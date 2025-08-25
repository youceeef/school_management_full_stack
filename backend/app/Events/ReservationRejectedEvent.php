<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationRejectedEvent
{
    use Dispatchable, SerializesModels;
    public Reservation $reservation;
    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }
}
