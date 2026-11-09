<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountReview extends Model
{
    use HasFactory;

    public const ACTION_APPROVED = 'approved';

    public const ACTION_REJECTED = 'rejected';

    public const ACTION_SUSPENDED = 'suspended';

    public const ACTION_REACTIVATED = 'reactivated';

    public const ACTION_RESUBMITTED = 'resubmitted';

    protected $fillable = [
        'user_id',
        'reviewer_id',
        'action',
        'from_status',
        'to_status',
        'reason',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The applicant or user undergoing review.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The administrator who performed the review action (nullable for applicant resubmissions).
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
