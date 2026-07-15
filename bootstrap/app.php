<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // 1. Регистрируем твой alias для middleware
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

        // 2. Умное перенаправление (заменяет RouteServiceProvider::HOME)
        $middleware->redirectTo(
            guests: '/login', // Куда отправлять гостей
            users: function (Request $request) {
                // Куда отправлять уже залогиненных пользователей, если они пытаются зайти на /login или /register
                $user = $request->user();

                if ($user && $user->role === 'admin') {
                    return '/admin'; // Если админ — шлем в админку
                }

                return '/dashboard'; // Если обычный — на дашборд
            }
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
