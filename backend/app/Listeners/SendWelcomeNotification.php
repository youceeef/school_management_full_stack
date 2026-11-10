<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\NewUserForAdminNotification;
use App\Notifications\UserRegisteredNotification;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Throwable;

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
            try {
                $registeredUser->notify(new UserRegisteredNotification($registeredUser));
            } catch (Throwable $e) {
                Log::warning('Failed delivering welcome notification: '.$e->getMessage(), [
                    'user_id' => $registeredUser->id,
                ]);
            }

            // 2. Notify admins once the account is reviewable. Pending staff are
            // excluded here: they are announced only after verifying their email.
            $rolesToNotifyAdminFor = ['enseignant', 'responsable_laboratoire', 'admin', 'eleve'];

            $shouldNotifyAdmin = $registeredUser->approval_status !== User::APPROVAL_PENDING
                && $registeredUser->hasAnyRole($rolesToNotifyAdminFor);

            if ($shouldNotifyAdmin) {
                try {
                    $admins = User::role('admin')->get();

                    if ($admins->isNotEmpty()) {
                        NotificationFacade::send($admins, new NewUserForAdminNotification($registeredUser));
                    }
                } catch (Throwable $e) {
                    Log::warning('Failed notifying admins of new user: '.$e->getMessage(), [
                        'new_user_id' => $registeredUser->id,
                    ]);
                }
            }
        }
    }
}
