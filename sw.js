// sw.js - Service Worker do Santuário
const CACHE_NAME = 'santuario-v2'; // Mude o número (v1, v2, v3) sempre que quiser forçar atualização

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
  // Exemplo:
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
      .then(() => self.skipWaiting()) // Força o Service Worker a ativar imediatamente
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
    ).then(() => self.clients.claim()) // Toma controle de todas as abas abertas
  );
});

// Estratégia de cache: Stale-while-revalidate (mostra do cache, mas atualiza em segundo plano)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retorna o cache imediatamente
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Atualiza o cache com a nova resposta
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
            return networkResponse;
          })
          .catch(() => cachedResponse); // Se falhar, mantém o cache
        return cachedResponse || fetchPromise;
      })
  );
});