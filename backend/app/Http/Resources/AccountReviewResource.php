<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountReviewResource extends JsonResource
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
            'action' => $this->action,
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'reason' => $this->reason,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at,
            'reviewer' => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'first_name' => $this->reviewer->first_name,
                'last_name' => $this->reviewer->last_name,
                'email' => $this->reviewer->email,
            ] : null,
        ];
    }
}
