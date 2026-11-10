<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAdministrationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_receives_a_bounded_paginated_user_directory(): void
    {
        $admin = $this->createAdmin();
        User::factory()->count(20)->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/users?per_page=5&page=2');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.total', 21)
            ->assertJsonPath('meta.counts.total', 21)
            ->assertJsonPath('meta.counts.admins', 1)
            ->assertJsonStructure([
                'data' => ['*' => ['id', 'first_name', 'last_name', 'email', 'roles', 'approval_status', 'department', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total', 'from', 'to', 'counts'],
                'links' => ['first', 'last', 'prev', 'next'],
            ]);
    }

    public function test_admin_can_search_filter_and_sort_the_user_directory(): void
    {
        $admin = $this->createAdmin();
        $teacher = User::factory()->create([
            'first_name' => 'Zied',
            'last_name' => 'Networks',
            'email' => 'zied@school.example',
            'department' => 'Télécommunications',
            'approval_status' => User::APPROVAL_APPROVED,
            'created_at' => now()->subDays(2),
        ]);
        $teacher->assignRole('enseignant');

        $pending = User::factory()->create([
            'first_name' => 'Amira',
            'last_name' => 'Pending',
            'email' => 'amira@school.example',
            'department' => 'Multimédia',
            'approval_status' => User::APPROVAL_PENDING,
            'created_at' => now(),
        ]);
        $pending->assignRole('enseignant');

        $token = $this->tokenFor($admin);

        $this->withToken($token)
            ->getJson('/api/users?search=networks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $teacher->id);

        $this->withToken($token)
            ->getJson('/api/users?role=enseignant&status=pending&department=Multimédia')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending->id);

        $sorted = $this->withToken($token)
            ->getJson('/api/users?role=enseignant&sort_by=name&sort_direction=asc');
        $sorted->assertOk()
            ->assertJsonPath('data.0.first_name', 'Amira')
            ->assertJsonPath('data.1.first_name', 'Zied');
    }

    public function test_user_directory_filters_are_validated_and_access_is_authorized(): void
    {
        $admin = $this->createAdmin();
        $student = User::factory()->create();
        $student->assignRole('eleve');

        $this->getJson('/api/users')->assertUnauthorized();
        $this->withToken($this->tokenFor($student))->getJson('/api/users')->assertForbidden();
        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/users?per_page=101&sort_by=password')
            ->assertUnprocessable();
    }

    public function test_admin_can_bulk_assign_and_remove_roles(): void
    {
        $admin = $this->createAdmin();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $token = $this->tokenFor($admin);

        // Bulk assign 'enseignant'
        $assignResponse = $this->withToken($token)->postJson('/api/users/bulk-action', [
            'user_ids' => [$user1->id, $user2->id],
            'action' => 'assign_role',
            'role' => 'enseignant',
        ]);

        $assignResponse->assertOk()
            ->assertJsonPath('processed_count', 2)
            ->assertJsonPath('skipped_count', 0);

        $this->assertTrue($user1->fresh()->hasRole('enseignant'));
        $this->assertTrue($user2->fresh()->hasRole('enseignant'));

        // Bulk remove 'enseignant'
        $removeResponse = $this->withToken($token)->postJson('/api/users/bulk-action', [
            'user_ids' => [$user1->id, $user2->id],
            'action' => 'remove_role',
            'role' => 'enseignant',
        ]);

        $removeResponse->assertOk()
            ->assertJsonPath('processed_count', 2);

        $this->assertFalse($user1->fresh()->hasRole('enseignant'));
        $this->assertFalse($user2->fresh()->hasRole('enseignant'));
    }

    public function test_admin_bulk_action_protects_self_and_last_admin(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create();

        $token = $this->tokenFor($admin);

        // Attempt bulk delete on self and regular user
        $deleteResponse = $this->withToken($token)->postJson('/api/users/bulk-action', [
            'user_ids' => [$admin->id, $user->id],
            'action' => 'delete',
        ]);

        $deleteResponse->assertOk()
            ->assertJsonPath('processed_count', 1)
            ->assertJsonPath('skipped_count', 1);

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'deleted_at' => null]);
        $this->assertSoftDeleted('users', ['id' => $user->id]);

        // Attempt bulk remove admin role from only remaining admin
        $removeRoleResponse = $this->withToken($token)->postJson('/api/users/bulk-action', [
            'user_ids' => [$admin->id],
            'action' => 'remove_role',
            'role' => 'admin',
        ]);

        $removeRoleResponse->assertOk()
            ->assertJsonPath('processed_count', 0)
            ->assertJsonPath('skipped_count', 1);

        $this->assertTrue($admin->fresh()->hasRole('admin'));
    }

    public function test_admin_can_bulk_approve_and_suspend_users(): void
    {
        $admin = $this->createAdmin();
        $pending1 = User::factory()->create([
            'approval_status' => User::APPROVAL_PENDING,
            'requested_role' => 'enseignant',
        ]);
        $pending2 = User::factory()->create([
            'approval_status' => User::APPROVAL_PENDING,
            'requested_role' => 'responsable_laboratoire',
        ]);

        $token = $this->tokenFor($admin);

        // Bulk approve
        $approveResponse = $this->withToken($token)->postJson('/api/users/bulk-action', [
            'user_ids' => [$pending1->id, $pending2->id],
            'action' => 'approve',
        ]);

        $approveResponse->assertOk()
            ->assertJsonPath('processed_count', 2);

        $this->assertEquals(User::APPROVAL_APPROVED, $pending1->fresh()->approval_status);
        $this->assertEquals(User::APPROVAL_APPROVED, $pending2->fresh()->approval_status);
        $this->assertTrue($pending1->fresh()->hasRole('enseignant'));

        // Bulk suspend
        $suspendResponse = $this->withToken($token)->postJson('/api/users/bulk-action', [
            'user_ids' => [$pending1->id, $pending2->id],
            'action' => 'suspend',
            'reason' => 'Annual institutional audit suspension',
        ]);

        $suspendResponse->assertOk()
            ->assertJsonPath('processed_count', 2);

        $this->assertEquals(User::APPROVAL_SUSPENDED, $pending1->fresh()->approval_status);
        $this->assertEquals(User::APPROVAL_SUSPENDED, $pending2->fresh()->approval_status);
    }

    public function test_non_admin_cannot_execute_bulk_actions(): void
    {
        $student = User::factory()->create();
        $student->assignRole('eleve');

        $this->postJson('/api/users/bulk-action', [
            'user_ids' => [$student->id],
            'action' => 'delete',
        ])->assertUnauthorized();

        $this->withToken($this->tokenFor($student))->postJson('/api/users/bulk-action', [
            'user_ids' => [$student->id],
            'action' => 'delete',
        ])->assertForbidden();
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    private function tokenFor(User $user): string
    {
        return $user->createToken('test-token')->plainTextToken;
    }
}
