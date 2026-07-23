import { useRef, useCallback } from 'react';

export const useLongPress = (onLongPress, onClick, { delay = 800, shouldPreventDefault = true, moveThreshold = 10 } = {}) => {
    const timeoutRef = useRef(null);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });

    const start = useCallback((e) => {
        // Save starting position to detect movement
        const touch = e.touches?.[0] || e;
        startPosRef.current = { x: touch.clientX, y: touch.clientY };

        isLongPressRef.current = false;
        timeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            onLongPress(e);
        }, delay);
    }, [onLongPress, delay]);

    const clear = useCallback((e) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (!isLongPressRef.current && onClick) {
            onClick(e);
        }
        isLongPressRef.current = false;
    }, [onClick]);

    const checkMovement = useCallback((e) => {
        const touch = e.touches?.[0] || e;
        if (!touch) return;
        const dx = touch.clientX - startPosRef.current.x;
        const dy = touch.clientY - startPosRef.current.y;
        if (Math.sqrt(dx*dx + dy*dy) > moveThreshold) {
            clear(e);
        }
    }, [clear, moveThreshold]);

    return {
        onMouseDown: (e) => {
            if (shouldPreventDefault) e.preventDefault();
            start(e);
        },
        onMouseUp: clear,
        onMouseLeave: clear,
        onMouseMove: checkMovement,
        onTouchStart: (e) => start(e),
        onTouchMove: (e) => {
            checkMovement(e);
            // Prevent default to avoid scrolling while pressing
            e.preventDefault();
        },
        onTouchEnd: clear,
        onTouchCancel: clear,
    };
};
