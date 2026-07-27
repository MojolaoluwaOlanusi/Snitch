/**
 * Utility function to update the home screen app badge using the Badging API
 * @param {number} count - The number to display on the badge (0 to clear)
 */
export const updateAppBadge = (count) => {
    // Detect iOS (Safari on iOS doesn't support Badging API)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
        // iOS doesn't support Badging API - store in localStorage for fallback
        try {
            localStorage.setItem('snitch-badge-count', count.toString());
            console.log('[Badge] iOS detected, badge count stored in localStorage:', count);
        } catch (error) {
            console.error('[Badge] Failed to store badge count in localStorage:', error);
        }
        return;
    }

    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
        try {
            if (count > 0) {
                navigator.setAppBadge(count);
                console.log('[Badge] Badge set to:', count);
            } else {
                navigator.clearAppBadge();
                console.log('[Badge] Badge cleared');
            }
        } catch (error) {
            console.error('[Badge] Failed to update app badge:', error);
        }
    } else {
        console.warn('[Badge] Badging API not supported in this browser');
    }
};

/**
 * Get the stored badge count (for iOS fallback)
 * @returns {number} The stored badge count
 */
export const getStoredBadgeCount = () => {
    try {
        const count = localStorage.getItem('snitch-badge-count');
        return count ? parseInt(count, 10) : 0;
    } catch (error) {
        console.error('[Badge] Failed to get stored badge count:', error);
        return 0;
    }
};
