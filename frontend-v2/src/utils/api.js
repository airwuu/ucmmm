const API_BASE = 'https://ucmmmdb.ucmmm-ucm.workers.dev';

/**
 * Get PDT-formatted date string (YYYY-MM-DD)
 */
export function getPDTDate(date) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

/**
 * Get the start of the current week (Sunday) in PDT
 */
export function getStartOfWeek(date = new Date()) {
    const currentDay = date.getDay(); // 0 = Sunday
    const diff = date.getDate() - currentDay; // go to Sunday
    return new Date(date.setDate(diff));
}

/**
 * Get current day name in lowercase (e.g., "monday", "tuesday")
 */
export function getCurrentDay() {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long',
    }).format(new Date()).toLowerCase();
}

/**
 * Get current meal period based on time and location
 * This ALWAYS returns a meal - the next/current one (never "closed")
 */
export function getCurrentMeal(location = 'pav') {
    const now = new Date();
    const options = { timeZone: 'America/Los_Angeles', hour12: false };

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        ...options,
        weekday: 'long',
    }).format(now).toLowerCase();

    const hour = parseInt(
        new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit' }).format(now),
        10
    );
    const minute = parseInt(
        new Intl.DateTimeFormat('en-US', { ...options, minute: '2-digit' }).format(now),
        10
    );

    const currentTime = hour * 100 + minute;

    if (location === 'dc') {
        const weekdayHours = {
            lunchStart: 1030,
            lunchEnd: 1400,
            dinnerStart: 1500,
            dinnerEnd: 2000,
            lateNightStart: 2100,
            lateNightEnd: 2400,
        };

        if (currentTime >= weekdayHours.lunchStart && currentTime < weekdayHours.lunchEnd) {
            return 'lunch';
        } else if (currentTime >= weekdayHours.dinnerStart && currentTime < weekdayHours.dinnerEnd) {
            return 'dinner';
        } else if (currentTime >= weekdayHours.lateNightStart && currentTime < weekdayHours.lateNightEnd) {
            return 'late_night';
        } else if (currentTime < weekdayHours.lunchStart) {
            return 'lunch';
        } else if (currentTime < weekdayHours.dinnerStart) {
            return 'dinner';
        } else {
            return 'late_night';
        }
    } else {
        // Pavilion
        const weekdayHours = {
            breakfastStart: 700,
            breakfastEnd: 1030,
            lunchStart: 1100,
            lunchEnd: 1500,
            dinnerStart: 1600,
            dinnerEnd: 2100,
        };

        const weekendHours = {
            breakfastStart: 900,
            breakfastEnd: 1030,
            lunchStart: 1100,
            lunchEnd: 1500,
            dinnerStart: 1600,
            dinnerEnd: 2100,
        };

        const hours = ['saturday', 'sunday'].includes(dayOfWeek) ? weekendHours : weekdayHours;

        if (currentTime >= hours.breakfastStart && currentTime < hours.breakfastEnd) {
            return 'breakfast';
        } else if (currentTime >= hours.lunchStart && currentTime < hours.lunchEnd) {
            return 'lunch';
        } else if (currentTime >= hours.dinnerStart && currentTime < hours.dinnerEnd) {
            return 'dinner';
        } else if (currentTime < hours.breakfastStart) {
            return 'breakfast';
        } else if (currentTime < hours.lunchStart) {
            return 'lunch';
        } else {
            return 'dinner';
        }
    }
}

/**
 * Check if a location is currently open for service
 */
export function isLocationOpen(location) {
    const now = new Date();
    const options = { timeZone: 'America/Los_Angeles', hour12: false };

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        ...options,
        weekday: 'long',
    }).format(now).toLowerCase();

    const hour = parseInt(
        new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit' }).format(now),
        10
    );
    const minute = parseInt(
        new Intl.DateTimeFormat('en-US', { ...options, minute: '2-digit' }).format(now),
        10
    );

    const currentTime = hour * 100 + minute;

    // DC is closed on weekends
    if (location === 'dc' && ['saturday', 'sunday'].includes(dayOfWeek)) {
        return false;
    }

    if (location === 'dc') {
        return (
            (currentTime >= 1030 && currentTime < 1400) ||
            (currentTime >= 1500 && currentTime < 2000) ||
            (currentTime >= 2100 && currentTime < 2400)
        );
    } else {
        const breakfastStart = ['saturday', 'sunday'].includes(dayOfWeek) ? 900 : 700;
        return (
            (currentTime >= breakfastStart && currentTime < 1030) ||
            (currentTime >= 1100 && currentTime < 1500) ||
            (currentTime >= 1600 && currentTime < 2100)
        );
    }
}

/**
 * Fetch menu items for a location
 */
