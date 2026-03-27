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

// 🚨 MÁGICA: Controla o que acontece quando a pessoa toca nos botões da notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Fecha o balão da notificação

    const action = event.action;

    // Se clicou no botão "Enviar Pulso"
    if (action === 'enviar_pulso') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                // Se a pessoa já tiver o app aberto em alguma aba
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url && 'focus' in client) {
                        client.focus(); // Traz o app pra frente
                        // Manda uma ordem secreta pro app disparar o pulso na mesma hora!
                        client.postMessage({ comando: 'disparar_pulso_remoto' });
                        return;
                    }
                }
                // Se o app tava fechado, abre ele já engatilhado para mandar o pulso
                if (clients.openWindow) {
                    return clients.openWindow('/?acao=disparar_pulso_remoto');
                }
            })
        );
    } 
    // Se clicou no corpo da notificação ou no botão "Abrir App"
    else {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                if (windowClients.length > 0) {
                    return windowClients[0].focus();
                } else {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// Removemos a função onBackgroundMessage pois ela causa envio duplo quando o app tá fechado!