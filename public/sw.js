const CACHE_NAME = 'mnau-hostel-pwa-v2';
const STATIC_ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
    '/favicon.ico'
];

// 1. Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[PWA SW] Precache warning:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event: Network-First with Offline Fallback
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Ignore WebSocket, Reverb or non-http requests
    if (!request.url.startsWith('http')) return;

    // Static Assets & Build Chunks: Stale-While-Revalidate
    if (
        request.url.includes('/build/') ||
        request.url.includes('/icons/') ||
        request.url.includes('fonts.googleapis.com') ||
        request.url.includes('fonts.gstatic.com')
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // HTML / Inertia Navigation: Network First with Cache Fallback for offline mode
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
                    }
                    return response;
                })
                .catch(async () => {
                    const cachedPage = await caches.match(request);
                    if (cachedPage) return cachedPage;
                    const rootPage = await caches.match('/');
                    if (rootPage) return rootPage;
                    return new Response(
                        '<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#064e3b;color:white;"><h2>МНАУ Гуртожитки (Офлайн)</h2><p>Немає з\'єднання з мережею. Ваша цифрова перепустка доступна у додатку.</p></body></html>',
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    );
                })
        );
        return;
    }

    // Default: Network with Cache fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
