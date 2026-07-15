import { useState, useEffect } from 'react';

const LIGHT_THEMES = ['winter', 'light', 'cupcake', 'bumblebee', 'emerald', 'corporate',
    'garden', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'lemonade', 'nord', 'acid'];

export function useAppTheme() {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('snitch-theme') || 'winter';
        return LIGHT_THEMES.includes(saved) ? 'light' : 'dark';
    });

    useEffect(() => {
        const handle = () => {
            const saved = localStorage.getItem('snitch-theme') || 'winter';
            setTheme(LIGHT_THEMES.includes(saved) ? 'light' : 'dark');
        };
        window.addEventListener('storage', handle);
        // Observe manual changes within the same tab (e.g. from settings modal)
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

    return theme;
}