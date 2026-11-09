<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'approval_status' => User::APPROVAL_APPROVED,
        ];
    }

    /**
     * Indicate that the user account is pending approval.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_status' => User::APPROVAL_PENDING,
        ]);
    }

    /**
     * Indicate that the user account is suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_status' => User::APPROVAL_SUSPENDED,
            'suspended_at' => now(),
        ]);
    }

    /**
     * Indicate that the user account is rejected.
     */
    public function rejected(?string $reason = 'Information incomplete'): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_status' => User::APPROVAL_REJECTED,
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
