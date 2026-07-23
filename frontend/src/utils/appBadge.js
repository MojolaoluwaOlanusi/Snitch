/**
 * Utility function to update the home screen app badge using the Badging API
 * @param {number} count - The number to display on the badge (0 to clear)
 */
export const updateAppBadge = (count) => {
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
        try {
            if (count > 0) {
                navigator.setAppBadge(count);
            } else {
                navigator.clearAppBadge();
            }
        } catch (error) {
            console.error('Failed to update app badge:', error);
        }
    } else {
        console.warn('Badging API not supported in this browser');
    }
};
