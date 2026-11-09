<?php

// app/Http/Resources/UserResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UserResource extends JsonResource
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
            'picture' => $this->profilePictureUrl(),
            'address' => $this->address,
            'phone' => $this->phone,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'bio' => $this->bio,
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
            // Return the relative path so the frontend can still combine it
            // with NEXT_PUBLIC_STORAGE_URL while configuration is corrected.
            Log::warning('Failed to generate profile picture URL', [
                'user_id' => $this->id,
                'path' => $this->picture,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return $this->picture;
        }
    }
}
