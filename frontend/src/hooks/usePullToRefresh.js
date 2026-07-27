import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * usePullToRefresh Hook
 * 
 * A custom hook that implements pull-to-refresh functionality for mobile devices.
 * Triggers a refresh callback when the user pulls down >80px from the top.
 * Shows a visual indicator (spinner) while pulling and refreshing.
 * 
 * @param {Function} onRefresh - Callback function to execute when refresh is triggered
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Pull distance threshold in pixels (default: 80)
 * @param {number} options.maxPull - Maximum pull distance in pixels (default: 120)
 * @param {number} options.enabledWidth - Screen width below which pull-to-refresh is enabled (default: 768)
 * 
 * @returns {Object} - Object containing pullToRefresh props and state
 * @returns {JSX.Element} pullIndicator - The visual indicator component to render
 * @returns {Object} pullToRefreshProps - Props to spread on the scrollable container
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
    const {
        threshold = 80,
        maxPull = 120,
        enabledWidth = 768,
    } = options;

    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);

    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);
    const containerRef = useRef(null);

    // Check if we're on a mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsEnabled(window.innerWidth < enabledWidth);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [enabledWidth]);

    const handleTouchStart = useCallback((e) => {
        if (!isEnabled || isRefreshing) return;

        // Only activate if at the top of the scrollable container
        const container = containerRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        if (scrollTop > 0) return;

        startY.current = e.touches[0].clientY;
        isDragging.current = true;
    }, [isEnabled, isRefreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging.current || !isEnabled || isRefreshing) return;

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        // Only pull down (positive diff)
        if (diff > 0) {
            // Calculate pull distance with resistance
            const pullDistance = Math.min(diff * 0.5, maxPull);
            setPullDistance(pullDistance);

            if (pullDistance > threshold) {
                setIsPulling(true);
            } else {
                setIsPulling(false);
            }

            // Prevent default scrolling when pulling
            if (pullDistance > 0) {
                e.preventDefault();
            }
        }
    }, [isEnabled, isRefreshing, threshold, maxPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging.current) return;

        isDragging.current = false;

        if (pullDistance >= threshold && !isRefreshing) {
            // Trigger refresh
            setIsRefreshing(true);
            setPullDistance(threshold);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Pull to refresh failed:', error);
            } finally {
                // Reset after a short delay
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                    setIsPulling(false);
                }, 500);
            }
        } else {
            // Reset without refreshing
            setPullDistance(0);
            setIsPulling(false);
        }
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    // Reset state on unmount
    useEffect(() => {
        return () => {
            isDragging.current = false;
            setPullDistance(0);
            setIsPulling(false);
            setIsRefreshing(false);
        };
    }, []);

    // Pull indicator component
    const pullIndicator = isEnabled && (isPulling || isRefreshing || pullDistance > 0) ? (
        <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
                height: `${Math.max(pullDistance, threshold)}px`,
                background: 'linear-gradient(to bottom, rgba(37, 99, 235, 0.1), transparent)',
            }}
        >
            <div
                className="flex items-center gap-2 text-primary transition-transform duration-200"
                style={{
                    transform: `rotate(${Math.min(pullDistance / threshold * 360, 360)}deg)`,
                    opacity: Math.min(pullDistance / threshold, 1),
                }}
            >
                <RotateCw 
                    className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                {isRefreshing ? (
                    <span className="text-sm font-medium">Refreshing...</span>
                ) : isPulling ? (
                    <span className="text-sm font-medium">Release to refresh</span>
                ) : (
                    <span className="text-sm font-medium">Pull to refresh</span>
                )}
            </div>
        </div>
    ) : null;

    // Props to spread on the scrollable container
    const pullToRefreshProps = {
        ref: containerRef,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        style: {
            touchAction: 'pan-y', // Allow vertical scrolling
        },
    };

    return {
        pullIndicator,
        pullToRefreshProps,
        isPulling,
        isRefreshing,
    };
};

export default usePullToRefresh;
