<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class NewUserForAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 60, 300];

    public function __construct(
        public readonly User $newUser,
        public readonly bool $isResubmission = false,
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
        $adminName = trim(($notifiable->first_name ?? '').' '.($notifiable->last_name ?? '')) ?: 'Administrateur';
        $applicantName = trim(($this->newUser->first_name ?? '').' '.($this->newUser->last_name ?? '')) ?: $this->newUser->email;
        $role = $this->newUser->requested_role
            ?? $this->newUser->getRoleNames()->first()
            ?? 'utilisateur';
        $requiresApproval = $this->newUser->approval_status === User::APPROVAL_PENDING;

        $roleLabel = match ($role) {
            'enseignant' => 'Enseignant',
            'responsable_laboratoire', 'responsable_labo' => 'Responsable de laboratoire',
            'admin' => 'Administrateur',
            'eleve' => 'Élève / Étudiant',
            default => ucfirst($role),
        };

        if ($requiresApproval || $this->isResubmission) {
            $subject = $this->isResubmission
                ? "[EduSpace Admin] Dossier corrigé et renvoyé : {$applicantName}"
                : "[EduSpace Admin] Nouvelle demande de compte : {$applicantName}";

            $intro = $this->isResubmission
                ? "Le demandeur {$applicantName} a soumis un dossier corrigé pour son compte {$roleLabel}."
                : "Une nouvelle demande d’accès pour le rôle {$roleLabel} nécessite votre validation.";

            $hasProof = ! empty($this->newUser->proof_document_path);
            $proofLabel = $hasProof
                ? 'Oui ('.($this->newUser->proof_document_name ?: 'Document téléversé').')'
                : 'Aucun document joint';

            return (new MailMessage)
                ->subject($subject)
                ->greeting("Bonjour {$adminName},")
                ->line($intro)
                ->line("• Demandeur : {$applicantName}")
                ->line("• Email : {$this->newUser->email}")
                ->line("• Rôle demandé : {$roleLabel}")
                ->line('• Établissement : '.($this->newUser->institution ?: 'Non renseigné'))
                ->line('• Département : '.($this->newUser->department ?: 'Non renseigné'))
                ->line('• Identifiant : '.($this->newUser->staff_id ?: 'Non renseigné'))
                ->line("• Justificatif : {$proofLabel}")
                ->action('Examiner la demande dans le centre d’approbation', "{$frontendUrl}/dashboard/account-requests")
                ->line('Vous pouvez valider, rejeter avec motif, ou suspendre ce compte depuis votre tableau de bord.');
        }

        return (new MailMessage)
            ->subject("[EduSpace Admin] Nouvel utilisateur inscrit : {$applicantName}")
            ->greeting("Bonjour {$adminName},")
            ->line("Un nouvel utilisateur s’est inscrit sur la plateforme EduSpace : {$applicantName} ({$this->newUser->email}).")
            ->line("• Rôle : {$roleLabel}")
            ->action('Voir la liste des utilisateurs', "{$frontendUrl}/dashboard/users");
    }

    public function toArray(object $notifiable): array
    {
        $role = $this->newUser->requested_role
            ?? $this->newUser->getRoleNames()->first()
            ?? 'user';
        $requiresApproval = $this->newUser->approval_status === User::APPROVAL_PENDING;

        $event = $this->isResubmission
            ? 'account_approval_resubmitted'
            : ($requiresApproval ? 'account_approval_required' : 'new_user_for_admin');

        $message = $this->isResubmission
            ? 'Le dossier de compte '.$role.' ('.$this->newUser->email.') a été corrigé et attend votre réexamen.'
            : ($requiresApproval
                ? 'Une demande de compte '.$role.' ('.$this->newUser->email.') attend votre approbation.'
                : 'Un nouveau '.$role.' ('.$this->newUser->email.') s\'est inscrit.');

        return [
            'event' => $event,
            'new_user_id' => $this->newUser->id,
            'new_user_name' => $this->newUser->first_name.' '.$this->newUser->last_name,
            'new_user_email' => $this->newUser->email,
            'new_user_role' => ucfirst($role),
            'approval_status' => $this->newUser->approval_status,
            'is_resubmission' => $this->isResubmission,
            'message' => $message,
            'action_url' => $requiresApproval ? '/dashboard/account-requests' : '/dashboard/users',
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Failed delivering new user notification to administrator', [
            'admin_id' => $this->newUser->id ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}
