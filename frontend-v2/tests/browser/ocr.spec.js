import { test, expect } from '@playwright/test';

for (const date of ['2026-11-16', '2026-10-12']) {
    test(`real grid recognition ${date}`, async ({ page }) => {
        test.skip(!process.env.RUN_OCR_TESTS, 'Set RUN_OCR_TESTS=1; requires OCR engine CDN access.');
        await page.route('**/foodtrucks**', route => route.fulfill({ json: { weeks: [], data: [] } }));
        await page.goto('/tests/harness.html');
        const result = await page.evaluate(async date => {
            const { runOcr } = await import('/src/utils/foodtruckOcr.js');
            return runOcr(`/tests/fixtures/${date}.png`, () => {}, { directImage: true });
        }, date);
        expect(result.warnings).toEqual([]);
        expect(result.entries).toHaveLength(date === '2026-11-16' ? 18 : 16);
        expect(result.entries).toContainEqual({ day: 'tue', truck: 'Limon Partido', start: '11:00', end: '15:00' });
        expect(result.entries).toContainEqual({ day: 'mon', truck: 'Spicy Birdz', start: '10:00', end: '18:00' });
        expect(result.entries.filter(e => e.day === 'sat' || e.day === 'sun')).toEqual(date === '2026-11-16' ? [
            { day: 'sat', truck: 'El Taco', start: '18:00', end: '23:00' },
            { day: 'sun', truck: 'El Taco', start: '18:00', end: '23:00' },
        ] : []);
    });
}

test('image proxy failures are actionable', async ({ page }) => {
    await page.route('**/foodtrucks**', route => route.fulfill({ json: { weeks: [], data: [] } }));
    await page.route('**/proxy/image?**', route => route.fulfill({ status: 502, json: { error: 'Image fetch failed' } }));
    await page.goto('/tests/harness.html');
    const error = await page.evaluate(async () => {
        const { loadImage } = await import('/src/utils/foodtruck/runtime.js');
        try { await loadImage('/proxy/image?url=fixture'); } catch (err) { return err.message; }
    });
    expect(error).toContain('HTTP 502');
});

test('OpenCV readiness waits for initialization and retries after load failure', async ({ page }) => {
    await page.route('**/foodtrucks**', route => route.fulfill({ json: { weeks: [], data: [] } }));
    await page.goto('/tests/harness.html');
    const result = await page.evaluate(async () => {
        const { loadOpenCV } = await import('/src/utils/foodtruck/runtime.js');
        window.cv = {};
        const first = loadOpenCV();
        const shared = first === loadOpenCV();
        setTimeout(() => { window.cv = { Mat() {}, imread() {} }; }, 100);
        await first;
        return shared;
    });
    expect(result).toBe(true);
    await page.reload();
    await page.route('https://docs.opencv.org/**', route => route.abort());
    const retry = await page.evaluate(async () => {
        const { loadOpenCV } = await import('/src/utils/foodtruck/runtime.js');
        let failed = false;
        try { await loadOpenCV(); } catch { failed = true; }
        window.cv = { Mat() {}, imread() {} };
        await loadOpenCV();
        return failed;
    });
    expect(retry).toBe(true);
});
