// ==========================================
// MOTOR OFFLINE & NOTIFICAÇÕES (PWA SANTUÁRIO)
// Versão: 2.0.0 (Compatibilidade Ouro iOS/Android)
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

// Inicializa a escuta de background para o iOS e Android
const messaging = firebase.messaging();

// 🚨 O GATILHO DE CLIQUE: O que acontece quando ela clica na notificação com a tela bloqueada
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Se clicou no botão de enviar pulso pela notificação
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
            // Se clicou no balão da notificação ou no botão "Abrir App"
            else {
                for (let i = 0; i < windowClients.length; i++) {
                    if (windowClients[i].url && 'focus' in windowClients[i]) {
                        return windowClients[i].focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow('/');
            }
        })
    );
});

const CACHE_NAME = 'santuario-cache-v2';

// A "Mochila de Sobrevivência"
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
    '/assets/icones-jogos/termo.png',
    '/assets/icones-jogos/tribunal.png',
    '/assets/icones-jogos/sincronia.png',
    '/assets/icones-jogos/minifazenda.png',
    '/assets/icones-jogos/jardim.png',
    '/assets/icones-jogos/julgamento.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Santuário SW] A carregar a mochila de sobrevivência...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); 
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    // Ignora conexões ao vivo do Firebase para as notificações chegarem em tempo real
    if (url.hostname.includes('firestore.googleapis.com') || 
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('firebaseio.com')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {});

            return cachedResponse || fetchPromise;
        })
    );
});