<?php

namespace App\Providers;

use App\Models\Document;
use App\Models\Equipement;
use App\Models\Reservation;
use App\Models\Salle;
use App\Models\User;
use App\Policies\DocumentPolicy;
use App\Policies\EquipementPolicy;
use App\Policies\ReservationPolicy;
use App\Policies\RolePolicy;
use App\Policies\SallePolicy;
use App\Policies\UserPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
        Salle::class => SallePolicy::class,
        Role::class => RolePolicy::class,
        Document::class => DocumentPolicy::class,
        Equipement::class => EquipementPolicy::class,
        Reservation::class => ReservationPolicy::class,
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $email = rawurlencode($notifiable->getEmailForPasswordReset());

            return config('app.frontend_url')."/password-reset/$token?email=$email";
        });

        //
    }
}
