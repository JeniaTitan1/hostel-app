<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'МНАУ Гуртожитки') }}</title>
        <meta name="description" content="Система онлайн-розселення та бронювання гуртожитків Миколаївського національного аграрного університету (МНАУ).">

        <script>
            if (localStorage.getItem('darkMode') === 'true' || (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        </script>

        <!-- PWA & Mobile Meta Tags -->
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#047857">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="МНАУ Кампус">
        <link rel="apple-touch-icon" href="/icons/icon-192.svg">
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead

        <!-- Service Worker Registration -->
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then((reg) => console.log('[PWA] ServiceWorker registered with scope:', reg.scope))
                        .catch((err) => console.warn('[PWA] ServiceWorker registration failed:', err));
                });
            }
        </script>
    </head>
    <body class="font-sans antialiased bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
        @inertia
    </body>
</html>
