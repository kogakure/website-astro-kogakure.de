import { expect, test, type Page } from '@playwright/test';

/** The look of every page type, locked (SI-481): `pnpm test:screenshots`, never `pnpm test:e2e` */
const LANGS = ['de', 'en', 'he', 'ja'] as const;
type Lang = (typeof LANGS)[number];

const prefix = (lang: Lang) => (lang === 'de' ? '/' : `/${lang}/`);

/** The parts of the book have no pages of their own: a part is its scene on the homepage */
const PAGE_TYPES: Record<string, { path: (lang: Lang) => string; element?: string }> = {
	home: { path: prefix },
	article: { path: (lang) => prefix(lang) + (lang === 'de' ? 'abhaertung/' : 'toughening-up/') },
	chapter: {
		path: prefix,
		element: '.scene:is(#koerperliches-training, #body-training)',
	},
	contents: { path: (lang) => prefix(lang) + (lang === 'de' ? 'inhalt/' : 'contents/') },
	glossary: { path: (lang) => prefix(lang) + (lang === 'de' ? 'glossar/' : 'glossary/') },
	'not-found': { path: (lang) => (lang === 'de' ? '/404.html' : `/${lang}/404/`) },
};

/** Fonts set, the ink masks (CSS, not in document.images) loaded, the images in view decoded */
const settled = async (page: Page) => {
	await page.evaluate(async () => {
		const masks = new Set<string>();
		for (const element of document.querySelectorAll('*')) {
			for (const part of [null, '::before', '::after']) {
				const { maskImage } = getComputedStyle(element, part);
				for (const [, url] of maskImage.matchAll(/url\("([^"]+)"\)/g)) masks.add(url ?? '');
			}
		}
		const decoded = [...masks].map((url) => {
			const image = new Image();
			image.src = url;
			return image.decode();
		});
		await Promise.all([...decoded, document.fonts.ready]);
	});
	await page.waitForFunction(() =>
		[...document.images]
			.filter((image) => {
				const box = image.getBoundingClientRect();
				return box.bottom > 0 && box.top < innerHeight && box.width > 0;
			})
			.every((image) => image.complete && image.naturalWidth > 0)
	);
};

for (const mode of ['light', 'dark'] as const) {
	test.describe(mode, () => {
		// Reduced motion: every page at rest, as it settles after its motion
		test.use({ colorScheme: mode, reducedMotion: 'reduce' });

		for (const lang of LANGS) {
			for (const [type, { path, element }] of Object.entries(PAGE_TYPES)) {
				test(`${type} ${lang}`, async ({ page }) => {
					await page.goto(path(lang));
					if (element) {
						const scene = page.locator(element);
						await scene.scrollIntoViewIfNeeded();
						await settled(page);
						await expect(scene).toHaveScreenshot(`${type}-${lang}-${mode}.png`);
					} else {
						await settled(page);
						await expect(page).toHaveScreenshot(`${type}-${lang}-${mode}.png`);
					}
				});
			}
		}
	});
}
