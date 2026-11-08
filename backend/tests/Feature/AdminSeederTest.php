<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_repeated_seeding_does_not_reset_an_existing_admin_password(): void
    {
        config()->set('initial-admin.email', 'admin@example.com');
        config()->set('initial-admin.password', 'Initial-Password-2026!');
        config()->set('initial-admin.first_name', 'Initial');
        config()->set('initial-admin.last_name', 'Admin');

        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(AdminSeeder::class);

        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $admin->update(['password' => 'Changed-Password-2026!']);

        $this->seed(AdminSeeder::class);

        $this->assertTrue(Hash::check(
            'Changed-Password-2026!',
            $admin->fresh()->password
        ));
    }
}
