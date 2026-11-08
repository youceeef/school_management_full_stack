<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User;
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

    public function toArray(User $notifiable): array
    {
        $salle = $this->reservation->salle;
        $approver = $this->reservation->approver;
        $approverName = $approver
            ? trim($approver->first_name.' '.$approver->last_name)
            : 'l\'administration';

        return [
            'event' => 'reservation_approved',
            'reservation_id' => $this->reservation->id,
            'salle_name' => $salle->name,
            'start_time' => $this->reservation->start_time->toDateTimeString(),
            'approved_by_name' => $approverName,
            'message' => "Votre réservation pour la salle {$salle->name} a été approuvée.",
            'action_url' => '/dashboard/mes-reservations/'.$this->reservation->id,
        ];
    }
}
