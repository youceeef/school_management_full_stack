<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function createRole(User $user)
    {
        return $user->hasPermissionTo('create roles');
    }

    public function listRoles(User $user)
    {
        return $user->hasPermissionTo('list roles');
    }
    public function listPermissions(User $user)
    {
        return $user->hasPermissionTo('list permissions');
    }

    public function assignRoleToUser(User $user)
    {
        return $user->hasPermissionTo('assign roles');
    }

    public function assignPermissionsToRole(User $user)
    {
        return $user->hasPermissionTo('assign permissions');
    }

    public function getAllRoles(User $user)
    {
        return $user->hasPermissionTo('get all roles');
    }

    public function getRoleById(User $user)
    {
        return $user->hasPermissionTo('view role');
    }

    public function updateRole(User $user)
    {
        return $user->hasPermissionTo('edit roles');
    }

    public function deleteRole(User $user)
    {
        return $user->hasPermissionTo('delete roles');
    }

    public function removeRoleFromUser(User $user)
    {
        return $user->hasPermissionTo('removeRoleFromUser');
    }
}
