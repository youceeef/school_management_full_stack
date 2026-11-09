<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class UserRegisteredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 60, 300];

    public function __construct(
        public readonly User $user,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $name = trim(($notifiable->first_name ?? '').' '.($notifiable->last_name ?? '')) ?: 'Utilisateur';
        $role = $this->user->requested_role
            ?? $this->user->getRoleNames()->first()
            ?? 'utilisateur';
        $pending = $this->user->approval_status === User::APPROVAL_PENDING;

        $roleLabel = match ($role) {
            'enseignant' => 'Enseignant',
            'responsable_laboratoire', 'responsable_labo' => 'Responsable de laboratoire',
            'admin' => 'Administrateur',
            'eleve' => 'Élève / Étudiant',
            default => ucfirst($role),
        };

        if ($pending) {
            return (new MailMessage)
                ->subject('[EduSpace] Demande d’inscription bien reçue')
                ->greeting("Bonjour {$name},")
                ->line("Votre demande d’inscription en tant que {$roleLabel} sur la plateforme EduSpace a été enregistrée avec succès.")
                ->line('Elle est actuellement transmise à l’administration de l’établissement pour vérification de votre identité et de votre justificatif.')
                ->line('Vous recevrez une notification par email dès que votre dossier aura été traité.')
                ->action('Accéder à EduSpace', "{$frontendUrl}/login")
                ->line('Merci pour votre démarche.');
        }

        return (new MailMessage)
            ->subject('[EduSpace] Bienvenue sur la plateforme !')
            ->greeting("Bonjour {$name},")
            ->line("Bienvenue sur EduSpace ! Votre compte {$roleLabel} est actif.")
            ->action('Se connecter à mon espace', "{$frontendUrl}/login")
            ->line('Vous pouvez dès à présent explorer vos cours, réservations et ressources.');
    }

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

    public function failed(Throwable $exception): void
    {
        Log::error('Failed delivering welcome notification to user', [
            'user_id' => $this->user->id ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}
