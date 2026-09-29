import { useState, useEffect, useRef, useCallback } from 'react';

export const usePullToRefresh = (containerRef, onRefresh, threshold = 80) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef(0);
    const isPullingRef = useRef(false);
    const isRefreshingRef = useRef(false);
    const initialScrollTopRef = useRef(0);

    const handleTouchStart = useCallback((e) => {
        const container = containerRef?.current;
        if (!container) return;
        
        // Only enable pull-to-refresh if user is at the very top
        if (container.scrollTop === 0) {
            startYRef.current = e.touches[0].clientY;
            initialScrollTopRef.current = container.scrollTop;
            isPullingRef.current = true;
        } else {
            isPullingRef.current = false;
        }
    }, [containerRef]);

    const handleTouchMove = useCallback((e) => {
        const container = containerRef?.current;
        if (!container || !isPullingRef.current) return;

        // If user scrolled away during the gesture, cancel immediately
        if (container.scrollTop > 0) {
            isPullingRef.current = false;
            setPullDistance(0);
            return;
        }

        const deltaY = e.touches[0].clientY - startYRef.current;
        
        // Only trigger pull-to-refresh if the user is clearly pulling down
        // (moving finger downward, delta > 0) and we're still at the top
        if (deltaY > 0 && container.scrollTop === 0) {
            // Resist the pull slightly for a natural feel
            setPullDistance(Math.min(deltaY * 0.4, 120));
            e.preventDefault();
        } else {
            // User is scrolling up or not pulling down, cancel the pull
            isPullingRef.current = false;
            setPullDistance(0);
        }
    }, [containerRef]);

    const handleTouchEnd = useCallback(() => {
        if (!isPullingRef.current) return;
        isPullingRef.current = false;

        if (pullDistance > threshold && !isRefreshingRef.current) {
            isRefreshingRef.current = true;
            setIsRefreshing(true);
            setPullDistance(50); // keep indicator visible during refresh
            onRefresh().finally(() => {
                isRefreshingRef.current = false;
                setIsRefreshing(false);
                setPullDistance(0);
            });
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, threshold, onRefresh]);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { pullDistance, isRefreshing };
};