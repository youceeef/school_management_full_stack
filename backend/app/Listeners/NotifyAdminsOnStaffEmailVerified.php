<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\NewUserForAdminNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Throwable;

class NotifyAdminsOnStaffEmailVerified
{
    /**
     * Staff applications only become reviewable once the applicant proves the
     * address belongs to them, so the admin alert is deferred until that point.
     */
    public function handle(Verified $event): void
    {
        $applicant = $event->user;

        if (! $applicant instanceof User) {
            return;
        }

        if (! $applicant->requiresAccountApproval() || ! $applicant->isPending()) {
            return;
        }

        try {
            $admins = User::role('admin')->get();

            if ($admins->isNotEmpty()) {
                NotificationFacade::send($admins, new NewUserForAdminNotification($applicant));
            }
        } catch (Throwable $exception) {
            Log::warning('Failed notifying admins of a verified staff application: '.$exception->getMessage(), [
                'user_id' => $applicant->id,
            ]);
        }
    }
}
