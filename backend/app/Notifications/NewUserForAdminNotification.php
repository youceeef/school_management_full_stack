<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewUserForAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected User $newUser;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $newUser)
    {
        $this->newUser = $newUser;
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
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $role = $this->newUser->getRoleNames()->first() ?? 'user';
        return [
            'event' => 'new_user_for_admin',
            'new_user_id' => $this->newUser->id,
            'new_user_name' => $this->newUser->first_name . ' ' . $this->newUser->last_name,
            'new_user_email' => $this->newUser->email,
            'new_user_role' => ucfirst($role),
            'message' => 'Un nouveau ' . $role . ' (' . $this->newUser->email . ') s\'est inscrit.',
            'action_url' => '/admin/users/' . $this->newUser->id,
        ];
    }
}
