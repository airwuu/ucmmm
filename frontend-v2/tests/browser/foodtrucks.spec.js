import { test, expect } from '@playwright/test';

const weeks = [
    { start: '2026-11-23', end: '2026-11-29', url: 'https://example.com/new.png' },
    { start: '2026-11-16', end: '2026-11-22', url: 'https://example.com/current.png' },
];

async function setup(page, { cache = false, discoveryFailure = false } = {}) {
    await page.clock.install({ time: new Date('2026-11-17T12:00:00-08:00') });
    await page.route('**/src/utils/foodtruckOcr.js', async route => {
        const response = await route.fetch();
        const body = await response.text();
        // Keep real discovery/save helpers; isolate expensive recognition for UI tests.
        await route.fulfill({ response, body: body.replace('export async function runOcr(', 'async function unusedRunOcr(') + `
            export async function runOcr(url, progress) {
                window.scannedImages = [...(window.scannedImages || []), url];
                progress(.5, 'Reading cells…');
                await new Promise(resolve => setTimeout(resolve, 250));
                return { entries: [{day: 'tue', truck: url.includes('new') ? 'New Truck' : 'Current Truck', start: '10:00', end: '18:00'}], warnings: [] };
            }
        ` });
    });
    await page.route('**/foodtrucks/images', route => route.fulfill(discoveryFailure ? { status: 503, json: {} } : { json: { weeks } }));
    await page.route('**/foodtrucks?**', route => route.fulfill({ json: cache ? {
        source: 'cache', data: [{day: 'tue', truck_name: 'Cached Truck', start_time: '10:00', end_time: '18:00'}],
    } : { source: 'error', error: 'Upstream 403', data: [] } }));
    await page.route('**/foodtrucks/schedule', route => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
    await page.goto('/tests/harness.html');
}

test('reload scans selected week and keeps local results when saving fails', async ({ page }) => {
    await setup(page);
    await expect(page.locator('.week-selector__toggle')).toContainText('2026-11-16');
    await page.getByTitle('Reload schedule (runs OCR)').click();
    await expect(page.getByText('Current Truck')).toBeVisible();
    await expect(page.locator('.ocr-error')).toContainText('could not be saved');
    await page.locator('.week-selector__toggle').click();
    await page.locator('.week-selector__item').nth(1).click();
    await expect(page.getByText('New Truck')).toBeVisible();
    await page.getByTitle('Reload schedule (runs OCR)').click();
    await expect(page.getByText('New Truck')).toBeVisible();
    expect(await page.evaluate(() => window.scannedImages)).toEqual([weeks[1].url, weeks[0].url, weeks[0].url]);
    await expect(page.locator('.day-btn')).toHaveCount(7);
});

test('a stale scan cannot replace the newly selected week', async ({ page }) => {
    await setup(page);
    await page.getByTitle('Reload schedule (runs OCR)').click();
    await page.locator('.week-selector__toggle').click();
    await page.locator('.week-selector__item').nth(1).click();
    await expect(page.getByText('New Truck')).toBeVisible();
    await expect(page.getByText('Current Truck')).toHaveCount(0);
});

test('discovery failure shows retry instead of an empty schedule', async ({ page }) => {
    await setup(page, { discoveryFailure: true });
    await expect(page.getByText(/discovery failed/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible();
    await expect(page.getByText(/No food trucks/)).toHaveCount(0);
});

test('seven day tabs fit on mobile and weekends can be selected', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setup(page, { cache: true });
    await page.getByRole('button', { name: 'SUN', exact: true }).click();
    await expect(page.getByText('No food trucks on Sunday')).toBeVisible();
    const bounds = await page.locator('.day-selector').evaluate(el => ({width: el.scrollWidth, client: el.clientWidth}));
    expect(bounds.width).toBeLessThanOrEqual(bounds.client);
    await page.screenshot({ path: '/tmp/ucmmm-foodtrucks-mobile.png' });
});
