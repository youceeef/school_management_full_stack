<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AccountRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'institution' => $this->institution,
            'department' => $this->department,
            'staff_id' => $this->staff_id,
            'professional_phone' => $this->professional_phone,
            'address' => $this->address,
            'bio' => $this->bio,
            'picture' => $this->profilePictureUrl(),
            'proof_document' => $this->proof_document_path ? [
                'name' => $this->proof_document_name,
                'mime' => $this->proof_document_mime,
                'size' => $this->proof_document_size,
                'submitted_at' => $this->proof_submitted_at,
                'is_pdf' => $this->proof_document_mime === 'application/pdf' || str_ends_with(strtolower($this->proof_document_name ?? ''), '.pdf'),
            ] : null,
            'approval_status' => $this->approval_status,
            'rejection_reason' => $this->rejection_reason,
            'requested_role' => $this->requested_role,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'reviewed_at' => $this->reviewed_at,
            'suspended_at' => $this->suspended_at,
            'reviewed_by' => $this->whenLoaded('reviewer', function () {
                if (! $this->reviewer) {
                    return null;
                }

                return [
                    'id' => $this->reviewer->id,
                    'first_name' => $this->reviewer->first_name,
                    'last_name' => $this->reviewer->last_name,
                    'email' => $this->reviewer->email,
                ];
            }),
            'reviews' => AccountReviewResource::collection($this->whenLoaded('reviews')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function profilePictureUrl(): ?string
    {
        if (! $this->picture) {
            return null;
        }

        try {
            return Storage::disk(config('filesystems.uploads_disk'))->url($this->picture);
        } catch (Throwable $e) {
            Log::warning('Failed to generate profile picture URL in AccountRequestResource', [
                'user_id' => $this->id,
                'path' => $this->picture,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return $this->picture;
        }
    }
}
