<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Throwable;

class StaffEmailVerificationController extends Controller
{
    /**
     * Confirm a staff applicant's email from a signed link.
     *
     * Applicants cannot log in before approval, so this endpoint must resolve
     * the account without an authenticated session; the signature is the proof
     * of ownership.
     */
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        if (! $request->hasValidSignature()) {
            return redirect("{$frontendUrl}/email-verified?status=expired");
        }

        $user = User::find($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return redirect("{$frontendUrl}/email-verified?status=invalid");
        }

        if ($user->hasVerifiedEmail()) {
            return redirect("{$frontendUrl}/email-verified?status=already");
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return redirect("{$frontendUrl}/email-verified?status=success");
    }

    /**
     * Send a fresh verification link.
     *
     * The response never reveals whether the address belongs to a pending
     * account, and a per-address limiter prevents using this endpoint to spam
     * an inbox or to probe account existence at scale.
     */
    public function resend(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        // Registration does not normalise the address, and mobile keyboards
        // auto-capitalise, so the lookup must ignore case.
        $email = Str::lower($validated['email']);

        $allowed = RateLimiter::attempt(
            'staff-verification-resend:'.$email,
            3,
            function () use ($email): void {
                $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

                if (! $user || ! $user->requiresAccountApproval() || $user->hasVerifiedEmail()) {
                    return;
                }

                try {
                    $user->sendEmailVerificationNotification();
                } catch (Throwable $exception) {
                    Log::error('Failed sending staff verification email', [
                        'user_id' => $user->id,
                        'error' => $exception->getMessage(),
                    ]);
                }
            },
            3600,
        );

        if (! $allowed) {
            return response()->json([
                'message' => 'Trop de demandes. Patientez une heure avant de demander un nouvel email.',
            ], 429);
        }

        return response()->json([
            'message' => 'Si un compte en attente correspond à cette adresse, un nouvel email de confirmation vient d’être envoyé.',
        ]);
    }
}
