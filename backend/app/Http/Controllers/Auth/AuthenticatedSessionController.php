<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        $user->tokens()->delete();
        $tokenName = 'auth-token:'.Str::limit((string) $request->userAgent(), 220, '');
        $token = $user->createToken($tokenName)->plainTextToken;

        // Load the user with roles and get permissions
        $user->load('roles.permissions');
        $role = $user->getRoleNames()->first();
        $permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => $user,
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ], 200);
    }
}
