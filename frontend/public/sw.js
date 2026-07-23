// frontend/public/sw.js

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let notificationData = event.data ? event.data.json() : {};

    const {
        title,
        body,
        icon,
        image,           // ← NEW: receive the full image URL
        badge,
        tag,
        data,
        actions,
        requireInteraction,
    } = notificationData;

    console.log('📦 Push data:', notificationData); // ← temporarily

    const options = {
        body: body || 'You have a new notification',
        icon: icon || '/avatar-placeholder.png',
        image: image || icon || '/avatar-placeholder.png', // ✅ iOS uses this
        badge: badge || '/badge-icon.png',
        tag: tag || 'default',
        requireInteraction: requireInteraction !== undefined ? requireInteraction : true,
        data: data || {},
        actions: actions || [
            { action: 'open', title: 'Open Chat' },
            { action: 'close', title: 'Close' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title || 'Snitch', options)
    );
});

// 🔥 CRITICAL: Handle notification click for navigation
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const { data } = event.notification;

    if (data?.type === 'message' && data?.conversationId) {
        const url = `/chat?conversationId=${data.conversationId}`;
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Try to focus an existing chat tab
                for (let client of clientList) {
                    if (client.url.includes('/chat')) {
                        return client.focus();
                    }
                }
                // Otherwise open a new one
                return clients.openWindow(url);
            })
        );
    }
});

self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
});
