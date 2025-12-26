import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for handling swipe gestures
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swiping, setSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);

    const onTouchStart = useCallback((e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setSwiping(true);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!touchStart) return;
        const currentTouch = e.targetTouches[0].clientX;
        setTouchEnd(currentTouch);
        setSwipeOffset(currentTouch - touchStart);
    }, [touchStart]);

    const onTouchEnd = useCallback(() => {
        setSwiping(false);
        if (!touchStart || !touchEnd) {
            setSwipeOffset(0);
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        } else if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }

        setSwipeOffset(0);
        setTouchStart(null);
        setTouchEnd(null);
    }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight]);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        swiping,
        swipeOffset,
    };
}

/**
 * Hook for managing panel navigation
 */
export function usePanelNavigation(totalPanels = 3, initialPanel = 0) {
    const [activePanel, setActivePanel] = useState(initialPanel);
    const containerRef = useRef(null);

    const goToPanel = useCallback((index) => {
        if (index >= 0 && index < totalPanels) {
            setActivePanel(index);
        }
    }, [totalPanels]);

    const goNext = useCallback(() => {
        if (activePanel < totalPanels - 1) {
            setActivePanel(activePanel + 1);
        }
    }, [activePanel, totalPanels]);

    const goPrev = useCallback(() => {
        if (activePanel > 0) {
            setActivePanel(activePanel - 1);
        }
    }, [activePanel]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev]);

    return {
        activePanel,
        goToPanel,
        goNext,
        goPrev,
        containerRef,
    };
}
