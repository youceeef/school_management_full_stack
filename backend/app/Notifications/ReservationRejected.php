<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User;
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

    public function toArray(User $notifiable): array
    {
        $salle = $this->reservation->salle;
        $rejector = $this->reservation->approver;
        $rejectorName = $rejector
            ? trim($rejector->first_name.' '.$rejector->last_name)
            : 'l\'administration';

        return [
            'event' => 'reservation_rejected',
            'reservation_id' => $this->reservation->id,
            'salle_name' => $salle->name,
            'start_time' => $this->reservation->start_time->toDateTimeString(),
            'rejected_by_name' => $rejectorName,
            'rejection_reason' => $this->reservation->rejection_reason,
            'message' => "Votre réservation pour la salle {$salle->name} a été rejetée.",
            'action_url' => '/dashboard/mes-reservations/'.$this->reservation->id,
        ];
    }
}
