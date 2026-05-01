// ==========================================
// SANTUÁRIO - SERVICE WORKER CONSERVADOR
// Sprint 3: Blindagem PWA + iPhone
// ==========================================

const CACHE_NAME = 'santuario-shell-v4';
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/style.css',
    '/core.js',
    '/app.js',
    '/script.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
];

// ------------------------------------------
// INSTALL
// ------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// ------------------------------------------
// ACTIVATE
// ------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// ------------------------------------------
// MESSAGE
// ------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ------------------------------------------
// FETCH
// Estratégia conservadora:
// - navegação: network first com fallback do shell
// - css/js/imagens leves: stale-while-revalidate simplificado
// - não cachear mp3/mp4
// - não interceptar firebase/googleapis
// ------------------------------------------
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Nunca intercepta Firebase / Google APIs
    if (
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com')
    ) {
        return;
    }

    // Nunca cacheia mídia pesada
    if (url.pathname.match(/\.(mp3|mp4|webm|mov|m4a)$/i)) {
        return;
    }

    // Navegação / HTML
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => response)
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // CSS / JS / imagens / fontes leves
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|gif|woff|woff2)$/i)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                const networkFetch = fetch(event.request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || networkFetch;
            })
        );
        return;
    }
});