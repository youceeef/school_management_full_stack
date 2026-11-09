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
            'address' => $this->address,
            'bio' => $this->bio,
            'picture' => $this->profilePictureUrl(),
            'approval_status' => $this->approval_status,
            'requested_role' => $this->requested_role,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'reviewed_at' => $this->reviewed_at,
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
