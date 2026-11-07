/**
 * Lighthouse on every page type (SI-481), against the production image,
 * which compresses and caches as the live site does (docs/testing.md):
 *
 *   pnpm docker:build && pnpm docker:run
 *   pnpm lighthouse            # mobile, the report in .unlighthouse/
 *   pnpm lighthouse --desktop
 */
const LANGS = ['de', 'en', 'he', 'ja', 'zh'] as const;

const prefix = (lang: string) => (lang === 'de' ? '/' : `/${lang}/`);
const slug = (lang: string, german: string, english: string) =>
	prefix(lang) + (lang === 'de' ? german : english);

/** Lighthouse's own desktop network: with `throttle`, Unlighthouse would take the phone's slow 4G */
const desktop = process.argv.includes('--desktop');
const DESKTOP_THROTTLING = {
	rttMs: 40,
	throughputKbps: 10 * 1024,
	cpuSlowdownMultiplier: 1,
	requestLatencyMs: 0,
	downloadThroughputKbps: 0,
	uploadThroughputKbps: 0,
};

export default {
	site: 'http://localhost:8080',
	// Every page type in Latin, Hebrew and CJK type; no crawl through 985 pages
	urls: LANGS.flatMap((lang) => [
		prefix(lang),
		slug(lang, 'inhalt/', 'contents/'),
		slug(lang, 'abhaertung/', 'toughening-up/'),
		slug(lang, 'koerperwaffen/', 'body-weapons/'),
		slug(lang, 'glossar/', 'glossary/'),
		slug(lang, 'chronologie/', 'chronology/'),
		slug(lang, 'kolophon/', 'colophon/'),
		`${prefix(lang)}downloads/`,
		slug(lang, 'impressum/', 'imprint/'),
		`${prefix(lang)}offline/`,
		// The 404 page by its own URL, as a scan skips pages that answer 404;
		// nginx serves the German one only as the answer to a missing page
		...(lang === 'de' ? [] : [`/${lang}/404/`]),
	]),
	// A German browser: elsewhere the first visit to / goes on to its language (docs/seo.md)
	puppeteerOptions: { args: ['--lang=de-DE'] },
	// One page at a time, so the pages don't slow each other down
	puppeteerClusterOptions: { maxConcurrency: 1 },
	...(desktop && { lighthouseOptions: { throttling: DESKTOP_THROTTLING } }),
	scanner: {
		// Simulated: by default a mid-range phone on slow 4G
		throttle: true,
		sitemap: false,
		robotsTxt: false,
		crawler: false,
		// Every URL is its own page type: no sampling of similar paths
		dynamicSampling: false,
		samples: 1,
	},
	ci: {
		buildStatic: true,
		reporter: 'jsonExpanded',
	},
	outputPath: '.unlighthouse',
};
