<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

class AccountRequestApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_list_paginated_account_requests_with_summary_counts(): void
    {
        $admin = $this->createAdmin();

        // Create applicants with various statuses
        $this->createApplicant('enseignant', User::APPROVAL_PENDING, 'Alice', 'Prof', 'alice@school.edu');
        $this->createApplicant('enseignant', User::APPROVAL_PENDING, 'Bob', 'Teacher', 'bob@school.edu');
        $this->createApplicant('responsable_laboratoire', User::APPROVAL_APPROVED, 'Charlie', 'Lab', 'charlie@school.edu');
        $this->createApplicant('enseignant', User::APPROVAL_REJECTED, 'Diana', 'Denied', 'diana@school.edu');

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/account-requests');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'first_name',
                        'last_name',
                        'email',
                        'approval_status',
                        'requested_role',
                        'roles',
                        'created_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                    'counts' => [
                        'all',
                        'pending',
                        'approved',
                        'rejected',
                        'suspended',
                    ],
                ],
                'links' => [
                    'first',
                    'last',
                ],
            ]);

        $meta = $response->json('meta');
        $this->assertSame(4, $meta['total']);
        $this->assertSame(4, $meta['counts']['all']);
        $this->assertSame(2, $meta['counts']['pending']);
        $this->assertSame(1, $meta['counts']['approved']);
        $this->assertSame(1, $meta['counts']['rejected']);
        $this->assertSame(0, $meta['counts']['suspended']);
    }

    public function test_admin_can_filter_by_status(): void
    {
        $admin = $this->createAdmin();

        $this->createApplicant('enseignant', User::APPROVAL_PENDING, 'Pending', 'One');
        $this->createApplicant('responsable_laboratoire', User::APPROVAL_APPROVED, 'Approved', 'Two');
        $this->createApplicant('enseignant', User::APPROVAL_REJECTED, 'Rejected', 'Three');

        $token = $this->tokenFor($admin);

        // Pending only
        $resPending = $this->withToken($token)->getJson('/api/account-requests?status=pending');
        $resPending->assertOk();
        $this->assertCount(1, $resPending->json('data'));
        $this->assertSame(User::APPROVAL_PENDING, $resPending->json('data.0.approval_status'));
        // Summary counts still reflect entire set
        $this->assertSame(3, $resPending->json('meta.counts.all'));
        $this->assertSame(1, $resPending->json('meta.counts.pending'));

        // Approved only
        $resApproved = $this->withToken($token)->getJson('/api/account-requests?status=approved');
        $resApproved->assertOk();
        $this->assertCount(1, $resApproved->json('data'));
        $this->assertSame(User::APPROVAL_APPROVED, $resApproved->json('data.0.approval_status'));

        // Rejected only
        $resRejected = $this->withToken($token)->getJson('/api/account-requests?status=rejected');
        $resRejected->assertOk();
        $this->assertCount(1, $resRejected->json('data'));
        $this->assertSame(User::APPROVAL_REJECTED, $resRejected->json('data.0.approval_status'));
    }

    public function test_admin_can_filter_by_role_name_email_and_date(): void
    {
        $admin = $this->createAdmin();

        $this->createApplicant('enseignant', User::APPROVAL_PENDING, 'Karim', 'Bensaid', 'karim@test.com', '2026-11-01');
        $this->createApplicant('responsable_laboratoire', User::APPROVAL_PENDING, 'Fatima', 'Zahra', 'fatima@test.com', '2026-11-05');

        $token = $this->tokenFor($admin);

        // Filter by role
        $resRole = $this->withToken($token)->getJson('/api/account-requests?requested_role=responsable_laboratoire');
        $resRole->assertOk();
        $this->assertCount(1, $resRole->json('data'));
        $this->assertSame('responsable_laboratoire', $resRole->json('data.0.requested_role'));

        // Filter by email
        $resEmail = $this->withToken($token)->getJson('/api/account-requests?email=karim@test.com');
        $resEmail->assertOk();
        $this->assertCount(1, $resEmail->json('data'));
        $this->assertSame('karim@test.com', $resEmail->json('data.0.email'));

        // Filter by search keyword
        $resSearch = $this->withToken($token)->getJson('/api/account-requests?search=Zahra');
        $resSearch->assertOk();
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertSame('Fatima', $resSearch->json('data.0.first_name'));

        // Filter by date range
        $resDate = $this->withToken($token)->getJson('/api/account-requests?date_from=2026-11-03&date_to=2026-11-06');
        $resDate->assertOk();
        $this->assertCount(1, $resDate->json('data'));
        $this->assertSame('Fatima', $resDate->json('data.0.first_name'));
    }

    public function test_admin_can_fetch_single_account_request_with_reviewer(): void
    {
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant('enseignant', User::APPROVAL_APPROVED, 'John', 'Doe');
        $applicant->forceFill([
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ])->save();

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/account-requests/{$applicant->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $applicant->id)
            ->assertJsonPath('data.first_name', 'John')
            ->assertJsonPath('data.reviewed_by.id', $admin->id);
    }

    public function test_admin_can_fetch_summary_counts_only(): void
    {
        $admin = $this->createAdmin();

        $this->createApplicant('enseignant', User::APPROVAL_PENDING);
        $this->createApplicant('enseignant', User::APPROVAL_PENDING);
        $this->createApplicant('responsable_laboratoire', User::APPROVAL_APPROVED);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/account-requests/counts');

        $response->assertOk()
            ->assertJson([
                'all' => 3,
                'pending' => 2,
                'approved' => 1,
                'rejected' => 0,
                'suspended' => 0,
            ]);
    }

    public function test_admin_can_approve_account_request_via_endpoint(): void
    {
        $admin = $this->createAdmin();
        $teacher = $this->createApplicant('enseignant', User::APPROVAL_PENDING);

        $response = $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/account-requests/{$teacher->id}", [
                'status' => User::APPROVAL_APPROVED,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.approval_status', User::APPROVAL_APPROVED)
            ->assertJsonPath('data.roles.0', 'enseignant');

        $teacher->refresh();
        $this->assertTrue($teacher->isApproved());
        $this->assertTrue($teacher->hasRole('enseignant'));
        $this->assertSame($admin->id, $teacher->reviewed_by);
        $this->assertNotNull($teacher->reviewed_at);
    }

    public function test_admin_can_reject_account_request_via_endpoint(): void
    {
        $admin = $this->createAdmin();
        $teacher = $this->createApplicant('enseignant', User::APPROVAL_PENDING);
        $teacher->assignRole('enseignant');
        $teacher->createToken('session');

        $response = $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/account-requests/{$teacher->id}", [
                'status' => User::APPROVAL_REJECTED,
                'reason' => 'Dossier administratif incomplet.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.approval_status', User::APPROVAL_REJECTED);

        $teacher->refresh();
        $this->assertSame(User::APPROVAL_REJECTED, $teacher->approval_status);
        $this->assertTrue($teacher->roles->isEmpty());
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $teacher->id,
        ]);
    }

    public function test_non_admin_cannot_access_account_requests(): void
    {
        $student = User::factory()->create();
        $student->assignRole('eleve');

        $teacher = $this->createApplicant('enseignant', User::APPROVAL_APPROVED);
        $teacher->assignRole('enseignant');

        // Unauthenticated
        $this->getJson('/api/account-requests')->assertUnauthorized();
        $this->getJson('/api/account-requests/counts')->assertUnauthorized();
        $this->patchJson('/api/account-requests/1', ['status' => 'approved'])->assertUnauthorized();

        // Student forbidden
        $this->withToken($this->tokenFor($student))->getJson('/api/account-requests')->assertForbidden();
        $this->withToken($this->tokenFor($student))->getJson('/api/account-requests/counts')->assertForbidden();
        $this->withToken($this->tokenFor($student))->patchJson('/api/account-requests/1', ['status' => 'approved'])->assertForbidden();

        // Teacher forbidden
        $this->withToken($this->tokenFor($teacher))->getJson('/api/account-requests')->assertForbidden();
        $this->withToken($this->tokenFor($teacher))->getJson('/api/account-requests/counts')->assertForbidden();
        $this->withToken($this->tokenFor($teacher))->patchJson('/api/account-requests/1', ['status' => 'approved'])->assertForbidden();
    }

    public function test_students_and_admins_are_excluded_from_staff_requests_listing(): void
    {
        $admin = $this->createAdmin();

        // Regular student (approved immediately)
        $student = User::factory()->create([
            'requested_role' => 'eleve',
            'approval_status' => User::APPROVAL_APPROVED,
        ]);
        $student->assignRole('eleve');

        // Staff applicant
        $this->createApplicant('enseignant', User::APPROVAL_PENDING);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson('/api/account-requests');

        $response->assertOk();
        $this->assertSame(1, $response->json('meta.total'));
        $this->assertSame(1, $response->json('meta.counts.all'));
        $this->assertSame('enseignant', $response->json('data.0.requested_role'));
    }

    public function test_admin_can_send_a_test_email(): void
    {
        Mail::fake();
        $admin = $this->createAdmin();

        $this->withToken($this->tokenFor($admin))
            ->postJson('/api/account-requests/test-email', ['email' => 'delivery@example.com'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonMissingPath('error');
    }

    public function test_test_email_endpoint_is_admin_only_and_validates_the_recipient(): void
    {
        $student = User::factory()->create();
        $student->assignRole('eleve');

        $this->postJson('/api/account-requests/test-email')->assertUnauthorized();
        $this->withToken($this->tokenFor($student))
            ->postJson('/api/account-requests/test-email')
            ->assertForbidden();

        $admin = $this->createAdmin();
        $this->withToken($this->tokenFor($admin))
            ->postJson('/api/account-requests/test-email', ['email' => 'not-an-email'])
            ->assertUnprocessable();
    }

    public function test_test_email_failure_response_sanitizes_credentials_in_errors(): void
    {
        $admin = $this->createAdmin();
        Mail::shouldReceive('raw')
            ->once()
            ->andThrow(new RuntimeException('smtp://user:secret@private-mail-host'));

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson('/api/account-requests/test-email', ['email' => 'delivery@example.com']);

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Échec de l’envoi de l’email de test.')
            ->assertJsonPath('error', 'smtp://user:***@private-mail-host');
        $this->assertStringNotContainsString('secret', $response->getContent());
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    private function createApplicant(
        string $requestedRole,
        string $status = User::APPROVAL_PENDING,
        string $firstName = 'Test',
        string $lastName = 'User',
        ?string $email = null,
        ?string $createdAt = null
    ): User {
        return User::factory()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email ?? fake()->unique()->safeEmail(),
            'requested_role' => $requestedRole,
            'approval_status' => $status,
            'created_at' => $createdAt ? Carbon::parse($createdAt) : now(),
        ]);
    }

    private function tokenFor(User $user): string
    {
        return $user->createToken('test-token')->plainTextToken;
    }
}
