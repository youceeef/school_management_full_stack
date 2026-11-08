<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use RuntimeException;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = config('initial-admin.email');
        $password = config('initial-admin.password');

        if (! $email || ! $password) {
            $this->command?->warn('ADMIN_EMAIL and ADMIN_PASSWORD are not set; initial admin creation was skipped.');

            return;
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => ['required', 'email'],
                'password' => ['required', Password::defaults()],
            ]
        );

        if ($validator->fails()) {
            throw new RuntimeException(
                'The initial administrator credentials do not satisfy the production validation rules.'
            );
        }

        $adminUser = User::withTrashed()->where('email', $email)->first();

        if ($adminUser?->trashed()) {
            $this->command?->warn('The configured initial administrator is deleted; it was not restored automatically.');

            return;
        }

        if (! $adminUser) {
            $adminUser = User::create([
                'first_name' => config('initial-admin.first_name'),
                'last_name' => config('initial-admin.last_name'),
                'email' => $email,
                'password' => $password,
            ]);
        }

        $adminUser->syncRoles(['admin']);
    }
}
