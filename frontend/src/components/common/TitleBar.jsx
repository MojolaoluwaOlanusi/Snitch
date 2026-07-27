import { useState, useEffect } from 'react';

const TitleBar = () => {
    const [isWCO, setIsWCO] = useState(false);

    useEffect(() => {
        // Check if we're in Window Controls Overlay mode
        const checkWCO = () => {
            const isWCOMode = window.matchMedia('(display-mode: window-controls-overlay)').matches;
            setIsWCO(isWCOMode);
        };

        checkWCO();

        // Listen for changes in display mode
        const mediaQuery = window.matchMedia('(display-mode: window-controls-overlay)');
        const handler = (e) => setIsWCO(e.matches);
        mediaQuery.addEventListener('change', handler);

        return () => {
            mediaQuery.removeEventListener('change', handler);
        };
    }, []);

    // Only render on desktop with WCO
    if (!isWCO) return null;

    return (
        <div
            className="titlebar-area h-8 flex items-center px-4 bg-base-100 border-b border-base-300 fixed top-0 left-0 right-0 z-50"
            style={{
                height: 'env(titlebar-area-height, 32px)',
                paddingLeft: 'env(titlebar-area-x, 0)',
                paddingRight: 'env(titlebar-area-x, 0)',
            }}
        >
            <span className="text-sm font-medium text-base-content/60">Snitch</span>
        </div>
    );
};

export default TitleBar;