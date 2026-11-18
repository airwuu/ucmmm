export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function parseHours(text) {
    const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (!match) return null;
    const [, h1, m1 = '00', a1, h2, m2 = '00', a2] = match;
    if (+h1 < 1 || +h1 > 12 || +h2 < 1 || +h2 > 12 || +m1 > 59 || +m2 > 59 || (!a1 && !a2)) return null;
    const minutes = (h, m, ap) => (+h % 12) * 60 + +m + (ap.toLowerCase() === 'pm' ? 720 : 0);
    let start = minutes(h1, m1, a1 || a2);
    let end = minutes(h2, m2, a2 || a1);
    // A trailing meridiem applies to both ends unless that reverses a daytime range.
    if (!a1 && start >= end && a2.toLowerCase() === 'pm') start -= 720;
    if (!a2 && end <= start && a1.toLowerCase() === 'am') end += 720;
    if (start < 0 || end <= start) return null;
    const format = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    return { start: format(start), end: format(end) };
}

const dayOf = text => {
    const clean = text.toLowerCase().replace(/[^a-z]/g, '');
    return DAY_NAMES.findIndex(day => clean.startsWith(day.toLowerCase().slice(0, 3)));
};

export function parseTable(matrix) {
    const headerIndex = matrix.findIndex(row => DAYS.every((_, day) => row.some(cell => dayOf(cell) === day)));
    if (headerIndex < 0) throw new Error('Could not read all seven weekday headers. Please retry the scan.');
    const header = matrix[headerIndex];
    const columns = DAYS.map((_, day) => header.findIndex(cell => dayOf(cell) === day));
    if (new Set(columns).size !== 7 || Math.min(...columns) < 1) throw new Error('Unrecognized schedule columns.');
    const entries = [];
    const warnings = [];
    let rows = 0;
    for (const cells of matrix.slice(headerIndex + 1)) {
        if (cells.every(cell => !cell.trim())) continue;
        rows++;
        const location = cells.slice(0, Math.min(...columns)).join(' ').replace(/\s+/g, ' ').trim();
        const hours = parseHours(location);
        for (let day = 0; day < 7; day++) {
            const truck = (cells[columns[day]] || '').replace(/\s+/g, ' ').trim();
            if (/^(closed|holiday)[.!]?$/i.test(truck)) continue;
            if (!truck || !/[a-z]/i.test(truck) || !hours) {
                warnings.push(`Could not read ${DAY_NAMES[day]} service in row ${rows}${!hours ? ' (hours unreadable)' : ''}.`);
                continue;
            }
            entries.push({ day: DAYS[day], truck, ...hours });
        }
    }
    if (!rows) throw new Error('No schedule rows were recognized.');
    return { entries, warnings };
}

export function sortWeeks(weeks) {
    return [...new Map(weeks.filter(w => w.url && /^\d{4}-\d{2}-\d{2}$/.test(w.start) && w.end >= w.start)
        .map(w => [w.start, w])).values()].sort((a, b) => a.start.localeCompare(b.start));
}

export function defaultWeek(weeks, today) {
    return weeks.find(w => w.start <= today && w.end >= today)
        || weeks.filter(w => w.start <= today).at(-1) || weeks[0] || null;
}
