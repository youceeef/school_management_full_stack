<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountRequestResource;
use App\Models\User;
use App\Notifications\AccountApprovalStatusNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AccountRequestController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin']);
    }

    /**
     * List paginated account requests with filtering and summary metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $baseQuery = User::query()
            ->where(function ($q) {
                $q->whereIn('requested_role', User::APPROVAL_ROLES)
                    ->orWhereIn('approval_status', [User::APPROVAL_PENDING, User::APPROVAL_REJECTED]);
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
            'suspended' => (int) ($rawCounts['suspended'] ?? 0),
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
        $user = User::with(['roles', 'reviewer'])
            ->where(function ($q) {
                $q->whereIn('requested_role', User::APPROVAL_ROLES)
                    ->orWhereIn('approval_status', [User::APPROVAL_PENDING, User::APPROVAL_REJECTED]);
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
                    ->orWhereIn('approval_status', [User::APPROVAL_PENDING, User::APPROVAL_REJECTED]);
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
            'suspended' => (int) ($rawCounts['suspended'] ?? 0),
        ]);
    }

    /**
     * Approve or reject an account request.
     */
    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([User::APPROVAL_APPROVED, User::APPROVAL_REJECTED]),
            ],
        ]);

        $user = User::with('roles')->findOrFail($id);

        if (! $user->requiresAccountApproval()) {
            return response()->json([
                'message' => 'Ce compte ne fait pas partie du processus d’approbation.',
            ], 422);
        }

        $status = $validated['status'];

        DB::transaction(function () use ($request, $user, $status) {
            if ($status === User::APPROVAL_APPROVED) {
                $user->syncRoles([$user->requested_role]);
            } else {
                $user->syncRoles([]);
                $user->tokens()->delete();
            }

            $user->forceFill([
                'approval_status' => $status,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
            ])->save();
        });

        $user->notify(new AccountApprovalStatusNotification($status));

        return response()->json([
            'message' => $status === User::APPROVAL_APPROVED
                ? 'Compte approuvé et rôle attribué avec succès.'
                : 'Demande de compte refusée.',
            'data' => new AccountRequestResource($user->fresh()->load(['roles', 'reviewer'])),
        ]);
    }
}
