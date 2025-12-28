import { useState, useEffect } from 'react';

/**
 * Hook to detect if viewport matches a media query
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event) => setMatches(event.matches);

        // Use addEventListener for modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener(handler);
        }
    }, [query]);

    return matches;
}

/**
 * Hook to detect if the current viewport is desktop-sized
 * @param {number} breakpoint - Minimum width for desktop (default: 1024)
 * @returns {boolean} - Whether the viewport is desktop-sized
 */
export function useIsDesktop(breakpoint = 1024) {
    return useMediaQuery(`(min-width: ${breakpoint}px)`);
}
