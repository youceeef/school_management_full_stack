<?php

namespace App\Policies;

use App\Models\Equipement;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EquipementPolicy
{
    /**
     * Perform pre-authorization checks.
     * This grants 'admin' users all permissions, bypassing other checks.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any equipements. (index)
     */
    public function viewAny(User $user): bool
    {
        // Renamed from 'index' to match the 'viewAny' convention.
        return $user->can('list_equipements');
    }

    /**
     * Determine whether the user can view the equipement. (show)
     */
    public function view(User $user, Equipement $equipement): bool
    {
        return $user->can('voir_equipement');
    }

    /**
     * Determine whether the user can create equipements. (store)
     */
    public function create(User $user): bool
    {
        return $user->can('ajouter_equipement');
    }

    /**
     * Determine whether the user can update the equipement.
     */
    public function update(User $user, Equipement $equipement): bool
    {
        // Add the ownership check. A user can update if they created it OR have the permission.
        return $user->id === $equipement->added_by || $user->can('modifier_equipement');
    }

    /**
     * Determine whether the user can delete the equipement.
     */
    public function delete(User $user, Equipement $equipement): bool
    {
        // Add the ownership check. A user can delete if they created it OR have the permission.
        return $user->id === $equipement->added_by || $user->can('supprimer_equipement');
    }
}
