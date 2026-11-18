import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/browser',
    timeout: 120000,
    workers: 1,
    use: {
        baseURL: 'http://127.0.0.1:3001',
        viewport: { width: 1440, height: 950 },
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
    },
    webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:3001', reuseExistingServer: !process.env.CI },
});
