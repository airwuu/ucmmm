import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME = 'UCMMM_THEME';
const CUSTOM_COOKIE_NAME = 'UCMMM_CUSTOM_COLORS';
const COOKIE_DAYS = 30;

export const THEMES = [
    { id: 'custom', name: 'Custom', description: 'Your colors' },
    { id: 'og', name: 'original', description: 'classic theme from v1' },
    { id: 'catgold', name: 'dark', description: 'UC Merced gold' },
    { id: 'light', name: 'light', description: 'Classic light' },
    { id: 'midnight', name: 'midnight', description: 'Deep blue' },
    { id: 'sunset', name: 'sunset', description: 'Warm orange' },
    { id: 'forest', name: 'forest', description: 'Nature greens' },
    { id: 'lavender', name: 'lavender', description: 'Soft purple' },
    { id: 'ocean', name: 'ocean', description: 'Cool cyan' },
];

// Default custom colors
const DEFAULT_CUSTOM = {
    background: '#1a1a2e',
    elevated: '#1f1f3a',
    card: '#252545',
    text: '#eaeaea',
    accent: '#e94560',
    secondary: '#0f3460',
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

// Helper to lighten/darken a hex color
function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Helper to create rgba from hex
function hexToRgba(hex, alpha) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Migrate old custom colors format to new format
function migrateCustomColors(colors) {
    const migrated = { ...DEFAULT_CUSTOM, ...colors };

    // Migrate old 'foreground' to new 'elevated' and 'card' if needed
    if (colors.foreground && !colors.elevated) {
        migrated.elevated = colors.foreground;
    }
    if (colors.foreground && !colors.card) {
        migrated.card = colors.foreground;
    }

    return migrated;
}

function applyCustomColors(rawColors) {
    const colors = migrateCustomColors(rawColors);
    const root = document.documentElement;

    // Core colors
    root.style.setProperty('--color-bg', colors.background);
    root.style.setProperty('--color-bg-elevated', colors.elevated);
    root.style.setProperty('--color-bg-card', colors.card);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-primary', colors.accent);
    root.style.setProperty('--color-secondary', colors.secondary);

    // Auto-calculated derived colors
    root.style.setProperty('--color-bg-card-hover', adjustColor(colors.card, 15));
    root.style.setProperty('--color-primary-hover', adjustColor(colors.accent, -20));
    root.style.setProperty('--color-primary-light', hexToRgba(colors.accent, 0.15));
    root.style.setProperty('--color-accent', adjustColor(colors.accent, 30));
    root.style.setProperty('--color-shadow-glow', `0 0 20px ${hexToRgba(colors.accent, 0.3)}`);
}

function clearCustomColors() {
    const root = document.documentElement;
    const props = [
        '--color-bg', '--color-bg-elevated', '--color-bg-card', '--color-bg-card-hover',
        '--color-text', '--color-primary', '--color-primary-hover', '--color-primary-light',
        '--color-secondary', '--color-accent', '--color-shadow-glow'
    ];
    props.forEach(prop => root.style.removeProperty(prop));
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
            if (saved) {
                const parsed = JSON.parse(decodeURIComponent(saved));
                return migrateCustomColors(parsed);
            }
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
