<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
// Remove: use Illuminate\Support\Facades\Event; // Not directly used here for defining listeners

// Your existing listener for Registered event
use App\Listeners\SendWelcomeNotification;

// Import your NEW Reservation events and listeners
use App\Events\ReservationSubmittedEvent;
use App\Listeners\NotifyManagersOnReservationSubmitted;
use App\Events\ReservationApprovedEvent;
use App\Listeners\NotifyUserOnReservationApproved;
use App\Events\ReservationRejectedEvent;
use App\Listeners\NotifyUserOnReservationRejected;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
            SendWelcomeNotification::class,
        ],

        // Reservation Event Mappings
        ReservationSubmittedEvent::class => [
            NotifyManagersOnReservationSubmitted::class,
        ],
        ReservationApprovedEvent::class => [
            NotifyUserOnReservationApproved::class,
        ],
        ReservationRejectedEvent::class => [
            NotifyUserOnReservationRejected::class,
        ],

    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        // Parent boot method is important if it does anything
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false; // Keep this false if you prefer explicit mapping in $listen array
    }
}
