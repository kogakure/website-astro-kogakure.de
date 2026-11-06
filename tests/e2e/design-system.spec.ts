import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('design system page', () => {
	for (const colorScheme of ['light', 'dark'] as const) {
		test(`has no accessibility violations in ${colorScheme} mode`, async ({ page }) => {
			await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
			await page.goto('/design-system/');
			const results = await new AxeBuilder({ page }).analyze();
			expect(results.violations).toEqual([]);
		});
	}

	test('loads its fonts from the site only, as WOFF2', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', (request) => requests.push(request.url()));
		await page.goto('/design-system/');
		await page.evaluate(() => document.fonts.ready);
		const fonts = requests.filter((url) => /\.(woff2?|ttf|otf)(\?|$)|fonts\./.test(url));
		expect(fonts.length).toBeGreaterThan(0);
		for (const url of fonts) expect(new URL(url).host).toBe('localhost:4329');
		for (const url of fonts) expect(url).toMatch(/\/fonts\/[^/]+\.woff2$/);
	});

	test('keeps the chosen mode across pages, and follows the system again', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/design-system/');
		const html = page.locator('html');
		await page.getByRole('radio', { name: 'Dark' }).check({ force: true });
		await expect(html).toHaveAttribute('data-mode', 'dark');
		await page.goto('/abhaertung/');
		await expect(html).toHaveAttribute('data-mode', 'dark');
		const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		expect(ground).toBe('rgb(21, 32, 48)');
		await page.goto('/design-system/');
		await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
		await page.getByRole('radio', { name: 'System' }).check({ force: true });
		await expect(html).not.toHaveAttribute('data-mode');
	});

	test('goes to the chosen language with the button, fetched on choosing', async ({ page }) => {
		await page.goto('/design-system/');
		const fetched = page.waitForRequest(/\/fonts\/noto-serif-sc-400-common-[0-9a-f]+\.woff2$/);
		await page.getByLabel('Language').selectOption({ label: '中文' });
		await fetched;
		await expect(page).toHaveURL(/\/design-system\/$/);
		await page.getByLabel('Language').selectOption({ label: 'Deutsch' });
		await page.getByRole('button', { name: 'Go' }).click();
		await expect(page).toHaveURL(/:\d+\/$/);
	});

	test('opens the sections in the native popover on narrow screens, without React', async ({
		page,
	}) => {
		const scripts: string[] = [];
		page.on('request', (request) => {
			if (request.resourceType() === 'script') scripts.push(request.url());
		});
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/design-system/');
		await page.mouse.wheel(0, 4000);
		await page.waitForTimeout(300);
		await page.mouse.wheel(0, -400);
		const button = page.locator('.where');
		await expect(button).toBeVisible();
		await expect(button).toHaveText(/Section \d of 8/);

		// The keyboard: Enter opens, Escape closes, focus returns
		const list = page.locator('#where-list');
		await button.focus();
		await page.keyboard.press('Enter');
		await expect(list).toBeVisible();
		await expect(list.locator('a[aria-current="location"]')).toHaveCount(1);
		await page.keyboard.press('Escape');
		await expect(list).toBeHidden();
		await expect(button).toBeFocused();

		// A section chosen closes it
		await button.click();
		await list.getByRole('link', { name: 'Colours' }).click();
		await expect(list).toBeHidden();
		await expect(page).toHaveURL(/#colours$/);

		expect(scripts.filter((url) => /react|client\.|SectionPopover/i.test(url))).toEqual([]);
	});
});
