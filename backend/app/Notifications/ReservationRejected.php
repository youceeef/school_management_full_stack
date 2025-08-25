<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User; // Type hint for $notifiable in toArray
use Illuminate\Notifications\Notification;

class ReservationRejected extends Notification
{
    protected Reservation $reservation;

    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(User $notifiable): array // $notifiable is the teacher
    {
        $salle = $this->reservation->salle;
        $rejector = $this->reservation->approver; // User who rejected

        return [
            'event' => 'reservation_rejected',
            'reservation_id' => $this->reservation->id,
            'salle_name' => $salle->name,
            'start_time' => $this->reservation->start_time->toDateTimeString(),
            'rejected_by_name' => $rejector ? $rejector->name : 'l\'administration',
            'rejection_reason' => $this->reservation->rejection_reason,
            'message' => "Votre réservation pour la salle {$salle->name} a été rejetée.",
            'action_url' => '/my-reservations/' . $this->reservation->id,
        ];
    }
}
