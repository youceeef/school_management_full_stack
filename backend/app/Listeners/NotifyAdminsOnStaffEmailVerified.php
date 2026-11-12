<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\NewUserForAdminNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\DB;
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

        $admins = User::role('admin')->get();

        if ($admins->isEmpty()) {
            return;
        }

        $notification = new NewUserForAdminNotification($applicant);

        // The database alert participates in the surrounding verification
        // transaction. If it cannot be persisted, verification rolls back and
        // the signed link remains usable instead of silently losing the alert.
        NotificationFacade::sendNow($admins, $notification, ['database']);

        // Email is external and must not roll back a durable verification and
        // in-app alert. Send it only after commit and isolate transport errors.
        DB::afterCommit(function () use ($admins, $notification, $applicant): void {
            try {
                NotificationFacade::sendNow($admins, $notification, ['mail']);
            } catch (Throwable $exception) {
                Log::warning('Failed emailing admins about a verified staff application: '.$exception->getMessage(), [
                    'user_id' => $applicant->id,
                ]);
            }
        });
    }
}
