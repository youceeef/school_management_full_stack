<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_can_be_requested(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $user->createToken('existing-session');

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function (object $notification) use ($user) {
            $response = $this->postJson('/api/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

            $response
                ->assertSessionHasNoErrors()
                ->assertStatus(200);

            $this->assertDatabaseCount('personal_access_tokens', 0);

            return true;
        });
    }

    public function test_unknown_addresses_receive_the_same_generic_response(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'missing@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['status']);

        Notification::assertNothingSent();
    }
}
