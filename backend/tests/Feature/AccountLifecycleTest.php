<?php

namespace Tests\Feature;

use App\Models\AccountReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccountLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'enseignant']);
        Role::firstOrCreate(['name' => 'responsable_laboratoire']);
        Role::firstOrCreate(['name' => 'eleve']);

        Notification::fake();
        Storage::fake(config('filesystems.documents_disk'));
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'approval_status' => User::APPROVAL_APPROVED,
        ]);
        $admin->assignRole('admin');

        return $admin;
    }

    private function createApplicant(string $role = 'enseignant', string $status = User::APPROVAL_PENDING): User
    {
        return User::factory()->create([
            'approval_status' => $status,
            'requested_role' => $role,
            'institution' => 'Université de Tunis',
            'department' => 'Génie Informatique',
            'staff_id' => 'ENS-'.fake()->unique()->numerify('#####'),
            'professional_phone' => '+216 71 100 200',
            'password' => Hash::make('Secret123!'),
        ]);
    }

    public function test_rejection_requires_a_valid_reason(): void
    {
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant();

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$applicant->id}", [
                'status' => User::APPROVAL_REJECTED,
                // reason omitted
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);

        // Reason shorter than 5 chars fails
        $responseShort = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$applicant->id}", [
                'status' => User::APPROVAL_REJECTED,
                'reason' => 'No',
            ]);

        $responseShort->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_admin_can_reject_pending_applicant_with_reason(): void
    {
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant();

        $token = $applicant->createToken('applicant-token')->plainTextToken;

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$applicant->id}", [
                'status' => User::APPROVAL_REJECTED,
                'reason' => 'Le document d’identité professionnelle est illisible.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.approval_status', User::APPROVAL_REJECTED)
            ->assertJsonPath('data.rejection_reason', 'Le document d’identité professionnelle est illisible.');

        $this->assertDatabaseHas('users', [
            'id' => $applicant->id,
            'approval_status' => User::APPROVAL_REJECTED,
            'rejection_reason' => 'Le document d’identité professionnelle est illisible.',
            'reviewed_by' => $admin->id,
        ]);

        // Tokens revoked
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $applicant->id,
        ]);

        // Audit review logged
        $this->assertDatabaseHas('account_reviews', [
            'user_id' => $applicant->id,
            'reviewer_id' => $admin->id,
            'action' => AccountReview::ACTION_REJECTED,
            'from_status' => User::APPROVAL_PENDING,
            'to_status' => User::APPROVAL_REJECTED,
            'reason' => 'Le document d’identité professionnelle est illisible.',
        ]);
    }

    public function test_admin_can_suspend_approved_account_with_reason(): void
    {
        $admin = $this->createAdmin();
        $staff = $this->createApplicant('enseignant', User::APPROVAL_APPROVED);
        $staff->assignRole('enseignant');

        $token = $staff->createToken('active-token')->plainTextToken;

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$staff->id}", [
                'status' => User::APPROVAL_SUSPENDED,
                'reason' => 'Enquête administrative en cours suite à cessation de fonctions.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.approval_status', User::APPROVAL_SUSPENDED)
            ->assertJsonPath('data.rejection_reason', 'Enquête administrative en cours suite à cessation de fonctions.');

        $this->assertDatabaseHas('users', [
            'id' => $staff->id,
            'approval_status' => User::APPROVAL_SUSPENDED,
            'rejection_reason' => 'Enquête administrative en cours suite à cessation de fonctions.',
        ]);

        $this->assertFalse($staff->fresh()->hasRole('enseignant'));
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $staff->id,
        ]);

        $this->assertDatabaseHas('account_reviews', [
            'user_id' => $staff->id,
            'reviewer_id' => $admin->id,
            'action' => AccountReview::ACTION_SUSPENDED,
            'from_status' => User::APPROVAL_APPROVED,
            'to_status' => User::APPROVAL_SUSPENDED,
        ]);
    }

    public function test_approved_account_cannot_be_rejected_directly(): void
    {
        $admin = $this->createAdmin();
        $staff = $this->createApplicant('enseignant', User::APPROVAL_APPROVED);
        $staff->assignRole('enseignant');

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$staff->id}", [
                'status' => User::APPROVAL_REJECTED,
                'reason' => 'Tentative de rejet d’un compte déjà actif.',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Un compte approuvé et actif ne peut pas être rejeté. Utilisez l’action de suspension.');
    }

    public function test_pending_application_cannot_be_suspended_directly(): void
    {
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant();

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$applicant->id}", [
                'status' => User::APPROVAL_SUSPENDED,
                'reason' => 'Tentative de suspension d’une candidature en attente.',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Une demande en attente ne peut pas être suspendue. Utilisez l’action de refus.');
    }

    public function test_admin_can_reactivate_suspended_account(): void
    {
        $admin = $this->createAdmin();
        $staff = $this->createApplicant('enseignant', User::APPROVAL_SUSPENDED);
        $staff->forceFill([
            'rejection_reason' => 'Suspension temporaire',
            'suspended_at' => now()->subDays(5),
        ])->save();

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/account-requests/{$staff->id}", [
                'status' => User::APPROVAL_APPROVED,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.approval_status', User::APPROVAL_APPROVED)
            ->assertJsonPath('data.rejection_reason', null);

        $freshStaff = $staff->fresh();
        $this->assertEquals(User::APPROVAL_APPROVED, $freshStaff->approval_status);
        $this->assertNull($freshStaff->rejection_reason);
        $this->assertNull($freshStaff->suspended_at);
        $this->assertTrue($freshStaff->hasRole('enseignant'));

        $this->assertDatabaseHas('account_reviews', [
            'user_id' => $staff->id,
            'reviewer_id' => $admin->id,
            'action' => AccountReview::ACTION_REACTIVATED,
            'from_status' => User::APPROVAL_SUSPENDED,
            'to_status' => User::APPROVAL_APPROVED,
        ]);
    }

    public function test_rejected_applicant_can_resubmit_corrected_information(): void
    {
        $applicant = $this->createApplicant('enseignant', User::APPROVAL_REJECTED);
        $applicant->forceFill([
            'rejection_reason' => 'Justificatif flou. Merci de scanner votre carte professionnelle.',
        ])->save();

        $fakePdf = UploadedFile::fake()->create('nouvelle_carte.pdf', 200, 'application/pdf');

        $response = $this->postJson('/api/account-requests/resubmit', [
            'email' => $applicant->email,
            'password' => 'Secret123!',
            'institution' => 'Université Hassan II - FS Casablanca',
            'department' => 'Département Mathématiques',
            'staff_id' => 'MAT-2026-88',
            'professional_phone' => '+212 522 123 456',
            'proof_document' => $fakePdf,
            'notes' => 'Voici la carte professionnelle numérisée en haute résolution.',
        ]);

        $response->assertOk()
            ->assertJsonPath('approval_status', User::APPROVAL_PENDING);

        $fresh = $applicant->fresh();
        $this->assertEquals(User::APPROVAL_PENDING, $fresh->approval_status);
        $this->assertNull($fresh->rejection_reason);
        $this->assertEquals('Université Hassan II - FS Casablanca', $fresh->institution);
        $this->assertEquals('MAT-2026-88', $fresh->staff_id);
        $this->assertEquals('nouvelle_carte.pdf', $fresh->proof_document_name);

        $this->assertDatabaseHas('account_reviews', [
            'user_id' => $applicant->id,
            'action' => AccountReview::ACTION_RESUBMITTED,
            'from_status' => User::APPROVAL_REJECTED,
            'to_status' => User::APPROVAL_PENDING,
            'reason' => 'Voici la carte professionnelle numérisée en haute résolution.',
        ]);
    }

    public function test_ensure_account_is_approved_middleware_blocks_suspended_user(): void
    {
        $staff = $this->createApplicant('enseignant', User::APPROVAL_SUSPENDED);
        $staff->assignRole('enseignant');
        $token = $staff->createToken('test-token')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/dashboard/summary');

        $response->assertStatus(403)
            ->assertJsonPath('code', 'ACCOUNT_SUSPENDED');

        // Token deleted on interception
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $staff->id,
        ]);
    }

    public function test_login_returns_clear_reason_for_rejected_and_suspended_accounts(): void
    {
        $rejectedUser = $this->createApplicant('enseignant', User::APPROVAL_REJECTED);
        $rejectedUser->forceFill(['rejection_reason' => 'Attestation non certifiée.'])->save();

        $response = $this->postJson('/api/login', [
            'email' => $rejectedUser->email,
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'ACCOUNT_REJECTED')
            ->assertJsonPath('rejection_reason', 'Attestation non certifiée.')
            ->assertJsonPath('can_resubmit', true);

        $suspendedUser = $this->createApplicant('responsable_laboratoire', User::APPROVAL_SUSPENDED);
        $suspendedUser->forceFill(['rejection_reason' => 'Contrat de recherche expiré.'])->save();

        $responseSuspended = $this->postJson('/api/login', [
            'email' => $suspendedUser->email,
            'password' => 'Secret123!',
        ]);

        $responseSuspended->assertStatus(403)
            ->assertJsonPath('code', 'ACCOUNT_SUSPENDED')
            ->assertJsonPath('rejection_reason', 'Contrat de recherche expiré.')
            ->assertJsonPath('can_resubmit', false);
    }
}
