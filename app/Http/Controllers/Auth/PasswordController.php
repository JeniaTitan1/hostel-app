<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $rules = [
            'password' => ['required', Password::defaults(), 'confirmed'],
        ];

        if (!$user->must_change_password) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        $validated = $request->validate($rules);

        $user = $request->user();
        $user->update([
            'password' => Hash::make($validated['password']),
            'password_changed' => true,
        ]);

        if ($user->must_change_password && $user->isProfileSetupComplete()) {
            $user->must_change_password = false;
            $user->save();
        }

        return back();
    }
}
