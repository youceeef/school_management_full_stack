<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AccountApprovalStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $status) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $approved = $this->status === 'approved';

        return [
            'event' => $approved ? 'account_approved' : 'account_rejected',
            'approval_status' => $this->status,
            'message' => $approved
                ? 'Votre compte a été approuvé. Vous pouvez maintenant vous connecter.'
                : 'Votre demande de compte a été refusée. Contactez l’administration pour plus d’informations.',
            'action_url' => $approved ? '/login' : '/',
        ];
    }
}
