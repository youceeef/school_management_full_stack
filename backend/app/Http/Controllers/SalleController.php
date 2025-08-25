<?php

namespace App\Http\Controllers;

use App\Models\Salle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class SalleController extends Controller
{





    public function indexCalendar()
    {
        // $this->authorize('viewAny', Salle::class);
        $salles = DB::table('salles')->get();
        return response()->json($salles);
    }

    /**
     * Display a paginated listing of the resource.
     */
    public function index(Request $request)
    {
        // CONVENTION: Using 'viewAny' for the index method.
        $this->authorize('viewAny', Salle::class);

        $query = Salle::query()->with('user:id,first_name,last_name');

        // Advanced Filtering
        if ($request->has('type') && in_array($request->query('type'), [Salle::TYPE_CLASSROOM, Salle::TYPE_LABORATORY, Salle::TYPE_AMPHITHEATER])) {
            $query->where('type', $request->query('type'));
        }
        if ($request->has('min_capacity') && is_numeric($request->query('min_capacity'))) {
            $query->where('capacity', '>=', $request->query('min_capacity'));
        }
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }

        // Sorting
        $sortBy = $request->query('sortBy', 'created_at');
        $sortDir = $request->query('sortDir', 'desc');
        if (in_array($sortBy, ['name', 'capacity', 'type', 'created_at'])) {
            $query->orderBy($sortBy, $sortDir);
        }

        // Pagination
        $perPage = $request->query('per_page', 15);
        $salles = $query->paginate((int)$perPage);

        return response()->json($salles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Salle::class);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:salles,name',
                'capacity' => 'required|integer|min:1',
                'type' => ['required', 'string', Rule::in([Salle::TYPE_CLASSROOM, Salle::TYPE_LABORATORY, Salle::TYPE_AMPHITHEATER])],
            ]);

            $salle = Salle::create($validated + ['user_id' => Auth::id()]);

            return response()->json([
                'message' => 'Salle créée avec succès.',
                'salle' => $salle->load('user:id,first_name,last_name')
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('salle creation failed: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred while creating the salle.'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($salleId)
    {
        // CLEANUP: Use findOrFail to automatically handle 404s.
        $salle = Salle::with('user:id,first_name,last_name')->findOrFail($salleId);
        $this->authorize('view', $salle);

        return response()->json($salle);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $salleId)
    {
        // CLEANUP: Use findOrFail and remove redundant ownership check.
        $salle = Salle::findOrFail($salleId);
        $this->authorize('update', $salle);

        try {
            $validated = $request->validate([
                'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('salles')->ignore($salleId)],
                'capacity' => 'sometimes|required|integer|min:1',
                'type' => ['sometimes', 'required', 'string', Rule::in([Salle::TYPE_CLASSROOM, Salle::TYPE_LABORATORY, Salle::TYPE_AMPHITHEATER])],
            ]);

            $salle->update($validated);

            return response()->json([
                'message' => 'Salle mise à jour avec succès.',
                'salle' => $salle->load('user:id,first_name,last_name')
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('salle update failed: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred while updating the salle.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($salleId)
    {
        // CLEANUP: Use findOrFail and remove redundant ownership check.
        $salle = Salle::findOrFail($salleId);
        $this->authorize('delete', $salle);

        $salle->delete();

        return response()->json(['message' => 'Salle supprimée avec succès']);
    }
}
