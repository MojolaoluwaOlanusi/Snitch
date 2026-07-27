import { useEffect, useState } from 'react';
import { SnitchLogoSmall } from '../svgs/snitch.jsx';

/**
 * TitleBar Component for Window Controls Overlay (WCO) Mode
 * 
 * This component only appears when the PWA is running in WCO mode on desktop.
 * It uses CSS environment variables to position itself correctly within the titlebar area.
 * 
 * CSS Environment Variables:
 * - env(titlebar-area-height): Height of the titlebar area
 * - env(titlebar-area-x): Left position of the titlebar area
 * - env(titlebar-area-y): Top position of the titlebar area
 * - env(titlebar-area-width): Width of the titlebar area
 */
const TitleBar = () => {
    const [isWCOMode, setIsWCOMode] = useState(false);

    useEffect(() => {
        // Check if we're in WCO mode by checking for the CSS environment variable
        // The titlebar-area-x variable is only available in WCO mode
        const checkWCOMode = () => {
            const testDiv = document.createElement('div');
            testDiv.style.position = 'absolute';
            testDiv.style.left = 'env(titlebar-area-x)';
            document.body.appendChild(testDiv);
            
            // If the computed style has a valid value, we're in WCO mode
            const computedStyle = window.getComputedStyle(testDiv);
            const isWCO = computedStyle.left !== 'auto' && computedStyle.left !== '';
            
            document.body.removeChild(testDiv);
            setIsWCOMode(isWCO);
        };

        checkWCOMode();
        
        // Re-check on window resize as WCO mode can change
        window.addEventListener('resize', checkWCOMode);
        return () => window.removeEventListener('resize', checkWCOMode);
    }, []);

    // Don't render if not in WCO mode
    if (!isWCOMode) return null;

    return (
        <div
            className="titlebar"
            style={{
                position: 'absolute',
                top: 'env(titlebar-area-y, 0)',
                left: 'env(titlebar-area-x, 0)',
                width: 'env(titlebar-area-width, 100%)',
                height: 'env(titlebar-area-height, 32px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--fallback-bg, #ffffff)',
                color: 'var(--fallback-fg, #1a1a2e)',
                WebkitAppRegion: 'drag', // Allow dragging the window via titlebar
                userSelect: 'none',
                zIndex: 9999,
                padding: '0 16px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                fontWeight: '500',
                letterSpacing: '-0.01em',
            }}
        >
            <div className="flex items-center gap-2">
                <SnitchLogoSmall className="w-5 h-5" />
                <span className="font-semibold">Snitch</span>
            </div>
        </div>
    );
};

export default TitleBar;
