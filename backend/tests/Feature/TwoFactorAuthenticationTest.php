<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function createAdmin(array $attributes = []): User
    {
        $admin = User::factory()->create(array_merge([
            'email' => 'admin@eduspace.test',
            'password' => 'AdminPass123!@#',
            'approval_status' => User::APPROVAL_APPROVED,
        ], $attributes));

        $admin->assignRole('admin');

        return $admin;
    }

    public function test_user_can_initiate_two_factor_authentication(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication', ['password' => 'AdminPass123!@#']);

        $response->assertOk()
            ->assertJsonStructure([
                'message',
                'secret',
                'svg',
                'recovery_codes',
                'confirmed',
            ])
            ->assertJsonPath('confirmed', false);

        $fresh = $admin->fresh();
        $this->assertNotNull($fresh->two_factor_secret);
        $this->assertCount(8, $fresh->two_factor_recovery_codes);
        $this->assertNull($fresh->two_factor_confirmed_at);
        $this->assertFalse($fresh->hasEnabledTwoFactorAuthentication());
    }

    public function test_two_factor_settings_require_an_admin_and_recent_password(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('enseignant');

        $this->withToken($teacher->createToken('test')->plainTextToken)
            ->postJson('/api/user/two-factor-authentication', ['password' => 'password'])
            ->assertForbidden();

        Auth::forgetGuards();
        $admin = $this->createAdmin();
        $this->withToken($admin->createToken('test')->plainTextToken)
            ->postJson('/api/user/two-factor-authentication', ['password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertNull($admin->fresh()->two_factor_secret);
    }

    public function test_user_cannot_confirm_2fa_with_invalid_code(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication', ['password' => 'AdminPass123!@#']);

        $response = $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication/confirm', [
                'code' => '000000',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);

        $this->assertNull($admin->fresh()->two_factor_confirmed_at);
    }

    public function test_user_can_confirm_2fa_with_valid_totp_code(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;
        $otherDeviceToken = $admin->createToken('other-device')->plainTextToken;

        $initResponse = $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication', ['password' => 'AdminPass123!@#']);

        $secret = $initResponse->json('secret');
        $validCode = (new Google2FA)->getCurrentOtp($secret);

        $response = $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication/confirm', [
                'code' => $validCode,
            ]);

        $response->assertOk()
            ->assertJsonPath('confirmed', true);

        $fresh = $admin->fresh();
        $this->assertNotNull($fresh->two_factor_confirmed_at);
        $this->assertTrue($fresh->hasEnabledTwoFactorAuthentication());
        $currentToken = $fresh->tokens()->sole();
        $this->assertStringStartsWith('two-factor-verified:', $currentToken->name);

        Auth::forgetGuards();
        $this->withToken($otherDeviceToken)->getJson('/api/user')->assertUnauthorized();
        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertOk();
    }

    public function test_login_returns_challenge_token_when_2fa_is_confirmed(): void
    {
        $admin = $this->createAdmin();
        $secret = (new Google2FA)->generateSecretKey(32);
        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1', 'code2'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $response = $this->postJson('/api/login', [
            'email' => 'admin@eduspace.test',
            'password' => 'AdminPass123!@#',
        ]);

        $response->assertOk()
            ->assertJsonPath('two_factor', true)
            ->assertJsonStructure(['two_factor', 'challenge_token'])
            ->assertJsonMissing(['token']);
    }

    public function test_two_factor_challenge_authenticates_with_valid_totp_code(): void
    {
        $admin = $this->createAdmin();
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey(32);
        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1-1234', 'code2-5678'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $challengeToken = $admin->createTwoFactorChallengeToken();
        $validCode = $google2fa->getCurrentOtp($secret);

        $response = $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code' => $validCode,
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'message',
                'token',
                'user',
                'role',
                'permissions',
            ])
            ->assertJsonPath('role', 'admin');

        $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code' => $validCode,
        ])->assertStatus(422);
    }

    public function test_two_factor_challenge_fails_with_invalid_totp_code(): void
    {
        $admin = $this->createAdmin();
        $secret = (new Google2FA)->generateSecretKey(32);
        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1-1234'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $challengeToken = $admin->createTwoFactorChallengeToken();

        $response = $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code' => '999999',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_challenge_is_invalidated_when_the_password_changes(): void
    {
        $admin = $this->createAdmin();
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey(32);
        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1-1234'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $challengeToken = $admin->createTwoFactorChallengeToken();
        $admin->forceFill(['password' => 'ChangedPass123!'])->save();

        $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code' => $google2fa->getCurrentOtp($secret),
        ])->assertStatus(422);
    }

    public function test_challenge_is_rejected_after_admin_role_is_removed(): void
    {
        $admin = $this->createAdmin();
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey(32);
        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1-1234'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $challengeToken = $admin->createTwoFactorChallengeToken();
        $admin->removeRole('admin');

        $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code' => $google2fa->getCurrentOtp($secret),
        ])->assertStatus(422);
    }

    public function test_challenge_attempts_are_rate_limited(): void
    {
        $admin = $this->createAdmin();
        $secret = (new Google2FA)->generateSecretKey(32);
        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1-1234'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $challengeToken = $admin->createTwoFactorChallengeToken();
        $payload = ['challenge_token' => $challengeToken, 'code' => '999999'];

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/two-factor-challenge', $payload)->assertStatus(422);
        }

        $this->postJson('/api/two-factor-challenge', $payload)->assertTooManyRequests();
    }

    public function test_two_factor_challenge_authenticates_with_recovery_code_and_consumes_it(): void
    {
        $admin = $this->createAdmin();
        $secret = (new Google2FA)->generateSecretKey(32);
        $recoveryCodes = ['code-alpha-123', 'code-beta-456'];

        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => $recoveryCodes,
            'two_factor_confirmed_at' => now(),
        ])->save();

        $challengeToken = $admin->createTwoFactorChallengeToken();

        // 1. Consume first recovery code
        $response = $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'recovery_code' => 'code-alpha-123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user']);

        $fresh = $admin->fresh();
        $this->assertEquals(['code-beta-456'], $fresh->two_factor_recovery_codes);

        // 2. Attempt to reuse consumed recovery code fails
        $secondChallenge = $admin->createTwoFactorChallengeToken();
        $reuseResponse = $this->postJson('/api/two-factor-challenge', [
            'challenge_token' => $secondChallenge,
            'recovery_code' => 'code-alpha-123',
        ]);

        $reuseResponse->assertStatus(422)
            ->assertJsonValidationErrors(['recovery_code']);
    }

    public function test_user_can_view_and_regenerate_recovery_codes_with_password(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('two-factor-verified:test')->plainTextToken;
        $secret = (new Google2FA)->generateSecretKey(32);

        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['old-code-1', 'old-code-2'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        // Wrong password fails
        $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication/recovery-codes', [
                'password' => 'WrongPassword!',
            ])->assertStatus(422);

        // Correct password succeeds
        $viewResponse = $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication/recovery-codes', [
                'password' => 'AdminPass123!@#',
            ]);

        $viewResponse->assertOk()
            ->assertJsonPath('recovery_codes', ['old-code-1', 'old-code-2']);

        // Regenerate codes with correct password
        $regenResponse = $this->withToken($token)
            ->postJson('/api/user/two-factor-authentication/recovery-codes/regenerate', [
                'password' => 'AdminPass123!@#',
            ]);

        $regenResponse->assertOk()
            ->assertJsonCount(8, 'recovery_codes');

        $this->assertNotEquals(['old-code-1', 'old-code-2'], $admin->fresh()->two_factor_recovery_codes);
    }

    public function test_user_can_disable_two_factor_authentication(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('two-factor-verified:test')->plainTextToken;
        $secret = (new Google2FA)->generateSecretKey(32);

        $admin->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => ['code1'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $this->assertTrue($admin->hasEnabledTwoFactorAuthentication());

        $response = $this->withToken($token)
            ->deleteJson('/api/user/two-factor-authentication', [
                'password' => 'AdminPass123!@#',
            ]);

        $response->assertOk()
            ->assertJsonPath('confirmed', false);

        $fresh = $admin->fresh();
        $this->assertNull($fresh->two_factor_secret);
        $this->assertNull($fresh->two_factor_recovery_codes);
        $this->assertNull($fresh->two_factor_confirmed_at);
        $this->assertFalse($fresh->hasEnabledTwoFactorAuthentication());

        // Subsequent login is direct without 2FA
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'admin@eduspace.test',
            'password' => 'AdminPass123!@#',
        ]);

        $loginResponse->assertOk()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonMissing(['two_factor']);
    }
}
