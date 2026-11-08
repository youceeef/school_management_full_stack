<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Salle;
use App\Models\User;
use App\Notifications\UserRegisteredNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAndNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_and_recent_reservations_are_dynamic_and_scoped(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $teacher = User::factory()->create();
        $teacher->assignRole('enseignant');

        $room = Salle::create([
            'name' => 'Dynamic Lab',
            'capacity' => 20,
            'type' => Salle::TYPE_LABORATORY,
            'user_id' => $admin->id,
        ]);
        $reservation = Reservation::create([
            'user_id' => $teacher->id,
            'salle_id' => $room->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'purpose' => 'Dynamic dashboard test',
            'status' => Reservation::STATUS_PENDING,
        ]);

        $teacherToken = $teacher->createToken('teacher')->plainTextToken;
        $this->withToken($teacherToken)
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('users', 2)
            ->assertJsonPath('rooms', 1)
            ->assertJsonPath('active_reservations', 1)
            ->assertJsonPath('pending_reservations', 1)
            ->assertJsonPath('unread_notifications', 0);

        $this->withToken($teacherToken)
            ->getJson('/api/reservations/recent')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $reservation->id)
            ->assertJsonPath('0.room', 'Dynamic Lab')
            ->assertJsonPath('0.action_url', "/dashboard/mes-reservations/{$reservation->id}");

    }

    public function test_admin_recent_reservations_link_to_the_management_view(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $room = Salle::create([
            'name' => 'Admin Lab',
            'capacity' => 20,
            'type' => Salle::TYPE_LABORATORY,
            'user_id' => $admin->id,
        ]);
        $reservation = Reservation::create([
            'user_id' => $admin->id,
            'salle_id' => $room->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'status' => Reservation::STATUS_PENDING,
        ]);

        $this->withToken($admin->createToken('admin')->plainTextToken)
            ->getJson('/api/reservations/recent')
            ->assertOk()
            ->assertJsonPath('0.action_url', "/dashboard/reservations/{$reservation->id}");
    }

    public function test_notification_payload_stats_and_mutations_stay_consistent(): void
    {
        $user = User::factory()->create();
        $user->notify(new UserRegisteredNotification($user));
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/notifications?limit=100')
            ->assertOk()
            ->assertJsonPath('stats.total', 1)
            ->assertJsonPath('stats.unread', 1)
            ->assertJsonPath('stats.read', 0)
            ->assertJsonPath('data.0.data.action_url', '/dashboard/profile');

        $notificationId = $response->json('data.0.id');

        $this->withToken($token)
            ->postJson("/api/notifications/{$notificationId}/mark-as-read")
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/notifications?limit=100')
            ->assertJsonPath('stats.unread', 0)
            ->assertJsonPath('stats.read', 1);

        $this->withToken($token)
            ->deleteJson("/api/notifications/{$notificationId}")
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/notifications?limit=100')
            ->assertJsonPath('stats.total', 0);
    }

    public function test_users_cannot_delete_another_users_notification(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $owner->notify(new UserRegisteredNotification($owner));
        $notificationId = $owner->notifications()->firstOrFail()->id;

        $this->withToken($otherUser->createToken('other')->plainTextToken)
            ->deleteJson("/api/notifications/{$notificationId}")
            ->assertForbidden();
    }
}
