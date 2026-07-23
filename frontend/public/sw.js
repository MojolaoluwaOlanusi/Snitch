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

    const {
        title,
        body,
        icon,
        badge,
        tag,
        data,
        actions,
        requireInteraction,
        image,
    } = notificationData;

    // 🔥 Use the provided icon or fallback to default
    const notificationIcon = icon || '/avatar-placeholder.png';
    const notificationBadge = badge || '/badge-icon.png';

    const options = {
        body: body || 'You have a new notification',
        icon: notificationIcon,
        badge: notificationBadge,
        tag: tag || 'default',
        requireInteraction: requireInteraction !== undefined ? requireInteraction : true,
        data: data || {},
        actions: actions || [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' },
        ],
        image: image || null, // For rich notifications with images
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

// Add this to sw.js – fallback group avatar generator
function generateGroupAvatar(groupName) {
    if (!groupName) return '/group-placeholder.png';
    
    const firstLetter = groupName.charAt(0).toUpperCase();
    const colors = [
        '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', 
        '#f97316', '#14b8a6', '#6366f1', '#ec4899',
        '#06b6d4', '#84cc16', '#f59e0b', '#ef4444'
    ];
    // Simple hash to pick a consistent color
    const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    
    // For service worker, we return a data URI or use the group placeholder
    // Since we can't generate images in SW, we'll use a placeholder endpoint
    return `/api/group-avatar/${groupName}?color=${color}&letter=${firstLetter}`;
}
