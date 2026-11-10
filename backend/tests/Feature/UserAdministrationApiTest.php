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
