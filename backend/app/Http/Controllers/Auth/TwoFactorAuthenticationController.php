<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorAuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class TwoFactorAuthenticationController extends Controller
{
    /**
     * Start enabling two-factor authentication.
     * Generates a new secret and recovery codes without confirming them yet.
     */
    public function enable(Request $request, TwoFactorAuthenticationService $service): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate(['password' => ['required', 'string']]);
        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json(['errors' => ['password' => ['Mot de passe incorrect.']]], 422);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            return response()->json(['message' => 'L’authentification à deux facteurs est déjà activée.'], 409);
        }

        if (! $user->two_factor_secret) {
            $secret = $service->generateSecretKey();
            $recoveryCodes = $service->generateRecoveryCodes();

            $user->forceFill([
                'two_factor_secret' => $secret,
                'two_factor_recovery_codes' => $recoveryCodes,
                'two_factor_confirmed_at' => null,
                'two_factor_challenge_hash' => null,
            ])->save();
        } else {
            $secret = (string) $user->two_factor_secret;
            $recoveryCodes = (array) $user->two_factor_recovery_codes;
        }

        $svg = $service->qrCodeSvg(
            config('app.name', 'EduSpace'),
            $user->email,
            $secret
        );

        return response()->json([
            'message' => 'Scannez le QR code avec votre application d’authentification pour terminer l’activation.',
            'secret' => $secret,
            'svg' => $svg,
            'recovery_codes' => $recoveryCodes,
            'confirmed' => ! is_null($user->two_factor_confirmed_at),
        ]);
    }

    /**
     * Confirm 2FA activation with a valid 6-digit TOTP code.
     */
    public function confirm(Request $request, TwoFactorAuthenticationService $service): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            return response()->json([
                'message' => 'Veuillez d’abord initier l’activation de la validation en deux étapes.',
            ], 422);
        }

        if (! $service->verify((string) $user->two_factor_secret, $validated['code'])) {
            return response()->json([
                'message' => 'Le code d’authentification à deux facteurs est invalide.',
                'errors' => [
                    'code' => ['Le code saisi est incorrect ou a expiré. Assurez-vous que l’heure de votre appareil est exacte.'],
                ],
            ], 422);
        }

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_challenge_hash' => null,
        ])->save();

        $currentToken = $user->currentAccessToken();
        // Sessions issued before enrollment have never completed the second factor.
        if ($currentToken instanceof PersonalAccessToken) {
            $currentToken->forceFill([
                'name' => 'two-factor-verified:'.substr((string) $request->userAgent(), 0, 210),
            ])->save();
            $user->tokens()->whereKeyNot($currentToken->getKey())->delete();
        } else {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Authentification à deux facteurs confirmée et activée avec succès.',
            'confirmed' => true,
        ]);
    }

    /**
     * View active recovery codes. Requires current password confirmation.
     */
    public function recoveryCodes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => [
                    'password' => ['Mot de passe incorrect.'],
                ],
            ], 422);
        }

        if (! $user->hasEnabledTwoFactorAuthentication()) {
            return response()->json([
                'message' => 'L’authentification à deux facteurs n’est pas activée.',
            ], 404);
        }

        return response()->json([
            'recovery_codes' => (array) $user->two_factor_recovery_codes,
        ]);
    }

    /**
     * Regenerate 8 fresh recovery codes. Requires current password confirmation.
     */
    public function regenerateRecoveryCodes(Request $request, TwoFactorAuthenticationService $service): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => [
                    'password' => ['Mot de passe incorrect.'],
                ],
            ], 422);
        }

        if (! $user->hasEnabledTwoFactorAuthentication()) {
            return response()->json([
                'message' => 'L’authentification à deux facteurs n’est pas activée.',
            ], 422);
        }

        $newCodes = $service->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => $newCodes,
        ])->save();

        return response()->json([
            'message' => 'Nouveaux codes de récupération générés avec succès.',
            'recovery_codes' => $newCodes,
        ]);
    }

    /**
     * Disable two-factor authentication. Requires current password confirmation.
     */
    public function disable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => [
                    'password' => ['Mot de passe incorrect.'],
                ],
            ], 422);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_challenge_hash' => null,
        ])->save();

        return response()->json([
            'message' => 'Authentification à deux facteurs désactivée avec succès.',
            'confirmed' => false,
        ]);
    }
}
