<?php

namespace Tests\Feature;

use App\Models\Equipement;
use App\Models\Salle;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_overlapping_room_or_equipment_reservations_are_rejected(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $teacher = User::factory()->create();
        $teacher->assignRole('enseignant');

        $room = Salle::create([
            'name' => 'Lab A',
            'capacity' => 20,
            'type' => Salle::TYPE_LABORATORY,
            'user_id' => $admin->id,
        ]);
        $equipment = Equipement::create([
            'name' => 'Projector',
            'quantity_available' => 1,
            'added_by' => $admin->id,
        ]);

        $payload = [
            'salle_id' => $room->id,
            'start_time' => now()->addDay()->startOfHour()->format('Y-m-d H:i:s'),
            'end_time' => now()->addDay()->startOfHour()->addHour()->format('Y-m-d H:i:s'),
            'purpose' => 'Class',
            'equipements' => [
                ['id' => $equipment->id, 'quantity' => 1],
            ],
        ];
        $token = $teacher->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/reservations', $payload)
            ->assertCreated();

        $this->withToken($token)
            ->postJson('/api/reservations', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('salle_id');

        $this->assertDatabaseCount('reservations', 1);
    }
}
