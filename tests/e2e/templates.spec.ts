import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const LANGS = ['de', 'en', 'es', 'fr', 'pt', 'it', 'nl', 'ru', 'ja', 'zh', 'ko', 'he'] as const;
type Lang = (typeof LANGS)[number];

const prefix = (lang: Lang) => (lang === 'de' ? '/' : `/${lang}/`);

/** One page of every type, in every language: German slugs at the root, English below the prefixes */
const PAGE_TYPES: Record<string, (lang: Lang) => string> = {
	home: prefix,
	contents: (lang) => prefix(lang) + (lang === 'de' ? 'inhalt/' : 'contents/'),
	article: (lang) => prefix(lang) + (lang === 'de' ? 'abhaertung/' : 'toughening-up/'),
	glossary: (lang) => prefix(lang) + (lang === 'de' ? 'glossar/' : 'glossary/'),
	chronology: (lang) => prefix(lang) + (lang === 'de' ? 'chronologie/' : 'chronology/'),
	downloads: (lang) => `${prefix(lang)}downloads/`,
	colophon: (lang) => prefix(lang) + (lang === 'de' ? 'kolophon/' : 'colophon/'),
	'not found': (lang) => (lang === 'de' ? '/404.html' : `/${lang}/404/`),
};

test.describe('language switch', () => {
	for (const [type, path] of Object.entries(PAGE_TYPES)) {
		test(`the ${type} page switches through all twelve languages to the same page`, async ({
			page,
		}) => {
			test.slow();
			await page.goto(path('de'));
			for (const lang of LANGS.slice(1)) {
				const target = path(lang);
				await page.locator('#language-select').selectOption(target);
				await page.locator('[data-language-form] button').click();
				await expect(page).toHaveURL(target);
				// The choice works once the page's script runs; before, it is a plain form
				await page.waitForLoadState('load');
				await expect(page.locator('html')).toHaveAttribute(
					'dir',
					lang === 'he' ? 'rtl' : 'ltr'
				);
			}
			// The reader's own choice is stored
			expect(await page.evaluate(() => localStorage.getItem('kogakure-lang'))).toBe('he');
		});
	}
});

test.describe('glossary', () => {
	test('the A–Z list jumps to a letter with the keyboard', async ({ page }) => {
		await page.goto('/glossar/');
		const letters = page.locator('[data-section-list]');
		await expect(letters.getByRole('heading', { name: 'Von A bis Z' })).toBeAttached();
		const k = letters.getByRole('link', { name: 'K', exact: true });
		await k.focus();
		await expect(k).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/#k$/);
		await expect(
			page.getByRole('heading', { level: 2, name: 'K', exact: true })
		).toBeInViewport();
	});

	test('every entry is an anchor with its term, kanji and meaning', async ({ page }) => {
		await page.goto('/glossar/#kamae');
		const entry = page.locator('#kamae');
		await expect(entry).toBeInViewport();
		await expect(entry.locator('dfn')).toHaveText('kamae');
		await expect(entry.locator('[lang="ja"]')).toHaveText('構え');
		await expect(entry.locator('q')).toHaveText('„Kampfstellungen“');
		expect(await page.locator('.entry').count()).toBe(760);
	});
});

