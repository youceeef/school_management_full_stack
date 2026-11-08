<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Equipement;
use App\Models\Reservation;
use App\Models\Salle;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

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

    public function summary(Request $request)
    {
        $user = $request->user();
        $reservationQuery = $this->visibleReservations($request);

        return response()->json([
            'users' => User::count(),
            'rooms' => Salle::count(),
            'equipments' => Equipement::count(),
            'documents' => Document::count(),
            'active_reservations' => (clone $reservationQuery)
                ->whereIn('status', [
                    Reservation::STATUS_PENDING,
                    Reservation::STATUS_APPROVED,
                    Reservation::STATUS_IN_PROGRESS,
                ])
                ->count(),
            'pending_reservations' => (clone $reservationQuery)
                ->where('status', Reservation::STATUS_PENDING)
                ->count(),
            'completed_reservations' => (clone $reservationQuery)
                ->where('status', Reservation::STATUS_COMPLETED)
                ->count(),
            'unread_notifications' => $user->unreadNotifications()->count(),
        ]);
    }

    public function getRecentReservations(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 5), 1), 20);
        $actionBase = $request->user()->can('list all reservations')
            ? '/dashboard/reservations/'
            : '/dashboard/mes-reservations/';

        $reservations = $this->visibleReservations($request)
            ->with(['salle', 'user'])
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(function ($reservation) use ($actionBase) {
                return [
                    'id' => $reservation->id,
                    'room' => $reservation->salle?->name ?? 'Salle supprimée',
                    'status' => $reservation->status,
                    'professor' => trim(($reservation->user?->first_name ?? '').' '.($reservation->user?->last_name ?? '')),
                    'purpose' => $reservation->purpose,
                    'start_time' => $reservation->start_time?->toIso8601String(),
                    'created_at' => $reservation->created_at?->toIso8601String(),
                    'action_url' => $actionBase.$reservation->id,
                ];
            });

        return response()->json($reservations);
    }

    private function visibleReservations(Request $request): Builder
    {
        $user = $request->user();
        $query = Reservation::query();

        if ($user->can('list all reservations')) {
            return $query;
        }

        if ($user->can('list own reservations')) {
            return $query->where('user_id', $user->id);
        }

        return $query->whereRaw('1 = 0');
    }
}
