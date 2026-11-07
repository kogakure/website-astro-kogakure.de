import { expect, test } from '@playwright/test';

/**
 * Performance budgets (SI-481): what one page of each type loads, measured
 * in the browser. Sizes as served by the preview server, uncompressed. The
 * search loads its code only when it is opened, so it counts for no page.
 */
const KB = 1024;

/** The page's own code (about 4 KB): the search button, the section list, the reading position */
const JAVASCRIPT = 10 * KB;

/**
 * Fonts: the subsets a page sets (docs/fonts.md); CJK sets hundreds of glyphs
 * more. Close to today's largest pages: new kanji in a text can call for more
 */
const FONTS = { latin: 230 * KB, cjk: 380 * KB };
/** The glossary sets every term, kanji and meaning on one page */
const GLOSSARY_FONTS = { latin: 330 * KB, cjk: 530 * KB };

/**
 * The painting that is the largest contentful paint: the opener, the
 * homepage's first plate. The opener is the whole painting shown as a band:
 * Abhärtung's at 1400 px is 472 KB, a crop of the band would be about half
 * (docs/testing.md, Lighthouse)
 */
const LCP_IMAGE = 500 * KB;

const LANGS = ['de', 'en', 'ru', 'he', 'ja', 'zh', 'ko'] as const;
type Lang = (typeof LANGS)[number];
const CJK: readonly Lang[] = ['ja', 'zh', 'ko'];

const prefix = (lang: Lang) => (lang === 'de' ? '/' : `/${lang}/`);
const slug = (german: string, english: string) => (lang: Lang) =>
	prefix(lang) + (lang === 'de' ? german : english);

/** `painting`: the opener is the largest contentful paint (the homepage's plate is only on a wide screen) */
const PAGE_TYPES: Record<string, { path: (lang: Lang) => string; painting?: true }> = {
	home: { path: prefix },
	contents: { path: slug('inhalt/', 'contents/') },
	article: { path: slug('abhaertung/', 'toughening-up/'), painting: true },
	'long article': { path: slug('koerperwaffen/', 'body-weapons/'), painting: true },
	glossary: { path: slug('glossar/', 'glossary/'), painting: true },
	chronology: { path: slug('chronologie/', 'chronology/'), painting: true },
	'not found': {
		path: (lang) => (lang === 'de' ? '/404.html' : `/${lang}/404/`),
		painting: true,
	},
};

interface Measured {
	javascript: number;
	fonts: number;
	lcp?: { url: string; size: number } | undefined;
}

for (const [type, { path, painting }] of Object.entries(PAGE_TYPES)) {
	test.describe(`${type} page`, () => {
		for (const lang of LANGS) {
			test(`${lang} stays within its budgets`, async ({ page }) => {
				await page.addInitScript(() => {
					const entries: string[] = [];
					Object.assign(window, { lcpEntries: entries });
					new PerformanceObserver((list) => {
						for (const entry of list.getEntries()) {
							entries.push((entry as PerformanceEntry & { url: string }).url);
						}
					}).observe({ type: 'largest-contentful-paint', buffered: true });
				});
				await page.goto(path(lang), { waitUntil: 'networkidle' });
				const measured = await page.evaluate((): Measured => {
					const resources = performance.getEntriesByType(
						'resource'
					) as PerformanceResourceTiming[];
					const sum = (matches: (entry: PerformanceResourceTiming) => boolean) =>
						resources
							.filter(matches)
							.reduce((total, entry) => total + entry.encodedBodySize, 0);
					const lcpUrl = (window as unknown as { lcpEntries: string[] }).lcpEntries.at(
						-1
					);
					const lcp = lcpUrl
						? resources.find((entry) => entry.name === lcpUrl)
						: undefined;
					return {
						javascript: sum((entry) => new URL(entry.name).pathname.endsWith('.js')),
						fonts: sum((entry) => new URL(entry.name).pathname.endsWith('.woff2')),
						lcp: lcp && { url: lcp.name, size: lcp.encodedBodySize },
					};
				});
				const script = CJK.includes(lang) ? 'cjk' : 'latin';
				expect.soft(measured.javascript, 'JavaScript').toBeLessThanOrEqual(JAVASCRIPT);
				expect
					.soft(measured.fonts, 'fonts')
					.toBeLessThanOrEqual((type === 'glossary' ? GLOSSARY_FONTS : FONTS)[script]);
				// A painting that stops being the largest paint would leave its budget unchecked
				if (painting) expect.soft(measured.lcp, 'the opener as LCP').toBeDefined();
				if (measured.lcp) {
					expect.soft(measured.lcp.size, measured.lcp.url).toBeLessThanOrEqual(LCP_IMAGE);
				}
			});
		}
	});
}
