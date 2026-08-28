export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const script = `
    importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

    firebase.initializeApp(${JSON.stringify(firebaseConfig)});

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || "CareBridge";
      const options = {
        body: payload.notification?.body || "",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: payload.data || {},
      };

      self.registration.showNotification(title, options);
    });

    self.addEventListener("notificationclick", (event) => {
      event.notification.close();

      const targetUrl = event.notification?.data?.clickAction || "/";

      event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client && client.url.includes(targetUrl)) {
              return client.focus();
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
      );
    });
  `;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  });
}
