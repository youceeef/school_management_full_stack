<?php

namespace App\Providers;

use App\Mail\Transport\MailjetApiTransport;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Password::defaults(fn () => app()->isProduction()
            ? Password::min(12)->letters()->mixedCase()->numbers()->symbols()
            : Password::min(8)
        );

        Mail::extend('mailjet', function (array $config = []) {
            $key = $config['key'] ?? config('mail.mailers.mailjet.key', env('MAILJET_APIKEY', env('MAIL_USERNAME')));
            $secret = $config['secret'] ?? config('mail.mailers.mailjet.secret', env('MAILJET_APISECRET', env('MAIL_PASSWORD')));
            $timeout = (int) ($config['timeout'] ?? config('mail.mailers.mailjet.timeout', env('MAIL_TIMEOUT', 10)));

            return new MailjetApiTransport(
                (string) $key,
                (string) $secret,
                $timeout
            );
        });
    }
}
