<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\NewUserForAdminNotification;
use App\Notifications\VerifyStaffEmailNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class StaffEmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function registerTeacher(string $email = 'ahmed.benali@fst.utm.tn')
    {
        Storage::fake(config('filesystems.documents_disk'));

        return $this->postJson('/api/register/enseignant', [
            'first_name' => 'Ahmed',
            'last_name' => 'Ben Ali',
            'email' => $email,
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'institution' => 'Faculté des Sciences de Tunis',
            'department' => 'Département Informatique',
            'staff_id' => 'ENS-2026-084',
            'professional_phone' => '+216 71 870 000',
            'proof_document' => UploadedFile::fake()->create('attestation.pdf', 1024, 'application/pdf'),
        ]);
    }

    private function signedVerificationUrl(User $user, string $lifetime = '+60 minutes'): string
    {
        return URL::temporarySignedRoute('verification.verify', now()->modify($lifetime), [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);
    }

    public function test_staff_registration_sends_a_verification_mail_and_stays_unverified(): void
    {
        Notification::fake();

        $response = $this->registerTeacher();

        $response->assertStatus(201)
            ->assertJsonPath('approval_required', true)
            ->assertJsonPath('verification_email_sent', true);

        $user = User::where('email', 'ahmed.benali@fst.utm.tn')->firstOrFail();

        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, VerifyStaffEmailNotification::class);
    }

    public function test_student_registration_is_verified_immediately_without_a_verification_mail(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register/eleve', [
            'first_name' => 'Yassine',
            'last_name' => 'Trabelsi',
            'email' => 'yassine.trabelsi@etudiant.tn',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
        ]);

        $response->assertStatus(201)->assertJsonStructure(['token']);

        $user = User::where('email', 'yassine.trabelsi@etudiant.tn')->firstOrFail();

        $this->assertTrue($user->hasVerifiedEmail());
        Notification::assertNotSentTo($user, VerifyStaffEmailNotification::class);
    }

    public function test_unverified_staff_cannot_log_in_even_with_correct_credentials(): void
    {
        $user = User::factory()->pending()->unverified()->create([
            'email' => 'pending.teacher@fst.utm.tn',
            'requested_role' => 'enseignant',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'EMAIL_UNVERIFIED')
            ->assertJsonPath('can_resend', true);
    }

    public function test_unverified_application_is_hidden_from_the_queue_and_cannot_be_reviewed(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $applicant = User::factory()->pending()->unverified()->create([
            'requested_role' => 'enseignant',
            'institution' => 'INSAT',
            'department' => 'Génie',
            'staff_id' => 'ENS-1',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/account-requests')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        $this->withToken($token)
            ->getJson('/api/account-requests/counts')
            ->assertOk()
            ->assertJsonPath('pending', 0);

        $this->withToken($token)
            ->patchJson("/api/account-requests/{$applicant->id}", ['status' => User::APPROVAL_APPROVED])
            ->assertStatus(409)
            ->assertJsonPath('code', 'EMAIL_UNVERIFIED');

        $this->withToken($token)
            ->patchJson("/api/users/{$applicant->id}/approval", ['status' => User::APPROVAL_APPROVED])
            ->assertStatus(409)
            ->assertJsonPath('code', 'EMAIL_UNVERIFIED');
    }

    public function test_valid_signed_link_verifies_the_account_and_alerts_admins(): void
    {
        Notification::fake();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $applicant = User::factory()->pending()->unverified()->create([
            'requested_role' => 'enseignant',
        ]);

        $response = $this->get($this->signedVerificationUrl($applicant));

        $response->assertRedirect(rtrim(config('app.frontend_url'), '/').'/email-verified?status=success');

        $this->assertTrue($applicant->fresh()->hasVerifiedEmail());
        Notification::assertSentTo($admin, NewUserForAdminNotification::class);
        Notification::assertSentToTimes($admin, NewUserForAdminNotification::class, 1);
    }

    public function test_verification_link_is_single_use_and_reports_the_already_verified_state(): void
    {
        Notification::fake();

        $applicant = User::factory()->pending()->unverified()->create([
            'requested_role' => 'enseignant',
        ]);

        $url = $this->signedVerificationUrl($applicant);

        $this->get($url)->assertRedirect(rtrim(config('app.frontend_url'), '/').'/email-verified?status=success');
        $this->get($url)->assertRedirect(rtrim(config('app.frontend_url'), '/').'/email-verified?status=already');
    }

    public function test_tampered_and_expired_links_do_not_verify_the_account(): void
    {
        $applicant = User::factory()->pending()->unverified()->create([
            'requested_role' => 'enseignant',
        ]);

        $expired = $this->signedVerificationUrl($applicant, '-1 minute');
        $this->get($expired)->assertRedirect(rtrim(config('app.frontend_url'), '/').'/email-verified?status=expired');

        $tampered = $this->signedVerificationUrl($applicant);
        $this->get(str_replace('signature=', 'signature=a', $tampered))
            ->assertRedirect(rtrim(config('app.frontend_url'), '/').'/email-verified?status=expired');

        $this->assertFalse($applicant->fresh()->hasVerifiedEmail());
    }

    public function test_resend_never_reveals_whether_an_address_is_registered(): void
    {
        Notification::fake();

        $this->postJson('/api/email/verification-notification', ['email' => 'nobody@example.test'])
            ->assertOk()
            ->assertJsonPath('message', 'Si un compte en attente correspond à cette adresse, un nouvel email de confirmation vient d’être envoyé.');

        Notification::assertNothingSent();
    }

    public function test_resend_sends_another_link_to_an_unverified_applicant(): void
    {
        Notification::fake();

        $applicant = User::factory()->pending()->unverified()->create([
            'email' => 'waiting.teacher@fst.utm.tn',
            'requested_role' => 'enseignant',
        ]);

        $this->postJson('/api/email/verification-notification', ['email' => $applicant->email])
            ->assertOk();

        Notification::assertSentTo($applicant, VerifyStaffEmailNotification::class);
    }

    public function test_resend_matches_the_address_case_insensitively(): void
    {
        Notification::fake();

        $applicant = User::factory()->pending()->unverified()->create([
            'email' => 'waiting.teacher@fst.utm.tn',
            'requested_role' => 'enseignant',
        ]);

        $this->postJson('/api/email/verification-notification', [
            'email' => 'Waiting.Teacher@FST.UTM.TN',
        ])->assertOk();

        Notification::assertSentTo($applicant, VerifyStaffEmailNotification::class);
    }
}
