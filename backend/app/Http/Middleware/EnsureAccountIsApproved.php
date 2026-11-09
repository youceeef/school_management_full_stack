<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsApproved
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isApproved()) {
            $user->currentAccessToken()?->delete();

            $code = match ($user->approval_status) {
                User::APPROVAL_SUSPENDED => 'ACCOUNT_SUSPENDED',
                User::APPROVAL_REJECTED => 'ACCOUNT_REJECTED',
                default => 'ACCOUNT_PENDING',
            };

            $message = match ($user->approval_status) {
                User::APPROVAL_SUSPENDED => 'Votre compte a été suspendu par l’administration.',
                User::APPROVAL_REJECTED => 'Votre demande de compte a été refusée.',
                default => 'Votre compte est en attente d’approbation par un administrateur.',
            };

            return response()->json([
                'message' => $message,
                'code' => $code,
                'approval_status' => $user->approval_status,
                'rejection_reason' => $user->rejection_reason,
            ], 403);
        }

        return $next($request);
    }
}
