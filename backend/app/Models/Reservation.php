<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Reservation extends Model
{
    use HasFactory;

    // Status Constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'user_id',
        'salle_id',
        'start_time',
        'end_time',
        'purpose',
        'status',
        'approved_by',
        'rejection_reason',
        'approved_at'
    ];
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'approved_at' => 'datetime',
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function salle()
    {
        return $this->belongsTo(Salle::class);
    }

    public function equipements()
    {
        return $this->belongsToMany(Equipement::class, 'equipement_reservation')
            ->withPivot('quantity')
            ->withTimestamps();
    }


    public function scopeOverlapping(Builder $query, string $startTime, string $endTime): Builder
    {
        // Using a closure for the where clause to ensure proper grouping if this scope is chained
        return $query->where(function (Builder $q) use ($startTime, $endTime) {
            $q->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime);
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_APPROVED]);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('start_time', '>', now());
    }

    public function scopePast(Builder $query): Builder
    {
        return $query->where('end_time', '<', now());
    }

    public function scopeForDate(Builder $query, string $date): Builder
    {
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();

        return $query->where('start_time', '>=', $startOfDay)
            ->where('end_time', '<=', $endOfDay);
    }

    public function getDurationInMinutesAttribute(): int
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    public function getIsActiveAttribute(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_APPROVED]);
    }

    public function getIsUpcomingAttribute(): bool
    {
        return $this->start_time->isFuture();
    }

    public function getIsPastAttribute(): bool
    {
        return $this->end_time->isPast();
    }

    public function getIsOngoingAttribute(): bool
    {
        $now = now();
        return $this->start_time->isPast() && $this->end_time->isFuture();
    }

    public function hasValidTimeRange(): bool
    {
        return $this->start_time < $this->end_time;
    }

    public function hasOverlappingReservations(): bool
    {
        return static::where('id', '!=', $this->id)
            ->where('salle_id', $this->salle_id)
            ->whereIn('status', [self::STATUS_PENDING, self::STATUS_APPROVED])
            ->overlapping($this->start_time, $this->end_time)
            ->exists();
    }
}
