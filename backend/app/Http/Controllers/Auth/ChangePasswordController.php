<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class ChangePasswordController extends Controller
{
    /**
     * Handle an incoming password change request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        // A password change invalidates every existing session, including the
        // current token. The frontend then returns the user to the login page.
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
