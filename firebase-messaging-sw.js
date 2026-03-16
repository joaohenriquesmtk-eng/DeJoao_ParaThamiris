importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Inicialize o Firebase com as mesmas configurações do seu app
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

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'whatsapp') {
        // Abre o WhatsApp com uma mensagem
        const url = 'https://wa.me/5562994838837?text=Oi%20amor%2C%20vi%20que%20você%20não%20está%20bem.%20Quer%20conversar%3F';
        event.waitUntil(clients.openWindow(url));
    }
    notification.close();
});

// Notificação em background (quando o app está fechado)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Notificação recebida em background:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/icons/icon-192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});