<?php
// app/Http/Resources/ReservationResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
// Import other resources we will create or might exist
use App\Http\Resources\UserResource; // Assuming you might have/want a UserResource
use App\Http\Resources\SalleResource; // Assuming you might have/want a SalleResource
use App\Http\Resources\EquipementPivotedResource; // A specific resource for equipment in reservation

class ReservationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // $this->resource refers to the Reservation model instance
        return [
            'id' => $this->id,
            'purpose' => $this->purpose,
            'start_time' => $this->start_time->toDateTimeString(), // Or format as needed e.g., ->format('Y-m-d H:i:s')
            'end_time' => $this->end_time->toDateTimeString(),
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'rejection_reason' => $this->when($this->status === 'rejected', $this->rejection_reason), // Only include if rejected
            'approved_at' => $this->when(
                in_array($this->status, ['approved', 'in_progress', 'completed']) && $this->approved_at,
                fn() => $this->approved_at->toDateTimeString()
            ), // Only if approved and date exists
            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),

            // Relationships - use whenLoaded to avoid N+1 issues if not eager loaded
            'user' => new UserResource($this->whenLoaded('user')), // The user who made the reservation
            'salle' => new SalleResource($this->whenLoaded('salle')),
            'approver' => new UserResource($this->whenLoaded('approver')), // The user who approved/rejected

            // For the pivot data (equipments attached to the reservation)
            'equipements' => EquipementPivotedResource::collection($this->whenLoaded('equipements')),

            // You can add HATEOAS links here if desired
            // 'links' => [
            //     'self' => route('reservations.show', $this->id), // Make sure your route name is correct
            // ]
        ];
    }

    private function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'approved' => 'Approuvée',
            'rejected' => 'Rejetée',
            'in_progress' => 'En cours',
            'completed' => 'Terminée',
            default => $this->status,
        };
    }
}
