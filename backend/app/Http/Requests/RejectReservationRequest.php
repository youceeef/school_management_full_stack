<?php
// app/Http/Requests/RejectReservationRequest.php
namespace App\Http\Requests;

use App\Models\Reservation; // Import Reservation model
use Illuminate\Foundation\Http\FormRequest;

class RejectReservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Get the reservation instance from the route
        $reservation = $this->route('reservation');

        // Check if a reservation model was resolved and then authorize
        // This uses the 'reject' method from ReservationPolicy.
        return $reservation && $this->user()->can('reject', $reservation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'rejection_reason' => 'required|string|min:10|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Le motif du rejet est obligatoire.',
            'rejection_reason.min' => 'Le motif du rejet doit comporter au moins :min caractères.',
            'rejection_reason.max' => 'Le motif du rejet ne peut pas dépasser :max caractères.',
        ];
    }
}
