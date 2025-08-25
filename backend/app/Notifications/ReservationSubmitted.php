<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User; // Type hint for $notifiable in toArray
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

    public function toArray(User $notifiable): array // $notifiable is the admin/manager
    {
        // Ensure relationships are loaded on $this->reservation if accessed here
        // e.g., $this->reservation->loadMissing(['user', 'salle']);
        $creator = $this->reservation->user;
        $salle = $this->reservation->salle;

        return [
            'event' => 'reservation_submitted', // Consistent event key
            'reservation_id' => $this->reservation->id,
            'requester_id' => $creator->id,
            'requester_name' => $creator->name, // Assuming User model has 'name' attribute
            'salle_name' => $salle->name,
            'start_time' => $this->reservation->start_time->toDateTimeString(),
            'message' => "Nouvelle demande de réservation de {$creator->name} pour la salle {$salle->name}.",
            'action_url' => '/admin/reservations/' . $this->reservation->id, // Adjust to your admin panel route
        ];
    }
}
