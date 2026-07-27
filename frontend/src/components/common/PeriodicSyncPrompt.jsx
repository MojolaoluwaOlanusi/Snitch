import { useState, useEffect } from 'react';
import { Bell, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

const DISMISSAL_KEY = 'periodic-sync-dismissed';
const DISMISSAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const PeriodicSyncPrompt = () => {
    const [permissionState, setPermissionState] = useState('prompt');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            // Check if feature is supported
            if (!('periodicSync' in navigator) || !('permissions' in navigator)) {
                setPermissionState('unsupported');
                return;
            }

            // Check if previously dismissed and if enough time has passed
            const dismissedData = localStorage.getItem(DISMISSAL_KEY);
            if (dismissedData) {
                const { timestamp } = JSON.parse(dismissedData);
                const timeSinceDismissal = Date.now() - timestamp;
                if (timeSinceDismissal < DISMISSAL_DURATION) {
                    // Not enough time passed, don't show
                    setPermissionState('dismissed');
                    return;
                }
            }

            // Check if app is in standalone mode (already installed)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                window.navigator.standalone === true;

            try {
                const status = await navigator.permissions.query({
                    name: 'periodic-background-sync',
                });
                setPermissionState(status.state);
                
                // Only show if permission is prompt (not granted, not denied)
                if (status.state === 'prompt') {
                    // If app is already installed (standalone), show immediately
                    // Otherwise, delay by 10 seconds (after install prompt)
                    const delay = isStandalone ? 0 : 10000;
                    setTimeout(() => setIsVisible(true), delay);
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.warn('Periodic sync permission check failed:', error);
                setPermissionState('unsupported');
            }
        };

        checkPermission();
    }, []);

    const handleEnable = async () => {
        try {
            // Request permission again
            const status = await navigator.permissions.query({
                name: 'periodic-background-sync',
            });
            if (status.state === 'prompt') {
                // Some browsers show a prompt automatically
                // For others, we can try to register sync which may trigger a prompt
                if ('periodicSync' in navigator.serviceWorker) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.periodicSync.register('fetch-updates', {
                        minInterval: 12 * 60 * 60 * 1000,
                    });
                    toast.success('Periodic sync enabled!');
                    setIsVisible(false);
                }
            } else if (status.state === 'denied') {
                toast.error('Permission denied. Please enable in browser settings.');
            }
        } catch (error) {
            console.error('Failed to enable periodic sync:', error);
            toast.error('Failed to enable. Please enable in browser settings.');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Store dismissal with timestamp in localStorage
        localStorage.setItem(DISMISSAL_KEY, JSON.stringify({
            timestamp: Date.now()
        }));
    };

    if (permissionState === 'unsupported') return null;
    if (permissionState === 'granted') return null;
    if (permissionState === 'dismissed') return null;
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-40 animate-slide-up">
            <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-4">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 hover:bg-base-200 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 text-base-content/50" />
                </button>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base-content text-sm">
                            Stay up to date
                        </h4>
                        <p className="text-xs text-base-content/60 mt-0.5">
                            Allow Snitch to refresh content in the background for the latest posts and messages.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleEnable}
                        className="flex-1 bg-primary text-primary-content rounded-lg py-2 px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Enable
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="flex-1 bg-base-200 text-base-content/70 rounded-lg py-2 px-3 text-sm font-medium hover:bg-base-300 transition-colors"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PeriodicSyncPrompt;