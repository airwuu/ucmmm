import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME = 'UCMMM_THEME';
const CUSTOM_COOKIE_NAME = 'UCMMM_CUSTOM_COLORS';
const COOKIE_DAYS = 30;

export const THEMES = [
    { id: 'custom', name: 'Custom', description: 'Your colors' },
    { id: 'og', name: 'OG UCMMM', description: 'Classic v1 vibes' },
    { id: 'catgold', name: 'Dark', description: 'UC Merced gold' },
    { id: 'light', name: 'Light', description: 'Classic light' },
    { id: 'midnight', name: 'Midnight', description: 'Deep blue' },
    { id: 'sunset', name: 'Sunset', description: 'Warm orange' },
    { id: 'forest', name: 'Forest', description: 'Nature greens' },
    { id: 'lavender', name: 'Lavender', description: 'Soft purple' },
    { id: 'ocean', name: 'Ocean', description: 'Cool cyan' },
];

// Default custom colors
const DEFAULT_CUSTOM = {
    background: '#1a1a2e',
    foreground: '#16213e',
    text: '#eaeaea',
    accent: '#e94560',
};

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
    if (typeof window === 'undefined') return 'og';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'og';
}

function applyCustomColors(colors) {
    const root = document.documentElement;
    root.style.setProperty('--color-bg', colors.background);
    root.style.setProperty('--color-bg-elevated', colors.foreground);
    root.style.setProperty('--color-bg-card', colors.foreground);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-primary', colors.accent);
}

function clearCustomColors() {
    const root = document.documentElement;
    root.style.removeProperty('--color-bg');
    root.style.removeProperty('--color-bg-elevated');
    root.style.removeProperty('--color-bg-card');
    root.style.removeProperty('--color-text');
    root.style.removeProperty('--color-primary');
}

export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        const saved = getCookie(COOKIE_NAME);
        if (saved && THEMES.some(t => t.id === saved)) return saved;
        return getSystemTheme();
    });

    const [customColors, setCustomColorsState] = useState(() => {
        try {
            const saved = getCookie(CUSTOM_COOKIE_NAME);
            if (saved) return JSON.parse(decodeURIComponent(saved));
        } catch { }
        return DEFAULT_CUSTOM;
    });

    const setTheme = useCallback((newTheme) => {
        if (!THEMES.some(t => t.id === newTheme)) return;
        setThemeState(newTheme);
        setCookie(COOKIE_NAME, newTheme, COOKIE_DAYS);
        document.documentElement.setAttribute('data-theme', newTheme);

        // Apply or clear custom colors
        if (newTheme === 'custom') {
            applyCustomColors(customColors);
        } else {
            clearCustomColors();
        }
    }, [customColors]);

    const setCustomColors = useCallback((colors) => {
        const merged = { ...customColors, ...colors };
        setCustomColorsState(merged);
        setCookie(CUSTOM_COOKIE_NAME, encodeURIComponent(JSON.stringify(merged)), COOKIE_DAYS);

        // Apply immediately if custom theme is active
        if (theme === 'custom') {
            applyCustomColors(merged);
        }
    }, [customColors, theme]);

    // Apply theme whenever it changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'custom') {
            applyCustomColors(customColors);
        } else {
            clearCustomColors();
        }
    }, [theme, customColors]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e) => {
            // Only auto-switch if no saved preference
            if (!getCookie(COOKIE_NAME)) {
                const newTheme = e.matches ? 'light' : 'og';
                setThemeState(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return {
        theme,
        setTheme,
        themes: THEMES,
        customColors,
        setCustomColors,
    };
}
