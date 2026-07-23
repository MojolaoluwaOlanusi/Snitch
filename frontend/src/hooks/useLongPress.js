import { useCallback, useRef } from 'react';

export function useLongPress(onLongPress, onClick, { shouldPreventDefault = true, delay = 500 } = {}) {
    const timeoutRef = useRef(null);
    const isLongPressRef = useRef(false);

    const start = useCallback((e) => {
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

    return {
        onMouseDown: (e) => {
            if (shouldPreventDefault) e.preventDefault();
            start(e);
        },
        onMouseUp: clear,
        onMouseLeave: clear,
        onTouchStart: (e) => {
            start(e);
        },
        onTouchEnd: clear,
    };
}
