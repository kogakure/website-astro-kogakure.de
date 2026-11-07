import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PREFIXED_LANGS } from '../../src/i18n/languages';

/** The script of the search: the dialog's island, React's renderer, Pagefind */
const SEARCH_SCRIPT = /\/_astro\/(SearchDialog|client)\.|\/pagefind\//;

/** An article per language; the glossary term `kunoichi` is in every language */
const ARTICLES = [
	{ lang: 'de', path: '/abhaertung/' },
	...PREFIXED_LANGS.map((lang) => ({ lang, path: `/${lang}/toughening-up/` })),
];

const dialog = (page: Page) => page.getByRole('dialog');
const field = (page: Page) => dialog(page).getByRole('searchbox');
const results = (page: Page) => dialog(page).locator('.search-result a');

async function search(page: Page, query: string) {
	await page.locator('[data-search-trigger]:visible').first().click();
	await expect(field(page)).toBeFocused();
	await field(page).fill(query);
	await expect(results(page).first()).toBeVisible();
}

test.describe('search', () => {
	test('loads no script until it is opened', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', (request) => requests.push(request.url()));
		await page.goto('/abhaertung/');
		await page.waitForLoadState('networkidle');
		expect(requests.filter((url) => SEARCH_SCRIPT.test(url))).toEqual([]);

		await search(page, 'kunoichi');
		expect(requests.some((url) => url.includes('/_astro/SearchDialog.'))).toBe(true);
		expect(requests.some((url) => url.endsWith('/pagefind/pagefind.js'))).toBe(true);
	});

	for (const { lang, path } of ARTICLES) {
		test(`finds only ${lang} pages on ${path}`, async ({ page }) => {
			await page.goto(path);
			await search(page, 'kunoichi');
			const hrefs = await results(page).evaluateAll((links) =>
				links.map((link) => link.getAttribute('href') ?? '')
			);
			expect(hrefs.length).toBeGreaterThan(0);
			for (const href of hrefs) {
				if (lang === 'de')
					expect(href, href).not.toMatch(new RegExp(`^/(${PREFIXED_LANGS.join('|')})/`));
				else expect(href, href).toMatch(new RegExp(`^/${lang}/`));
			}
		});
	}

	test('shows the title, chapter and excerpt of each result', async ({ page }) => {
		await page.goto('/abhaertung/');
		await search(page, 'Kunoichi');
		const article = dialog(page).locator('.search-result', { hasText: 'Organisation' }).first();
		await expect(article.locator('a')).toHaveText('Kunoichi');
		await expect(article.locator('.search-chapter')).toHaveText('Organisation & Ausbildung');
		await expect(article.locator('.search-excerpt mark').first()).toBeVisible();
		// A glossary entry is a result of its own
		await expect(results(page).filter({ hasText: /^kunoichi くノ一$/ })).toHaveAttribute(
			'href',
			'/glossar/#kunoichi'
		);
		await expect(dialog(page).getByRole('status')).toHaveText(/^\d+ Treffer$/);
	});

	test('is fully keyboard-usable, traps and returns the focus', async ({ page }) => {
		await page.goto('/abhaertung/');
		const trigger = page.locator('[data-search-trigger]:visible').first();
		await trigger.focus();
		await page.keyboard.press('Enter');
		await expect(field(page)).toBeFocused();
		await field(page).fill('kunoichi');
		await expect(results(page).first()).toBeVisible();

		// The arrows move between the field and the results
		await page.keyboard.press('ArrowDown');
		await expect(results(page).first()).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(results(page).nth(1)).toBeFocused();
		await page.keyboard.press('ArrowUp');
		await page.keyboard.press('ArrowUp');
		await expect(field(page)).toBeFocused();

		// Tab stays in the dialog, round past its last element (Base UI's focus
		// guard hands the focus back a frame later)
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Tab');
			await expect
				.poll(() =>
					page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))
				)
				.toBe(true);
		}

		await page.keyboard.press('Escape');
		await expect(dialog(page)).toBeHidden();
		await expect(trigger).toBeFocused();
	});

	test('opens with / and goes to the first result with Enter', async ({ page }) => {
		await page.goto('/en/toughening-up/');
		await page.keyboard.press('/');
		await expect(field(page)).toBeFocused();
		await field(page).fill('kunoichi');
		const first = await results(page).first().getAttribute('href');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === first);
	});

	test('a glossary entry on the glossary page closes the dialog at its anchor', async ({
		page,
	}) => {
		await page.goto('/glossar/');
		await search(page, 'kunoichi');
		await results(page)
			.filter({ hasText: /^kunoichi くノ一$/ })
			.click();
		await expect(dialog(page)).toBeHidden();
		await expect(page).toHaveURL(/\/glossar\/#kunoichi$/);
		await expect(page.locator('#kunoichi')).toBeInViewport();
	});

	test('returns the focus to where / was pressed', async ({ page }) => {
		await page.goto('/abhaertung/');
		const link = page.locator('.facts a').first();
		await link.focus();
		await page.keyboard.press('/');
		await expect(field(page)).toBeFocused();
		// A `/` inside the open dialog changes nothing
		await page.keyboard.press('Tab');
		await page.keyboard.press('/');
		await page.keyboard.press('Escape');
		await expect(dialog(page)).toBeHidden();
		await expect(link).toBeFocused();
	});

	test('shows the next results and hands them the focus', async ({ page }) => {
		await page.goto('/abhaertung/');
		await search(page, 'Ninja');
		await expect(results(page)).toHaveCount(10);
		await dialog(page).getByRole('button', { name: 'Weitere Treffer' }).click();
		await expect(results(page)).toHaveCount(20);
		await expect(results(page).nth(10)).toBeFocused();
	});

	test('says when the search cannot load', async ({ page }) => {
		await page.route('**/pagefind/pagefind.js', (route) => route.abort());
		await page.goto('/abhaertung/');
		await page.locator('[data-search-trigger]:visible').first().click();
		await field(page).fill('kunoichi');
		await expect(dialog(page).getByRole('status')).toHaveText(
			'Die Suche ist gerade nicht erreichbar.'
		);
	});

	test('stays in the top bar when it comes back on a phone', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/abhaertung/');
		await page.mouse.wheel(0, 3000);
		await page.waitForTimeout(300);
		await page.mouse.wheel(0, -300);
		await expect(page.locator('[data-topbar]')).toHaveAttribute('data-state', 'shown');
		await page.locator('[data-topbar] [data-search-trigger]').click();
		await expect(field(page)).toBeFocused();
	});

	test('the homepage contents open it', async ({ page }) => {
		await page.goto('/en/');
		await search(page, 'kunoichi');
		await expect(results(page).first()).toHaveAttribute('href', /^\/en\//);
	});

	for (const path of ['/abhaertung/', '/he/toughening-up/']) {
		test(`the open dialog on ${path} has no accessibility violations`, async ({ page }) => {
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(path);
			await search(page, 'kunoichi');
			const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
			expect(axe.violations).toEqual([]);
		});
	}
});

test.describe('reading time', () => {
	test('is a fact of every article, localised', async ({ page }) => {
		await page.goto('/abhaertung/');
		await expect(page.locator('.facts')).toContainText(/Lesezeit\s*\d+ Min\./);
		await page.goto('/ja/toughening-up/');
		await expect(page.locator('.facts')).toContainText(/読了時間\s*約\d+分/);
	});

	test('is not a fact of the glossary', async ({ page }) => {
		await page.goto('/glossar/');
		await expect(page.locator('.facts')).not.toContainText('Lesezeit');
	});
});
