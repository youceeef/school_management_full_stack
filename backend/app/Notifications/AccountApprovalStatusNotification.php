<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class AccountApprovalStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 60, 300];

    public function __construct(
        private readonly string $status,
        private readonly ?string $reason = null,
        ?string $customLocale = null,
    ) {
        $this->locale = $customLocale;
    }

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
        $locale = $this->resolveLocale($notifiable);
        $name = trim(($notifiable->first_name ?? '').' '.($notifiable->last_name ?? '')) ?: 'Utilisateur';

        return match ($locale) {
            'en' => $this->buildEnglishMail($name, $frontendUrl),
            'ar' => $this->buildArabicMail($name, $frontendUrl),
            default => $this->buildFrenchMail($name, $frontendUrl),
        };
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
            'action_url' => $approved ? '/login' : ($this->status === 'rejected' ? '/resubmit' : '/'),
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Failed delivering account approval status notification', [
            'status' => $this->status,
            'reason' => $this->reason,
            'error' => $exception->getMessage(),
        ]);
    }

    private function resolveLocale(object $notifiable): string
    {
        if ($this->locale) {
            return strtolower(substr($this->locale, 0, 2));
        }

        if (isset($notifiable->preferred_locale) && $notifiable->preferred_locale) {
            return strtolower(substr($notifiable->preferred_locale, 0, 2));
        }

        return strtolower(substr(config('app.locale', 'fr'), 0, 2));
    }

    private function buildFrenchMail(string $name, string $frontendUrl): MailMessage
    {
        $mail = (new MailMessage)->greeting("Bonjour {$name},");

        switch ($this->status) {
            case 'approved':
                return $mail
                    ->subject('[EduSpace] Votre compte a été validé')
                    ->line('Votre demande d’accès en tant que personnel a été validée avec succès par l’administration.')
                    ->line('Vous pouvez dès à présent vous connecter pour accéder à vos services et ressources.')
                    ->action('Se connecter à EduSpace', "{$frontendUrl}/login")
                    ->line('Merci pour votre confiance.');

            case 'reactivated':
                return $mail
                    ->subject('[EduSpace] Votre compte a été réactivé')
                    ->line('Votre compte EduSpace a été réactivé par l’administration.')
                    ->line('Tous vos accès et permissions associés ont été entièrement restaurés.')
                    ->action('Accéder à la plateforme', "{$frontendUrl}/login");

            case 'rejected':
                $mail
                    ->subject('[EduSpace] Statut de votre demande de compte')
                    ->line('Votre demande d’accès en tant que personnel n’a pas pu être validée par l’administration.');

                if ($this->reason) {
                    $mail->line("Motif communiqué par l’administrateur : « {$this->reason} »");
                }

                return $mail
                    ->line('Vous pouvez corriger vos informations institutionnelles ou soumettre un justificatif conforme directement depuis notre page de correction.')
                    ->action('Corriger et renvoyer ma demande', "{$frontendUrl}/resubmit")
                    ->line('Cette démarche ne nécessite pas la création d’un nouveau compte.');

            case 'suspended':
                $mail
                    ->subject('[EduSpace] Suspension temporaire de votre compte')
                    ->line('Votre compte EduSpace a été suspendu par l’administration.');

                if ($this->reason) {
                    $mail->line("Motif de la suspension : « {$this->reason} »");
                }

                return $mail
                    ->line('Vos sessions actives ont été immédiatement révoquées.')
                    ->line('Si vous pensez qu’il s’agit d’une erreur ou pour toute question, veuillez contacter l’administration de l’établissement.');

            default:
                return $mail
                    ->subject('[EduSpace] Mise à jour du statut de votre compte')
                    ->line('Le statut de votre compte EduSpace a été mis à jour.')
                    ->action('Consulter EduSpace', $frontendUrl);
        }
    }

    private function buildEnglishMail(string $name, string $frontendUrl): MailMessage
    {
        $mail = (new MailMessage)->greeting("Hello {$name},");

        switch ($this->status) {
            case 'approved':
                return $mail
                    ->subject('[EduSpace] Your account has been approved')
                    ->line('Your staff access application has been successfully approved by the administration.')
                    ->line('You can now sign in to access your services and resources.')
                    ->action('Sign in to EduSpace', "{$frontendUrl}/login")
                    ->line('Thank you for your commitment.');

            case 'reactivated':
                return $mail
                    ->subject('[EduSpace] Your account has been reactivated')
                    ->line('Your EduSpace account has been reactivated by the administration.')
                    ->line('All associated permissions and access rights have been fully restored.')
                    ->action('Access EduSpace', "{$frontendUrl}/login");

            case 'rejected':
                $mail
                    ->subject('[EduSpace] Application status update')
                    ->line('Your staff access request could not be approved by the administration.');

                if ($this->reason) {
                    $mail->line("Administrator reason: “{$this->reason}”");
                }

                return $mail
                    ->line('You can correct your institutional credentials or upload a compliant proof document on our update page.')
                    ->action('Correct and resubmit', "{$frontendUrl}/resubmit")
                    ->line('You do not need to create a new account to complete this step.');

            case 'suspended':
                $mail
                    ->subject('[EduSpace] Temporary account suspension')
                    ->line('Your EduSpace account has been suspended by the administration.');

                if ($this->reason) {
                    $mail->line("Suspension reason: “{$this->reason}”");
                }

                return $mail
                    ->line('All active sessions have been revoked.')
                    ->line('If you believe this is an error or have questions, please reach out to the school administration.');

            default:
                return $mail
                    ->subject('[EduSpace] Account status updated')
                    ->line('Your EduSpace account status has been updated.')
                    ->action('Open EduSpace', $frontendUrl);
        }
    }

    private function buildArabicMail(string $name, string $frontendUrl): MailMessage
    {
        $mail = (new MailMessage)->greeting("مرحبًا {$name}،");

        switch ($this->status) {
            case 'approved':
                return $mail
                    ->subject('[EduSpace] تمت الموافقة على حسابك')
                    ->line('تمت الموافقة بنجاح على طلب انضمامك من قِبل إدارة المؤسسة.')
                    ->line('يمكنك الآن تسجيل الدخول للاستفادة من كافة الخدمات والموارد المتاحة.')
                    ->action('تسجيل الدخول إلى EduSpace', "{$frontendUrl}/login")
                    ->line('شكرًا لتعاونكم معنا.');

            case 'reactivated':
                return $mail
                    ->subject('[EduSpace] تمت إعادة تفعيل حسابك')
                    ->line('تمت إعادة تفعيل حسابك على منصة EduSpace من قِبل الإدارة.')
                    ->line('تمت استعادة كافة الصلاحيات وحقوق الوصول المرتبطة بحسابك بالكامل.')
                    ->action('الدخول إلى المنصة', "{$frontendUrl}/login");

            case 'rejected':
                $mail
                    ->subject('[EduSpace] تحديث بشأن طلب حسابك')
                    ->line('تعذر قبول طلب تسجيلك كأحد أفراد الطاقم من قِبل إدارة المؤسسة.');

                if ($this->reason) {
                    $mail->line("السبب المذكور من الإدارة: « {$this->reason} »");
                }

                return $mail
                    ->line('يمكنك تصحيح بياناتك المؤسسية أو رفع وثيقة إثبات مطابقة مباشرة من خلال صفحة التصحيح.')
                    ->action('تصحيح الطلب وإعادة إرساله', "{$frontendUrl}/resubmit")
                    ->line('لا حاجة لإنشاء حساب جديد للقيام بهذه العملية.');

            case 'suspended':
                $mail
                    ->subject('[EduSpace] تعليق مؤقت لحسابك')
                    ->line('تم تعليق حسابك على منصة EduSpace من قِبل إدارة المؤسسة.');

                if ($this->reason) {
                    $mail->line("سبب التعليق: « {$this->reason} »");
                }

                return $mail
                    ->line('تم إنهاء جميع جلسات تسجيل الدخول النشطة فورًا.')
                    ->line('إذا كنت تعتقد أن هذا الإجراء تم بالخطأ، يُرجى التواصل مع إدارة المؤسسة.');

            default:
                return $mail
                    ->subject('[EduSpace] تحديث حالة الحساب')
                    ->line('تم تحديث حالة حسابك على منصة EduSpace.')
                    ->action('زيارة EduSpace', $frontendUrl);
        }
    }
}
