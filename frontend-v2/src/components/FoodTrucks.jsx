import { useState, useEffect, useMemo } from 'react';
import { fetchFoodTrucks, getCurrentDay } from '../utils/api';
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
 * Food trucks panel
 */
export default function FoodTrucks() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get today as 3-letter abbreviation, default to 'mon' if weekend
    const getTodayAbbr = () => {
        const fullDay = getCurrentDay(); // returns 'monday', 'tuesday', etc.
        const abbr = fullDay.slice(0, 3); // 'mon', 'tue', etc.
        // If weekend, default to Monday since food trucks are weekday-only
        if (abbr === 'sat' || abbr === 'sun') return 'mon';
        return abbr;
    };

    const [selectedDay, setSelectedDay] = useState(getTodayAbbr);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchFoodTrucks();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Today's day as abbreviation
    const today = (() => {
        const fullDay = getCurrentDay();
        const abbr = fullDay.slice(0, 3);
        if (abbr === 'sat' || abbr === 'sun') return null; // No "today" indicator on weekends
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
                <span className="food-trucks__source">
                    {data?.source === 'cache' ? 'Updated' : 'Live'}
                </span>
            </div>

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
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return time;
    let [, h, m] = match;
    let hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${m} ${suffix}`;
}
