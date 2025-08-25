<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Salle extends Model
{
    use HasFactory;

    protected $table = 'salles';

    // --- Constants for Type ---
    public const TYPE_CLASSROOM = 'salle de classe';
    public const TYPE_LABORATORY = 'laboratoire';
    public const TYPE_AMPHITHEATER = 'amphitheatre';


    protected $fillable = [
        'name',
        'capacity',
        'type',
        'user_id',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // Scopes
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeWithMinCapacity(Builder $query, int $capacity): Builder
    {
        return $query->where('capacity', '>=', $capacity);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'like', "%{$term}%")
            ->orWhere('type', 'like', "%{$term}%");
    }

    public function scopeAvailableForPeriod(Builder $query, string $startTime, string $endTime): Builder
    {
        return $query->whereDoesntHave('reservations', function (Builder $query) use ($startTime, $endTime) {
            $query->whereIn('status', [Reservation::STATUS_PENDING, Reservation::STATUS_APPROVED])
                ->overlapping($startTime, $endTime);
        });
    }

    // Helper Methods
    public function isAvailable(string $startTime, string $endTime, ?int $excludeReservationId = null): bool
    {
        $query = $this->reservations()
            ->whereIn('status', [Reservation::STATUS_PENDING, Reservation::STATUS_APPROVED])
            ->overlapping($startTime, $endTime);

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        return !$query->exists();
    }

    public function getUpcomingReservations(int $limit = 5)
    {
        return $this->reservations()
            ->whereIn('status', [Reservation::STATUS_PENDING, Reservation::STATUS_APPROVED])
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->limit($limit)
            ->get();
    }

    public function getCurrentReservation()
    {
        return $this->reservations()
            ->whereIn('status', [Reservation::STATUS_APPROVED])
            ->where('start_time', '<=', now())
            ->where('end_time', '>', now())
            ->first();
    }

    // Validation Methods
    public static function getValidTypes(): array
    {
        return [
            self::TYPE_CLASSROOM,
            self::TYPE_LABORATORY,
            self::TYPE_AMPHITHEATER,
        ];
    }

    public function validateCapacity(?int $requestedCapacity): bool
    {
        return !$requestedCapacity || $this->capacity >= $requestedCapacity;
    }
}
