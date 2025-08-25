<?php

namespace App\Http\Controllers;

// Requests & Resources
use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\RejectReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Http\Resources\ReservationCollection;

// Models
use App\Models\Reservation;
use App\Models\Equipement;
use App\Models\User;

// Laravel Facades & Helpers
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Throwable;

// Import your NEW Reservation Events
use App\Events\ReservationSubmittedEvent;
use App\Events\ReservationApprovedEvent;
use App\Events\ReservationRejectedEvent;
// We are removing ReservationCancelledEvent for now

use App\Services\ReservationService;
use App\Exceptions\RoomNotAvailableException;
use App\Exceptions\EquipmentNotAvailableException;

class ReservationController extends Controller
{
    protected $reservationService;

    public function __construct(ReservationService $reservationService)
    {
        $this->reservationService = $reservationService;
    }

    public function index(Request $request): ReservationCollection|JsonResponse
    {
        $this->authorize('viewAny', Reservation::class);
        $user = $request->user();
        $query = Reservation::with(['salle', 'user', 'equipements', 'approver']);

        if ($user->can('list all reservations')) {
            if ($request->filled('status') && in_array($request->status, ['pending', 'approved', 'rejected'])) {
                $query->where('status', $request->status);
            }
        } elseif ($user->can('list own reservations')) {
            $query->where('user_id', $user->id);
            if ($request->filled('status') && in_array($request->status, ['pending', 'approved', 'rejected'])) {
                $query->where('status', $request->status);
            }
        } else {
            return response()->json(['message' => 'You are not authorized to list reservations.'], 403);
        }
        $reservations = $query->latest()->paginate(15);
        return new ReservationCollection($reservations);
    }

