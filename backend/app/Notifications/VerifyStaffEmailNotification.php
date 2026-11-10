<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Throwable;

class VerifyStaffEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public const LINK_LIFETIME_MINUTES = 60;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 60, 300];

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $this->resolveLocale($notifiable);
        $name = trim(($notifiable->first_name ?? '').' '.($notifiable->last_name ?? '')) ?: 'Utilisateur';
        $verificationUrl = $this->verificationUrl($notifiable);
        $minutes = self::LINK_LIFETIME_MINUTES;

        return match ($locale) {
            'en' => $this->buildEnglishMail($name, $verificationUrl, $minutes),
            'ar' => $this->buildArabicMail($name, $verificationUrl, $minutes),
            default => $this->buildFrenchMail($name, $verificationUrl, $minutes),
        };
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Failed delivering staff email verification notification', [
            'error' => $exception->getMessage(),
        ]);
    }

    private function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(self::LINK_LIFETIME_MINUTES),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }

    private function resolveLocale(object $notifiable): string
    {
        if (isset($notifiable->preferred_locale) && $notifiable->preferred_locale) {
            return strtolower(substr($notifiable->preferred_locale, 0, 2));
        }

        return strtolower(substr(config('app.locale', 'fr'), 0, 2));
    }

    private function buildFrenchMail(string $name, string $url, int $minutes): MailMessage
    {
        return (new MailMessage)
            ->greeting("Bonjour {$name},")
            ->subject('[EduSpace] Confirmez votre adresse email')
            ->line('Votre demande de compte en tant que personnel a bien été enregistrée, mais elle ne sera pas encore examinée par l’administration.')
            ->line('Pour des raisons de sécurité, confirmez d’abord que cette adresse email vous appartient en cliquant sur le bouton ci-dessous.')
            ->action('Confirmer mon adresse email', $url)
            ->line("Ce lien est valable {$minutes} minutes et ne peut être utilisé qu’une seule fois.")
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message : aucun compte ne sera examiné sans cette confirmation.');
    }

    private function buildEnglishMail(string $name, string $url, int $minutes): MailMessage
    {
        return (new MailMessage)
            ->greeting("Hello {$name},")
            ->subject('[EduSpace] Confirm your email address')
            ->line('Your staff account request has been received, but it cannot be reviewed by the administration yet.')
            ->line('For security reasons, please confirm that this email address belongs to you using the button below.')
            ->action('Confirm my email address', $url)
            ->line("This link is valid for {$minutes} minutes and can only be used once.")
            ->line('If you did not request this account, simply ignore this message: no account is reviewed without this confirmation.');
    }

    private function buildArabicMail(string $name, string $url, int $minutes): MailMessage
    {
        return (new MailMessage)
            ->greeting("مرحبًا {$name}،")
            ->subject('[EduSpace] تأكيد عنوان بريدك الإلكتروني')
            ->line('تم استلام طلب حسابك كأحد أفراد الطاقم، لكنه لن يُراجع من قِبل الإدارة بعد.')
            ->line('لأسباب أمنية، يُرجى تأكيد أن عنوان البريد الإلكتروني هذا يخصك عبر الزر أدناه.')
            ->action('تأكيد عنوان بريدي الإلكتروني', $url)
            ->line("هذا الرابط صالح لمدة {$minutes} دقيقة ويمكن استخدامه مرة واحدة فقط.")
            ->line('إذا لم تكن أنت من قدّم هذا الطلب، فتجاهل هذه الرسالة: لن تتم مراجعة أي حساب دون هذا التأكيد.');
    }
}
