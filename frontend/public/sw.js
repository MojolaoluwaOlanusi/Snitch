// Service Worker for handling push notifications

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

    const { title, body, icon, badge, tag, data, actions, requireInteraction } = notificationData;

    const options = {
        body: body || 'You have a new notification',
        icon: icon || '/snitch-icon.png',
        badge: badge || '/badge-icon.png',
        tag: tag || 'default', // Replace previous notification with same tag
        requireInteraction: requireInteraction !== undefined ? requireInteraction : true,
        data: data || {}, // Store data for click handler
        actions: actions || [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title || 'Snitch', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const { action, notification } = event;
    const { data } = notification;

    if (action === 'close') return;

    // Get the target URL based on notification type
    let targetUrl = '/';

    if (data.type === 'message' && data.conversationId) {
        targetUrl = `/chat?conversationId=${data.conversationId}`;
    } else if (data.type === 'mention' && data.conversationId) {
        targetUrl = `/chat?conversationId=${data.conversationId}&messageId=${data.messageId}`;
    } else if (data.url) {
        targetUrl = new URL(data.url, self.location.origin).pathname;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Check if window is already open
            for (let client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if not found
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
});

// Add support for background message handling (optional PWA feature)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync (advanced feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(
            // Fetch pending messages from server
            fetch('/api/chat/pending-messages', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access-token')}`
                }
            }).then(response => response.json())
        );
    }
});
