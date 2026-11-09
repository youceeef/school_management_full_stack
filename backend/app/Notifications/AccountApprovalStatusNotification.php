<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AccountApprovalStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $status,
        private readonly ?string $reason = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $approved = in_array($this->status, ['approved', 'reactivated'], true);

        $message = match ($this->status) {
            'approved' => 'Votre compte a été approuvé. Vous pouvez maintenant vous connecter.',
            'reactivated' => 'Votre compte a été réactivé par l’administration.',
            'suspended' => 'Votre compte a été suspendu par l’administration.',
            'rejected' => 'Votre demande de compte a été refusée par l’administration.',
            default => 'Mise à jour du statut de votre compte.',
        };

        return [
            'event' => 'account_'.$this->status,
            'approval_status' => $this->status,
            'message' => $message,
            'reason' => $this->reason,
            'action_url' => $approved ? '/login' : '/',
        ];
    }
}
