import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME = 'UCMMM_THEME';
const COOKIE_DAYS = 30;

export const THEMES = [
    { id: 'catgold', name: 'Catgold', description: 'UC Merced colors' },
    { id: 'midnight', name: 'Midnight', description: 'Deep blue' },
    { id: 'sunset', name: 'Sunset', description: 'Warm orange' },
    { id: 'forest', name: 'Forest', description: 'Nature greens' },
    { id: 'lavender', name: 'Lavender', description: 'Soft purple' },
    { id: 'ocean', name: 'Ocean', description: 'Cool cyan' },
    { id: 'light', name: 'Light', description: 'Classic light' },
];

function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getSystemTheme() {
    if (typeof window === 'undefined') return 'catgold';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'catgold';
}

export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        const saved = getCookie(COOKIE_NAME);
        if (saved && THEMES.some(t => t.id === saved)) return saved;
        return getSystemTheme();
    });

    const setTheme = useCallback((newTheme) => {
        if (!THEMES.some(t => t.id === newTheme)) return;
        setThemeState(newTheme);
        setCookie(COOKIE_NAME, newTheme, COOKIE_DAYS);
        document.documentElement.setAttribute('data-theme', newTheme);
    }, []);

    // Initialize theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e) => {
            // Only auto-switch if no saved preference
            if (!getCookie(COOKIE_NAME)) {
                const newTheme = e.matches ? 'light' : 'catgold';
                setThemeState(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return { theme, setTheme, themes: THEMES };
}
