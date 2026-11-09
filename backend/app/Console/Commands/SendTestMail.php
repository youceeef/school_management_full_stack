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

        $this->info("Sending test email to: {$recipient}");
        $this->table(['Config Key', 'Value'], [
            ['MAIL_MAILER', (string) config('mail.default')],
            ['MAIL_HOST', (string) config('mail.mailers.smtp.host')],
            ['MAIL_PORT', (string) config('mail.mailers.smtp.port')],
            ['MAIL_ENCRYPTION', (string) config('mail.mailers.smtp.encryption')],
            ['MAIL_USERNAME', (string) config('mail.mailers.smtp.username')],
            ['MAIL_FROM_ADDRESS', (string) config('mail.from.address')],
            ['MAIL_FROM_NAME', (string) config('mail.from.name')],
        ]);

        try {
            Mail::raw('Bonjour, ceci est un email de test envoyé depuis EduSpace pour vérifier la configuration SMTP.', function ($message) use ($recipient) {
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
