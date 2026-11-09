<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_pending_teacher_cannot_log_in(): void
    {
        $teacher = $this->pendingApplicant('enseignant');

        $this->postJson('/api/login', [
            'email' => $teacher->email,
            'password' => 'password',
        ])
            ->assertForbidden()
            ->assertJsonPath('code', 'ACCOUNT_PENDING')
            ->assertJsonMissingPath('token');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_admin_can_approve_teacher_and_assign_requested_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $teacher = $this->pendingApplicant('enseignant');

        $this->withToken($admin->createToken('admin-review')->plainTextToken)
            ->patchJson("/api/users/{$teacher->id}/approval", [
                'status' => User::APPROVAL_APPROVED,
            ])
            ->assertOk()
            ->assertJsonPath('user.approval_status', User::APPROVAL_APPROVED)
            ->assertJsonPath('user.roles.0', 'enseignant');

        $teacher->refresh();

        $this->assertTrue($teacher->isApproved());
        $this->assertTrue($teacher->hasRole('enseignant'));
        $this->assertSame($admin->id, $teacher->reviewed_by);
        $this->assertNotNull($teacher->reviewed_at);

        $this->postJson('/api/login', [
            'email' => $teacher->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token', 'permissions']);
    }

    public function test_admin_can_reject_application_and_revoke_access(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $teacher = $this->pendingApplicant('enseignant');
        $teacher->assignRole('enseignant');
        $teacher->createToken('stale-session');

        $this->withToken($admin->createToken('admin-review')->plainTextToken)
            ->patchJson("/api/users/{$teacher->id}/approval", [
                'status' => User::APPROVAL_REJECTED,
                'reason' => 'Justificatif professionnel manquant ou non conforme.',
            ])
            ->assertOk();

        $teacher->refresh();

        $this->assertSame(User::APPROVAL_REJECTED, $teacher->approval_status);
        $this->assertTrue($teacher->roles->isEmpty());
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $teacher->id,
        ]);

        $this->postJson('/api/login', [
            'email' => $teacher->email,
            'password' => 'password',
        ])->assertForbidden()->assertJsonPath('code', 'ACCOUNT_REJECTED');
    }

    public function test_non_admin_cannot_review_applications(): void
    {
        $student = User::factory()->create();
        $student->assignRole('eleve');
        $teacher = $this->pendingApplicant('enseignant');

        $this->withToken($student->createToken('student')->plainTextToken)
            ->patchJson("/api/users/{$teacher->id}/approval", [
                'status' => User::APPROVAL_APPROVED,
            ])
            ->assertForbidden();

        $this->assertSame(User::APPROVAL_PENDING, $teacher->fresh()->approval_status);
    }

    public function test_backfill_converts_existing_staff_roles_to_pending_requests(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $teacher = User::factory()->create();
        $teacher->assignRole('enseignant');
        $teacher->createToken('teacher-session');

        $manager = User::factory()->create();
        $manager->assignRole('responsable_laboratoire');

        $student = User::factory()->create();
        $student->assignRole('eleve');

        $migration = require database_path(
            'migrations/2026_11_09_000002_backfill_staff_account_approvals.php'
        );
        $migration->up();

        $teacher->refresh();
        $manager->refresh();
        $admin->refresh();
        $student->refresh();

        $this->assertSame(User::APPROVAL_PENDING, $teacher->approval_status);
        $this->assertSame('enseignant', $teacher->requested_role);
        $this->assertTrue($teacher->roles->isEmpty());
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $teacher->id,
        ]);

        $this->assertSame(User::APPROVAL_PENDING, $manager->approval_status);
        $this->assertSame('responsable_laboratoire', $manager->requested_role);
        $this->assertTrue($manager->roles->isEmpty());

        $this->assertSame(User::APPROVAL_APPROVED, $admin->approval_status);
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertSame(User::APPROVAL_APPROVED, $student->approval_status);
        $this->assertTrue($student->hasRole('eleve'));
    }

    private function pendingApplicant(string $requestedRole): User
    {
        return User::factory()->create([
            'approval_status' => User::APPROVAL_PENDING,
            'requested_role' => $requestedRole,
            'reviewed_at' => null,
            'reviewed_by' => null,
        ]);
    }
}
