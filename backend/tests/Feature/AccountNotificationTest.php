<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\AccountApprovalStatusNotification;
use App\Notifications\NewUserForAdminNotification;
use App\Notifications\UserRegisteredNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccountNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'enseignant']);
        Role::firstOrCreate(['name' => 'responsable_laboratoire']);
        Role::firstOrCreate(['name' => 'eleve']);

        Storage::fake(config('filesystems.documents_disk'));
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'email' => 'admin@eduspace.test',
            'first_name' => 'Admin',
            'last_name' => 'Principal',
            'approval_status' => User::APPROVAL_APPROVED,
        ]);
        $admin->assignRole('admin');

        return $admin;
    }

    private function createApplicant(string $role = 'enseignant', string $status = User::APPROVAL_PENDING): User
    {
        return User::factory()->create([
            'first_name' => 'Karim',
            'last_name' => 'Gharbi',
            'email' => 'karim.gharbi@eduspace.test',
            'approval_status' => $status,
            'requested_role' => $role,
            'institution' => 'Université de Carthage',
            'department' => 'Informatique',
            'staff_id' => 'ENS-88990',
            'professional_phone' => '+216 71 222 333',
            'proof_document_path' => 'proofs/test.pdf',
            'proof_document_name' => 'carte-professionnelle.pdf',
            'proof_document_mime' => 'application/pdf',
            'proof_document_size' => 1024,
            'proof_submitted_at' => now(),
        ]);
    }

    public function test_account_approval_notification_mail_content_for_approved_status(): void
    {
        $applicant = $this->createApplicant();
        $notification = new AccountApprovalStatusNotification('approved', null, 'fr');

        $this->assertContains('mail', $notification->via($applicant));
        $this->assertContains('database', $notification->via($applicant));

        $mail = $notification->toMail($applicant);
        $this->assertSame('[EduSpace] Votre compte a été validé', $mail->subject);
        $this->assertStringContainsString('validée avec succès', implode(' ', $mail->introLines));
        $this->assertStringEndsWith('/login', $mail->actionUrl);
    }

    public function test_account_approval_notification_mail_content_for_rejected_status_includes_reason_and_resubmit_action(): void
    {
        $applicant = $this->createApplicant();
        $reason = 'La carte professionnelle soumise est expirée.';
        $notification = new AccountApprovalStatusNotification('rejected', $reason, 'fr');

        $mail = $notification->toMail($applicant);
        $this->assertSame('[EduSpace] Statut de votre demande de compte', $mail->subject);
        $content = implode(' ', array_merge($mail->introLines, $mail->outroLines));
        $this->assertStringContainsString($reason, $content);
        $this->assertStringEndsWith('/resubmit', $mail->actionUrl);
    }

    public function test_account_approval_notification_mail_content_for_suspended_and_reactivated_statuses(): void
    {
        $applicant = $this->createApplicant();

        // Suspended
        $suspendedNotif = new AccountApprovalStatusNotification('suspended', 'En attente de renouvellement du contrat', 'fr');
        $suspendedMail = $suspendedNotif->toMail($applicant);
        $this->assertSame('[EduSpace] Suspension temporaire de votre compte', $suspendedMail->subject);
        $this->assertStringContainsString('En attente de renouvellement du contrat', implode(' ', $suspendedMail->introLines));

        // Reactivated
        $reactivatedNotif = new AccountApprovalStatusNotification('reactivated', null, 'fr');
        $reactivatedMail = $reactivatedNotif->toMail($applicant);
        $this->assertSame('[EduSpace] Votre compte a été réactivé', $reactivatedMail->subject);
        $this->assertStringEndsWith('/login', $reactivatedMail->actionUrl);
    }

    public function test_account_approval_notification_supports_english_and_arabic_localization(): void
    {
        $applicant = $this->createApplicant();

        // English
        $enNotif = new AccountApprovalStatusNotification('approved', null, 'en');
        $enMail = $enNotif->toMail($applicant);
        $this->assertSame('[EduSpace] Your account has been approved', $enMail->subject);
        $this->assertStringEndsWith('/login', $enMail->actionUrl);

        // Arabic
        $arNotif = new AccountApprovalStatusNotification('approved', null, 'ar');
        $arMail = $arNotif->toMail($applicant);
        $this->assertSame('[EduSpace] تمت الموافقة على حسابك', $arMail->subject);
        $this->assertStringEndsWith('/login', $arMail->actionUrl);

        // Arabic Rejected with reason
        $arRejectedNotif = new AccountApprovalStatusNotification('rejected', 'وثيقة غير واضحة', 'ar');
        $arRejectedMail = $arRejectedNotif->toMail($applicant);
        $this->assertSame('[EduSpace] تحديث بشأن طلب حسابك', $arRejectedMail->subject);
        $this->assertStringContainsString('وثيقة غير واضحة', implode(' ', $arRejectedMail->introLines));
        $this->assertStringEndsWith('/resubmit', $arRejectedMail->actionUrl);
    }

    public function test_new_user_for_admin_notification_mail_formats_staff_applicant_and_action(): void
    {
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant('enseignant', User::APPROVAL_PENDING);

        $notification = new NewUserForAdminNotification($applicant, false);
        $this->assertContains('mail', $notification->via($admin));

        $mail = $notification->toMail($admin);
        $this->assertStringContainsString('Nouvelle demande de compte', $mail->subject);
        $this->assertStringContainsString($applicant->email, implode(' ', $mail->introLines));
        $this->assertStringContainsString('Enseignant', implode(' ', $mail->introLines));
        $this->assertStringContainsString('Université de Carthage', implode(' ', $mail->introLines));
        $this->assertStringEndsWith('/dashboard/account-requests', $mail->actionUrl);
    }

    public function test_new_user_for_admin_notification_mail_formats_resubmission(): void
    {
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant('responsable_laboratoire', User::APPROVAL_PENDING);

        $notification = new NewUserForAdminNotification($applicant, true);
        $mail = $notification->toMail($admin);

        $this->assertStringContainsString('Dossier corrigé et renvoyé', $mail->subject);
        $this->assertStringEndsWith('/dashboard/account-requests', $mail->actionUrl);
    }

    public function test_user_registered_notification_mail_for_pending_staff(): void
    {
        $applicant = $this->createApplicant('enseignant', User::APPROVAL_PENDING);
        $notification = new UserRegisteredNotification($applicant);

        $this->assertContains('mail', $notification->via($applicant));
        $mail = $notification->toMail($applicant);

        $this->assertSame('[EduSpace] Demande d’inscription bien reçue', $mail->subject);
        $this->assertStringContainsString('Enseignant', implode(' ', $mail->introLines));
        $this->assertStringEndsWith('/login', $mail->actionUrl);
    }

    public function test_admin_approval_dispatches_notification_to_applicant(): void
    {
        Notification::fake();
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant();

        $response = $this->actingAs($admin)
            ->patchJson("/api/account-requests/{$applicant->id}", [
                'status' => 'approved',
            ]);

        $response->assertOk();

        Notification::assertSentTo(
            $applicant,
            AccountApprovalStatusNotification::class,
            fn ($notification) => $notification->toArray($applicant)['approval_status'] === 'approved'
        );
    }

    public function test_admin_rejection_dispatches_notification_with_reason(): void
    {
        Notification::fake();
        $admin = $this->createAdmin();
        $applicant = $this->createApplicant();
        $reason = 'Document justificatif illisible ou non conforme.';

        $response = $this->actingAs($admin)
            ->patchJson("/api/account-requests/{$applicant->id}", [
                'status' => 'rejected',
                'reason' => $reason,
            ]);

        $response->assertOk();

        Notification::assertSentTo(
            $applicant,
            AccountApprovalStatusNotification::class,
            fn ($notification) => $notification->toArray($applicant)['approval_status'] === 'rejected'
                && $notification->toArray($applicant)['reason'] === $reason
        );
    }

    public function test_admin_suspension_and_reactivation_dispatch_notifications(): void
    {
        Notification::fake();
        $admin = $this->createAdmin();
        $approvedUser = $this->createApplicant('enseignant', User::APPROVAL_APPROVED);
        $approvedUser->assignRole('enseignant');

        // Suspend
        $suspendResponse = $this->actingAs($admin)
            ->patchJson("/api/account-requests/{$approvedUser->id}", [
                'status' => 'suspended',
                'reason' => 'Vérification de contrat en cours.',
            ]);
        $suspendResponse->assertOk();

        Notification::assertSentTo(
            $approvedUser,
            AccountApprovalStatusNotification::class,
            fn ($notif) => $notif->toArray($approvedUser)['approval_status'] === 'suspended'
        );

        // Reactivate
        $reactivateResponse = $this->actingAs($admin)
            ->patchJson("/api/account-requests/{$approvedUser->id}", [
                'status' => 'approved',
            ]);
        $reactivateResponse->assertOk();

        Notification::assertSentTo(
            $approvedUser,
            AccountApprovalStatusNotification::class,
            fn ($notif) => $notif->toArray($approvedUser)['approval_status'] === 'reactivated'
        );
    }

    public function test_resubmission_dispatches_notification_to_all_admins(): void
    {
        Notification::fake();
        $admin1 = $this->createAdmin();
        $admin2 = User::factory()->create([
            'email' => 'admin2@eduspace.test',
            'approval_status' => User::APPROVAL_APPROVED,
        ]);
        $admin2->assignRole('admin');

        $rejectedApplicant = $this->createApplicant('enseignant', User::APPROVAL_REJECTED);
        $rejectedApplicant->password = bcrypt('secret123');
        $rejectedApplicant->rejection_reason = 'Justificatif expiré';
        $rejectedApplicant->save();

        $response = $this->postJson('/api/account-requests/resubmit', [
            'email' => $rejectedApplicant->email,
            'password' => 'secret123',
            'institution' => 'Université de Tunis El Manar',
            'department' => 'Sciences Informatiques',
            'staff_id' => 'ENS-99999',
            'proof_document' => UploadedFile::fake()->create('nouveau-justificatif.pdf', 500, 'application/pdf'),
            'notes' => 'Voici ma nouvelle attestation de travail.',
        ]);

        $response->assertOk();

        Notification::assertSentTo(
            [$admin1, $admin2],
            NewUserForAdminNotification::class,
            fn ($notification) => $notification->isResubmission === true
        );
    }
}
