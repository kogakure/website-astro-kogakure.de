import { expect, test } from '@playwright/test';

/** Printed, an article is ink on white paper, whole and at rest (global.css, prose.css) */
test.describe('print', () => {
	test.use({ colorScheme: 'dark' });

	test('an article prints in day colours on white, whatever the mode', async ({ page }) => {
		await page.goto('/koerperwaffen/');
		await page.getByRole('radio', { name: 'Dunkel' }).check();
		await page.emulateMedia({ media: 'print' });
		await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
		await expect(page.locator('.prose p').first()).toHaveCSS('color', 'rgb(22, 17, 12)');
		await expect(page.locator('.prose h2').first()).toHaveCSS('color', 'rgb(22, 17, 12)');
	});

	test('only the text prints: no bars, lists, switches or way on', async ({ page }) => {
		await page.goto('/koerperwaffen/');
		await page.emulateMedia({ media: 'print' });
		for (const selector of [
			'.skip-link',
			'[data-section-list]',
			'[data-mode-choice]',
			'[data-language-form]',
			'nav.after',
			'[data-lightbox]',
		]) {
			await expect(page.locator(selector).first(), selector).toBeHidden();
		}
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('every figure loads before printing and prints with its caption', async ({ page }) => {
		await page.goto('/koerperwaffen/');
		await page.emulateMedia({ media: 'print' });
		await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
		const figures = page.locator('.prose figure:visible');
		expect(await figures.count()).toBeGreaterThan(20);
		for (const figure of await figures.all()) {
			await expect(figure).toHaveCSS('break-inside', 'avoid');
			await expect(figure.locator('figcaption')).toBeVisible();
			const image = figure.locator('img');
			await expect(image).toHaveAttribute('loading', 'eager');
			await expect(image).toHaveCSS('opacity', '1');
			await expect
				.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
				.toBeGreaterThan(0);
		}
	});

	test('nothing moves on paper', async ({ page }) => {
		await page.goto('/');
		await page.emulateMedia({ media: 'print' });
		const motion = await page.evaluate(() =>
			[...document.querySelectorAll('*')].flatMap((element) =>
				[undefined, '::before', '::after'].map((part) => {
					const style = getComputedStyle(element, part);
					return [style.animationName, style.transitionDuration];
				})
			)
		);
		expect(motion.filter(([name, duration]) => name !== 'none' || duration !== '0s')).toEqual(
			[]
		);
	});

	test('headings stay with their text', async ({ page }) => {
		await page.goto('/koerperwaffen/');
		await page.emulateMedia({ media: 'print' });
		await expect(page.locator('.prose h2').first()).toHaveCSS('break-after', 'avoid');
	});

	test('a link shows its address, the book’s own pages on its domain', async ({ page }) => {
		await page.goto('/datenschutz/');
		await page.emulateMedia({ media: 'print' });
		const address = (href: string) =>
			page
				.locator(`.prose a[href="${href}"]`)
				.first()
				.evaluate((link) => getComputedStyle(link, '::after').content);
		expect(await address('/impressum/')).toBe('" (www.kogakure.de/impressum/)"');
		expect(await address('https://umami.is/')).toBe('" (https://umami.is/)"');
	});

	test('the subtitle on the opener prints in its box', async ({ page }) => {
		await page.goto('/koerperwaffen/');
		await page.emulateMedia({ media: 'print' });
		const box = page.locator('.plate-opener .subtitle > span');
		await expect(box).toHaveCSS('print-color-adjust', 'exact');
		await expect(box).toHaveCSS('background-color', 'rgb(22, 17, 12)');
		await expect(page.locator('.plate-opener .subtitle')).toHaveCSS('opacity', '1');
	});
});
