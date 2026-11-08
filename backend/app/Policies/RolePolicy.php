<?php

namespace App\Policies;

use App\Models\User;

class RolePolicy
{
    public function createRole(User $user)
    {
        return $user->hasPermissionTo('createRole');
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
        return $user->hasPermissionTo('assignRoleToUser');
    }

    public function assignPermissionsToRole(User $user)
    {
        return $user->hasPermissionTo('assignPermissionsToRole');
    }

    public function getAllRoles(User $user)
    {
        return $user->hasPermissionTo('getAllRoles');
    }

    public function getRoleById(User $user)
    {
        return $user->hasPermissionTo('getRoleById');
    }

    public function updateRole(User $user)
    {
        return $user->hasPermissionTo('updateRole');
    }

    public function deleteRole(User $user)
    {
        return $user->hasPermissionTo('deleteRole');
    }

    public function removeRoleFromUser(User $user)
    {
        return $user->hasPermissionTo('removeRoleFromUser');
    }
}
