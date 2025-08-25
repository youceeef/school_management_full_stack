<?php
// app/Http/Requests/StoreReservationRequest.php
namespace App\Http\Requests;

use App\Models\Reservation;
use App\Models\Salle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Reservation::class);
    }

    public function rules(): array
    {
        return [
            'salle_id' => [
                'required',
                'integer',
                Rule::exists('salles', 'id')->where(
                    fn($query) =>
                    $query->whereIn('type', [Salle::TYPE_LABORATORY, Salle::TYPE_AMPHITHEATER])
                ),
            ],
            'start_time' => 'required|date_format:Y-m-d H:i:s|after_or_equal:now',
            'end_time' => 'required|date_format:Y-m-d H:i:s|after:start_time',
            'purpose' => 'nullable|string|max:1000',
            'equipements' => 'nullable|array',
            'equipements.*.id' => 'required_with:equipements|integer|exists:equipements,id',
            'equipements.*.quantity' => 'required_with:equipements|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'salle_id.exists' => 'La salle sélectionnée n\'est pas valide ou n\'est pas un laboratoire/amphithéâtre.',
            // ... other messages
        ];
    }
}
