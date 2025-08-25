<?php

namespace App\Listeners;

use App\Events\ReservationRejectedEvent;
use App\Notifications\ReservationRejected as ReservationRejectedNotification; // The Notification class

class NotifyUserOnReservationRejected
{
    public function __construct()
    {
        //
    }

    public function handle(ReservationRejectedEvent $event): void
    {
        $reservation = $event->reservation;
        // Ensure relationships needed by ReservationRejectedNotification::toArray() are loaded
        $reservation->loadMissing(['user', 'salle', 'approver']);

        $teacher = $reservation->user; // The user who made the reservation

        if ($teacher) {
            $teacher->notify(new ReservationRejectedNotification($reservation));
        }
    }
}
