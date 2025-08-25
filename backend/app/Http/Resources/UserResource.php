<?php
// app/Http/Resources/UserResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'picture' => $this->picture ? asset('storage/' . $this->picture) : null,
            'address' => $this->address,
            'phone' => $this->phone,
            'roles' => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'bio' => $this->bio,
        ];
    }
}
