<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendTestMail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test {email? : Destination email address}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to verify SMTP configuration and connectivity';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $recipient = $this->argument('email') ?? config('mail.from.address');
        $mailer = (string) config('mail.default');

        $this->info("Sending test email to: {$recipient} via mailer [{$mailer}]");

        $rows = [
            ['MAIL_MAILER', $mailer],
            ['MAIL_FROM_ADDRESS', (string) config('mail.from.address')],
            ['MAIL_FROM_NAME', (string) config('mail.from.name')],
        ];

        if ($mailer === 'mailjet') {
            $key = (string) config('mail.mailers.mailjet.key');
            $rows[] = ['MAILJET_KEY', $key !== '' ? substr($key, 0, 6).'***' : 'not set'];
            $rows[] = ['API_ENDPOINT', 'https://api.mailjet.com/v3.1/send (Port 443 HTTPS)'];
        } else {
            $rows[] = ['MAIL_HOST', (string) config('mail.mailers.smtp.host')];
            $rows[] = ['MAIL_PORT', (string) config('mail.mailers.smtp.port')];
            $rows[] = ['MAIL_ENCRYPTION', (string) config('mail.mailers.smtp.encryption')];
        }

        $this->table(['Config Key', 'Value'], $rows);

        try {
            Mail::raw('Bonjour, ceci est un email de test envoyé depuis EduSpace pour vérifier la configuration de messagerie (Mailjet API v3.1 HTTPS).', function ($message) use ($recipient) {
                $message->to($recipient)
                    ->subject('[EduSpace] Test de configuration de messagerie');
            });

            $this->info('✓ Test email sent successfully!');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('✗ Failed sending test email: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
