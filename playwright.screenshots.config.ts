import { defineConfig, devices } from '@playwright/test';

// Not the port of playwright.config.ts (both suites may run at once), nor 4330 (the prototypes)
const port = 4349;

const browser = process.env.SCREENSHOT_BROWSER;
if (!browser) {
	throw new Error(
		'Run the screenshot tests with `pnpm test:screenshots` (scripts/screenshots.ts)'
	);
}

/** The screenshot suite: the browser runs in the Playwright image (scripts/screenshots.ts) */
export default defineConfig({
	testDir: './tests/screenshots',
	snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	expect: {
		toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
	},
	use: {
		baseURL: `http://localhost:${port}`,
		connectOptions: { wsEndpoint: browser, exposeNetwork: '<loopback>' },
		locale: 'de-DE',
		timezoneId: 'Europe/Berlin',
		serviceWorkers: 'block',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		command: `pnpm exec astro preview --port ${port} --ignore-lock`,
		url: `http://localhost:${port}`,
		// Always the build in dist/: a server already on the port could be anything
		reuseExistingServer: false,
		timeout: 60_000,
	},
});