test.describe('legal pages', () => {
	test('the colophon links the imprint and the privacy policy in every language', async ({
		page,
	}) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Impressum' }).click();
		await expect(page).toHaveURL('/impressum/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Impressum');

		await page.goto('/ja/');
		await expect(page.getByRole('link', { name: /^プライバシー\s*（英語）$/ })).toHaveAttribute(
			'href',
			'/ja/privacy/'
		);
	});

	test('another language keeps its own page around the English text', async ({ page }) => {
		await page.goto('/ja/imprint/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imprint');
		await expect(page.locator('.page-text')).toHaveAttribute('lang', 'en');
		// The way on stays Japanese: the contents, and the privacy policy from the text
		await expect(page.getByRole('link', { name: '目次', exact: true }).first()).toHaveAttribute(
			'href',
			'/ja/contents/'
		);
		await page.locator('.page-text').getByRole('link', { name: 'privacy policy' }).click();
		await expect(page).toHaveURL('/ja/privacy/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

		await page.goto('/he/privacy/');
		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
		await expect(page.locator('.page-text')).toHaveAttribute('dir', 'ltr');
	});

	test('the language switch leads from the German to the English version', async ({ page }) => {
		await page.goto('/datenschutz/');
		await page.locator('#language-select').selectOption('/en/privacy/');
		await page.locator('[data-language-form] button').click();
		await expect(page).toHaveURL('/en/privacy/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	for (const path of [
		'/impressum/',
		'/datenschutz/',
		'/en/imprint/',
		'/ja/privacy/',
		'/he/imprint/',
	]) {
		test(`${path} has no accessibility violations`, async ({ page }) => {
			await page.goto(path);
			const results = await new AxeBuilder({ page }).analyze();
			expect(results.violations).toEqual([]);
		});
	}
});

test.describe('mode', () => {
	test('a chosen mode holds across reloads and pages, before first paint', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');
		await page.getByRole('radio', { name: 'Dunkel' }).check();
		await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');

		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
		await expect(page.getByRole('radio', { name: 'Dunkel' })).toBeChecked();

		await page.goto('/abhaertung/');
		await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
		// The toolbar follows the mode: the reading page's indigo
		await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
			'content',
			'#152030'
		);

		await page.getByRole('radio', { name: 'System' }).check();
		await page.goto('/inhalt/');
		await expect(page.locator('html')).not.toHaveAttribute('data-mode', /./);
	});
});

test.describe('reading', () => {
	test('„Lesen“ resumes while the page is parsed, before any bundled script', async ({
		page,
	}) => {
		await page.goto('/');
		await page.evaluate(() =>
			localStorage.setItem(
				'kogakure-reading',
				JSON.stringify({ key: 'chronolyPage', lang: 'de', hash: '' })
			)
		);
		await page.route('**/_astro/*.js', (route) => route.abort());
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await expect(page.locator('[data-resume] a')).toHaveText('Lesen: Chronologie');
	});

	test('„Lesen“ starts at the beginning, then resumes at the last article', async ({ page }) => {
		await page.goto('/');
		const read = page.locator('[data-resume] a');
		await expect(read).toHaveAttribute('href', '/vorwort/');
		await expect(read).toHaveText('Lesen: Vorwort');

		await page.goto('/abhaertung/');
		const section = page.locator('[data-section-list] a').nth(1);
		const hash = (await section.getAttribute('href')) ?? '';
		await page.locator(hash).evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
		await expect(page.locator('[data-section-list] a[aria-current]')).toHaveAttribute(
			'href',
			hash
		);

		await page.goto('/');
		await expect(read).toHaveAttribute('href', `/abhaertung/${hash}`);
		await expect(read).toHaveText('Lesen: Abhärtung');

		// In another language: the same article, without the German section id
		await page.goto('/en/');
		await expect(read).toHaveAttribute('href', '/en/toughening-up/');
	});

	test('an article leads back to its part on the homepage', async ({ page }) => {
		await page.goto('/abhaertung/');
		await page.getByRole('link', { name: 'Zurück zu Körperliches Training' }).click();
		await expect(page).toHaveURL('/#koerperliches-training');
		await expect(page.locator('#koerperliches-training h2')).toHaveText(
			'Körperliches Training'
		);
		await page
			.locator('#koerperliches-training')
			.getByRole('link', { name: 'Abhärtung', exact: true })
			.click();
		await expect(page).toHaveURL('/abhaertung/');
	});
});

