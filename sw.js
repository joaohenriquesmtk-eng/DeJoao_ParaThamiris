// Extermínio real e absoluto de todo o cache offline do PWA
self.addEventListener('install', (e) => self.skipWaiting());

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => caches.delete(key))
        )).then(() => {
            return self.registration.unregister();
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request));
});