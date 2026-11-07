import { defineConfig, devices } from '@playwright/test';

// A port of its own, so a running dev server or another project is never reused
const port = 4329;

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${port}`,
		// A German browser: on its first visit, / sends other languages on (SI-478)
		locale: 'de-DE',
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	// Tests run against the built site, as it is served in production
	webServer: {
		command: `pnpm exec astro preview --port ${port} --ignore-lock`,
		url: `http://localhost:${port}`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
