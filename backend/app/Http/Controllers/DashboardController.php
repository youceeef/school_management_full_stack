<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Salle;
use App\Models\Equipement;
use App\Models\Document;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function getUserCount()
    {
        $count = User::count();
        return response()->json(['count' => $count]);
    }

    public function getSalleCount()
    {
        $count = Salle::count();
        return response()->json(['count' => $count]);
    }

    public function getEquipementCount()
    {
        $count = Equipement::count();
        return response()->json(['count' => $count]);
    }

    public function getDocumentCount()
    {
        $count = Document::count();
        return response()->json(['count' => $count]);
    }

    public function getRecentReservations(Request $request)
    {
        $limit = $request->query('limit', 5);

        $reservations = Reservation::with(['salle', 'user'])
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(function ($reservation) {
                return [
                    'room' => $reservation->salle->name,
                    'status' => $reservation->status,
                    'professor' => $reservation->user->first_name . ' ' . $reservation->user->last_name,
                    'date' => Carbon::parse($reservation->start_time)->format('d M Y'),
                ];
            });

        return response()->json($reservations);
    }

    private function translateStatus($status)
    {
        $translations = [
            'pending' => 'En attente',
            'approved' => 'En cours',
            'scheduled' => 'Planifié',
            'rejected' => 'Rejeté',
            'completed' => 'Terminé'
        ];

        return $translations[$status] ?? $status;
    }
}
