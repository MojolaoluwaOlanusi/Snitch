// frontend/public/sw.js

const CACHE_NAME = 'snitch-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/index.css',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-96x96.png',
    '/apple-icon-180.png',
    '/web-app-manifest-192x192.png',
    '/web-app-manifest-512x512.png',
    '/avatar-placeholder.png',
    '/login.webp',
];

// ==================== Install ====================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ==================== Activate ====================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ==================== Fetch ====================
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests (they need fresh data)
    if (url.pathname.startsWith('/api/')) {
        // Network-first for API requests
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses for offline fallback
                    if (response.ok) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached API response if available
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        // Fallback for API
                        return new Response(
                            JSON.stringify({ offline: true, message: 'You are offline. Please check your connection.' }),
                            { status: 503, headers: { 'Content-Type': 'application/json' } }
                        );
                    });
                })
        );
        return;
    }

    // Skip socket.io requests
    if (url.pathname.includes('/socket.io/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Skip analytics/vercel requests
    if (url.pathname.includes('/_vercel/') || url.pathname.includes('/feedback')) {
        event.respondWith(fetch(request));
        return;
    }

    // For static assets – cache-first
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update in background (stale-while-revalidate)
                    event.waitUntil(
                        fetch(request).then((networkResponse) => {
                            if (networkResponse.ok) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(request, networkResponse);
                                });
                            }
                        }).catch(() => {})
                    );
                    return cachedResponse;
                }

                // Not in cache – fetch from network
                return fetch(request).then((response) => {
                    // Cache successful responses for future offline use
                    if (response.ok) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // If both cache and network fail, show offline page
                if (request.destination === 'document') {
                    return caches.match(OFFLINE_URL);
                }
                return new Response('Offline', { status: 503 });
            })
    );
});

// ==================== Push Notifications ====================
self.addEventListener('push', (event) => {
    let notificationData = event.data ? event.data.json() : {};

    const {
        title,
        body,
        icon,
        image,
        badge,
        tag,
        data,
        actions,
        requireInteraction,
    } = notificationData;

    const options = {
        body: body || 'You have a new notification',
        icon: icon || '/avatar.png',
        image: image || icon || '/notification.png',
        badge: badge || '/badge-72.png',
        tag: tag || 'default',
        requireInteraction: requireInteraction !== undefined ? requireInteraction : true,
        data: data || {},
        actions: actions || [
            { action: 'open', title: 'Open Snitch' },
            { action: 'reply', title: 'Reply' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title || 'Snitch', options)
    );
});

// ==================== Notification Click ====================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const { action, notification } = event;
    const { data } = notification;

    if (action === 'close') return;

    if (action === 'reply' && data?.conversationId) {
        const url = `/chat?conversationId=${data.conversationId}&replyTo=${data.messageId || ''}`;
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (let client of clientList) {
                    if (client.url.includes('/chat') && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                return clients.openWindow(url);
            })
        );
        return;
    }

    if (data?.type === 'message' && data?.conversationId) {
        const url = `/chat?conversationId=${data.conversationId}`;
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (let client of clientList) {
                    if (client.url.includes('/chat') && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                return clients.openWindow(url);
            })
        );
    }
});

// ==================== Background Sync ====================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    console.log('[SW] Syncing pending messages...');
    // This will be implemented when we add offline message queuing
}