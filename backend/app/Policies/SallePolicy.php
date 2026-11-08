<?php

namespace App\Policies;

use App\Models\Salle;
use App\Models\User;

class SallePolicy
{
    /**
     * Perform pre-authorization checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any salles. (index)
     */
    public function viewAny(User $user): bool
    {
        return $user->can('list_salles');
    }

    /**
     * Determine whether the user can view the salle. (show)
     */
    public function view(User $user, Salle $salle): bool
    {
        return $user->can('voir_salle');
    }

    /**
     * Determine whether the user can create salles. (store)
     */
    public function create(User $user): bool
    {
        return $user->can('ajouter_salle');
    }

    /**
     * Determine whether the user can update the salle.
     */
    /**
     * Determine whether the user can update the salle.
     */
    public function update(User $user, Salle $salle): bool
    {
        // MODIFIED: Ownership check has been removed.
        return $user->can('modifier_salle');
    }

    /**
     * Determine whether the user can delete the salle.
     */
    public function delete(User $user, Salle $salle): bool
    {
        // MODIFIED: Ownership check has been removed.
        return $user->can('supprimer_salle');
    }
}
