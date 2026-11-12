<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\VerifyStaffEmailNotification;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendStaffVerificationEmail
{
    use Dispatchable;

    public function __construct(public readonly string $email) {}

    /**
     * Resolve the applicant and enqueue/deliver the notification only after the
     * HTTP response has been sent. Every accepted resend request dispatches this
     * job, so response timing cannot reveal whether the address exists.
     */
    public function handle(): void
    {
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$this->email])
            ->first();

        if (! $user || ! $user->requiresAccountApproval() || $user->hasVerifiedEmail()) {
            return;
        }

        try {
            // The notification remains queueable for future async queue drivers;
            // today's synchronous driver runs it here, after the response.
            $user->notify(new VerifyStaffEmailNotification);
        } catch (Throwable $exception) {
            Log::error('Failed sending staff verification email', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
