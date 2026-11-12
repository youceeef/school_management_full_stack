<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendStaffVerificationEmail;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        // Lock the account while checking and updating it so two concurrent
        // uses of the same link cannot emit the Verified event twice.
        $status = DB::transaction(function () use ($id, $hash): string {
            $user = User::query()->whereKey($id)->lockForUpdate()->first();

            if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
                return 'invalid';
            }

            if ($user->hasVerifiedEmail()) {
                return 'already';
            }

            $user->markEmailAsVerified();
            event(new Verified($user));

            return 'success';
        });

        return redirect("{$frontendUrl}/email-verified?status={$status}");
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
                try {
                    // Dispatch for every accepted address and resolve the user only
                    // after the response. This removes the existence timing branch.
                    SendStaffVerificationEmail::dispatchAfterResponse($email);
                } catch (Throwable $exception) {
                    Log::error('Failed scheduling staff verification email', [
                        'email_hash' => hash('sha256', $email),
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
            // This wording and status intentionally stay identical for unknown
            // addresses, successful delivery, and transport failure. That keeps
            // the endpoint non-enumerable without falsely promising delivery.
            'message' => 'Si un compte en attente correspond à cette adresse, la demande a été prise en compte. Vérifiez vos courriers indésirables et réessayez plus tard si aucun email n’arrive.',
        ], 202);
    }
}
