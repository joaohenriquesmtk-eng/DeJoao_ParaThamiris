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
const CACHE_NAME = 'santuario-v5';
const urlsParaCache = ['/', '/index.html', '/style.css', '/script.js', '/manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsParaCache)));
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});