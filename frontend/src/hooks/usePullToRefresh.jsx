import { useState, useRef, useEffect } from 'react';

export const usePullToRefresh = (onRefresh, threshold = 80) => {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef(0);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return;

        const handleTouchStart = (e) => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            // Only activate if at the very top of the page
            if (scrollTop === 0) {
                startYRef.current = e.touches[0].clientY;
                setIsPulling(true);
            } else {
                setIsPulling(false);
            }
        };

        const handleTouchMove = (e) => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            // If we're not at the top, deactivate pull-to-refresh
            if (scrollTop > 0) {
                setIsPulling(false);
                setPullDistance(0);
                return;
            }

            if (!isPulling) return;
            
            const deltaY = e.touches[0].clientY - startYRef.current;
            
            // Only allow pulling down (positive deltaY) and only if still at top
            if (deltaY > 0 && scrollTop === 0) {
                setPullDistance(Math.min(deltaY, 150));
                e.preventDefault();
            } else {
                // If pulling up or scrolled away, reset
                setIsPulling(false);
                setPullDistance(0);
            }
        };

        const handleTouchEnd = () => {
            if (pullDistance > threshold && !isRefreshingRef.current) {
                isRefreshingRef.current = true;
                setIsRefreshing(true);
                setPullDistance(50);
                onRefresh().finally(() => {
                    isRefreshingRef.current = false;
                    setIsRefreshing(false);
                    setPullDistance(0);
                    setIsPulling(false);
                });
            } else {
                setPullDistance(0);
                setIsPulling(false);
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, onRefresh, threshold]);

    return { pullDistance, isPulling, isRefreshing };
};