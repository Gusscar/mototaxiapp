// Firebase Messaging Service Worker
// Este archivo debe estar en /public para que sea accesible en la raíz del sitio

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// La config se pasa via el mensaje de postMessage desde el cliente
self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon } = payload.notification ?? {};
      self.registration.showNotification(title ?? "MotoTaxi", {
        body: body ?? "",
        icon: icon ?? "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        data: payload.data,
        vibrate: [200, 100, 200],
      });
    });
  }
});

// Manejar clic en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
