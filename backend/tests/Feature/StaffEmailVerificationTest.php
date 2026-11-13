<?php

namespace Tests\Feature;

use App\Jobs\SendStaffVerificationEmail;
use App\Models\User;
use App\Notifications\NewUserForAdminNotification;
use App\Notifications\VerifyStaffEmailNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Contracts\Notifications\Dispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
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
        Notification::assertSentToTimes($user, VerifyStaffEmailNotification::class, 1);
    }

    public function test_verification_notification_generates_a_signed_link_that_expires_after_60_minutes(): void
    {
        $applicant = User::factory()->pending()->unverified()->create([
            'requested_role' => 'enseignant',
        ]);

        $mail = (new VerifyStaffEmailNotification)->toMail($applicant);
        $request = HttpRequest::create($mail->actionUrl);
        parse_str((string) parse_url($mail->actionUrl, PHP_URL_QUERY), $query);

        $this->assertArrayHasKey('signature', $query);
        $this->assertArrayHasKey('expires', $query);
        $this->assertEqualsWithDelta(now()->addMinutes(60)->getTimestamp(), (int) $query['expires'], 2);
        $this->assertTrue(URL::hasValidSignature($request));
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

        $this->withToken($token)
            ->postJson('/api/users/bulk-action', [
                'user_ids' => [$applicant->id],
                'action' => 'approve',
            ])
            ->assertOk()
            ->assertJsonPath('processed_count', 0)
            ->assertJsonPath('skipped_count', 1);

        $this->assertSame(User::APPROVAL_PENDING, $applicant->fresh()->approval_status);
        $this->assertFalse($applicant->fresh()->hasRole('enseignant'));
    }

    public function test_unverified_suspended_staff_cannot_be_reactivated_through_any_approval_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $applicant = User::factory()->suspended()->unverified()->create([
            'requested_role' => 'enseignant',
        ]);
        $token = $admin->createToken('admin-token')->plainTextToken;

        $this->withToken($token)
            ->patchJson("/api/account-requests/{$applicant->id}", ['status' => User::APPROVAL_APPROVED])
            ->assertStatus(409)
            ->assertJsonPath('code', 'EMAIL_UNVERIFIED');

        $this->withToken($token)
            ->patchJson("/api/users/{$applicant->id}/approval", ['status' => User::APPROVAL_APPROVED])
            ->assertStatus(409)
            ->assertJsonPath('code', 'EMAIL_UNVERIFIED');

        $this->withToken($token)
            ->postJson('/api/users/bulk-action', [
                'user_ids' => [$applicant->id],
                'action' => 'approve',
            ])
            ->assertOk()
            ->assertJsonPath('processed_count', 0)
            ->assertJsonPath('skipped_count', 1);

        $this->assertSame(User::APPROVAL_SUSPENDED, $applicant->fresh()->approval_status);
        $this->assertFalse($applicant->fresh()->hasRole('enseignant'));
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
        Notification::assertSentTo(
            $admin,
            NewUserForAdminNotification::class,
            fn ($notification, array $channels): bool => $channels === ['database']
        );
        Notification::assertSentTo(
            $admin,
            NewUserForAdminNotification::class,
            fn ($notification, array $channels): bool => $channels === ['mail']
        );
        Notification::assertSentToTimes($admin, NewUserForAdminNotification::class, 2);
    }

    public function test_verification_persists_the_admin_database_alert_atomically(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $applicant = User::factory()->pending()->unverified()->create([
            'requested_role' => 'enseignant',
        ]);

        $this->get($this->signedVerificationUrl($applicant))
            ->assertRedirect(rtrim(config('app.frontend_url'), '/').'/email-verified?status=success');

        $storedNotification = $admin->fresh()->notifications()->firstOrFail();

        $this->assertTrue($applicant->fresh()->hasVerifiedEmail());
        $this->assertSame('account_approval_required', $storedNotification->data['event']);
        $this->assertSame($applicant->id, $storedNotification->data['new_user_id']);
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
        Bus::fake();
        Notification::fake();

        $this->postJson('/api/email/verification-notification', ['email' => 'nobody@example.test'])
            ->assertStatus(202)
            ->assertJsonPath(
                'message',
                'Si un compte en attente correspond à cette adresse, la demande a été prise en compte. Vérifiez vos courriers indésirables et réessayez plus tard si aucun email n’arrive.'
            );

        Bus::assertDispatchedAfterResponse(
            SendStaffVerificationEmail::class,
            fn (SendStaffVerificationEmail $job): bool => $job->email === 'nobody@example.test'
        );
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
            ->assertStatus(202);

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
        ])->assertStatus(202);

        Notification::assertSentTo($applicant, VerifyStaffEmailNotification::class);
    }

    public function test_resend_is_limited_to_three_attempts_per_address_per_hour(): void
    {
        Bus::fake();
        Notification::fake();

        $applicant = User::factory()->pending()->unverified()->create([
            'email' => 'rate-limited.teacher@fst.utm.tn',
            'requested_role' => 'enseignant',
        ]);

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->postJson('/api/email/verification-notification', ['email' => $applicant->email])
                ->assertStatus(202);
        }

        $this->postJson('/api/email/verification-notification', ['email' => $applicant->email])
            ->assertTooManyRequests();

        Bus::assertDispatchedAfterResponseTimes(SendStaffVerificationEmail::class, 3);
        Notification::assertNothingSent();
    }

    public function test_resend_transport_failure_keeps_the_response_non_enumerable_and_neutral(): void
    {
        $applicant = User::factory()->pending()->unverified()->create([
            'email' => 'delivery.failure@fst.utm.tn',
            'requested_role' => 'enseignant',
        ]);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('send')
            ->once()
            ->andThrow(new \RuntimeException('Simulated mail transport failure'));
        $this->app->instance(Dispatcher::class, $dispatcher);

        $this->postJson('/api/email/verification-notification', ['email' => $applicant->email])
            ->assertStatus(202)
            ->assertJsonPath(
                'message',
                'Si un compte en attente correspond à cette adresse, la demande a été prise en compte. Vérifiez vos courriers indésirables et réessayez plus tard si aucun email n’arrive.'
            );
    }
}
