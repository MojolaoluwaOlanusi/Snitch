import { create } from "zustand";

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("snitch-theme") || "winter",
    setTheme: (theme) => {
        localStorage.setItem("snitch-theme", theme);
        set({ theme });
    },
}));