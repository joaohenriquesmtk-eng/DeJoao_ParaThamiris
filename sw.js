importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Use EXATAMENTE o mesmo bloco que você pegou no Passo 1
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

// Captura a notificação quando o app está fechado
messaging.onBackgroundMessage((payload) => {
    console.log('Notificação recebida em background:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/icons/icon-192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Código de Cache (O que você já tinha)
const CACHE_NAME = 'santuario-v7'; // Versão atualizada para forçar o recarregamento
const urlsParaCache = [
    '/', 
    '/index.html', 
    '/style.css', 
    '/script.js', 
    '/manifest.json',
    '/assets/ambient.mp3',
    '/assets/sons/mf/regar.mp3',
    '/assets/alerta.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsParaCache)));
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

// ==========================================
// INTERCEPTADOR DE NOTIFICAÇÕES RICAS (AÇÕES)
// ==========================================

self.addEventListener('notificationclick', function(event) {
    // Fecha a notificação automaticamente ao clicar
    event.notification.close();

    // SE O USUÁRIO CLICAR NO BOTÃO DE AÇÃO "ENVIAR PULSO"
    if (event.action === 'enviar_pulso') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
                // 1. Se o aplicativo já estiver aberto em alguma aba em segundo plano
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    if (client.url && 'focus' in client) {
                        client.focus();
                        // Manda uma ordem telepática para o script.js disparar o pulso
                        client.postMessage({ comando: 'disparar_pulso_remoto' });
                        return;
                    }
                }
                // 2. Se o aplicativo estiver totalmente fechado
                if (clients.openWindow) {
                    // Abre o app passando uma ordem secreta na URL
                    return clients.openWindow('/?acao=disparar_pulso_remoto');
                }
            })
        );
    } else {
        // Se clicar apenas na notificação normal (não no botão), só abre o app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                if (windowClients.length > 0) {
                    windowClients[0].focus();
                } else {
                    clients.openWindow('/');
                }
            })
        );
    }
});