<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle common registration logic
     */
    private function createUser(
        Request $request,
        array $validationRules,
        string $role,
        bool $issueToken = true,
        bool $requiresApproval = false
    ): JsonResponse {
        $validated = $request->validate($validationRules);

        $user = DB::transaction(function () use ($validated, $role, $requiresApproval) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'institution' => $validated['institution'] ?? null,
                'department' => $validated['department'] ?? null,
                'staff_id' => $validated['staff_id'] ?? null,
                'professional_phone' => $validated['professional_phone'] ?? null,
                'approval_status' => $requiresApproval
                    ? User::APPROVAL_PENDING
                    : User::APPROVAL_APPROVED,
                'requested_role' => $requiresApproval ? $role : null,
                'reviewed_at' => $requiresApproval ? null : now(),
            ]);

            if (! $requiresApproval) {
                $user->assignRole($role);
            }

            return $user;
        });

        event(new Registered($user));

        $response = [
            'message' => $requiresApproval
                ? 'Votre demande de compte a été enregistrée. Un administrateur doit l\'approuver avant votre première connexion.'
                : "$role enregistré avec succès",
            'user' => $user->load('roles'),
            'approval_required' => $requiresApproval,
            'approval_status' => $user->approval_status,
            'requested_role' => $user->requested_role,
        ];

        if ($issueToken && $user->isApproved()) {
            $response['token'] = $user->createToken('registration-token')->plainTextToken;
        }

        return response()->json($response, 201);
    }

    /**
     * Student Registration
     */
    public function registerStudent(Request $request): JsonResponse
    {
        return $this->createUser(
            $request,
            [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ],
            'eleve'
        );
    }

    /**
     * Teacher Registration
     */
    public function registerTeacher(Request $request): JsonResponse
    {
        return $this->createUser(
            $request,
            [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'institution' => ['required', 'string', 'max:255'],
                'department' => ['required', 'string', 'max:255'],
                'staff_id' => ['required', 'string', 'max:100'],
                'professional_phone' => ['nullable', 'string', 'max:30'],
            ],
            'enseignant',
            false,
            true
        );
    }

    /**
     * Manager Registration
     */
    public function registerManager(Request $request): JsonResponse
    {
        return $this->createUser(
            $request,
            [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'institution' => ['required', 'string', 'max:255'],
                'department' => ['required', 'string', 'max:255'],
                'staff_id' => ['required', 'string', 'max:100'],
                'professional_phone' => ['nullable', 'string', 'max:30'],
            ],
            'responsable_laboratoire',
            false,
            true
        );
    }

    /**
     * Admin Registration
     */
    public function registerAdmin(Request $request): JsonResponse
    {
        return $this->createUser(
            $request,
            [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'institution' => ['nullable', 'string', 'max:255'],
                'department' => ['nullable', 'string', 'max:255'],
                'staff_id' => ['nullable', 'string', 'max:100'],
                'professional_phone' => ['nullable', 'string', 'max:30'],
            ],
            'admin',
            false
        );
    }
}
