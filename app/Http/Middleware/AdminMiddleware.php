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
            // Якщо це звичайний користувач (або студент під час входу з адмінки), перенаправляємо на студентський кабінет без помилок
            return redirect()->route('dashboard');
        }

        // 3. Если всё ок (это админ), пропускаем запрос дальше
        return $next($request);
    }
}
