// sw.js - Service Worker do Santuário (v3)
const CACHE_NAME = 'santuario-v3';

const urlsParaCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/minifazenda_novo.js',
  '/tribunal.js',
  '/julgamento.js',
  // Adicione aqui outros arquivos importantes (imagens, ícones, sons)
  // '/assets/icone.png',
  // '/assets/ambient.mp3',
  // '/assets/sons/acerto.mp3',
  // '/assets/sons/nivel.mp3',
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
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Se encontrou no cache, já retorna e atualiza em segundo plano
      if (cachedResponse) {
        // Atualiza o cache em segundo plano (sem bloquear)
        fetch(event.request)
          .then(networkResponse => {
            // Só atualiza se a resposta for válida e clonável
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
          })
          .catch(() => { /* falha silenciosa */ });
        return cachedResponse;
      }

      // Se não está no cache, busca da rede
      return fetch(event.request)
        .then(networkResponse => {
          // Só armazena se for uma resposta válida
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Se tudo falhar, retorna uma resposta de fallback (opcional)
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});