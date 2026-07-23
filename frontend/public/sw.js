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
    let notificationData = {};

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData = {
                title: 'Snitch',
                body: event.data.text(),
            };
        }
    }

    const {
        title,
        body,
        icon,
        badge,
        tag,
        data,
        actions,
        requireInteraction,
    } = notificationData;

    const options = {
        body: body || 'You have a new notification',
        icon: icon || '/avatar-placeholder.png',
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

    const { action, notification } = event;
    const { data } = notification;

    if (action === 'close') return;

    // Build the target URL
    let targetUrl = '/';

    if (data?.type === 'message' && data?.conversationId) {
        targetUrl = `/chat?conversationId=${data.conversationId}`;
    } else if (data?.url) {
        targetUrl = data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Try to focus an existing chat window
            for (let client of clientList) {
                if (client.url.includes('/chat')) {
                    return client.focus();
                }
            }
            // Open new window if none exists
            return clients.openWindow(targetUrl);
        })
    );
});

self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
});
