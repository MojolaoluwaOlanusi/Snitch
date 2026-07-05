import daisyui from 'daisyui';
import daisyUIThemes from "daisyui/src/theming/themes"

module.exports = {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5',
                secondary: '#6366F1',
                background: '#F9FAFB',
                'gold': '#FFD700',
            },
        },
    },
    plugins: [daisyui],

    daisyui: {
        themes: [
            {
                winter: {
                    ...daisyUIThemes["winter"],
                    "primary": "#2563eb",          // blue-600 – contrast ~8.5:1 on white
                    "primary-focus": "#1d4ed8",    // blue-700 for hover
                    "primary-content": "#ffffff",  // white text on primary
                },
            },
            "light",
            "dark",
            "cupcake",
            "bumblebee",
            "emerald",
            "corporate",
            "synthwave",
            "retro",
            "cyberpunk",
            "valentine",
            "halloween",
            "garden",
            "forest",
            "aqua",
            "lofi",
            "pastel",
            "fantasy",
            "wireframe",
            "black",
            "luxury",
            "dracula",
            "cmyk",
            "autumn",
            "business",
            "acid",
            "lemonade",
            "night",
            "coffee",
            "winter",
            "dim",
            "nord",
            "sunset",
        ],
    },
};