<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{

    public function listUsers(User $user)
    {
        return $user->hasPermissionTo('list users');
    }
    public function removeRoleFromUser(User $user, $userId)
    {
        return $user->id === $userId;
    }
    public function deleteUser(User $user)
    {
        return $user->hasPermissionTo('delete user');
    }
}
