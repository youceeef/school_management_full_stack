<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Equipement extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'quantity_available',
        'added_by',
    ];

    protected $casts = [
        'quantity_available' => 'integer',
    ];

    // Relationships
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function reservations()
    {
        return $this->belongsToMany(Reservation::class, 'equipement_reservation')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    // Scopes
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('quantity_available', '>', 0);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'like', "%{$term}%")
            ->orWhere('description', 'like', "%{$term}%");
    }

    // Helper Methods
    public function getAvailableQuantityForPeriod(string $startTime, string $endTime): int
    {
        $reservedQuantity = $this->reservations()
            ->whereIn('status', [Reservation::STATUS_PENDING, Reservation::STATUS_APPROVED])
            ->overlapping($startTime, $endTime)
            ->sum('equipement_reservation.quantity');

        return max(0, $this->quantity_available - $reservedQuantity);
    }

    public function isAvailableForQuantity(int $requestedQuantity, string $startTime, string $endTime): bool
    {
        return $this->getAvailableQuantityForPeriod($startTime, $endTime) >= $requestedQuantity;
    }

    // Validation Methods
    public function validateQuantityRequest(int $requestedQuantity, string $startTime, string $endTime): array
    {
        $errors = [];
        $availableQuantity = $this->getAvailableQuantityForPeriod($startTime, $endTime);

        if ($requestedQuantity > $availableQuantity) {
            $errors[] = "Quantité insuffisante. Disponible: {$availableQuantity}, Demandé: {$requestedQuantity}";
        }

        if ($requestedQuantity <= 0) {
            $errors[] = "La quantité demandée doit être supérieure à 0";
        }

        return $errors;
    }
}
