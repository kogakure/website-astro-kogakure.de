import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** One article in all twelve languages: the old DE/EN URLs and the English slug for the rest */
const TOUGHENING_UP = [
	{ path: '/abhaertung/', lang: 'de', dir: 'ltr', title: 'Abhärtung' },
	{ path: '/en/toughening-up/', lang: 'en', dir: 'ltr', title: 'Toughening Up' },
	{ path: '/es/toughening-up/', lang: 'es', dir: 'ltr' },
	{ path: '/fr/toughening-up/', lang: 'fr', dir: 'ltr' },
	{ path: '/pt/toughening-up/', lang: 'pt-BR', dir: 'ltr' },
	{ path: '/it/toughening-up/', lang: 'it', dir: 'ltr' },
	{ path: '/nl/toughening-up/', lang: 'nl', dir: 'ltr' },
	{ path: '/ru/toughening-up/', lang: 'ru', dir: 'ltr' },
	{ path: '/ja/toughening-up/', lang: 'ja', dir: 'ltr' },
	{ path: '/zh/toughening-up/', lang: 'zh-Hans', dir: 'ltr' },
	{ path: '/ko/toughening-up/', lang: 'ko', dir: 'ltr' },
	{ path: '/he/toughening-up/', lang: 'he', dir: 'rtl' },
];

test.describe('article pages', () => {
	for (const { path, lang, dir, title } of TOUGHENING_UP) {
		test(`${path} renders in ${lang}`, async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page.locator('html')).toHaveAttribute('lang', lang);
			await expect(page.locator('html')).toHaveAttribute('dir', dir);
			const heading = page.getByRole('heading', { level: 1 });
			if (title) await expect(heading).toHaveText(title);
			else await expect(heading).not.toBeEmpty();
			// The opener loads first, the text's figures lazily
			await expect(page.locator('.plate-opener img')).toHaveAttribute('loading', 'eager');
			await expect(page.locator('.prose figure img').first()).toHaveAttribute(
				'loading',
				'lazy'
			);
		});
	}

	test('figure images come in their generated widths and load', async ({ page, request }) => {
		await page.goto('/en/kamae/');
		const img = page.locator('.prose figure img').first();
		await expect(img).toHaveAttribute(
			'src',
			/^\/images\/article\/kamae-01-[a-z-]+-1400\.webp$/
		);
		await expect(img).toHaveAttribute('width', '2048');
		const srcset = (await img.getAttribute('srcset')) ?? '';
		const files = srcset.split(', ').map((candidate) => candidate.split(' ')[0] ?? '');
		expect(files).toHaveLength(4);
		for (const file of files) {
			const response = await request.get(file);
			expect(response.status(), file).toBe(200);
			expect(response.headers()['content-type']).toBe('image/webp');
		}
	});

	test('previous and next follow the book order', async ({ page }) => {
		await page.goto('/vorwort/');
		await page.locator('a[rel="next"]').click();
		await expect(page).toHaveURL(/\/ninjutsu\/$/);
		await page.locator('a[rel="prev"]').click();
		await expect(page).toHaveURL(/\/vorwort\/$/);
	});

	for (const path of ['/abhaertung/', '/he/toughening-up/', '/ja/toughening-up/']) {
		test(`${path} has no accessibility violations`, async ({ page }) => {
			// The settled page: axe can't judge contrast mid-animation
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(path);
			const results = await new AxeBuilder({ page }).analyze();
			expect(results.violations).toEqual([]);
		});
	}
});

test.describe('homepages', () => {
	test('every language has a homepage with its contents', async ({ page }) => {
		for (const prefix of ['/', '/en/', '/ja/', '/he/']) {
			await page.goto(prefix);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText('木隠 Kogakure');
			await expect(page.locator('.article-title').first()).toHaveAttribute(
				'href',
				prefix === '/' ? '/vorwort/' : `${prefix}preface/`
			);
		}
	});
});

test.describe('404 pages', () => {
	test('the 404 page is not a book page', async ({ page }) => {
		const response = await page.goto('/nicht-gefunden/');
		expect(response?.status()).toBe(404);
	});

	test('every language has its own 404 page', async ({ page }) => {
		await page.goto('/en/404/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(
			page.getByRole('link', { name: 'start of the book', exact: false })
		).toHaveAttribute('href', '/en/preface/');
	});
});
