import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        // Разрешаем CORS, чтобы скрипты Vite не блокировались браузером
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
});
