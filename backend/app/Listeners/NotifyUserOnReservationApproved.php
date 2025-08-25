<?php

namespace App\Listeners;

use App\Events\ReservationApprovedEvent;
use App\Notifications\ReservationApproved as ReservationApprovedNotification; // The Notification class

class NotifyUserOnReservationApproved
{
    public function __construct()
    {
        //
    }

    public function handle(ReservationApprovedEvent $event): void
    {
        $reservation = $event->reservation;
        $reservation->loadMissing(['user', 'salle', 'approver']);
        $teacher = $reservation->user;

        if ($teacher) {
            $teacher->notify(new ReservationApprovedNotification($reservation));
        }
    }
}