export async function fetchMenu(location) {
    const now = new Date();
    const week = getPDTDate(getStartOfWeek(new Date(now)));
    const day = getCurrentDay();
    const meal = getCurrentMeal(location);

    const url = `${API_BASE}/menu/${week}/${location}/${day}/${meal}`;
    console.log('[API] Fetching menu:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch menu');
        const items = await response.json();
        console.log('[API] Menu items received:', items.length);
        return { items, meal, isOpen: isLocationOpen(location) };
    } catch (error) {
        console.error('[API] Menu fetch error:', error);
        return { items: [], meal, isOpen: isLocationOpen(location), error: error.message };
    }
}

/**
 * Report an item as missing
 */
export async function reportMissing(itemId) {
    const url = `${API_BASE}/item/${itemId}/missing`;

    try {
        const response = await fetch(url, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to report');
        return await response.json();
    } catch (error) {
        console.error('[API] Report error:', error);
        throw error;
    }
}

/**
 * Remove a missing report (decrement by 1)
 */
export async function unreportMissing(itemId) {
    const url = `${API_BASE}/item/${itemId}/missing/remove`;

    try {
        const response = await fetch(url, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to remove report');
        return await response.json();
    } catch (error) {
        console.error('[API] Unreport error:', error);
        throw error;
    }
}

/**
 * Fetch food truck schedule
 */
export async function fetchFoodTrucks(date) {
    const cacheBuster = `_t=${Date.now()}`;
    const dateParam = date || getPDTDate(new Date());
    const url = `${API_BASE}/foodtrucks?date=${dateParam}&${cacheBuster}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch food trucks');
        return await response.json();
    } catch (error) {
        console.error('[API] Food trucks fetch error:', error);
        return { source: 'error', data: [], error: error.message };
    }
}

/**
 * Get meal time info for display
 */
export function getMealTimeInfo(location) {
    const now = new Date();
    const options = { timeZone: 'America/Los_Angeles' };
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { ...options, weekday: 'long' })
        .format(now).toLowerCase();
    const isWeekend = ['saturday', 'sunday'].includes(dayOfWeek);

    const hours = location === 'dc' ? {
        lunch: { start: '10:30 AM', end: '2:00 PM' },
        dinner: { start: '3:00 PM', end: '8:00 PM' },
        late_night: { start: '9:00 PM', end: '12:00 AM' }
    } : {
        breakfast: { start: isWeekend ? '9:00 AM' : '7:00 AM', end: '10:30 AM' },
        lunch: { start: '11:00 AM', end: '3:00 PM' },
        dinner: { start: '4:00 PM', end: '9:00 PM' }
    };

    return {
        currentMeal: getCurrentMeal(location),
        isOpen: isLocationOpen(location),
        hours,
        isWeekend,
        closedReason: location === 'dc' && isWeekend ? 'Closed on weekends' : null
    };
}

/**
 * Get the next opening time for a location (returns relative time)
 */
export function getNextOpenTime(location) {
    const now = new Date();
    const options = { timeZone: 'America/Los_Angeles', hour12: false };

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        ...options,
        weekday: 'long',
    }).format(now).toLowerCase();

    const hour = parseInt(
        new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit' }).format(now),
        10
    );
    const minute = parseInt(
        new Intl.DateTimeFormat('en-US', { ...options, minute: '2-digit' }).format(now),
        10
    );

    const currentMinutes = hour * 60 + minute;
    const isWeekend = ['saturday', 'sunday'].includes(dayOfWeek);

    // Helper to format relative time
    const formatRelative = (targetMinutes) => {
        let diff = targetMinutes - currentMinutes;
        if (diff < 0) diff += 24 * 60; // next day

        if (diff < 60) {
            return `in ${diff} minute${diff !== 1 ? 's' : ''}`;
        } else {
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            if (mins === 0) {
                return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
            }
            return `in ${hours}h ${mins}m`;
        }
    };

    if (location === 'dc') {
        // DC is closed on weekends
        if (isWeekend) {
            return 'Monday at 10:30 AM';
        }

        // DC hours: 10:30-14:00, 15:00-20:00, 21:00-24:00 (in minutes: 630, 900, 1260)
        if (currentMinutes < 630) return formatRelative(630);
        if (currentMinutes >= 840 && currentMinutes < 900) return formatRelative(900);
        if (currentMinutes >= 1200 && currentMinutes < 1260) return formatRelative(1260);
        return 'tomorrow at 10:30 AM';
    } else {
        // Pavilion
        const breakfastStart = isWeekend ? 540 : 420; // 9:00 or 7:00 in minutes
        const breakfastLabel = isWeekend ? '9:00 AM' : '7:00 AM';

        if (currentMinutes < breakfastStart) return formatRelative(breakfastStart);
        if (currentMinutes >= 630 && currentMinutes < 660) return formatRelative(660); // 11:00
        if (currentMinutes >= 900 && currentMinutes < 960) return formatRelative(960); // 16:00
        return `tomorrow at ${breakfastLabel}`;
    }
}
