import { expect, test, type Page } from '@playwright/test';

// The service worker is blocked everywhere else (playwright.config.ts)
test.use({ serviceWorkers: 'allow' });

/** Waits until the service worker controls the page and has saved it */
async function saved(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready);
	await expect
		.poll(() =>
			page.evaluate(async () => {
				const cache = await caches.open('kogakure-pages');
				return Boolean(await cache.match(location.href, { ignoreVary: true }));
			})
		)
		.toBe(true);
}

test.describe('offline', () => {
	test('a page read opens offline; one never read shows the offline page', async ({
		page,
		context,
	}) => {
		await page.goto('/abhaertung/');
		await saved(page);
		await context.setOffline(true);

		await page.reload();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Abhärtung');
		// A link with a query is the same saved page
		await page.goto('/abhaertung/?utm_source=test');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Abhärtung');

		await page.goto('/kamae/');
		await expect(page).toHaveURL('/kamae/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keine Verbindung');
		await expect(page.getByRole('link', { name: 'Erneut versuchen' })).toBeVisible();
		// The pages saved on the device, in the page's language
		const savedPages = page.getByRole('region', { name: 'Ohne Verbindung lesbar' });
		await expect(savedPages.getByRole('link', { name: 'Abhärtung' })).toHaveAttribute(
			'href',
			'/abhaertung/'
		);
	});

	test('the offline page is in the language of the page asked for', async ({ page, context }) => {
		await page.goto('/en/');
		await page.evaluate(() => navigator.serviceWorker.ready);
		await context.setOffline(true);
		await page.goto('/en/kamae/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('No connection');
		await page.goto('/he/kamae/');
		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
	});

	test('a page read keeps its styles beyond the shell, which the next deploy deletes', async ({
		page,
	}) => {
		await page.goto('/abhaertung/');
		await saved(page);
		// Now the worker answers: the stylesheet, also in the shell, is kept on its own
		await page.reload();
		const stylesheet = await page
			.locator('link[rel="stylesheet"]')
			.first()
			.evaluate((link: HTMLLinkElement) => link.href);
		await expect
			.poll(() =>
				page.evaluate(
					async (href) =>
						Boolean(await (await caches.open('kogakure-assets')).match(href)),
					stylesheet
				)
			)
			.toBe(true);
	});

	test('the worker precaches the shell of this build', async ({ request }) => {
		const response = await request.get('/sw.js');
		expect(response.ok()).toBe(true);
		const sw = await response.text();
		expect(sw).not.toContain("version: 'dev'");
		for (const url of ['/offline/', '/en/offline/', '/he/offline/', '/manifest.webmanifest'])
			expect(sw).toContain(`"${url}"`);
	});
});

test.describe('install', () => {
	test('the book is installable', async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => navigator.serviceWorker.ready);
		const cdp = await page.context().newCDPSession(page);
		const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
		expect(installabilityErrors).toEqual([]);
		const { url, errors } = await cdp.send('Page.getAppManifest');
		expect(url).toMatch(/\/manifest\.webmanifest$/);
		expect(errors).toEqual([]);
	});

	test('every language has its manifest: the same app, starting in that language', async ({
		page,
		request,
	}) => {
		await page.goto('/ja/');
		const href = await page.locator('link[rel="manifest"]').getAttribute('href');
		expect(href).toBe('/ja/manifest.webmanifest');
		const response = await request.get(href!);
		expect(response.headers()['content-type']).toContain('application/manifest+json');
		const manifest = await response.json();
		expect(manifest).toMatchObject({
			id: '/',
			short_name: '木隠',
			start_url: '/ja/',
			lang: 'ja',
			display: 'standalone',
		});
		expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain(
			'maskable'
		);
	});

	test('every icon and launch screen the page names exists', async ({ page, request }) => {
		await page.goto('/');
		const hrefs = await page
			.locator(
				'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-startup-image"]'
			)
			.evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
		expect(hrefs.length).toBeGreaterThan(40);
		for (const href of [...hrefs, '/favicon.ico', '/apple-touch-icon.png']) {
			const response = await request.get(href);
			expect(response.status(), href).toBe(200);
		}
	});

	test('no page asks for a missing file', async ({ page }) => {
		const missing: string[] = [];
		page.on('response', (response) => {
			if (response.status() >= 400) missing.push(response.url());
		});
		for (const path of ['/', '/abhaertung/', '/en/contents/', '/offline/']) {
			await page.goto(path);
			await page.waitForLoadState('load');
		}
		expect(missing).toEqual([]);
	});
});
