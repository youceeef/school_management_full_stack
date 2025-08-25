<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User; // Type hint for $notifiable in toArray
use Illuminate\Notifications\Notification;

class ReservationApproved extends Notification
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
        $approver = $this->reservation->approver; // User who approved

        return [
            'event' => 'reservation_approved',
            'reservation_id' => $this->reservation->id,
            'salle_name' => $salle->name,
            'start_time' => $this->reservation->start_time->toDateTimeString(),
            'approved_by_name' => $approver ? $approver->name : 'l\'administration',
            'message' => "Votre réservation pour la salle {$salle->name} a été approuvée.",
            'action_url' => '/my-reservations/' . $this->reservation->id, // Adjust to teacher's reservation view route
        ];
    }
}
