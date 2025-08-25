<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;
use Illuminate\Auth\Access\AuthorizationException;

class RegisteredUserController extends Controller
{
    /**
     * Handle common registration logic
     */
    private function createUser(Request $request, array $validationRules, string $role): JsonResponse
    {
        $validated = $request->validate($validationRules);

        $user = User::create(array_merge([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]));

        $user->assignRole($role);

        event(new Registered($user));

        $token = $user->createToken('api_token')->plainTextToken;

        return response()->json([
            'message' => "$role enregistré avec succès",
            'token' => $token,
            'user' => $user->load('roles')
        ], 201);
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
            'responsable_laboratoire'
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
            'admin'
        );
    }
}
