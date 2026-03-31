// ==========================================
// MOTOR OFFLINE & NOTIFICAÇÕES (PWA SANTUÁRIO)
// Versão: 4.0.0 (Blindagem Ouro - iOS e Android)
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
// ESTRATÉGIA DE CACHE INTELIGENTE UNIFICADA
// ==========================================
const CACHE_NAME = 'santuario-cache-ouro-v5.0'; // Atualizado para forçar o reset da versão bugada

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Santuário SW] Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 🚨 O NOVO CÉREBRO INTERCEPTADOR (Um único 'fetch' perfeito)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    
    // 1. IGNORA FIREBASE (Nunca faz cache do banco de dados ao vivo)
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase')) {
        return; 
    }

    // 2. ESTRATÉGIA CACHE-FIRST (Para Imagens, Áudios e Lotties)
    if (url.pathname.match(/\.(mp3|mp4|png|jpg|jpeg|svg|gif|woff|woff2)$/)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    }
                    return networkResponse;
                }).catch(() => {});
            })
        );
        return;
    }

    // 3. ESTRATÉGIA NETWORK-FIRST (Para HTML, JS e CSS)
    // Garante que o código do jogo esteja sempre na última versão, mas funciona offline se a net cair.
    event.respondWith(
        fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});