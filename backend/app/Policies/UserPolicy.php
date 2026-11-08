<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function listUsers(User $user)
    {
        return $user->hasPermissionTo('list users');
    }

    public function removeRoleFromUser(User $user, $userId)
    {
        return $user->hasPermissionTo('removeRoleFromUser');
    }

    public function deleteUser(User $user)
    {
        return $user->hasPermissionTo('delete user');
    }
}
