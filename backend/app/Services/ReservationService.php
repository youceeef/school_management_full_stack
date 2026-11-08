<?php

namespace App\Services;

use App\Events\ReservationSubmittedEvent;
use App\Exceptions\EquipmentNotAvailableException;
use App\Exceptions\RoomNotAvailableException;
use App\Models\Equipement;
use App\Models\Reservation;
use App\Models\Salle;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function checkSalleAvailability(int $salleId, string $startTime, string $endTime): bool
    {
        return ! Reservation::where('salle_id', $salleId)
            ->whereIn('status', ['pending', 'approved'])
            ->overlapping($startTime, $endTime)
            ->exists();
    }

    public function validateEquipmentAvailability(Collection $requestedEquipments, string $startTime, string $endTime): array
    {
        $equipmentErrors = [];
        if ($requestedEquipments->isEmpty()) {
            return $equipmentErrors;
        }

        $requestedEquipementIds = $requestedEquipments->pluck('id')->unique()->toArray();

        // Get all overlapping reservations for the time period
        $overlappingReservations = Reservation::whereIn('status', ['pending', 'approved', 'in_progress'])
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->with(['equipements' => function ($query) use ($requestedEquipementIds) {
                $query->whereIn('equipements.id', $requestedEquipementIds);
            }])
            ->get();

        // Get equipment data with their total quantities
        $equipmentData = Equipement::whereIn('id', $requestedEquipementIds)
            ->get()
            ->keyBy('id');

        foreach ($requestedEquipments as $index => $requestedItem) {
            $equipment = $equipmentData->get($requestedItem['id']);
            if (! $equipment) {
                continue;
            }

            // Calculate total reserved quantity for this time period
            $reservedQuantity = $overlappingReservations
                ->flatMap(fn ($res) => $res->equipements)
                ->where('id', $equipment->id)
                ->sum('pivot.quantity');

            $netAvailable = $equipment->quantity_available - $reservedQuantity;

            if ($requestedItem['quantity'] > $netAvailable) {
                // Get conflicting reservations details
                $conflictingReservations = $overlappingReservations
                    ->filter(function ($res) use ($equipment) {
                        return $res->equipements->contains('id', $equipment->id);
                    })
                    ->map(function ($res) use ($equipment) {
                        $reservedQty = $res->equipements->where('id', $equipment->id)->first()->pivot->quantity;

                        return [
                            'time' => $this->format_date($res->start_time).' - '.$this->format_date($res->end_time),
                            'quantity' => $reservedQty,
                        ];
                    })
                    ->values();

                $errorMessage = "Quantité insuffisante pour l'équipement: {$equipment->name}.\n".
                    "Demandé: {$requestedItem['quantity']}, ".
                    "Disponible: {$netAvailable} ".
                    "(Stock total: {$equipment->quantity_available}, ".
                    "Réservé: {$reservedQuantity})\n";

                if ($conflictingReservations->isNotEmpty()) {
                    $errorMessage .= "\nRéservations en conflit:\n";
                    foreach ($conflictingReservations as $conflict) {
                        $errorMessage .= "- {$conflict['time']}: {$conflict['quantity']} unité(s)\n";
                    }
                }

                $equipmentErrors["equipements.{$index}.quantity"] = [$errorMessage];
            }
        }

        return $equipmentErrors;
    }

    private function format_date($date): string
    {
        return Carbon::parse($date)->format('d/m/Y H:i');
    }

    private function createReservation(array $validatedData, int $userId): Reservation
    {
        $reservation = Reservation::create([
            'user_id' => $userId,
            'salle_id' => $validatedData['salle_id'],
            'start_time' => $validatedData['start_time'],
            'end_time' => $validatedData['end_time'],
            'purpose' => $validatedData['purpose'] ?? null,
            'status' => 'pending',
        ]);

        if (! empty($validatedData['equipements'])) {
            $equipmentsToAttach = collect($validatedData['equipements'])
                ->mapWithKeys(fn ($item) => [$item['id'] => ['quantity' => $item['quantity']]])
                ->all();
            $reservation->equipements()->attach($equipmentsToAttach);
        }

        $reservation->loadMissing(['salle', 'user', 'equipements']);

        return $reservation;
    }

    /**
     * Serialize availability checks around the selected room and equipment so
     * concurrent requests cannot reserve the same resources simultaneously.
     */
    public function createAvailableReservation(array $validatedData, int $userId): Reservation
    {
        $reservation = DB::transaction(function () use ($validatedData, $userId) {
            Salle::query()
                ->whereKey($validatedData['salle_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $requestedEquipments = collect($validatedData['equipements'] ?? []);
            $equipmentIds = $requestedEquipments->pluck('id')->unique()->sort()->values();

            if ($equipmentIds->isNotEmpty()) {
                Equipement::query()
                    ->whereIn('id', $equipmentIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();
            }

            if (! $this->checkSalleAvailability(
                $validatedData['salle_id'],
                $validatedData['start_time'],
                $validatedData['end_time']
            )) {
                throw new RoomNotAvailableException(errors: [
                    'salle_id' => ['Cette salle n\'est pas disponible pour la période demandée.'],
                ]);
            }

            $equipmentErrors = $this->validateEquipmentAvailability(
                $requestedEquipments,
                $validatedData['start_time'],
                $validatedData['end_time']
            );

            if ($equipmentErrors !== []) {
                throw new EquipmentNotAvailableException(errors: $equipmentErrors);
            }

            return $this->createReservation($validatedData, $userId);
        }, 3);

        ReservationSubmittedEvent::dispatch($reservation);

        return $reservation;
    }
}
