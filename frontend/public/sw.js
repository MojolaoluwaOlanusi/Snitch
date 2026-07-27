// frontend/public/sw.js

const CACHE_NAME = 'snitch-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-96x96.png',
    '/apple-icon-180.png',
    '/manifest-icon-192.maskable.png',
    '/manifest-icon-512.maskable.png',
    '/avatar-placeholder.png',
    '/login.webp',
    '/badge-72.png',
    '/notification.png',
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

    // Skip requests with unsupported schemes (chrome-extension, etc.)
    if (!url.protocol.startsWith('http')) return;

    // Skip non-GET requests (except for specific API endpoints that need offline handling)
    if (request.method !== 'GET') {
        // For POST requests to API, allow them to fail gracefully when offline
        if (url.pathname.startsWith('/api/')) {
            event.respondWith(
                fetch(request).catch(() => {
                    return new Response(
                        JSON.stringify({ offline: true, message: 'You are offline. Request queued.' }),
                        { status: 503, headers: { 'Content-Type': 'application/json' } }
                    );
                })
            );
        }
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

    // API requests - Network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
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
                        if (cachedResponse) {
                            console.log('[SW] Serving cached API response:', url.pathname);
                            return cachedResponse;
                        }
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

    // For static assets – cache-first with stale-while-revalidate
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
                // If both cache and network fail, show offline page for documents
                if (request.destination === 'document') {
                    return caches.match(OFFLINE_URL).then((offlineResponse) => {
                        if (offlineResponse) return offlineResponse;
                        // Create a basic offline page if none exists
                        return new Response(
                            '<html><body><h1>You are offline</h1><p>Please check your connection.</p></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
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
            // Only add reply action for message notifications
            ...(data?.type === 'message' ? [{ action: 'reply', title: 'Reply' }] : []),
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
    console.log('[SW] Background sync triggered – sending pending messages...');

    // Get all clients (tabs) and send them a message to trigger sync
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
        client.postMessage({
            type: 'SYNC_MESSAGES',
            payload: { trigger: 'background_sync' }
        });
    }

}

// ==================== Periodic Background Sync ====================

// Register periodic sync when the app is installed
self.addEventListener('install', (event) => {
    event.waitUntil(
        self.skipWaiting()
    );
});

// Activate and register periodic sync
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            await self.clients.claim();
            // Register periodic sync if supported
            if ('periodicSync' in registration) {
                try {
                    const status = await navigator.permissions.query({
                        name: 'periodic-background-sync',
                    });
                    if (status.state === 'granted') {
                        await registration.periodicSync.register('fetch-updates', {
                            minInterval: 12 * 60 * 60 * 1000,
                        });
                        console.log('[SW] Periodic sync registered');
                    }
                } catch (error) {
                    console.warn('[SW] Periodic sync not supported:', error);
                }
            }
        })()
    );
});

// Handle periodic sync events
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'fetch-updates') {
        event.waitUntil(fetchUpdates());
    }
});

async function fetchUpdates() {
    console.log('[SW] Periodic sync triggered – fetching updates...');

    // Notify all open clients to refresh data
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
        client.postMessage({
            type: 'PERIODIC_SYNC',
            payload: { timestamp: Date.now() }
        });
    }
}