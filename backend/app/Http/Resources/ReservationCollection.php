<?php
// app/Http/Resources/ReservationCollection.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ReservationCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // 'data' key will contain the array of ReservationResource items by default
            'data' => $this->collection,
            // You can add pagination links and meta automatically if you return the paginator instance directly
            // or customize it here:
            // 'links' => [
            //     'first' => $this->url(1),
            //     'last' => $this->url($this->lastPage()),
            //     'prev' => $this->previousPageUrl(),
            //     'next' => $this->nextPageUrl(),
            // ],
            // 'meta' => [
            //     'current_page' => $this->currentPage(),
            //     'from' => $this->firstItem(),
            //     'last_page' => $this->lastPage(),
            //     'path' => $this->path(),
            //     'per_page' => $this->perPage(),
            //     'to' => $this->lastItem(),
            //     'total' => $this->total(),
            // ],
        ];
    }

    /**
     * The "data" wrapper that should be applied.
     * By default, Laravel wraps the collection in a "data" key.
     * If you want to customize this, or if you disabled it globally and want it here:
     * public static $wrap = 'data'; // or 'reservations', or null to disable for this resource
     */
}
