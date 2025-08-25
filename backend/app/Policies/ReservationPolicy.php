<?php
// app/Policies/ReservationPolicy.php
namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReservationPolicy
{
    use HandlesAuthorization;

    // Example method:
    public function create(User $user): bool
    {
        return $user->can('create reservations');
    }

    public function store(User $user): bool
    {
        return $user->can('create reservations');
    }

    public function viewAny(User $user): bool // For listing
    {
        return $user->can('list all reservations') || $user->can('list own reservations');
    }

    public function view(User $user, Reservation $reservation): bool
    {
        if (!$user->can('view reservation detail')) {
            return false;
        }
        if ($user->can('list all reservations')) {
            return true;
        }
        return $user->can('list own reservations') && $user->id === $reservation->user_id;
    }

    public function approve(User $user, Reservation $reservation): bool
    {
        return $user->can('approve reservations') && $reservation->status === 'pending';
    }

    public function reject(User $user, Reservation $reservation): bool
    {
        return $user->can('reject reservations') && $reservation->status === 'pending';
    }

    public function delete(User $user, Reservation $reservation): bool // For cancelling
    {
        if ($user->can('cancel any reservation')) return true;
        return $user->can('cancel own reservation') &&
            $user->id === $reservation->user_id &&
            in_array($reservation->status, ['pending', 'approved']);
    }
    public function viewMyReservations(User $user): bool
    {
        return $user->can('list own reservations');
    }
}
