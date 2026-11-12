<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountRequestResource;
use App\Http\Resources\UserResource;
use App\Models\AccountReview;
use App\Models\User;
use App\Notifications\AccountApprovalStatusNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    //
    public function index(Request $request): JsonResponse
    {
        $this->authorize('listUsers', User::class);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:200'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
            'status' => [
                'nullable',
                Rule::in([
                    User::APPROVAL_PENDING,
                    User::APPROVAL_APPROVED,
                    User::APPROVAL_REJECTED,
                    User::APPROVAL_SUSPENDED,
                ]),
            ],
            'department' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date'],
            'date_to' => [
                'nullable',
                'date',
                Rule::when($request->filled('date_from'), ['after_or_equal:date_from']),
            ],
            'sort_by' => ['nullable', Rule::in(['id', 'name', 'email', 'department', 'approval_status', 'created_at'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $counts = [
            'total' => User::query()->count(),
            'admins' => User::role('admin')->count(),
            'pending' => User::query()->where('approval_status', User::APPROVAL_PENDING)->count(),
        ];

        $query = User::query()->with(['roles:id,name', 'reviewer:id,first_name,last_name']);

        if (! empty($validated['search'])) {
            $search = '%'.Str::lower(trim($validated['search'])).'%';
            $query->where(function ($builder) use ($search) {
                $builder->whereRaw('LOWER(first_name) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(institution) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(department) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(staff_id) LIKE ?', [$search]);
            });
        }

        if (! empty($validated['role'])) {
            $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $validated['role']));
        }

        if (! empty($validated['status'])) {
            $query->where('approval_status', $validated['status']);
        }

        if (! empty($validated['department'])) {
            $department = '%'.Str::lower(trim($validated['department'])).'%';
            $query->whereRaw('LOWER(department) LIKE ?', [$department]);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortDirection = $validated['sort_direction'] ?? 'desc';

        if ($sortBy === 'name') {
            $query->orderBy('first_name', $sortDirection)
                ->orderBy('last_name', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }
        $query->orderBy('id', $sortDirection);

        $paginator = $query->paginate($validated['per_page'] ?? 15)->withQueryString();
        $users = $paginator->getCollection()->map(function (User $user) {
            return [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'approval_status' => $user->approval_status,
                'requested_role' => $user->requested_role,
                'institution' => $user->institution,
                'department' => $user->department,
                'reviewed_at' => $user->reviewed_at,
                'reviewed_by' => $user->reviewer ? [
                    'id' => $user->reviewer->id,
                    'name' => $user->reviewer->first_name.' '.$user->reviewer->last_name,
                ] : null,
                'created_at' => $user->created_at,
            ];
        });

        return response()->json([
            'data' => $users,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'counts' => $counts,
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $this->authorize('listUsers', User::class);

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1', 'max:100'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'action' => ['required', 'string', Rule::in(['assign_role', 'remove_role', 'delete', 'approve', 'suspend'])],
            'role' => [
                Rule::requiredIf(fn () => in_array($request->input('action'), ['assign_role', 'remove_role'], true)),
                'nullable',
                'string',
                'exists:roles,name',
            ],
            'reason' => [
                Rule::requiredIf(fn () => $request->input('action') === 'suspend'),
                'nullable',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        $admin = $request->user();
        $action = $validated['action'];
        $roleName = $validated['role'] ?? null;
        $reason = $validated['reason'] ?? null;
        $targetIds = array_values(array_unique($validated['user_ids']));

        $users = User::with('roles')->whereIn('id', $targetIds)->get();

        $processedCount = 0;
        $skippedCount = 0;
        $skippedReasons = [];
        $pendingNotifications = [];
        $storedFilesToDelete = [];

        DB::transaction(function () use (
            $users,
            $action,
            $roleName,
            $reason,
            $admin,
            $request,
            &$processedCount,
            &$skippedCount,
            &$skippedReasons,
            &$pendingNotifications,
            &$storedFilesToDelete
        ) {
            $totalAdmins = User::role('admin')->count();

            foreach ($users as $user) {
                $isSelf = (int) $admin->id === (int) $user->id;

                if ($action === 'delete') {
                    if ($isSelf) {
                        $skippedCount++;
                        $skippedReasons[] = 'Votre propre compte administrateur ne peut pas être supprimé.';

                        continue;
                    }
                    if ($user->hasRole('admin') && $totalAdmins <= 1) {
                        $skippedCount++;
                        $skippedReasons[] = 'Le dernier administrateur ne peut pas être supprimé.';

                        continue;
                    }

                    $picturePath = $user->picture;
                    $proofPath = $user->proof_document_path;
                    $user->tokens()->delete();
                    $user->delete();
                    $storedFilesToDelete[] = [$picturePath, config('filesystems.uploads_disk')];
                    $storedFilesToDelete[] = [$proofPath, config('filesystems.documents_disk')];

                    if ($user->hasRole('admin')) {
                        $totalAdmins--;
                    }
                    $processedCount++;

                    continue;
                }

                if ($action === 'suspend') {
                    if ($isSelf) {
                        $skippedCount++;
                        $skippedReasons[] = 'Votre propre compte administrateur ne peut pas être suspendu.';

                        continue;
                    }
                    if ($user->approval_status === User::APPROVAL_SUSPENDED) {
                        $skippedCount++;

                        continue;
                    }
                    if (! $user->requiresAccountApproval() || $user->approval_status !== User::APPROVAL_APPROVED) {
                        $skippedCount++;
                        $skippedReasons[] = 'Seuls les comptes de personnel approuvés peuvent être suspendus.';

                        continue;
                    }

                    $fromStatus = $user->approval_status;
                    $user->tokens()->delete();
                    $user->syncRoles([]);
                    $user->forceFill([
                        'approval_status' => User::APPROVAL_SUSPENDED,
                        'rejection_reason' => $reason ?: 'Compte suspendu par une action groupée administrateur.',
                        'suspended_at' => now(),
                        'reviewed_at' => now(),
                        'reviewed_by' => $admin->id,
                    ])->save();

                    AccountReview::create([
                        'user_id' => $user->id,
                        'reviewer_id' => $admin->id,
                        'action' => AccountReview::ACTION_SUSPENDED,
                        'from_status' => $fromStatus,
                        'to_status' => User::APPROVAL_SUSPENDED,
                        'reason' => $reason ?: 'Suspension groupée',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]);

                    $pendingNotifications[] = [
                        'user' => $user,
                        'action' => AccountReview::ACTION_SUSPENDED,
                        'reason' => $reason,
                    ];

                    $processedCount++;

                    continue;
                }

                if ($action === 'approve') {
                    if ($user->approval_status === User::APPROVAL_APPROVED) {
                        $skippedCount++;

                        continue;
                    }
                    if (! $user->requiresAccountApproval()) {
                        $skippedCount++;
                        $skippedReasons[] = 'Ce compte ne fait pas partie du processus d’approbation.';

                        continue;
                    }
                    if (! $user->hasVerifiedEmail()) {
                        $skippedCount++;
                        $skippedReasons[] = 'L’adresse email doit être confirmée avant toute approbation ou réactivation.';

                        continue;
                    }

                    $fromStatus = $user->approval_status;
                    $reviewAction = $fromStatus === User::APPROVAL_SUSPENDED
                        ? AccountReview::ACTION_REACTIVATED
                        : AccountReview::ACTION_APPROVED;
                    if ($user->requested_role) {
                        $user->syncRoles([$user->requested_role]);
                    }
                    $user->forceFill([
                        'approval_status' => User::APPROVAL_APPROVED,
                        'rejection_reason' => null,
                        'suspended_at' => null,
                        'reviewed_at' => now(),
                        'reviewed_by' => $admin->id,
                    ])->save();

                    AccountReview::create([
                        'user_id' => $user->id,
                        'reviewer_id' => $admin->id,
                        'action' => $reviewAction,
                        'from_status' => $fromStatus,
                        'to_status' => User::APPROVAL_APPROVED,
                        'reason' => 'Approbation groupée par administrateur',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]);

                    $pendingNotifications[] = [
                        'user' => $user,
                        'action' => $reviewAction,
                        'reason' => null,
                    ];

                    $processedCount++;

                    continue;
                }

                if ($action === 'assign_role') {
                    if ($user->hasRole($roleName)) {
                        $skippedCount++;

                        continue;
                    }
                    $user->assignRole($roleName);
                    if ($roleName === 'admin') {
                        $totalAdmins++;
                    }
                    $processedCount++;

                    continue;
                }

                if ($action === 'remove_role') {
                    if (! $user->hasRole($roleName)) {
                        $skippedCount++;

                        continue;
                    }
                    if ($roleName === 'admin') {
                        if ($isSelf) {
                            $skippedCount++;
                            $skippedReasons[] = 'Vous ne pouvez pas retirer votre propre rôle administrateur.';

                            continue;
                        }
                        if ($totalAdmins <= 1) {
                            $skippedCount++;
                            $skippedReasons[] = 'Le rôle administrateur ne peut pas être retiré au dernier administrateur.';

                            continue;
                        }
                        $totalAdmins--;
                    }
                    $user->removeRole($roleName);
                    $processedCount++;

                    continue;
                }
            }
        });

        // Object storage and queued notifications are external side effects. Run
        // them only after the database transaction commits successfully.
        foreach ($storedFilesToDelete as [$path, $disk]) {
            $this->deleteStoredPicture($path, $disk);
        }

        foreach ($pendingNotifications as $pendingNotification) {
            try {
                $pendingNotification['user']->notifyNow(new AccountApprovalStatusNotification(
                    $pendingNotification['action'],
                    $pendingNotification['reason']
                ));
            } catch (Throwable $e) {
                Log::warning('Failed delivering bulk account status notification: '.$e->getMessage(), [
                    'user_id' => $pendingNotification['user']->id,
                    'action' => $pendingNotification['action'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Action groupée traitée avec succès.',
            'action' => $action,
            'processed_count' => $processedCount,
            'skipped_count' => $skippedCount,
            'skipped_reasons' => array_values(array_unique($skippedReasons)),
        ]);
    }

    public function reviewAccountApproval(Request $request, int $userId)
    {
        $this->authorize('listUsers', User::class);

        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([User::APPROVAL_APPROVED, User::APPROVAL_REJECTED, User::APPROVAL_SUSPENDED]),
            ],
            'reason' => [
                Rule::requiredIf(fn () => in_array($request->input('status'), [User::APPROVAL_REJECTED, User::APPROVAL_SUSPENDED], true)),
                'nullable',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        $user = User::with('roles')->findOrFail($userId);

        if (! $user->requiresAccountApproval()) {
            return response()->json([
                'message' => 'Ce compte ne fait pas partie du processus d’approbation.',
            ], 422);
        }

        $status = $validated['status'];

        // An unverified pending request cannot be reviewed at all, and no
        // unverified account may enter (or re-enter) the approved state.
        if (! $user->hasVerifiedEmail()
            && ($user->isPending() || $status === User::APPROVAL_APPROVED)) {
            return response()->json([
                'message' => 'Cette demande ne peut pas être examinée tant que l’adresse email n’a pas été confirmée.',
                'code' => 'EMAIL_UNVERIFIED',
            ], 409);
        }

        $fromStatus = $user->approval_status;
        $reason = $validated['reason'] ?? null;

        if ($fromStatus === User::APPROVAL_APPROVED && $status === User::APPROVAL_REJECTED) {
            return response()->json([
                'message' => 'Un compte approuvé et actif ne peut pas être rejeté. Utilisez l’action de suspension.',
            ], 422);
        }

        if ($fromStatus === User::APPROVAL_PENDING && $status === User::APPROVAL_SUSPENDED) {
            return response()->json([
                'message' => 'Une demande en attente ne peut pas être suspendue. Utilisez l’action de refus.',
            ], 422);
        }

        $action = match ($status) {
            User::APPROVAL_APPROVED => ($fromStatus === User::APPROVAL_SUSPENDED ? AccountReview::ACTION_REACTIVATED : AccountReview::ACTION_APPROVED),
            User::APPROVAL_SUSPENDED => AccountReview::ACTION_SUSPENDED,
            User::APPROVAL_REJECTED => AccountReview::ACTION_REJECTED,
        };

        DB::transaction(function () use ($request, $user, $status, $fromStatus, $action, $reason) {
            $now = now();
            $adminId = $request->user()->id;

            if ($status === User::APPROVAL_APPROVED) {
                $user->syncRoles([$user->requested_role]);
                $user->forceFill([
                    'approval_status' => $status,
                    'rejection_reason' => null,
                    'suspended_at' => null,
                    'reviewed_at' => $now,
                    'reviewed_by' => $adminId,
                ])->save();
            } else {
                $user->syncRoles([]);
                $user->tokens()->delete();

                $user->forceFill([
                    'approval_status' => $status,
                    'rejection_reason' => $reason,
                    'suspended_at' => $status === User::APPROVAL_SUSPENDED ? $now : null,
                    'reviewed_at' => $now,
                    'reviewed_by' => $adminId,
                ])->save();
            }

            AccountReview::create([
                'user_id' => $user->id,
                'reviewer_id' => $adminId,
                'action' => $action,
                'from_status' => $fromStatus,
                'to_status' => $status,
                'reason' => $reason,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        $notificationWarning = null;
        try {
            $user->notifyNow(new AccountApprovalStatusNotification($action, $reason));
        } catch (Throwable $e) {
            Log::warning('Failed delivering account approval status notification: '.$e->getMessage(), [
                'user_id' => $user->id,
                'action' => $action,
            ]);
            $notificationWarning = 'Le statut a été mis à jour avec succès, mais la notification par email n’a pas pu être délivrée.';
        }

        $message = match ($action) {
            AccountReview::ACTION_APPROVED => 'Compte approuvé et rôle attribué avec succès.',
            AccountReview::ACTION_REACTIVATED => 'Compte réactivé et accès restauré avec succès.',
            AccountReview::ACTION_SUSPENDED => 'Compte suspendu et sessions révoquées.',
            AccountReview::ACTION_REJECTED => 'Demande de compte refusée avec motif.',
        };

        $responseData = [
            'message' => $message,
            'user' => new UserResource($user->fresh()->load('roles')),
        ];

        if ($notificationWarning) {
            $responseData['notification_warning'] = $notificationWarning;
        }

        return response()->json($responseData);
    }

    public function show(Request $request, int $userId): JsonResponse
    {
        $this->authorize('listUsers', User::class);

        $user = User::with(['roles', 'reviewer', 'reviews.reviewer'])->findOrFail($userId);

        return response()->json([
            'data' => new AccountRequestResource($user),
        ]);
    }

    public function showProfile()
    {
        try {
            $user = Auth::user()->load('roles');

            return response()->json([
                'message' => 'Profile fetched successfully',
                'user' => new UserResource($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user profile: '.$e->getMessage());

            return response()->json(['message' => 'Error fetching profile'], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        // Keep validation outside the catch block so Laravel can return its
        // normal 422 response instead of turning invalid images into a 500.
        $validatedData = $this->validateProfileData($request);
        $user = Auth::user();
        $diskName = config('filesystems.uploads_disk');
        $oldPicture = $user->picture;
        $newPicture = null;

        DB::beginTransaction();

        try {
            if ($request->hasFile('picture')) {
                $newPicture = $this->storeProfilePicture(
                    $request->file('picture'),
                    $diskName
                );
                $user->picture = $newPicture;
            }

            $this->updateUserFields($user, $validatedData);

            $hasTextChanges = $user->isDirty([
                'first_name',
                'last_name',
                'address',
                'phone',
                'bio',
                'institution',
                'department',
                'staff_id',
                'professional_phone',
            ]);
            $pictureUploaded = $newPicture !== null;

            if ($hasTextChanges || $pictureUploaded) {
                $user->save();
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();

            // A stored object is not covered by the database transaction.
            // Remove it if the database update failed.
            if ($newPicture) {
                $this->deleteStoredPicture($newPicture, $diskName);
            }

            Log::error('Error updating user profile', [
                'user_id' => $user->id,
                'disk' => $diskName,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $request->hasFile('picture')
                    ? 'Failed to upload profile picture'
                    : 'Error updating profile',
            ], 500);
        }

        // Only remove the previous object after both the replacement upload
        // and the database commit succeeded.
        if ($newPicture && $oldPicture && $oldPicture !== $newPicture) {
            $this->deleteStoredPicture($oldPicture, $diskName);
        }

        $user->load('roles');

        return response()->json([
            'message' => ($hasTextChanges || $pictureUploaded)
                ? 'Profile updated successfully'
                : 'No changes detected in the profile data',
            'user' => new UserResource($user),
            'updated' => [
                'text_fields' => $hasTextChanges,
                'picture' => $pictureUploaded,
            ],
        ]);
    }

    private function validateProfileData(Request $request)
    {
        $rules = [
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'institution' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'staff_id' => 'nullable|string|max:100',
            'professional_phone' => 'nullable|string|max:30',
        ];

        // Only add picture validation if a file is being uploaded
        if ($request->hasFile('picture')) {
            $rules['picture'] = [
                'file',
                'image',
                'mimes:jpeg,png,jpg,gif,webp',
                'max:2048', // 2MB
                'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
            ];
        }

        return $request->validate($rules);
    }

    private function storeProfilePicture(UploadedFile $picture, string $diskName): string
    {
        if (! $picture->isValid()) {
            throw new RuntimeException('The uploaded profile picture is not valid.');
        }

        $extension = strtolower($picture->extension() ?: 'jpg');
        $fileName = Str::uuid().'.'.$extension;

        // Object-storage disks do not require explicit directory creation.
        // Avoiding exists()/makeDirectory() also improves compatibility with
        // S3-compatible providers that implement only object operations.
        $path = $picture->storeAs('profile_pictures', $fileName, $diskName);

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('The profile picture could not be stored.');
        }

        return $path;
    }

    private function deleteStoredPicture(?string $path, string $diskName): void
    {
        if (! $path) {
            return;
        }

        try {
            // S3 deletes are idempotent, so a preliminary exists() request is
            // unnecessary and may not be supported by every compatible API.
            Storage::disk($diskName)->delete($path);
        } catch (Throwable $e) {
            Log::warning('Failed to delete stored profile picture', [
                'path' => $path,
                'disk' => $diskName,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function deleteProfilePicture()
    {
        try {
            $user = Auth::user();

            if (! $user->picture) {
                return response()->json(['message' => 'No profile picture to delete'], 404);
            }

            $picturePath = $user->picture;
            $diskName = config('filesystems.uploads_disk');

            // Clear the database reference even if the remote object has
            // already expired or cannot be deleted immediately.
            $user->picture = null;
            $user->save();
            $this->deleteStoredPicture($picturePath, $diskName);

            return response()->json([
                'message' => 'Profile picture deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting profile picture: '.$e->getMessage());

            return response()->json(['message' => 'Error deleting profile picture'], 500);
        }
    }

    private function updateUserFields(User $user, array $validatedData)
    {
        $fields = [
            'first_name',
            'last_name',
            'address',
            'phone',
            'bio',
            'institution',
            'department',
            'staff_id',
            'professional_phone',
        ];

        foreach ($fields as $field) {
            // Only update if field exists in validated data AND is not empty or null
            if (
                array_key_exists($field, $validatedData) &&
                $validatedData[$field] !== null &&
                $validatedData[$field] !== ''
            ) {
                $user->{$field} = $validatedData[$field];
            }
        }

        return $user;
    }

    public function deleteProfile()
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $picturePath = $user->picture;
        $proofPath = $user->proof_document_path;

        $user->tokens()->delete();

        if ($user->delete()) {
            // If user deletion is successful, then delete the profile picture and proof document
            $this->deleteStoredPicture(
                $picturePath,
                config('filesystems.uploads_disk')
            );
            $this->deleteStoredPicture(
                $proofPath,
                config('filesystems.documents_disk')
            );

            return response()->json(['message' => 'Your profile has been deleted successfully.']);
        } else {
            return response()->json(['message' => 'Failed to delete profile from the database.'], 500);
        }
    }

    public function deleteUserByAdmin(Request $request, $userId)
    {
        $this->authorize('deleteUser', User::class);
        $user = User::with('roles')->findOrFail($userId);

        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'You cannot delete your own administrator account.',
            ], 422);
        }

        if ($user->hasRole('admin') && User::role('admin')->count() <= 1) {
            return response()->json([
                'message' => 'The last administrator account cannot be deleted.',
            ], 422);
        }

        $picturePath = $user->picture;
        $proofPath = $user->proof_document_path;

        $user->tokens()->delete();
        $user->delete();

        $this->deleteStoredPicture($picturePath, config('filesystems.uploads_disk'));
        $this->deleteStoredPicture($proofPath, config('filesystems.documents_disk'));

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function getCurrentUser()
    {
        $user = Auth::user()->load('roles');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'roles' => $user->roles->pluck('name'),
            ],
        ]);
    }

    public function getPermissions()
    {
        $user = Auth::user();

        return response()->json([
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }
}
