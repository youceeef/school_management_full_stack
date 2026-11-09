<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $roles = DB::table('roles')
                ->whereIn('name', [...User::APPROVAL_ROLES, 'admin'])
                ->pluck('id', 'name');

            $staffRoleIds = collect(User::APPROVAL_ROLES)
                ->map(fn (string $role) => $roles->get($role))
                ->filter()
                ->values();

            if ($staffRoleIds->isEmpty()) {
                return;
            }

            $adminIds = collect();
            if ($roles->has('admin')) {
                $adminIds = DB::table('model_has_roles')
                    ->where('role_id', $roles->get('admin'))
                    ->where('model_type', User::class)
                    ->pluck('model_id');
            }

            foreach (User::APPROVAL_ROLES as $requestedRole) {
                $roleId = $roles->get($requestedRole);
                if (! $roleId) {
                    continue;
                }

                $candidateQuery = DB::table('users')
                    ->join('model_has_roles', function ($join) use ($roleId) {
                        $join->on('users.id', '=', 'model_has_roles.model_id')
                            ->where('model_has_roles.model_type', User::class)
                            ->where('model_has_roles.role_id', $roleId);
                    })
                    ->whereNull('users.deleted_at')
                    ->whereNull('users.requested_role');

                if ($adminIds->isNotEmpty()) {
                    $candidateQuery->whereNotIn('users.id', $adminIds);
                }

                $userIds = $candidateQuery->pluck('users.id');
                if ($userIds->isEmpty()) {
                    continue;
                }

                DB::table('users')->whereIn('id', $userIds)->update([
                    'approval_status' => User::APPROVAL_PENDING,
                    'requested_role' => $requestedRole,
                    'reviewed_at' => null,
                    'reviewed_by' => null,
                    'updated_at' => now(),
                ]);

                DB::table('model_has_roles')
                    ->whereIn('model_id', $userIds)
                    ->where('model_type', User::class)
                    ->whereIn('role_id', $staffRoleIds)
                    ->delete();

                DB::table('personal_access_tokens')
                    ->where('tokenable_type', User::class)
                    ->whereIn('tokenable_id', $userIds)
                    ->delete();
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        DB::transaction(function () {
            $roles = DB::table('roles')
                ->whereIn('name', User::APPROVAL_ROLES)
                ->pluck('id', 'name');

            $users = DB::table('users')
                ->whereIn('requested_role', User::APPROVAL_ROLES)
                ->get(['id', 'requested_role']);

            foreach ($users as $user) {
                $roleId = $roles->get($user->requested_role);
                if ($roleId) {
                    DB::table('model_has_roles')->insertOrIgnore([
                        'role_id' => $roleId,
                        'model_type' => User::class,
                        'model_id' => $user->id,
                    ]);
                }
            }

            DB::table('users')
                ->whereIn('requested_role', User::APPROVAL_ROLES)
                ->update([
                    'approval_status' => User::APPROVAL_APPROVED,
                    'requested_role' => null,
                    'reviewed_at' => null,
                    'reviewed_by' => null,
                    'updated_at' => now(),
                ]);
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
