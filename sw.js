// sw.js - Service Worker do Santuário (v3)
const CACHE_NAME = 'santuario-v3';

const urlsParaCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
];

// Instalação: faz cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsParaCache))
      .then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Stale-while-revalidate (com tratamento de erro)
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam do próprio site (evita erro de extensões e Firebase)
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Ignora métodos que não sejam GET (como o POST do login)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // Só armazena se for status 200 (OK) e se for do tipo básico (não 206)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});