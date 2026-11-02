/**
 * CampusConnect - Firebase Cloud Messaging (FCM) Service Worker
 * Madhav Institute of Technology & Science (MITS), Gwalior
 * 
 * Handles background push notifications, service worker caching, and deep-link click events.
 */

// Import Firebase scripts inside service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_MITS_Gwalior_CampusConnect_2026",
  authDomain: "campusconnect-mits.firebaseapp.com",
  projectId: "campusconnect-mits",
  storageBucket: "campusconnect-mits.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:mitsgwlcampusconnect2026"
};

try {
  firebase.initializeApp(FIREBASE_CONFIG);
  const messaging = firebase.messaging();

  // Background Push Message Handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const title = payload.notification?.title || payload.data?.title || 'MITS Gwalior Campus Notice';
    const body = payload.notification?.body || payload.data?.message || 'New official circular available.';
    const icon = payload.notification?.icon || payload.data?.icon || '/assets/images/mits-campus.jpg';
    const clickUrl = payload.data?.clickUrl || payload.data?.actionUrl || '/announcements.html';

    const options = {
      body: body,
      icon: icon,
      badge: '/assets/images/mits-campus.jpg',
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || `mits-notif-${Date.now()}`,
      renotify: true,
      data: {
        url: clickUrl,
        dateOfArrival: Date.now()
      },
      actions: [
        { action: 'open', title: 'View Circular' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    return self.registration.showNotification(title, options);
  });
} catch (e) {
  console.warn('[SW] Firebase messaging init in SW note:', e.message);
}

// Service worker notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/announcements.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Cache installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
