<?php

namespace App\Models;

use App\Notifications\VerifyStaffEmailNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    public const APPROVAL_PENDING = 'pending';

    public const APPROVAL_APPROVED = 'approved';

    public const APPROVAL_REJECTED = 'rejected';

    public const APPROVAL_SUSPENDED = 'suspended';

    public const APPROVAL_ROLES = ['enseignant', 'responsable_laboratoire'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'picture',
        'address',
        'phone',
        'bio',
        'institution',
        'department',
        'staff_id',
        'professional_phone',
        'proof_document_path',
        'proof_document_name',
        'proof_document_mime',
        'proof_document_size',
        'proof_submitted_at',
        'approval_status',
        'rejection_reason',
        'requested_role',
        'reviewed_at',
        'reviewed_by',
        'suspended_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'approval_status' => self::APPROVAL_APPROVED,
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'reviewed_at' => 'datetime',
        'suspended_at' => 'datetime',
        'two_factor_secret' => 'encrypted',
        'two_factor_recovery_codes' => 'encrypted:array',
        'two_factor_confirmed_at' => 'datetime',
    ];

    public function reviewer()
    {
        return $this->belongsTo(self::class, 'reviewed_by');
    }

    public function reviews()
    {
        return $this->hasMany(AccountReview::class)->orderByDesc('created_at');
    }

    public function isApproved(): bool
    {
        return $this->approval_status === self::APPROVAL_APPROVED;
    }

    public function isSuspended(): bool
    {
        return $this->approval_status === self::APPROVAL_SUSPENDED;
    }

    public function isRejected(): bool
    {
        return $this->approval_status === self::APPROVAL_REJECTED;
    }

    public function isPending(): bool
    {
        return $this->approval_status === self::APPROVAL_PENDING;
    }

    public function hasEnabledTwoFactorAuthentication(): bool
    {
        return ! is_null($this->two_factor_secret) && ! is_null($this->two_factor_confirmed_at);
    }

    /**
     * Generate a signed temporary challenge token for 2FA verification.
     */
    public function createTwoFactorChallengeToken(): string
    {
        return encrypt([
            'user_id' => $this->id,
            'expires_at' => now()->addMinutes(5)->timestamp,
        ]);
    }

    /**
     * Replace recovery code if matching code is found.
     * Returns true if valid code was consumed and user saved.
     */
    public function consumeRecoveryCode(string $code): bool
    {
        $codes = $this->two_factor_recovery_codes;

        if (! is_array($codes) || empty($codes)) {
            return false;
        }

        $clean = trim($code);
        $foundIndex = null;

        foreach ($codes as $index => $storedCode) {
            if (hash_equals($storedCode, $clean)) {
                $foundIndex = $index;
                break;
            }
        }

        if ($foundIndex === null) {
            return false;
        }

        unset($codes[$foundIndex]);
        $this->two_factor_recovery_codes = array_values($codes);
        $this->save();

        return true;
    }

    public function requiresAccountApproval(): bool
    {
        return in_array($this->requested_role, self::APPROVAL_ROLES, true);
    }

    /**
     * Staff must confirm ownership of their email before review; every other
     * account type can never enter that flow, so no verification mail is sent.
     */
    public function sendEmailVerificationNotification(): void
    {
        if ($this->requiresAccountApproval()) {
            // Production currently uses the synchronous queue driver. Sending
            // immediately lets registration/resend detect transport failures
            // instead of reporting that a job was accepted when none exists.
            $this->notifyNow(new VerifyStaffEmailNotification);
        }
    }

    /**
     * Accounts an administrator may act on. A pending application is reviewable
     * only once its email address has been confirmed; already-decided accounts
     * stay visible for their history.
     */
    public function scopeReviewable(Builder $query): Builder
    {
        return $query->where(function (Builder $query) {
            $query->whereNotNull('email_verified_at')
                ->orWhere('approval_status', '!=', self::APPROVAL_PENDING);
        });
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
    // public function salles()
    // {
    //     return $this->hasMany(Salle::class);
    // }

}
