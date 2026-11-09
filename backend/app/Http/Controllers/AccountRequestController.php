<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountRequestResource;
use App\Models\AccountReview;
use App\Models\User;
use App\Notifications\AccountApprovalStatusNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AccountRequestController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin'])->except(['resubmit']);
    }

    /**
     * List paginated account requests with filtering and summary metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $baseQuery = User::query()
            ->where(function ($q) {
                $q->whereIn('requested_role', User::APPROVAL_ROLES)
                    ->orWhereIn('approval_status', [User::APPROVAL_PENDING, User::APPROVAL_REJECTED, User::APPROVAL_SUSPENDED]);
            });

        // Compute summary counts across all requests before applying view filters
        $rawCounts = (clone $baseQuery)
            ->selectRaw('approval_status, count(*) as count')
            ->groupBy('approval_status')
            ->pluck('count', 'approval_status');

        $counts = [
            'all' => (int) $rawCounts->sum(),
            'pending' => (int) ($rawCounts[User::APPROVAL_PENDING] ?? 0),
            'approved' => (int) ($rawCounts[User::APPROVAL_APPROVED] ?? 0),
            'rejected' => (int) ($rawCounts[User::APPROVAL_REJECTED] ?? 0),
            'suspended' => (int) ($rawCounts[User::APPROVAL_SUSPENDED] ?? 0),
        ];

        $query = (clone $baseQuery)->with(['roles', 'reviewer']);

        // Filter by status if provided and not "all"
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('approval_status', $request->input('status'));
        }

        // Filter by requested role
        if ($request->filled('requested_role')) {
            $query->where('requested_role', $request->input('requested_role'));
        } elseif ($request->filled('role')) {
            $query->where('requested_role', $request->input('role'));
        }

        // Filter by general search keyword (name, email, institution, department, or staff ID)
        if ($request->filled('search')) {
            $search = '%'.$request->input('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('institution', 'like', $search)
                    ->orWhere('department', 'like', $search)
                    ->orWhere('staff_id', 'like', $search);
            });
        }

        // Filter by explicit institutional fields
        if ($request->filled('institution')) {
            $query->where('institution', 'like', '%'.$request->input('institution').'%');
        }
        if ($request->filled('department')) {
            $query->where('department', 'like', '%'.$request->input('department').'%');
        }
        if ($request->filled('staff_id')) {
            $query->where('staff_id', 'like', '%'.$request->input('staff_id').'%');
        }

        // Filter by explicit name
        if ($request->filled('name')) {
            $name = '%'.$request->input('name').'%';
            $query->where(function ($q) use ($name) {
                $q->where('first_name', 'like', $name)
                    ->orWhere('last_name', 'like', $name);
            });
        }

        // Filter by explicit email
        if ($request->filled('email')) {
            $query->where('email', 'like', '%'.$request->input('email').'%');
        }

        // Filter by creation date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        // Sort configuration
        $sortBy = $request->input('sort_by');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        if ($sortBy) {
            $allowedSorts = [
                'created_at',
                'first_name',
                'last_name',
                'email',
                'approval_status',
                'requested_role',
                'institution',
                'department',
                'staff_id',
            ];
            if (in_array($sortBy, $allowedSorts, true)) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                $query->orderByDesc('created_at');
            }
        } else {
            // Default sort: pending first, then rejected, then newest
            $query->orderByRaw("CASE approval_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END")
                ->orderByDesc('created_at');
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => AccountRequestResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
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

    /**
     * Show a single account request.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['roles', 'reviewer', 'reviews.reviewer'])
            ->where(function ($q) {
                $q->whereIn('requested_role', User::APPROVAL_ROLES)
                    ->orWhereIn('approval_status', [User::APPROVAL_PENDING, User::APPROVAL_REJECTED, User::APPROVAL_SUSPENDED]);
            })
            ->findOrFail($id);

        return response()->json([
            'data' => new AccountRequestResource($user),
        ]);
    }

    /**
     * Return only summary counts for badges and navigation.
     */
    public function counts(): JsonResponse
    {
        $baseQuery = User::query()
            ->where(function ($q) {
                $q->whereIn('requested_role', User::APPROVAL_ROLES)
                    ->orWhereIn('approval_status', [User::APPROVAL_PENDING, User::APPROVAL_REJECTED, User::APPROVAL_SUSPENDED]);
            });

        $rawCounts = $baseQuery
            ->selectRaw('approval_status, count(*) as count')
            ->groupBy('approval_status')
            ->pluck('count', 'approval_status');

        return response()->json([
            'all' => (int) $rawCounts->sum(),
            'pending' => (int) ($rawCounts[User::APPROVAL_PENDING] ?? 0),
            'approved' => (int) ($rawCounts[User::APPROVAL_APPROVED] ?? 0),
            'rejected' => (int) ($rawCounts[User::APPROVAL_REJECTED] ?? 0),
            'suspended' => (int) ($rawCounts[User::APPROVAL_SUSPENDED] ?? 0),
        ]);
    }

    /**
     * Review an account request: approve, reject, suspend, or reactivate.
     */
    public function review(Request $request, int $id): JsonResponse
    {
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

        $user = User::with('roles')->findOrFail($id);

        if (! $user->requiresAccountApproval()) {
            return response()->json([
                'message' => 'Ce compte ne fait pas partie du processus d’approbation.',
            ], 422);
        }

        $fromStatus = $user->approval_status;
        $toStatus = $validated['status'];
        $reason = $validated['reason'] ?? null;

        // Lifecycle guards (P3.3)
        // 1. An active approved account cannot be rejected directly; must be suspended.
        if ($fromStatus === User::APPROVAL_APPROVED && $toStatus === User::APPROVAL_REJECTED) {
            return response()->json([
                'message' => 'Un compte approuvé et actif ne peut pas être rejeté. Utilisez l’action de suspension.',
            ], 422);
        }

        // 2. A pending application cannot be suspended; must be rejected.
        if ($fromStatus === User::APPROVAL_PENDING && $toStatus === User::APPROVAL_SUSPENDED) {
            return response()->json([
                'message' => 'Une demande en attente ne peut pas être suspendue. Utilisez l’action de refus.',
            ], 422);
        }

        // Determine specific audit action
        $action = match ($toStatus) {
            User::APPROVAL_APPROVED => ($fromStatus === User::APPROVAL_SUSPENDED ? AccountReview::ACTION_REACTIVATED : AccountReview::ACTION_APPROVED),
            User::APPROVAL_SUSPENDED => AccountReview::ACTION_SUSPENDED,
            User::APPROVAL_REJECTED => AccountReview::ACTION_REJECTED,
        };

        DB::transaction(function () use ($request, $user, $toStatus, $fromStatus, $action, $reason) {
            $now = now();
            $adminId = $request->user()->id;

            if ($toStatus === User::APPROVAL_APPROVED) {
                $user->syncRoles([$user->requested_role]);
                $user->forceFill([
                    'approval_status' => User::APPROVAL_APPROVED,
                    'rejection_reason' => null,
                    'suspended_at' => null,
                    'reviewed_at' => $now,
                    'reviewed_by' => $adminId,
                ])->save();
            } else {
                // Immediately revoke roles and terminate all active Sanctum sessions (P3.3)
                $user->syncRoles([]);
                $user->tokens()->delete();

                $user->forceFill([
                    'approval_status' => $toStatus,
                    'rejection_reason' => $reason,
                    'suspended_at' => $toStatus === User::APPROVAL_SUSPENDED ? $now : null,
                    'reviewed_at' => $now,
                    'reviewed_by' => $adminId,
                ])->save();
            }

            // Append chronological audit history (P3.4)
            AccountReview::create([
                'user_id' => $user->id,
                'reviewer_id' => $adminId,
                'action' => $action,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'reason' => $reason,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        $user->notify(new AccountApprovalStatusNotification($action, $reason));

        $successMessage = match ($action) {
            AccountReview::ACTION_APPROVED => 'Compte approuvé et rôle attribué avec succès.',
            AccountReview::ACTION_REACTIVATED => 'Compte réactivé et accès restauré avec succès.',
            AccountReview::ACTION_SUSPENDED => 'Compte suspendu et sessions révoquées.',
            AccountReview::ACTION_REJECTED => 'Demande de compte refusée avec motif.',
        };

        return response()->json([
            'message' => $successMessage,
            'data' => new AccountRequestResource($user->fresh()->load(['roles', 'reviewer', 'reviews.reviewer'])),
        ]);
    }

    /**
     * Authenticated preview stream for applicant proof document.
     */
    public function previewProof(int $id): StreamedResponse|JsonResponse
    {
        $user = User::findOrFail($id);

        if (! $user->proof_document_path) {
            return response()->json(['message' => 'Aucun document justificatif associé à cette demande.'], 404);
        }

        $disk = config('filesystems.documents_disk');
        $storage = Storage::disk($disk);

        if (! $storage->exists($user->proof_document_path)) {
            return response()->json(['message' => 'Le fichier justificatif est introuvable sur le stockage.'], 404);
        }

        $mime = $user->proof_document_mime ?: 'application/octet-stream';
        $fileName = $user->proof_document_name ?: basename($user->proof_document_path);
        $stream = $storage->readStream($user->proof_document_path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.addslashes($fileName).'"',
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Authenticated download for applicant proof document.
     */
    public function downloadProof(int $id): StreamedResponse|JsonResponse
    {
        $user = User::findOrFail($id);

        if (! $user->proof_document_path) {
            return response()->json(['message' => 'Aucun document justificatif associé à cette demande.'], 404);
        }

        $disk = config('filesystems.documents_disk');
        $storage = Storage::disk($disk);

        if (! $storage->exists($user->proof_document_path)) {
            return response()->json(['message' => 'Le fichier justificatif est introuvable sur le stockage.'], 404);
        }

        $mime = $user->proof_document_mime ?: 'application/octet-stream';
        $fileName = $user->proof_document_name ?: basename($user->proof_document_path);
        $stream = $storage->readStream($user->proof_document_path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'attachment; filename="'.addslashes($fileName).'"',
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Correct and resubmit a rejected application (P3.2).
     */
    public function resubmit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'institution' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'staff_id' => ['required', 'string', 'max:100'],
            'professional_phone' => ['nullable', 'string', 'max:30'],
            'proof_document' => [
                'nullable',
                'file',
                'mimes:pdf,jpeg,png,jpg',
                'max:5120',
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 401);
        }

        if ($user->approval_status !== User::APPROVAL_REJECTED) {
            return response()->json([
                'message' => 'Seules les demandes refusées peuvent faire l’objet d’une nouvelle soumission.',
            ], 422);
        }

        $disk = config('filesystems.documents_disk');
        $oldPath = $user->proof_document_path;
        $documentData = [];

        if ($request->hasFile('proof_document')) {
            $file = $request->file('proof_document');
            $dir = 'proofs/'.date('Y/m');
            $path = $file->store($dir, $disk);

            $documentData = [
                'proof_document_path' => $path,
                'proof_document_name' => $file->getClientOriginalName(),
                'proof_document_mime' => $file->getClientMimeType() ?: $file->getMimeType(),
                'proof_document_size' => $file->getSize(),
                'proof_submitted_at' => now(),
            ];
        }

        DB::transaction(function () use ($user, $validated, $documentData, $request) {
            $updatePayload = array_merge([
                'institution' => $validated['institution'],
                'department' => $validated['department'],
                'staff_id' => $validated['staff_id'],
                'professional_phone' => $validated['professional_phone'] ?? null,
                'approval_status' => User::APPROVAL_PENDING,
                'rejection_reason' => null,
            ], $documentData);

            $user->forceFill($updatePayload)->save();

            AccountReview::create([
                'user_id' => $user->id,
                'reviewer_id' => null,
                'action' => AccountReview::ACTION_RESUBMITTED,
                'from_status' => User::APPROVAL_REJECTED,
                'to_status' => User::APPROVAL_PENDING,
                'reason' => $validated['notes'] ?? 'Informations et justificatif corrigés par le demandeur',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        // Clean up old proof file if a new file was uploaded
        if ($request->hasFile('proof_document') && $oldPath && $oldPath !== ($documentData['proof_document_path'] ?? null)) {
            try {
                Storage::disk($disk)->delete($oldPath);
            } catch (\Throwable $e) {
                Log::warning('Failed to delete old proof document on resubmission: '.$e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Votre demande a été corrigée et renvoyée avec succès. Elle est désormais en attente de validation.',
            'approval_status' => User::APPROVAL_PENDING,
        ], 200);
    }
}
