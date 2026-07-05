/* global self, clients, registration */

self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const options = {
        body: data.body || 'You have a new message',
        icon: '/favicon.svg',    // ← use your SVG logo
        badge: '/favicon.svg',   // ← same icon for badge
        data: { url: data.url || '/' },
    };
    event.waitUntil(self.registration.showNotification(data.title || 'Snitch', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});