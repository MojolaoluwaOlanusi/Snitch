// useAppTheme.ts
import { useState, useEffect } from 'react';

const LIGHT_THEMES = ['winter', 'light', 'cupcake', 'bumblebee', 'emerald', 'corporate',
    'garden', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'lemonade', 'nord', 'acid'];

// Map theme modes to status bar colors
const STATUS_BAR_COLORS = {
    light: '#ffffff',   // White for light mode
    dark: '#1a1a2e',    // Dark for dark mode
    // Or use your app's actual background colors:
    // light: '#f8f9fa',
    // dark: '#0f0f1a',
};

export function useAppTheme() {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('snitch-theme') || 'winter';
        return LIGHT_THEMES.includes(saved) ? 'light' : 'dark';
    });

    // 🔥 NEW: Get the status bar color based on current theme
    const statusBarColor = STATUS_BAR_COLORS[theme];

    // 🔥 NEW: Update the status bar meta tag when theme changes
    useEffect(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = statusBarColor;
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'theme-color';
            newMeta.content = statusBarColor;
            document.head.appendChild(newMeta);
        }
    }, [theme, statusBarColor]);

    useEffect(() => {
        const handle = () => {
            const saved = localStorage.getItem('snitch-theme') || 'winter';
            setTheme(LIGHT_THEMES.includes(saved) ? 'light' : 'dark');
        };
        window.addEventListener('storage', handle);
        const observer = new MutationObserver(() => {
            const current = document.documentElement.getAttribute('data-theme') || 'winter';
            setTheme(LIGHT_THEMES.includes(current) ? 'light' : 'dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            window.removeEventListener('storage', handle);
            observer.disconnect();
        };
    }, []);

    return {
        theme,           // 'light' | 'dark'
        statusBarColor,  // hex color string
        isDark: theme === 'dark',
        isLight: theme === 'light',
    };
}
