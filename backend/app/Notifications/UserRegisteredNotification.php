<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class UserRegisteredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected User $user;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     * This data is stored in the 'data' column of the notifications table (as JSON).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $role = $this->user->requested_role
            ?? $this->user->getRoleNames()->first()
            ?? 'utilisateur';
        $pending = $this->user->approval_status === User::APPROVAL_PENDING;

        return [
            'event' => 'user_registered',
            'user_id' => $this->user->id,
            'user_name' => $this->user->first_name.' '.$this->user->last_name,
            'role' => $role,
            'approval_status' => $this->user->approval_status,
            'message' => $pending
                ? 'Votre demande de compte '.$role.' a été enregistrée et attend l’approbation d’un administrateur.'
                : 'Bienvenue ! Votre compte en tant que '.$role.' a été créé.',
            'action_url' => $pending ? '/login' : '/dashboard/profile',
        ];
    }
}
