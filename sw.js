// ==========================================
// MOTOR OFFLINE & NOTIFICAÇÕES (PWA SANTUÁRIO)
// Versão: 3.0.0 (Revisão de Ouro - Network-First)
// ==========================================

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCYTqgvf42EJHgPHEMP0auJIaMGSDjo4lY",
    authDomain: "santuario-jt.firebaseapp.com",
    databaseURL: "https://santuario-jt-default-rtdb.firebaseio.com",
    projectId: "santuario-jt",
    storageBucket: "santuario-jt.firebasestorage.app",
    messagingSenderId: "381433603925",
    appId: "1:381433603925:web:27d899e7fba589f2e231dc"
});

const messaging = firebase.messaging();

// 🚨 MOTOR DE RECEBIMENTO EM SEGUNDO PLANO
messaging.onBackgroundMessage((payload) => {
    console.log('[Santuário SW] Mensagem recebida no éter (background).', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 400],
        data: { url: payload.fcmOptions?.link || '/' } 
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🚨 GATILHO DE CLIQUE NA NOTIFICAÇÃO
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            if (action === 'enviar_pulso') {
                for (let i = 0; i < windowClients.length; i++) {
                    if (windowClients[i].url && 'focus' in windowClients[i]) {
                        windowClients[i].focus();
                        windowClients[i].postMessage({ comando: 'disparar_pulso_remoto' });
                        return;
                    }
                }
                if (clients.openWindow) return clients.openWindow('/?acao=disparar_pulso_remoto');
            } 
            else {
                for (let i = 0; i < windowClients.length; i++) {
                    if (windowClients[i].url && 'focus' in windowClients[i]) {
                        return windowClients[i].focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ==========================================
// ESTRATÉGIA DE CACHE INTELIGENTE
// ==========================================
const CACHE_NAME = 'santuario-cache-v3-ouro'; // Atualizado para forçar o reset global

// Apenas os arquivos vitais para a tela carregar se estiver offline
const ASSETS_TO_CACHE = [
    '/', 
    '/index.html', 
    '/style.css', 
    '/core.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força a instalação imediata e expulsa a versão antiga
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Se o nome do cache não for o "v3-ouro", deleta sem piedade.
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Santuário SW] Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Assume o controle da página imediatamente
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    
    // 1. Ignora requisições do Firebase e APIs externas
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase')) {
        return; 
    }

    // 2. NETWORK-FIRST PARA CÓDIGO FONTE (Garante atualizações instantâneas)
    // Se for HTML, CSS ou JavaScript, tenta baixar do servidor primeiro.
    if (event.request.headers.get('accept').includes('text/html') || 
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css')) {
        
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Deu certo! Atualiza o cache silenciosamente e devolve o arquivo novo
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    return networkResponse;
                })
                .catch(() => {
                    // Sem internet! Tira do cache para o aplicativo não quebrar
                    return caches.match(event.request);
                })
        );
        return; // Encerra aqui para esse tipo de arquivo
    }

    // 3. CACHE-FIRST PARA MÍDIAS (Áudios, Imagens, Fontes)
    // Coisas pesadas que não mudam. Pega do cache primeiro para não gastar dados.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            }).catch(() => {});
        })
    );
});