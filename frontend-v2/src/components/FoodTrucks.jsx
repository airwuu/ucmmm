import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchFoodTrucks, getCurrentDay } from '../utils/api';
import { runOcr, fetchWeekImages, submitOcrResults, parseOcrTable } from '../utils/foodtruckOcr';
import './FoodTrucks.css';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_NAMES = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
};

/**
 * Food trucks panel with OCR capability
 */
export default function FoodTrucks() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // OCR state
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrMessage, setOcrMessage] = useState('');
    const [ocrError, setOcrError] = useState(null);
    const [ocrRan, setOcrRan] = useState(false);
    const [weekImages, setWeekImages] = useState([]);

    // OpenCV preloading state
    const [cvReady, setCvReady] = useState(false);
    const cvLoadAttempted = useRef(false);

    // Preload OpenCV.js on component mount (non-blocking)
    useEffect(() => {
        if (cvLoadAttempted.current) return;
        cvLoadAttempted.current = true;

        // Check if already loaded
        if (window.cv && window.cv.imread) {
            setCvReady(true);
            return;
        }

        const existingScript = document.getElementById('opencv-js');
        if (existingScript) {
            const waitReady = () => {
                if (window.cv && window.cv.imread) {
                    setCvReady(true);
                    return;
                }
                setTimeout(waitReady, 100);
            };
            waitReady();
            return;
        }

        const script = document.createElement('script');
        script.id = 'opencv-js';
        script.src = 'https://docs.opencv.org/4.x/opencv.js';
        script.async = true;
        script.onload = () => {
            const waitReady = () => {
                if (window.cv && window.cv.imread) {
                    console.log('[FoodTrucks] OpenCV ready');
                    setCvReady(true);
                    return;
                }
                setTimeout(waitReady, 100);
            };
            waitReady();
        };
        script.onerror = () => console.warn('[FoodTrucks] OpenCV failed to load');
        document.head.appendChild(script);
    }, []);

    // Get today as 3-letter abbreviation, default to 'mon' if weekend
    const getTodayAbbr = () => {
        const fullDay = getCurrentDay();
        const abbr = fullDay.slice(0, 3);
        if (abbr === 'sat' || abbr === 'sun') return 'mon';
        return abbr;
    };

    const [selectedDay, setSelectedDay] = useState(getTodayAbbr);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(null); // null = current/latest week
    const [weekMenuOpen, setWeekMenuOpen] = useState(false);

    // Get currently selected week image
    const selectedWeek = useMemo(() => {
        if (!weekImages.length) return null;
        if (selectedWeekIndex !== null && weekImages[selectedWeekIndex]) {
            return weekImages[selectedWeekIndex];
        }
        // Default to latest week
        return weekImages[weekImages.length - 1];
    }, [weekImages, selectedWeekIndex]);



    // Initial data load
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchFoodTrucks();
                if (cancelled) return;

                console.log('[FoodTrucks] Data result:', result);
                setData(result);

                // Also try to fetch week images for potential OCR
                const weeks = await fetchWeekImages();
                if (cancelled) return;

                console.log('[FoodTrucks] Week images:', weeks);
                setWeekImages(weeks);

                // If no cached data, show message but DON'T auto-run OCR
                // User can click reload button to trigger OCR manually
                if (result.source !== 'cache' || !result.data || result.data.length === 0) {
                    console.log('[FoodTrucks] No cached data - user can click reload to run OCR');
                }
            } catch (err) {
                if (cancelled) return;
                console.error('[FoodTrucks] Load error:', err);
                setError(err.message);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        load();

        return () => { cancelled = true; };
    }, []);

    // Run OCR on a week image
    const runFoodTruckOcr = useCallback(async (weekImage) => {
        if (!weekImage?.url) {
            setOcrError('No image available');
            return;
        }

        setOcrLoading(true);
        setOcrProgress(0);
        setOcrMessage('Starting...');
        setOcrError(null);

        try {
            const result = await runOcr(weekImage.url, (progress, message) => {
                setOcrProgress(progress);
                setOcrMessage(message || '');
            }, cvReady);

            if (result && Array.isArray(result) && result.length > 0) {
                // Parse OCR results into entries
                const entries = parseOcrTable(result, weekImage.start);
                console.log('[FoodTrucks] OCR parsed entries:', entries.length);

                if (entries.length > 0) {
                    // Submit to backend cache
                    setOcrMessage('Saving to cache...');
                    const submitResult = await submitOcrResults(weekImage.start, entries, weekImage.url);
                    console.log('[FoodTrucks] Submit result:', submitResult);

                    // Convert entries to display format
                    const displayData = entries.map(e => ({
                        week_start: weekImage.start,
                        day: e.day,
                        truck_name: e.truck,
                        start_time: e.start,
                        end_time: e.end,
                        location: null,
                        cuisine: null
                    }));

                    setData({ source: 'ocr', data: displayData });
                }
            } else if (result?.rawText) {
                console.log('[FoodTrucks] OCR returned raw text only');
                setOcrError('Could not parse table structure');
            }

            setOcrRan(true);
        } catch (err) {
            console.error('[FoodTrucks] OCR error:', err);
            setOcrError(err.message);
        } finally {
            setOcrLoading(false);
            setOcrProgress(1);
            setOcrMessage('');
        }
    }, [cvReady]);

    // Manual reload handler
    const handleReload = useCallback(() => {
        if (ocrLoading) return; // Already running

        if (weekImages.length > 0) {
            runFoodTruckOcr(weekImages[0]);
        } else if (data?.image_url) {
            // Fallback to image from main response
            runFoodTruckOcr({ url: data.image_url, start: data.week_start });
        } else {
            setOcrError('No schedule image available');
        }
    }, [weekImages, data, ocrLoading, runFoodTruckOcr]);

    // Handler to select a week - fetches from cache first, OCR as fallback
    const handleSelectWeek = useCallback(async (index) => {
        setSelectedWeekIndex(index);
        setWeekMenuOpen(false);

        const week = weekImages[index];
        if (!week) return;

        // First try to fetch from cache
        setLoading(true);
        try {
            const result = await fetchFoodTrucks(week.start);
            console.log('[FoodTrucks] Fetched week:', week.start, result);

            if (result.source === 'cache' && result.data && result.data.length > 0) {
                // Cache hit!
                setData(result);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.warn('[FoodTrucks] Cache fetch failed:', err);
        }
        setLoading(false);

        // No cache, run OCR
        runFoodTruckOcr(week);
    }, [weekImages, runFoodTruckOcr]);

    // Today's day as abbreviation
    const today = (() => {
        const fullDay = getCurrentDay();
        const abbr = fullDay.slice(0, 3);
        if (abbr === 'sat' || abbr === 'sun') return null;
        return abbr;
    })();

    // Filter entries for selected day
    const entries = useMemo(() => {
        if (!data?.data) return [];
        return data.data.filter(e => e.day === selectedDay);
    }, [data, selectedDay]);

    // Group by location/time
    const groupedEntries = useMemo(() => {
        const groups = {};
        entries.forEach(entry => {
            const time = entry.start_time
                ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}`
                : 'Schedule TBD';
            if (!groups[time]) groups[time] = [];
            groups[time].push(entry);
        });
        return groups;
    }, [entries]);

    return (
        <div className="food-trucks">
            <div className="food-trucks__header">
                <h2 className="food-trucks__title">Food Trucks</h2>
                <div className="food-trucks__header-right">
                    {data?.source && (
                        <span className={`food-trucks__source food-trucks__source--${data.source}`}>
                            {data.source === 'cache' ? 'Cached' : data.source === 'ocr' ? 'OCR' : 'Live'}
                        </span>
                    )}
                    <a
                        href="https://dining.ucmerced.edu/retail-services/fork-road"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="food-trucks__link"
                        title="View official food truck info"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Official
                    </a>
                    <button
                        className="reload-btn"
                        onClick={handleReload}
                        disabled={ocrLoading}
                        title="Reload schedule (runs OCR)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={ocrLoading ? 'spinning' : ''}>
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* OCR Progress */}
            {ocrLoading && (
                <div className="ocr-progress">
                    <div className="ocr-progress__bar">
                        <div
                            className="ocr-progress__fill"
                            style={{ width: `${ocrProgress * 100}%` }}
                        />
                    </div>
                    <span className="ocr-progress__text">{ocrMessage}</span>
                </div>
            )}

            {/* OCR Error */}
            {ocrError && !ocrLoading && (
                <div className="ocr-error">
                    <span>OCR: {ocrError}</span>
                </div>
            )}

            {/* Week selector dropdown (shown when multiple weeks available) */}
            {weekImages.length > 0 && (
                <div className="week-selector">
                    <button
                        className="week-selector__toggle"
                        onClick={() => setWeekMenuOpen(!weekMenuOpen)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{selectedWeek?.label || 'Select Week'}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={weekMenuOpen ? 'rotated' : ''}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {weekMenuOpen && (
                        <div className="week-selector__menu">
                            {weekImages.map((week, index) => (
                                <button
                                    key={week.start}
                                    className={`week-selector__item ${selectedWeekIndex === index ? 'week-selector__item--active' : ''}`}
                                    onClick={() => handleSelectWeek(index)}
                                >
                                    {week.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Day selector */}
            <div className="day-selector">
                {DAYS.map(day => (
                    <button
                        key={day}
                        className={`day-btn ${selectedDay === day ? 'day-btn--active' : ''} ${day === today ? 'day-btn--today' : ''}`}
                        onClick={() => setSelectedDay(day)}
                    >
                        <span className="day-btn__abbr">{day.toUpperCase()}</span>
                        {day === today && <span className="day-btn__dot" />}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="food-trucks__content">
                {loading ? (
                    <div className="food-trucks__loading">
                        <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                        <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                    </div>
                ) : error ? (
                    <div className="food-trucks__error">
                        <p>Failed to load food trucks</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="food-trucks__empty">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <path d="M16 8h4l3 3v5h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <p>No food trucks on {DAY_NAMES[selectedDay]}</p>
                        {!ocrRan && weekImages.length > 0 && (
                            <button className="retry-btn" onClick={handleReload}>
                                Run OCR to load schedule
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="food-trucks__list">
                        {Object.entries(groupedEntries).map(([time, trucks]) => (
                            <div key={time} className="truck-group">
                                <div className="truck-group__time">{time}</div>
                                {trucks.map((truck, idx) => (
                                    <div key={idx} className="truck-card">
                                        <div className="truck-card__info">
                                            <h3 className="truck-card__name">{truck.truck_name}</h3>
                                            {truck.cuisine && (
                                                <span className="truck-card__cuisine">{truck.cuisine}</span>
                                            )}
                                            {truck.location && (
                                                <span className="truck-card__location">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                                        <circle cx="12" cy="10" r="3" />
                                                    </svg>
                                                    {truck.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(time) {
    if (!time) return '';
    if (time.toLowerCase().includes('night')) return time;
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return time;
    let [, h, m] = match;
    let hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${m} ${suffix}`;
}
