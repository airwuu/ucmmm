import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchFoodTrucks, getCurrentDay, getPDTDate } from '../utils/api';
import { runOcr, fetchWeekImages, submitOcrResults } from '../utils/foodtruckOcr';
import { DAYS, DAY_NAMES as NAMES, defaultWeek } from '../utils/foodtruck/parse';
import './FoodTrucks.css';

const DAY_NAMES = Object.fromEntries(DAYS.map((day, index) => [day, NAMES[index]]));

export default function FoodTrucks() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrMessage, setOcrMessage] = useState('');
    const [ocrError, setOcrError] = useState(null);
    const [ocrRan, setOcrRan] = useState(false);
    const [weekImages, setWeekImages] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [weekMenuOpen, setWeekMenuOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(() => getCurrentDay().slice(0, 3));
    const request = useRef(0);
    const scan = useRef(null);
    const today = getCurrentDay().slice(0, 3);
    const date = getPDTDate(new Date());
    const noncurrent = selectedWeek && !(selectedWeek.start <= date && selectedWeek.end >= date);

    const beginRequest = useCallback(() => {
        scan.current?.abort();
        scan.current = null;
        setData(null);
        setError(null);
        setOcrError(null);
        setOcrRan(false);
        setOcrLoading(false);
        return ++request.current;
    }, []);

    const runFoodTruckOcr = useCallback(async (week, id) => {
        if (!week?.url) { setOcrError('No schedule image available.'); return; }
        const controller = new AbortController();
        scan.current = controller;
        setLoading(false);
        setOcrLoading(true);
        setOcrProgress(0);
        setOcrMessage('Starting…');
        const active = () => request.current === id && !controller.signal.aborted;
        try {
            const result = await runOcr(week.url, (progress, message) => {
                if (active()) { setOcrProgress(progress); setOcrMessage(message); }
            }, { signal: controller.signal });
            if (!active()) return;
            setData({ source: 'ocr', data: result.entries.map(entry => ({
                week_start: week.start, day: entry.day, truck_name: entry.truck,
                start_time: entry.start, end_time: entry.end,
            })) });
            setOcrRan(true);
            setError(null);
            if (result.warnings.length) {
                setOcrError(`Partial scan: ${result.warnings.join(' ')} Results were not saved.`);
            } else if (result.entries.length) {
                setOcrMessage('Saving schedule…');
                try { await submitOcrResults(week.start, result.entries, week.url, controller.signal); }
                catch (err) { if (active()) setOcrError(err.message); }
            }
        } catch (err) {
            if (active()) setOcrError(err.message);
        } finally {
            if (active()) { setOcrLoading(false); setOcrMessage(''); scan.current = null; }
        }
    }, []);

    const loadWeek = useCallback(async (week, id, autoScan) => {
        const result = await fetchFoodTrucks(week?.start);
        if (request.current !== id) return;
        if (result.source === 'cache' && result.data?.length) {
            setData(result);
            setLoading(false);
        } else if (autoScan && week) {
            await runFoodTruckOcr(week, id);
        } else {
            if (result.source === 'error') setError(result.error || 'Schedule service unavailable.');
            setLoading(false);
        }
    }, [runFoodTruckOcr]);

    const load = useCallback(async () => {
        const id = beginRequest();
        setLoading(true);
        try {
            const weeks = await fetchWeekImages();
            if (request.current !== id) return;
            setWeekImages(weeks);
            const week = defaultWeek(weeks, getPDTDate(new Date()));
            setSelectedWeek(week);
            await loadWeek(week, id, false);
        } catch (err) {
            if (request.current !== id) return;
            setError(err.message);
            setLoading(false);
        }
    }, [beginRequest, loadWeek]);

    useEffect(() => {
        load();
        return () => { request.current++; scan.current?.abort(); };
    }, [load]);

    const handleReload = () => {
        if (ocrLoading) return;
        if (!selectedWeek) { load(); return; }
        const id = beginRequest();
        runFoodTruckOcr(selectedWeek, id);
    };

    const handleSelectWeek = index => {
        const week = weekImages[index];
        setWeekMenuOpen(false);
        setSelectedWeek(week);
        const id = beginRequest();
        setLoading(true);
        loadWeek(week, id, true);
    };

    const entries = useMemo(() => data?.data?.filter(entry => entry.day === selectedDay) || [], [data, selectedDay]);
    const groupedEntries = useMemo(() => {
        const groups = {};
        entries.forEach(entry => {
            const time = entry.start_time ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}` : 'Schedule TBD';
            (groups[time] ||= []).push(entry);
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
                        <span>{selectedWeek ? `${selectedWeek.start} – ${selectedWeek.end}` : 'Select Week'}{noncurrent ? ' (not current week)' : ''}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={weekMenuOpen ? 'rotated' : ''}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {weekMenuOpen && (
                        <div className="week-selector__menu">
                            {weekImages.map((week, index) => (
                                <button
                                    key={week.start}
                                    className={`week-selector__item ${selectedWeek?.start === week.start ? 'week-selector__item--active' : ''}`}
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
                        className={`day-btn ${selectedDay === day ? 'day-btn--active' : ''} ${day === today && !noncurrent ? 'day-btn--today' : ''}`}
                        onClick={() => setSelectedDay(day)}
                    >
                        <span className="day-btn__abbr">{day.toUpperCase()}</span>
                        {day === today && !noncurrent && <span className="day-btn__dot" />}
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
                        <p>{error}</p>
                        <button className="retry-btn" onClick={load}>Retry loading</button>
                        {selectedWeek && <button className="retry-btn" onClick={handleReload}>Scan selected week</button>}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="food-trucks__empty">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <path d="M16 8h4l3 3v5h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <p>{ocrLoading ? 'Reading schedule…' : data && !ocrError ? `No food trucks on ${DAY_NAMES[selectedDay]}` : ocrError ? 'Schedule scan incomplete or unavailable' : 'Schedule not loaded'}</p>
                        {!ocrRan && !ocrLoading && weekImages.length > 0 && (
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
