import { expect, test, type Page } from '@playwright/test';

/** Goes to the page in another language with the colophon's language select */
async function switchLanguage(page: Page, name: string) {
	const form = page.locator('[data-language-form]');
	await form.locator('select').selectOption({ label: name });
	await form.locator('button[type="submit"]').click();
}

test.describe('first visit to /', () => {
	test.describe('a French browser', () => {
		test.use({ locale: 'fr-FR' });

		test('goes to the French homepage, once', async ({ page }) => {
			await page.goto('/');
			await expect(page).toHaveURL('/fr/');
			await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
			await page.goto('/');
			await expect(page).toHaveURL('/');
			await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		});

		test('stays on a deep link', async ({ page }) => {
			await page.goto('/kamae/');
			await expect(page).toHaveURL('/kamae/');
			await page.goto('/#geschichte');
			await expect(page).toHaveURL('/#geschichte');
		});

		test('stays on / after choosing German', async ({ page }) => {
			await page.goto('/fr/');
			await switchLanguage(page, 'Deutsch');
			await expect(page).toHaveURL('/');
			await expect(page.locator('html')).toHaveAttribute('lang', 'de');
			await page.goto('/');
			await expect(page).toHaveURL('/');
		});
	});

	test.describe('a German browser', () => {
		test('stays on /', async ({ page }) => {
			await page.goto('/');
			await expect(page).toHaveURL('/');
		});

		test('follows the reader’s own choice after that', async ({ page }) => {
			await page.goto('/');
			await switchLanguage(page, '日本語');
			await expect(page).toHaveURL('/ja/');
			await page.goto('/');
			await expect(page).toHaveURL('/ja/');
		});
	});

	test.describe('a browser in none of the languages', () => {
		test.use({ locale: 'pl-PL' });

		test('goes to English', async ({ page }) => {
			await page.goto('/');
			await expect(page).toHaveURL('/en/');
		});
	});
});

test.describe('search engines', () => {
	test('an article names its canonical URL, its language versions and its structured data', async ({
		page,
	}) => {
		await page.goto('/en/kamae/');
		await expect(page).toHaveTitle('Kamae · 木隠 · Ninja, Ninjutsu & Martial Arts');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://www.kogakure.de/en/kamae/'
		);
		await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(13);
		await expect(page.locator('link[hreflang="de"]')).toHaveAttribute(
			'href',
			'https://www.kogakure.de/kamae/'
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			'content',
			'https://www.kogakure.de/images/og/kamaePage.jpg'
		);
		const types = await page
			.locator('script[type="application/ld+json"]')
			.evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? '')['@type']));
		expect(types).toEqual(['Article', 'BreadcrumbList']);
	});

	test('the preview image of every article exists', async ({ page, request }) => {
		await page.goto('/ja/kamae/');
		const image = await page.locator('meta[property="og:image"]').getAttribute('content');
		const response = await request.get(new URL(image ?? '').pathname);
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toBe('image/jpeg');
	});

	test('the homepage is the book', async ({ page }) => {
		await page.goto('/en/');
		const book = await page.locator('script[type="application/ld+json"]').textContent();
		expect(JSON.parse(book ?? '')).toMatchObject({ '@type': 'Book', inLanguage: 'en' });
	});

	test('the sitemap lists every page with its language versions', async ({ request }) => {
		const response = await request.get('/sitemap.xml');
		expect(response.status()).toBe(200);
		const xml = await response.text();
		expect(xml).toContain('<loc>https://www.kogakure.de/kamae/</loc>');
		expect(xml).toContain('hreflang="x-default" href="https://www.kogakure.de/en/kamae/"');
		expect(xml).not.toContain('/404/');
		for (const legal of ['/impressum/', '/datenschutz/', '/en/imprint/', '/ja/privacy/'])
			expect(xml).not.toContain(legal);
		expect(xml).not.toContain('/design-system/');
		expect(xml).toContain('<loc>https://www.kogakure.de/buch/</loc>');
		expect(xml).toContain('hreflang="en" href="https://www.kogakure.de/en/book/"');
	});

	test('robots.txt keeps /sprueche/ out and points to the sitemap', async ({ request }) => {
		const robots = await (await request.get('/robots.txt')).text();
		expect(robots).toContain('Disallow: /sprueche/');
		expect(robots).toContain('Sitemap: https://www.kogakure.de/sitemap.xml');
	});

	for (const path of ['/impressum/', '/datenschutz/', '/en/imprint/', '/ja/privacy/'])
		test(`the legal page ${path} stays out of the index`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
			await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
			await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
		});

	test('404 pages stay out of the index', async ({ page }) => {
		await page.goto('/en/does-not-exist/');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
	});
});