    public function store(StoreReservationRequest $request): JsonResponse|ReservationResource
    {
        $this->authorize('store', Reservation::class);
        $validated = $request->validated();

        try {
            // Check room availability
            if (!$this->reservationService->checkSalleAvailability(
                $validated['salle_id'],
                $validated['start_time'],
                $validated['end_time']
            )) {
                throw new RoomNotAvailableException(errors: [
                    'salle_id' => ['Cette salle n\'est pas disponible pour la période demandée.']
                ]);
            }

            // Check equipment availability if equipment is requested
            if (!empty($validated['equipements'])) {
                $equipmentErrors = $this->reservationService->validateEquipmentAvailability(
                    collect($validated['equipements']),
                    $validated['start_time'],
                    $validated['end_time']
                );

                if (!empty($equipmentErrors)) {
                    throw new EquipmentNotAvailableException(errors: $equipmentErrors);
                }
            }

            // Create the reservation
            $reservation = $this->reservationService->createReservation($validated, Auth::id());

            return new ReservationResource($reservation);
        } catch (RoomNotAvailableException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->getErrors()
            ], 422);
        } catch (EquipmentNotAvailableException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->getErrors()
            ], 422);
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Une erreur est survenue. Veuillez réessayer.'
            ], 500);
        }
    }


    public function approve(Reservation $reservation): ReservationResource|JsonResponse
    {
        $this->authorize('approve', $reservation);
        if ($reservation->status !== 'pending') {
            return response()->json(['message' => 'Cette réservation ne peut pas être approuvée.', 'current_status' => $reservation->status], 422);
        }

        $reservation->status = 'approved';
        $reservation->approved_by = Auth::id();
        $reservation->approved_at = now();
        $reservation->rejection_reason = null;
        $reservation->save();

        // Ensure relationships are loaded for the event and resource
        $reservation->loadMissing(['user', 'salle', 'approver', 'equipements']);

        // --- Dispatch Event for Approval ---
        ReservationApprovedEvent::dispatch($reservation);
        // --- End Event Dispatch ---

        return new ReservationResource($reservation);
    }

    public function reject(RejectReservationRequest $request, Reservation $reservation): ReservationResource|JsonResponse
    {
        // Authorization is handled by RejectReservationRequest
        if ($reservation->status !== 'pending') {
            return response()->json(['message' => 'Cette réservation ne peut pas être rejetée.', 'current_status' => $reservation->status], 422);
        }
        $validated = $request->validated();
        $reservation->status = 'rejected';
        $reservation->rejection_reason = $validated['rejection_reason'];
        $reservation->approved_by = Auth::id();
        $reservation->approved_at = now();
        $reservation->save();

        // Ensure relationships are loaded for the event and resource
        $reservation->loadMissing(['user', 'salle', 'approver', 'equipements']);

        // --- Dispatch Event for Rejection ---
        ReservationRejectedEvent::dispatch($reservation);
        // --- End Event Dispatch ---

        return new ReservationResource($reservation);
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $this->authorize('delete', $reservation);
        $reservation->delete();

        return response()->json(['message' => 'Réservation annulée avec succès.'], 200);
    }


    public function show(Reservation $reservation): ReservationResource
    {
        $this->authorize('view', $reservation);
        $reservation->load(['salle', 'user', 'equipements', 'approver']);
        return new ReservationResource($reservation);
    }
    public function myReservations(Request $request): ReservationCollection|JsonResponse
    {
        $user = $request->user();
        $this->authorize('viewMyReservations', Reservation::class);

        $query = Reservation::with(['salle', 'user', 'equipements', 'approver'])
            ->where('user_id', $user->id);

        if ($request->filled('status') && in_array($request->status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $request->status);
        }

        $reservations = $query->latest()->paginate(15);
        return new ReservationCollection($reservations);
    }
    public function myReservationSingle(Reservation $reservation): ReservationResource|JsonResponse
    {
        $user = request()->user();

        // Check if the reservation belongs to the authenticated user
        if ($reservation->user_id !== $user->id) {
            return response()->json([
                'message' => 'You are not authorized to view this reservation.'
            ], 403);
        }

        $this->authorize('view', $reservation);

        // Load the relationships
        $reservation->load(['salle', 'user', 'equipements', 'approver']);

        return new ReservationResource($reservation);
    }
    public function cancelMyReservation(Reservation $reservation): JsonResponse
    {
        $user = request()->user();

        // Check if the reservation belongs to the authenticated user
        if ($reservation->user_id !== $user->id) {
            return response()->json([
                'message' => 'You are not authorized to cancel this reservation.'
            ], 403);
        }

        // Check if the reservation can be cancelled (not already approved/rejected)
        if ($reservation->status !== 'pending') {
            return response()->json([
                'message' => 'Seules les réservations en attente peuvent être annulées.',
                'current_status' => $reservation->status
            ], 422);
        }

        $reservation->delete();

        return response()->json([
            'message' => 'Réservation annulée avec succès.'
        ], 200);
    }

    /**
     * Get reservations for calendar view with room filtering
     */
    public function getCalendarReservations(Request $request): JsonResponse
    {
        // $this->authorize('viewCalendarReservations', Reservation::class);
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'salle_ids' => 'nullable|array',
            'salle_ids.*' => 'exists:salles,id'
        ]);

        // First, get only laboratoire and amphitheatre salles
        $validSalleTypes = ['laboratoire', 'amphitheatre'];

        $query = Reservation::with(['salle', 'user', 'equipements'])
            ->whereHas('salle', function ($query) use ($validSalleTypes) {
                $query->whereIn('type', $validSalleTypes);
            })
            ->where(function($query) use ($request) {
                $query->where(function($q) use ($request) {
                    // Reservations that start within the date range
                    $q->whereBetween('start_time', [
                        $request->start_date,
                        $request->end_date
                    ]);
                })->orWhere(function($q) use ($request) {
                    // Reservations that end within the date range
                    $q->whereBetween('end_time', [
                        $request->start_date,
                        $request->end_date
                    ]);
                })->orWhere(function($q) use ($request) {
                    // Reservations that span across the entire date range
                    $q->where('start_time', '<=', $request->start_date)
                      ->where('end_time', '>=', $request->end_date);
                });
            })
            ->whereIn('status', ['approved', 'in_progress', 'completed']);

        if ($request->filled('salle_ids') && !empty($request->salle_ids)) {
            $query->whereIn('salle_id', $request->salle_ids);
        }

        $reservations = $query->get()->map(function ($reservation) {
            return [
                'id' => $reservation->id,
                'title' => $reservation->purpose,
                'description' => $reservation->purpose,
                'start_time' => $reservation->start_time,
                'end_time' => $reservation->end_time,
                'status' => $reservation->status,
                'approved_at' => $reservation->approved_at ? $reservation->approved_at->toDateTimeString() : null,
                'status_label' => match($reservation->status) {
                    'approved' => 'Approuvée',
                    'in_progress' => 'En cours',
                    'completed' => 'Terminée',
                    default => $reservation->status,
                },
                'salle' => [
                    'id' => $reservation->salle->id,
                    'name' => $reservation->salle->name,
                    'type' => $reservation->salle->type
                ],
                'user' => [
                    'id' => $reservation->user->id,
                    'first_name' => $reservation->user->first_name,
                    'last_name' => $reservation->user->last_name,
                    'email' => $reservation->user->email,
                    'role' => $reservation->user->role
                ],
                'equipements' => $reservation->equipements->map(function ($equipement) {
                    return [
                        'id' => $equipement->id,
                        'name' => $equipement->name,
                        'pivot' => [
                            'quantity' => $equipement->pivot->quantity
                        ]
                    ];
                })
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $reservations,
            'message' => 'Reservations retrieved successfully'
        ]);
    }

    /**
     * Get daily reservations with room filtering
     */
    public function getDailyReservations(Request $request): JsonResponse
    {
        $this->authorize('viewDailyReservations', Reservation::class);
        $request->validate([
            'date' => 'required|date',
            'salle_ids' => 'nullable|array',
            'salle_ids.*' => 'exists:salles,id'
        ]);

        $validSalleTypes = ['laboratoire', 'amphitheatre'];

        $query = Reservation::with(['salle', 'user', 'equipements'])
            ->whereHas('salle', function ($query) use ($validSalleTypes) {
                $query->whereIn('type', $validSalleTypes);
            })
            ->whereDate('start_time', $request->date)
            ->where('status', 'approved');

        if ($request->filled('salle_ids') && !empty($request->salle_ids)) {
            $query->whereIn('salle_id', $request->salle_ids);
        }

        $reservations = $query->get();

        return response()->json([
            'success' => true,
            'data' => $reservations,
            'message' => 'Daily reservations retrieved successfully'
        ]);
    }
}
