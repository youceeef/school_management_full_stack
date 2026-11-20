<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(
                Str::lower((string) $request->input('email')).'|'.$request->ip()
            );
        });

        RateLimiter::for('registration', fn (Request $request) => Limit::perMinute(5)->by($request->ip())
        );

        RateLimiter::for('two-factor-challenge', function (Request $request) {
            $limits = [Limit::perMinute(5)->by('two-factor-ip:'.$request->ip())];
            $challengeToken = $request->input('challenge_token');
            if (! is_string($challengeToken) || strlen($challengeToken) > 2048) {
                return $limits;
            }

            try {
                $payload = decrypt($challengeToken);
            } catch (\Throwable) {
                return $limits;
            }

            if (is_array($payload) && isset($payload['user_id'], $payload['expires_at']) && $payload['expires_at'] > now()->timestamp) {
                $limits[] = Limit::perMinute(5)->by('two-factor-user:'.$payload['user_id']);
            }

            return $limits;
        });

        RateLimiter::for('two-factor-settings', fn (Request $request) => Limit::perMinute(5)->by($request->user()->id));

        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by(
                Str::lower((string) $request->input('email')).'|'.$request->ip()
            );
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
