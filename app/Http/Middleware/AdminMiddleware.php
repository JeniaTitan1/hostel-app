<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Проверяем, авторизован ли пользователь вообще
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // 2. Проверяем, является ли он администратором или комендантом
        if (!in_array(Auth::user()->role, ['admin', 'commandant'])) {
            // Если зашел обычный юзер, прерываем запрос с ошибкой "Доступ запрещен" (403)
            abort(403, 'Доступ заборонено. Ця зона лише для адміністраторів та комендантів.');
        }

        // 3. Если всё ок (это админ), пропускаем запрос дальше
        return $next($request);
    }
}
