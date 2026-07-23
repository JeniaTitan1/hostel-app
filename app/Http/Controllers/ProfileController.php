<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\AuditLog;
use App\Models\EmailChangeRequest;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'pendingEmailRequest' => $request->user()->pendingEmailChangeRequest,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $newEmail = $validated['email'] ?? null;
        $emailChanged = $newEmail && $user->email !== $newEmail;

        // Заповнюємо всі дані профілю, окрім емейлу (емейл обробляється окремо)
        unset($validated['email']);
        $user->fill($validated);

        if ($emailChanged) {
            if ($user->role !== 'user' || $user->email_changes_count == 0) {
                // Пряма безперешкодна зміна електронної пошти (перший раз для студента або завжди для адміна/коменданта)
                $user->email = $newEmail;
                $user->email_verified_at = null;
                $user->email_changes_count += 1;

                AuditLog::log($user->id, 'profile_email_update', "Користувач {$user->name} оновив електронну пошту на {$newEmail}");

                session()->flash('status', 'email-updated');
            } else {
                // Повторна зміна емейлу -> надсилання запиту в адмінку
                $existingPending = EmailChangeRequest::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->first();

                if ($existingPending) {
                    return back()->withErrors(['email' => 'У вас вже є активний запит на зміну електронної пошти. Очікуйте рішення адміністратора.']);
                }

                EmailChangeRequest::create([
                    'user_id' => $user->id,
                    'old_email' => $user->email,
                    'new_email' => $newEmail,
                    'status' => 'pending',
                ]);

                AuditLog::log($user->id, 'email_change_request_submitted', "Користувач {$user->name} надіслав запит на зміну пошти з {$user->email} на {$newEmail}");

                session()->flash('status', 'email-change-requested');
            }
        }

        $user->save();

        // Якщо користувач підлягає обов'язковій перевірці на зміну пароля та профілю
        if ($user->must_change_password && $user->isProfileSetupComplete()) {
            $user->must_change_password = false;
            $user->save();
        }

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Dismiss the reallocation notification.
     */
    public function dismissReallocation(Request $request): RedirectResponse
    {
        $request->user()->update([
            'reallocated_notification' => false,
            'reallocated_from' => null,
            'reallocated_to' => null,
            'reallocated_reason' => null,
        ]);

        return redirect()->back();
    }
}
