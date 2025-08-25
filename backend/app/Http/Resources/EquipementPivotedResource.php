<?php
// app/Http/Resources/EquipementPivotedResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipementPivotedResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // $this->resource refers to the Equipement model instance when iterated from reservation->equipements
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            // 'quantity_available' => $this->quantity_available, // Total stock, might be useful
            'quantity_reserved' => $this->whenPivotLoaded('equipement_reservation', function () {
                return $this->pivot->quantity; // Access the 'quantity' from the pivot table
            }),
            // Add other equipment fields if needed
        ];
    }
}
