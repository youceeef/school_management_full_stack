<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StaffRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_registration_requires_institutional_fields(): void
    {
        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Ahmed',
            'last_name' => 'Ben Ali',
            'email' => 'ahmed.benali@fst.utm.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['institution', 'department', 'staff_id', 'proof_document']);
    }

    public function test_teacher_registration_succeeds_with_institutional_fields_and_enters_pending_status(): void
    {
        Storage::fake(config('filesystems.documents_disk'));

        $proofFile = UploadedFile::fake()->create('attestation_travail.pdf', 1024, 'application/pdf');

        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Ahmed',
            'last_name' => 'Ben Ali',
            'email' => 'ahmed.benali@fst.utm.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Département Informatique',
            'staff_id' => 'ENS-2026-084',
            'professional_phone' => '+216 71 870 000',
            'proof_document' => $proofFile,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('approval_required', true)
            ->assertJsonPath('approval_status', User::APPROVAL_PENDING)
            ->assertJsonPath('requested_role', 'enseignant')
            ->assertJsonMissing(['token']);

        $this->assertDatabaseHas('users', [
            'email' => 'ahmed.benali@fst.utm.tn',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Département Informatique',
            'staff_id' => 'ENS-2026-084',
            'professional_phone' => '+216 71 870 000',
            'proof_document_name' => 'attestation_travail.pdf',
            'approval_status' => User::APPROVAL_PENDING,
            'requested_role' => 'enseignant',
        ]);

        $user = User::where('email', 'ahmed.benali@fst.utm.tn')->firstOrFail();
        $this->assertTrue($user->roles->isEmpty());
        $this->assertNotNull($user->proof_document_path);
        Storage::disk(config('filesystems.documents_disk'))->assertExists($user->proof_document_path);
    }

    public function test_lab_manager_registration_requires_and_persists_institutional_fields(): void
    {
        Storage::fake(config('filesystems.documents_disk'));

        // Missing fields fail validation
        $failResponse = $this->postJson('/api/register/responsable_labo', [
            'first_name' => 'Sonia',
            'last_name' => 'Mansour',
            'email' => 'sonia.mansour@insat.ucar.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
        ]);

        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['institution', 'department', 'staff_id', 'proof_document']);

        $proofFile = UploadedFile::fake()->create('carte_professionnelle.png', 512, 'image/png');

        // Complete submission succeeds
        $successResponse = $this->postJson('/api/register/responsable_labo', [
            'first_name' => 'Sonia',
            'last_name' => 'Mansour',
            'email' => 'sonia.mansour@insat.ucar.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'INSAT',
            'department' => 'Laboratoire de Physique des Matériaux',
            'staff_id' => 'LAB-2026-012',
            'professional_phone' => '+216 71 703 829',
            'proof_document' => $proofFile,
        ]);

        $successResponse->assertStatus(201)
            ->assertJsonPath('approval_required', true)
            ->assertJsonPath('approval_status', User::APPROVAL_PENDING)
            ->assertJsonPath('requested_role', 'responsable_laboratoire');

        $this->assertDatabaseHas('users', [
            'email' => 'sonia.mansour@insat.ucar.tn',
            'institution' => 'INSAT',
            'department' => 'Laboratoire de Physique des Matériaux',
            'staff_id' => 'LAB-2026-012',
            'proof_document_name' => 'carte_professionnelle.png',
            'approval_status' => User::APPROVAL_PENDING,
        ]);
    }

    public function test_student_registration_does_not_require_institutional_fields(): void
    {
        $response = $this->postJson('/api/register/eleve', [
            'first_name' => 'Yassine',
            'last_name' => 'Trabelsi',
            'email' => 'yassine.trabelsi@etudiant.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('approval_required', false)
            ->assertJsonPath('approval_status', User::APPROVAL_APPROVED)
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', [
            'email' => 'yassine.trabelsi@etudiant.tn',
            'approval_status' => User::APPROVAL_APPROVED,
            'institution' => null,
            'staff_id' => null,
            'proof_document_path' => null,
        ]);
    }

    public function test_admin_account_request_api_exposes_and_searches_institutional_fields(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        User::factory()->create([
            'first_name' => 'Hichem',
            'last_name' => 'Gharbi',
            'email' => 'hichem.gharbi@enit.utm.tn',
            'requested_role' => 'enseignant',
            'approval_status' => User::APPROVAL_PENDING,
            'institution' => 'Ecole Nationale d\'Ingenieurs de Tunis',
            'department' => 'Genie Electrique',
            'staff_id' => 'ENIT-GE-042',
            'professional_phone' => '+216 71 874 700',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        // Search by staff ID
        $responseStaffId = $this->withToken($token)
            ->getJson('/api/account-requests?search=ENIT-GE-042');

        $responseStaffId->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.staff_id', 'ENIT-GE-042')
            ->assertJsonPath('data.0.institution', 'Ecole Nationale d\'Ingenieurs de Tunis')
            ->assertJsonPath('data.0.department', 'Genie Electrique')
            ->assertJsonPath('data.0.professional_phone', '+216 71 874 700');

        // Search by institution
        $responseInstitution = $this->withToken($token)
            ->getJson('/api/account-requests?institution=Ingenieurs');

        $responseInstitution->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.staff_id', 'ENIT-GE-042');
    }
}
