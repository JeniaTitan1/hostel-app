<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob: data:; style-src 'self' 'unsafe-inline' https: http:; font-src 'self' https: http: data:; img-src 'self' data: https: http: blob:; connect-src 'self' https: http: ws: wss:;">

        <title inertia>{{ config('app.name', 'МНАУ Гуртожитки') }}</title>
        <meta name="description" content="Система онлайн-розселення та бронювання гуртожитків Миколаївського національного аграрного університету (МНАУ).">

        <script>
            if (localStorage.getItem('darkMode') === 'true' || (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        </script>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
        @inertia
    </body>
</html>
