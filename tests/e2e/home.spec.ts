import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('German homepage', () => {
	test('renders in German with the title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/木隠/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('木隠 Kogakure');
	});

	test('skip link moves focus to the main content', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');
		const skipLink = page.getByRole('link', { name: 'Zum Text' });
		await expect(skipLink).toBeFocused();
		await skipLink.press('Enter');
		await expect(page).toHaveURL(/#main$/);
	});

	test('has no accessibility violations', async ({ page }) => {
		await page.goto('/');
		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});
});

test('unknown pages show the 404 page', async ({ page }) => {
	const response = await page.goto('/gibt-es-nicht/');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seite nicht gefunden');
});
