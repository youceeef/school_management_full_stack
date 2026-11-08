<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        bool $issueToken = true
    ): JsonResponse {
        $validated = $request->validate($validationRules);

        $user = DB::transaction(function () use ($validated, $role) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $user->assignRole($role);

            return $user;
        });

        event(new Registered($user));

        $response = [
            'message' => "$role enregistré avec succès",
            'user' => $user->load('roles'),
        ];

        if ($issueToken) {
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
            ],
            'enseignant'
        );
    }

    /**
     * Manager Registration
     */
    public function registerManager(Request $request): JsonResponse
    {
        // if (!auth()->user() || !auth()->user()->hasRole('admin')) {
        //     throw new AuthorizationException('You are not authorized to register an admin.');
        // }
        return $this->createUser(
            $request,
            [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ],
            'responsable_laboratoire',
            false
        );
    }

    /**
     * Admin Registration
     */
    public function registerAdmin(Request $request): JsonResponse
    {
        // if (!auth()->user() || !auth()->user()->hasRole('admin')) {
        //     throw new AuthorizationException('You are not authorized to register an admin.');
        // }
        return $this->createUser(
            $request,
            [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ],
            'admin',
            false
        );
    }
}
