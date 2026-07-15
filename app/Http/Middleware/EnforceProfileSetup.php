<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceProfileSetup
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            if ($user->isProfileSetupComplete()) {
                $user->must_change_password = false;
                $user->save();
                return $next($request);
            }

            $allowedRoutes = [
                'profile.edit',
                'profile.update',
                'password.update',
                'logout',
            ];
            $currentRouteName = $request->route() ? $request->route()->getName() : null;

            if (!in_array($currentRouteName, $allowedRoutes)) {
                return redirect()->route('profile.edit')->with('error', 'Будь ласка, оновіть ваше ім\'я, пароль, email та заповніть контактні дані перед початком роботи!');
            }
        }

        return $next($request);
    }
}
