import { useEffect, useCallback } from 'react';
import axiosInstance from '../services/axios';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

export const usePushNotifications = () => {
    const registerServiceWorker = useCallback(async () => {
        try {
            if (!('serviceWorker' in navigator)) {
                console.warn('Service Worker not supported');
                return false;
            }

            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }, []);

    const subscribeToPush = useCallback(async (registration) => {
        try {
            if (!registration || !VAPID_PUBLIC_KEY) {
                console.warn('Missing registration or VAPID key');
                return null;
            }

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Subscribe to push
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            // Send subscription to backend
            const response = await axiosInstance.post('/auth/push-subscription', {
                subscription: subscription.toJSON(),
            });

            console.log('Push subscription saved:', response.data);
            return subscription;
        } catch (error) {
            console.error('Push subscription error:', error);
            return null;
        }
    }, []);

    const unsubscribeFromPush = useCallback(async (registration) => {
        try {
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify backend
                await axiosInstance.delete('/auth/push-subscription', {
                    data: { endpoint: subscription.endpoint },
                });

                console.log('Push subscription removed');
            }
        } catch (error) {
            console.error('Push unsubscription error:', error);
        }
    }, []);

    const setupPushNotifications = useCallback(async () => {
        try {
            const registration = await registerServiceWorker();
            if (!registration) return false;

            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                console.warn('Notification permission denied');
                return false;
            }

            const subscription = await subscribeToPush(registration);
            return subscription !== null;
        } catch (error) {
            console.error('Push notification setup failed:', error);
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
