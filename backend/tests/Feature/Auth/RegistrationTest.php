<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_can_register(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/register/eleve', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.email', 'test@example.com');

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $this->assertSame('eleve', $response->json('user.roles.0.name'));
    }

    public function test_privileged_registration_requires_an_admin(): void
    {
        $response = $this->postJson('/api/register/admin', [
            'first_name' => 'Other',
            'last_name' => 'Admin',
            'email' => 'other-admin@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertUnauthorized();
        $this->assertDatabaseMissing('users', ['email' => 'other-admin@example.com']);
    }

    public function test_admin_can_create_a_privileged_account_without_switching_sessions(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this
            ->withToken($admin->createToken('test')->plainTextToken)
            ->postJson('/api/register/admin', [
                'first_name' => 'Other',
                'last_name' => 'Admin',
                'email' => 'other-admin@example.com',
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

        $response
            ->assertCreated()
            ->assertJsonMissingPath('token')
            ->assertJsonPath('user.email', 'other-admin@example.com');

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }
}
