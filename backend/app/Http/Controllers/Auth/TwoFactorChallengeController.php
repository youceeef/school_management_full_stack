<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactorAuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class TwoFactorChallengeController extends Controller
{
    /**
     * Complete authentication using a 2FA TOTP code or recovery code.
     */
    public function store(Request $request, TwoFactorAuthenticationService $service): JsonResponse
    {
        $validated = $request->validate([
            'challenge_token' => ['required', 'string', 'max:2048'],
            'code' => ['nullable', 'string', 'max:6'],
            'recovery_code' => ['nullable', 'string', 'max:64'],
        ]);

        if (empty($validated['code']) && empty($validated['recovery_code'])) {
            return response()->json([
                'message' => 'Veuillez saisir votre code d’authentification ou un code de récupération.',
                'errors' => [
                    'code' => ['Veuillez saisir un code.'],
                ],
            ], 422);
        }

        try {
            $payload = decrypt($validated['challenge_token']);
        } catch (Throwable) {
            return response()->json([
                'message' => 'Le jeton de vérification est invalide ou a expiré. Veuillez vous reconnecter.',
            ], 422);
        }

        if (! is_array($payload) || ! isset($payload['user_id'], $payload['expires_at'], $payload['nonce'], $payload['password_hash'])) {
            return response()->json([
                'message' => 'Le jeton de vérification est invalide. Veuillez vous reconnecter.',
            ], 422);
        }

        if ($payload['expires_at'] <= now()->timestamp) {
            return response()->json([
                'message' => 'Le délai de vérification (5 minutes) est écoulé. Veuillez vous reconnecter.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $service, $payload, $validated) {
            $user = User::query()->lockForUpdate()->find($payload['user_id']);

            if (! $user || ! $user->hasRole('admin') || ! $user->hasEnabledTwoFactorAuthentication() || ! $user->isApproved()
                || ($user->requiresAccountApproval() && ! $user->hasVerifiedEmail())
                || ! hash_equals((string) $user->two_factor_challenge_hash, hash('sha256', $payload['nonce']))
                || ! hash_equals(hash('sha256', $user->password), $payload['password_hash'])) {
                return response()->json(['message' => 'Session de vérification invalide.'], 422);
            }

            if (! empty($validated['code'])) {
                if (! $service->verify((string) $user->two_factor_secret, (string) $validated['code'])) {
                    return response()->json([
                        'message' => 'Le code d’authentification à deux facteurs est invalide.',
                        'errors' => ['code' => ['Le code saisi est incorrect ou a expiré.']],
                    ], 422);
                }
            } elseif (! $user->consumeRecoveryCode((string) $validated['recovery_code'])) {
                return response()->json([
                    'message' => 'Le code de récupération est invalide ou a déjà été utilisé.',
                    'errors' => ['recovery_code' => ['Code de récupération invalide.']],
                ], 422);
            }

            $user->forceFill(['two_factor_challenge_hash' => null])->save();
            $user->tokens()->delete();
            $tokenName = 'two-factor-verified:'.Str::limit((string) $request->userAgent(), 210, '');
            $token = $user->createToken($tokenName)->plainTextToken;

            $user->load('roles.permissions');
            $role = $user->getRoleNames()->first();

            return response()->json([
                'message' => 'Connexion réussie',
                'token' => $token,
                'user' => $user,
                'role' => $role,
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ]);
        });
    }
}
