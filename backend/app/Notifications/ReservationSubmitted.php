<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Notifications\Notification;

class ReservationSubmitted extends Notification
{
    // No 'use Queueable;' or 'implements ShouldQueue'

    protected Reservation $reservation;

    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(User $notifiable): array
    {
        $creator = $this->reservation->user;
        $salle = $this->reservation->salle;
        $creatorName = trim($creator->first_name.' '.$creator->last_name);

        return [
            'event' => 'reservation_submitted',
            'reservation_id' => $this->reservation->id,
            'requester_id' => $creator->id,
            'requester_name' => $creatorName,
            'salle_name' => $salle->name,
            'start_time' => $this->reservation->start_time->toDateTimeString(),
            'message' => "Nouvelle demande de réservation de {$creatorName} pour la salle {$salle->name}.",
            'action_url' => '/dashboard/reservations/'.$this->reservation->id,
        ];
    }
}
