<?php

namespace App\Http\Controllers;

use App\Models\Equipement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EquipementController extends Controller
{
    /**
     * Display a paginated listing of the resource.
     */
    public function index(Request $request)
    {
        // CONVENTION: Using 'viewAny' for the index method.
        $this->authorize('viewAny', Equipement::class);

        $query = Equipement::query()->with('createdBy:id,first_name,last_name');

        // Filtering & Sorting
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }
        $query->orderBy(
            $request->query('sortBy', 'name'),
            $request->query('sortDir', 'asc')
        );

        // Pagination
        $equipements = $query->paginate($request->query('per_page', 15));

        return response()->json($equipements);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Equipement::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:equipements,name',
            'description' => 'nullable|string',
            'quantity_available' => 'required|integer|min:0',
        ]);

        $equipement = Equipement::create($validated + ['added_by' => Auth::id()]);

        return response()->json([
            'message' => 'Équipement créé avec succès.',
            'equipement' => $equipement->load('createdBy:id,first_name,last_name')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($equipementId)
    {
        $equipement = Equipement::with('createdBy:id,first_name,last_name')->findOrFail($equipementId);
        $this->authorize('view', $equipement);

        return response()->json($equipement);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $equipementId)
    {
        $equipement = Equipement::findOrFail($equipementId);
        $this->authorize('update', $equipement);

        // SIMPLIFICATION: Using 'sometimes' is cleaner for partial updates.
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('equipements')->ignore($equipementId)],
            'description' => 'sometimes|nullable|string',
            'quantity_available' => 'sometimes|required|integer|min:0',
        ]);

        $equipement->update($validated);

        return response()->json([
            'message' => 'Équipement mis à jour avec succès.',
            'equipement' => $equipement->load('createdBy:id,first_name,last_name')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($equipementId)
    {
        $equipement = Equipement::findOrFail($equipementId);
        $this->authorize('delete', $equipement);

        $equipement->delete();

        return response()->json(['message' => 'Équipement supprimé avec succès.']);
    }


    public function indexEquipements()
    {
        // $this->authorize('viewAny', Salle::class);
        $salles = DB::table('equipements')->get();
        return response()->json($salles);
    }
}