test.describe('every page type in every language', () => {
	for (const lang of LANGS) {
		test(`${lang}: no horizontal scrolling at 390 px`, async ({ page }) => {
			await page.setViewportSize({ width: 390, height: 844 });
			for (const path of Object.values(PAGE_TYPES)) {
				await page.goto(path(lang));
				const overflow = await page.evaluate(
					() =>
						document.documentElement.scrollWidth - document.documentElement.clientWidth
				);
				expect(overflow, path(lang)).toBe(0);
			}
		});
	}

	for (const lang of ['de', 'he', 'ja'] as const) {
		for (const [type, path] of Object.entries(PAGE_TYPES)) {
			test(`${lang} ${type} page has no accessibility violations`, async ({ page }) => {
				// The settled page: axe can't judge contrast mid-animation
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.goto(path(lang));
				const results = await new AxeBuilder({ page }).analyze();
				expect(results.violations).toEqual([]);
			});
		}
	}
});

test('the vortex of the prologue drifts once and comes to rest', async ({ page }) => {
	await page.goto('/');
	const motion = await page.evaluate(() => {
		const vortex = document.querySelector('.vortex');
		if (!vortex) return [];
		return (['::before', '::after'] as const).map((part) => {
			const style = getComputedStyle(vortex, part);
			return [style.animationName, style.animationDuration, style.animationIterationCount];
		});
	});
	expect(motion).toEqual([
		['drift-wash', '3.4s', '1'],
		['drift-ink', '3.4s', '1'],
	]);
});

test.describe('images', () => {
	test('a plate opens whole in the lightbox and closes back into its edge', async ({ page }) => {
		await page.goto('/niedergang/');
		const opener = page.getByRole('button', { name: /^Bild vergrößern: / }).first();
		await opener.focus();
		await page.keyboard.press('Enter');
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(page.getByRole('button', { name: 'Schließen' })).toBeFocused();
		await expect(dialog.locator('.lightbox-caption')).toHaveText(
			'Tokugawa wird durch die Berge geführt'
		);
		// The whole painting: the frame takes the original's proportion
		const frame = dialog.locator('[data-lightbox-frame]');
		await expect(frame).toHaveClass(/is-whole/);
		const box = await frame.boundingBox();
		expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1536 / 1024, 1);

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(opener).toBeFocused();
	});

	test('a figure of the text opens too, and closes with a click', async ({ page }) => {
		await page.goto('/koerperwaffen/');
		await page.locator('figure[data-kind="ken"] .lightbox-trigger').first().click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await dialog.locator('[data-lightbox-frame]').click();
		await expect(dialog).toBeHidden();
	});

	test('a plate scaled inside its edge closes back onto the edge, not the scaled image', async ({
		page,
	}) => {
		await page.goto('/');
		const plate = page.locator('#koerperliches-training .plate-art');
		await plate.scrollIntoViewIfNeeded();
		const edge = await plate.boundingBox();
		await plate.locator('.lightbox-trigger').click();
		await expect(page.locator('[data-lightbox-frame]')).toHaveClass(/is-whole/);
		// Where closing ends: the last keyframe, set as the close button is clicked
		const end = await page.evaluate(() => {
			const lightbox = document.querySelector('[data-lightbox]');
			lightbox?.querySelector<HTMLButtonElement>('[data-lightbox-close]')?.click();
			const [move] = lightbox?.querySelector('[data-lightbox-frame]')?.getAnimations() ?? [];
			const keyframes = (move?.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
			const { width, height } = keyframes.at(-1) ?? { width: 0, height: 0 };
			return {
				width: Number.parseFloat(String(width)),
				height: Number.parseFloat(String(height)),
			};
		});
		expect(end.width).toBeCloseTo(edge?.width ?? 0, 0);
		expect(end.height).toBeCloseTo(edge?.height ?? 0, 0);
		// The name plate waits until the painting is back in its edge
		const name = page.locator('#koerperliches-training .plate-name');
		await expect(name).toBeHidden();
		await expect(page.getByRole('dialog')).toBeHidden();
		await expect(name).toBeVisible();
		await expect(name).toHaveCSS('opacity', '1');
	});

	test('no soft hyphen shows as text', async ({ page }) => {
		for (const path of ['/', '/inhalt/', '/trainingsfaktoren/', '/en/', '/en/contents/']) {
			await page.goto(path);
			await expect(page.locator('body')).not.toContainText('&shy;');
			expect(await page.title()).not.toContain('­');
		}
	});
});
