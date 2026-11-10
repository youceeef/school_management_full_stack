<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StaffProofDocumentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_registration_fails_without_proof_document(): void
    {
        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Kamel',
            'last_name' => 'Mejri',
            'email' => 'kamel.mejri@fst.utm.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Informatique',
            'staff_id' => 'ENS-2026-999',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['proof_document']);
    }

    public function test_proof_document_validation_rejects_unsupported_extensions(): void
    {
        $invalidFile = UploadedFile::fake()->create('malicious.exe', 100, 'application/x-msdownload');

        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Kamel',
            'last_name' => 'Mejri',
            'email' => 'kamel.mejri@fst.utm.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Informatique',
            'staff_id' => 'ENS-2026-999',
            'proof_document' => $invalidFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['proof_document']);
    }

    public function test_proof_document_validation_rejects_files_larger_than_5mb(): void
    {
        // 6 MB file exceeds the 5120 KB limit
        $oversizedFile = UploadedFile::fake()->create('large_proof.pdf', 6144, 'application/pdf');

        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Kamel',
            'last_name' => 'Mejri',
            'email' => 'kamel.mejri@fst.utm.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Informatique',
            'staff_id' => 'ENS-2026-999',
            'proof_document' => $oversizedFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['proof_document']);
    }

    public function test_proof_document_is_stored_on_private_disk_and_metadata_exposed(): void
    {
        $disk = config('filesystems.documents_disk');
        Storage::fake($disk);

        $proof = UploadedFile::fake()->create('attestation.pdf', 1200, 'application/pdf');

        $response = $this->postJson('/api/register/enseignant', [
            'first_name' => 'Kamel',
            'last_name' => 'Mejri',
            'email' => 'kamel.mejri@fst.utm.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Informatique',
            'staff_id' => 'ENS-2026-999',
            'proof_document' => $proof,
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'kamel.mejri@fst.utm.tn')->firstOrFail();

        // P6.1: an applicant confirms the address before admins can inspect it.
        $user->markEmailAsVerified();

        $this->assertNotNull($user->proof_document_path);
        $this->assertSame('attestation.pdf', $user->proof_document_name);
        $this->assertSame('application/pdf', $user->proof_document_mime);
        $this->assertNotNull($user->proof_submitted_at);
        Storage::disk($disk)->assertExists($user->proof_document_path);

        // Admin inspects resource
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $resAdmin = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->getJson("/api/account-requests/{$user->id}");

        $resAdmin->assertOk()
            ->assertJsonPath('data.proof_document.name', 'attestation.pdf')
            ->assertJsonPath('data.proof_document.is_pdf', true)
            ->assertJsonMissing(['proof_document_path']);
    }

    public function test_admin_can_preview_proof_document_stream(): void
    {
        $disk = config('filesystems.documents_disk');
        Storage::fake($disk);

        $storedPath = 'proof_documents/sample_preview.pdf';
        Storage::disk($disk)->put($storedPath, '%PDF-1.4 sample content');

        $applicant = User::factory()->create([
            'requested_role' => 'enseignant',
            'approval_status' => User::APPROVAL_PENDING,
            'proof_document_path' => $storedPath,
            'proof_document_name' => 'contrat.pdf',
            'proof_document_mime' => 'application/pdf',
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->get("/api/account-requests/{$applicant->id}/proof/preview");

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('contrat.pdf', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('inline', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_admin_can_download_proof_document(): void
    {
        $disk = config('filesystems.documents_disk');
        Storage::fake($disk);

        $storedPath = 'proof_documents/sample_download.png';
        Storage::disk($disk)->put($storedPath, 'binary-image-content');

        $applicant = User::factory()->create([
            'requested_role' => 'responsable_laboratoire',
            'approval_status' => User::APPROVAL_PENDING,
            'proof_document_path' => $storedPath,
            'proof_document_name' => 'carte.png',
            'proof_document_mime' => 'image/png',
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->get("/api/account-requests/{$applicant->id}/proof/download");

        $response->assertOk();
        $this->assertStringContainsString('image/png', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('carte.png', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('attachment', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_non_admin_cannot_preview_or_download_proof_document(): void
    {
        $applicant = User::factory()->create([
            'requested_role' => 'enseignant',
            'approval_status' => User::APPROVAL_PENDING,
            'proof_document_path' => 'proof_documents/secret.pdf',
            'proof_document_name' => 'secret.pdf',
        ]);

        $student = User::factory()->create();
        $student->assignRole('eleve');

        // Unauthenticated returns 401
        $this->getJson("/api/account-requests/{$applicant->id}/proof/preview")->assertUnauthorized();
        $this->getJson("/api/account-requests/{$applicant->id}/proof/download")->assertUnauthorized();

        // Student forbidden returns 403
        $this->withToken($student->createToken('student')->plainTextToken)
            ->getJson("/api/account-requests/{$applicant->id}/proof/preview")
            ->assertForbidden();

        $this->withToken($student->createToken('student')->plainTextToken)
            ->getJson("/api/account-requests/{$applicant->id}/proof/download")
            ->assertForbidden();
    }

    public function test_returns_404_when_document_missing_or_not_found(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $applicant = User::factory()->create([
            'requested_role' => 'enseignant',
            'approval_status' => User::APPROVAL_PENDING,
            'proof_document_path' => null,
        ]);

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->getJson("/api/account-requests/{$applicant->id}/proof/preview");

        $response->assertNotFound();
    }
}
