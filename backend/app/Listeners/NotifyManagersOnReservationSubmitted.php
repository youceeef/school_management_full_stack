<?php

namespace App\Listeners;

use App\Events\ReservationSubmittedEvent;
use App\Models\User;
use App\Notifications\ReservationSubmitted as ReservationSubmittedNotification; // The Notification class
use Illuminate\Support\Facades\Notification as NotificationFacade;

class NotifyManagersOnReservationSubmitted
{
    public function __construct()
    {
        //
    }

    public function handle(ReservationSubmittedEvent $event): void
    {
        $reservation = $event->reservation;
        $reservation->loadMissing(['user', 'salle']);

        $usersToNotify = User::permission('approve reservations')->get();
        // Alternatively: $adminsToNotify = User::role('admin')->get();

        if ($usersToNotify->isNotEmpty()) {
            NotificationFacade::send($usersToNotify, new ReservationSubmittedNotification($reservation));
        }
    }
}
