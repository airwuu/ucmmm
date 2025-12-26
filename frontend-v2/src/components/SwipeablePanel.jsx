import { useEffect } from 'react';
import { useSwipe, usePanelNavigation } from '../hooks/useSwipe';
import { isLocationOpen } from '../utils/api';
import './SwipeablePanel.css';

const PANELS = [
    { id: 'pav', label: 'Pavilion' },
    { id: 'dc', label: 'DC' },
    { id: 'trucks', label: 'Trucks' },
];

// Determine initial panel based on what's open
function getInitialPanel() {
    const pavOpen = isLocationOpen('pav');
    const dcOpen = isLocationOpen('dc');

    // If Pavilion is closed but DC is open, start on DC
    if (!pavOpen && dcOpen) return 1;
    // Otherwise start on Pavilion (default)
    return 0;
}

/**
 * Swipeable panel container with dot indicators
 */
export default function SwipeablePanel({ children }) {
    const { activePanel, goToPanel, goNext, goPrev } = usePanelNavigation(PANELS.length, getInitialPanel());

    const { onTouchStart, onTouchMove, onTouchEnd, swiping, swipeOffset } = useSwipe({
        onSwipeLeft: goNext,
        onSwipeRight: goPrev,
        threshold: 60,
    });

    // Calculate transform with swipe feedback
    const baseTransform = activePanel * -100;
    const dragOffset = swiping ? (swipeOffset / window.innerWidth) * 30 : 0; // Damped feedback

    return (
        <div className="swipeable-panel">
            {/* Tab navigation */}
            <div className="panel-tabs">
                {PANELS.map((panel, index) => (
                    <button
                        key={panel.id}
                        className={`panel-tab ${activePanel === index ? 'panel-tab--active' : ''}`}
                        onClick={() => goToPanel(index)}
                    >
                        {panel.label}
                    </button>
                ))}
            </div>

            {/* Swipeable content area */}
            <div
                className="panel-viewport"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div
                    className="panel-track"
                    style={{
                        transform: `translateX(calc(${baseTransform}% + ${dragOffset}px))`,
                        transition: swiping ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {children}
                </div>
            </div>

            {/* Dot indicators */}
            <div className="panel-dots">
                {PANELS.map((panel, index) => (
                    <button
                        key={panel.id}
                        className={`panel-dot ${activePanel === index ? 'panel-dot--active' : ''}`}
                        onClick={() => goToPanel(index)}
                        aria-label={`Go to ${panel.label}`}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Individual panel wrapper
 */
export function Panel({ children, className = '' }) {
    return (
        <div className={`panel ${className}`}>
            {children}
        </div>
    );
}
