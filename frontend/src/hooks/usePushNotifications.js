import { useEffect, useCallback } from 'react';
import axiosInstance from '../lib/axios';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const usePushNotifications = () => {
    const registerServiceWorker = useCallback(async () => {
        try {
            if (!('serviceWorker' in navigator)) {
                console.warn('[Push] Service Worker not supported');
                return false;
            }

            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            console.log('[Push] Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('[Push] Service Worker registration failed:', error);
            return null;
        }
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('[Push] Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('[Push] Notification permission already granted');
            return true;
        }

        if (Notification.permission !== 'denied') {
            console.log('[Push] Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('[Push] Permission result:', permission);
            return permission === 'granted';
        }

        console.warn('[Push] Notification permission denied');
        return false;
    }, []);

    const subscribeToPush = useCallback(async (registration) => {
        try {
            if (!registration) {
                console.warn('[Push] Missing registration');
                return null;
            }

            if (!VAPID_PUBLIC_KEY) {
                console.error('[Push] VAPID_PUBLIC_KEY is not set. Please check your .env file.');
                return null;
            }

            console.log('[Push] VAPID key found, length:', VAPID_PUBLIC_KEY.length);

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                console.log('[Push] No existing subscription, creating new one...');
                // Subscribe to push
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
                console.log('[Push] New subscription created');
            } else {
                console.log('[Push] Using existing subscription');
            }

            // Send subscription to backend
            const token = localStorage.getItem('access-token');
            if (!token) {
                console.warn('[Push] No access token found, cannot save subscription');
                return subscription;
            }

            console.log('[Push] Sending subscription to backend...');
            const response = await axiosInstance.post('/auth/push-subscription', {
                subscription: subscription.toJSON(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[Push] Push subscription saved:', response.data);
            return subscription;
        } catch (error) {
            console.error('[Push] Push subscription error:', error);
            if (error.response) {
                console.error('[Push] Server response:', error.response.data);
            }
            return null;
        }
    }, []);

    const unsubscribeFromPush = useCallback(async (registration) => {
        try {
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify backend
                const token = localStorage.getItem('access-token');
                if (token) {
                    await axiosInstance.delete('/auth/push-subscription', {
                        data: { endpoint: subscription.endpoint },
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }

                console.log('[Push] Push subscription removed');
            }
        } catch (error) {
            console.error('[Push] Push unsubscription error:', error);
        }
    }, []);

    const setupPushNotifications = useCallback(async () => {
        try {
            console.log('[Push] Setting up push notifications...');
            
            const registration = await registerServiceWorker();
            if (!registration) {
                console.error('[Push] Failed to register service worker');
                return false;
            }

            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                console.warn('[Push] Notification permission denied');
                return false;
            }

            const subscription = await subscribeToPush(registration);
            const success = subscription !== null;
            console.log('[Push] Setup complete, success:', success);
            return success;
        } catch (error) {
            console.error('[Push] Push notification setup failed:', error);
            return false;
        }
    }, [registerServiceWorker, requestNotificationPermission, subscribeToPush]);

    return {
        setupPushNotifications,
        registerServiceWorker,
        requestNotificationPermission,
        subscribeToPush,
        unsubscribeFromPush,
    };
};

// Helper: Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
