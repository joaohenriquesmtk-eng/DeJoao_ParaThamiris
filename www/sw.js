// ==========================================
// MOTOR OFFLINE SUPREMO (PWA SANTUÁRIO)
// Versão: 1.0.0
// ==========================================

const CACHE_NAME = 'santuario-cache-v1';

// A "Mochila de Sobrevivência": Tudo o que a app precisa para arrancar sem internet
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/core.js',
    '/ui.js',
    '/graficos3d.js',
    '/app.js',
    '/script.js',
    '/tribunal.js',
    '/julgamento.js',
    '/minifazenda_novo.js',
    '/manifest.json',
    '/assets/icone.png',
    '/assets/ambient.mp3',
    // Ícones dos Jogos
    '/assets/icones-jogos/termo.png',
    '/assets/icones-jogos/tribunal.png',
    '/assets/icones-jogos/sincronia.png',
    '/assets/icones-jogos/minifazenda.png',
    '/assets/icones-jogos/jardim.png',
    '/assets/icones-jogos/julgamento.png'
];

// INSTALAÇÃO: A app baixa tudo para o disco rígido do telemóvel
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força a atualização imediata sem ter de fechar a app
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Santuário SW] A carregar a mochila de sobrevivência...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => console.error('[Santuário SW] Erro ao fazer cache:', err))
    );
});

// ATIVAÇÃO: A app limpa lixo de versões antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Santuário SW] A apagar memórias antigas:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Assume o controlo imediato de todas as abas
});

// O INTERCETOR: O "Polícia de Trânsito" da sua Internet
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // REGRA 1: Ignora tudo o que não for GET (como envio de mensagens ao Firebase)
    if (event.request.method !== 'GET') return;

    // REGRA 2: Ignora o Firebase Database (Para as mensagens chegarem em tempo real)
    if (url.hostname.includes('firestore.googleapis.com') || 
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('firebaseio.com')) {
        return; 
    }

    // REGRA 3: Estratégia "Stale-While-Revalidate" (Mostra o cache RÁPIDO, atualiza no fundo)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Vai à internet procurar uma versão mais nova
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Se encontrou algo novo na internet, guarda no cache silenciosamente
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Se estiver offline e a rede falhar, simplesmente falha silenciosamente
                // porque o `cachedResponse` será devolvido logo abaixo.
            });

            // MAGIA: Devolve o Cache IMEDIATAMENTE. Se não existir no cache, espera a rede.
            return cachedResponse || fetchPromise;
        })
    );
});