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
        $this->assertSame(User::APPROVAL_APPROVED, $response->json('approval_status'));
    }

    public function test_teacher_registration_requires_admin_approval(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Pending',
            'last_name' => 'Teacher',
            'email' => 'pending-teacher@example.com',
            'password' => 'Strong-Password-2026!',
            'password_confirmation' => 'Strong-Password-2026!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonMissingPath('token')
            ->assertJsonPath('approval_required', true)
            ->assertJsonPath('approval_status', User::APPROVAL_PENDING)
            ->assertJsonPath('requested_role', 'enseignant')
            ->assertJsonCount(0, 'user.roles');

        $teacher = User::where('email', 'pending-teacher@example.com')->firstOrFail();

        $this->assertFalse($teacher->isApproved());
        $this->assertTrue($teacher->roles->isEmpty());
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_laboratory_manager_can_submit_a_public_pending_application(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->postJson('/api/register/responsable_labo', [
            'first_name' => 'Pending',
            'last_name' => 'Manager',
            'email' => 'pending-manager@example.com',
            'password' => 'Strong-Password-2026!',
            'password_confirmation' => 'Strong-Password-2026!',
        ])
            ->assertCreated()
            ->assertJsonMissingPath('token')
            ->assertJsonPath('approval_status', User::APPROVAL_PENDING)
            ->assertJsonPath('requested_role', 'responsable_laboratoire');
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
