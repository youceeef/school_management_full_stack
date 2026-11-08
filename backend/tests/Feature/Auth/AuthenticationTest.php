<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token', 'user', 'permissions']);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertUnauthorized();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();
        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $response = $this
            ->withToken($login->json('token'))
            ->postJson('/api/logout');

        $response->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_is_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertTooManyRequests();
    }

    public function test_password_change_uses_the_authenticated_user_and_revokes_tokens(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('current-session')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/change-password', [
                'email' => 'another-user@example.com',
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
