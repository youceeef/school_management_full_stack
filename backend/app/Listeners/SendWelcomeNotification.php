<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\UserRegisteredNotification;
use App\Notifications\NewUserForAdminNotification;
use Illuminate\Auth\Events\Registered;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification as NotificationFacade; // For sending to multiple users

class SendWelcomeNotification
{


    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        $registeredUser = $event->user;

        if ($registeredUser instanceof User) {
            // 1. Notify the newly registered user
            $registeredUser->notify(new UserRegisteredNotification($registeredUser));

            // 2. Notify admins if the new user has a specific role
            $rolesToNotifyAdminFor = ['enseignant', 'responsable_laboratoire', 'admin', 'eleve'];

            $shouldNotifyAdmin = false;
            if ($registeredUser->hasAnyRole($rolesToNotifyAdminFor)) {
                $shouldNotifyAdmin = true;
            }
            // If not using Spatie's hasAnyRole or prefer manual check:
            // $userRoles = $registeredUser->getRoleNames();
            // if ($userRoles) {
            //     foreach ($rolesToNotifyAdminFor as $roleToWatch) {
            //         if ($userRoles->contains($roleToWatch)) {
            //             $shouldNotifyAdmin = true;
            //             break;
            //         }
            //     }
            // }

            if ($shouldNotifyAdmin) {
                // Fetch all users with the 'admin' role
                // Make sure you have an 'admin' role defined with Spatie Permissions
                $admins = User::role('admin')->get();

                if ($admins->isNotEmpty()) {
                    NotificationFacade::send($admins, new NewUserForAdminNotification($registeredUser));
                }
            }
        }
    }
}
