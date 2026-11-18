import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHours, parseTable, sortWeeks, defaultWeek, DAY_NAMES } from '../src/utils/foodtruck/parse.js';
import { collapseLines } from '../src/utils/foodtruck/grid.js';

const table = rows => [['UCM Week of 11/16/26'], ['Location', ...DAY_NAMES], ...rows];
test('abbreviated hours and wrapped night service', () => {
    for (const [text, start, end] of [['YWDC 1, 10-6pm', '10:00', '18:00'], ['11-3pm', '11:00', '15:00'], ['Night Service Scholars\nLane 6pm-11pm', '18:00', '23:00'], ['12pm–3pm', '12:00', '15:00'], ['9:30am–11:45am', '09:30', '11:45']]) {
        assert.deepEqual(parseHours(text), { start, end });
    }
    for (const text of ['Night Service', '10-6', '13pm-6pm', '9:99am-6pm', '6pm-3pm']) assert.equal(parseHours(text), null);
});
test('ignores merged title and closed cells; extracts weekends', () => {
    const result = parseTable(table([['YWDC 1, 10-6pm', 'Spicy Birdz', ...Array(6).fill('Closed')], ['Night Service\n6pm-11pm', ...Array(7).fill('El Taco')]]));
    assert.equal(result.entries.length, 8);
    assert.deepEqual(result.entries.at(-1), { day: 'sun', truck: 'El Taco', start: '18:00', end: '23:00' });
    assert.deepEqual(result.warnings, []);
});
test('distinguishes all closed from unreadable cells and hours', () => {
    assert.deepEqual(parseTable(table([['10-6pm', ...Array(7).fill('Closed')]])), { entries: [], warnings: [] });
    assert.equal(parseTable(table([['Unknown hours', ...Array(7).fill('El Taco')]])).warnings.length, 7);
    assert.equal(parseTable(table([['10-6pm', ...Array(7).fill('')]])).warnings.length, 7);
    assert.throws(() => parseTable([['garbage']]), /weekday headers/);
    assert.throws(() => parseTable(table([])), /No schedule rows/);
});
test('week selection sorts dates and prefers current, then past, then future', () => {
    const weeks = sortWeeks([{ start: '2026-11-23', end: '2026-11-29', url: 'b' }, { start: '2026-11-16', end: '2026-11-22', url: 'a' }]);
    assert.equal(defaultWeek(weeks, '2026-11-17').url, 'a');
    assert.equal(defaultWeek(weeks, '2026-12-01').url, 'b');
    assert.equal(defaultWeek(weeks, '2026-11-01').url, 'a');
    assert.equal(defaultWeek([], '2026-11-01'), null);
});
test('line clustering does not invent image-edge boundaries', () => {
    assert.deepEqual(collapseLines([0, 0, 8, 9, 8, 0, 0, 8, 0], 7), [3, 7]);
});
