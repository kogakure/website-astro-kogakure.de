/**
 * The URL scheme. It keeps the URLs of the old site:
 *
 *   de       /<german-slug>/
 *   en       /en/<english-slug>/
 *   others   /<lang>/<english-slug>/
 *
 * The slug is the file name in kogakure-texts; translations use the English
 * file name, so the slug alone never says which language a page is in.
 */
import { DEFAULT_LANG, type Lang } from './languages.ts';

/** `/` for German, `/en/` for English, … */
export const homePath = (lang: Lang): string => (lang === DEFAULT_LANG ? '/' : `/${lang}/`);

export const pagePath = (lang: Lang, slug: string): string => `${homePath(lang)}${slug}/`;

/** A path as the param of a rest route: `/en/kamae/` → `en/kamae` */
export const routeParam = (path: string): string => path.replace(/^\/|\/$/g, '');

/** The 404 page of a language (nginx serves it for unknown URLs below the prefix) */
export const notFoundPath = (lang: Lang): string =>
	lang === DEFAULT_LANG ? '/404.html' : `/${lang}/404/`;

/** The offline page's slug: its URL and its own font subsets (SI-480) */
export const OFFLINE_SLUG = 'offline';

/** The offline page of a language: the service worker shows it for a page not saved on the device */
export const offlinePath = (lang: Lang): string => pagePath(lang, OFFLINE_SLUG);

/**
 * Pages outside the book, by translationKey, with their own route instead of
 * `/<slug>/`. They are not in the TOC, the book order, previous/next, the
 * sitemap or the search index.
 */
const OWN_ROUTES: Record<string, (lang: Lang) => string> = {
	notFoundPage: notFoundPath,
};

export const isInBook = (translationKey: string): boolean =>
	!Object.hasOwn(OWN_ROUTES, translationKey);

/** The URL of a content page */
export const routeOf = (lang: Lang, slug: string, translationKey: string): string =>
	OWN_ROUTES[translationKey]?.(lang) ?? pagePath(lang, slug);

/** The legal pages, by key: their slugs in German and English */
export const LEGAL_PAGES = {
	imprint: { de: 'impressum', en: 'imprint' },
	privacy: { de: 'datenschutz', en: 'privacy' },
} as const;

export type LegalPage = keyof typeof LEGAL_PAGES;

/** The legal pages are written in German and English; the other languages show the English text */
export const legalLang = (lang: Lang): 'de' | 'en' => (lang === DEFAULT_LANG ? 'de' : 'en');

/**
 * `/impressum/`, `/en/imprint/`, `/ja/imprint/`: every language has the page
 * below its own prefix, so the way on stays in the reader's language
 */
export const legalPath = (lang: Lang, page: LegalPage): string =>
	pagePath(lang, LEGAL_PAGES[page][legalLang(lang)]);

/**
 * The ebook's page (SI-504): its slugs in German and English. The book
 * prints these URLs on its last page and in its QR code (kogakure-book,
 * SI-503), so they must never change: /buch/ and /en/book/
 */
export const EBOOK_SLUGS = { de: 'buch', en: 'book' } as const;

/** Route key of the ebook's page in the alternates map */
export const EBOOK = 'ebook';

/**
 * `/buch/`, `/en/book/`, `/ja/book/`: every language has the page below its
 * own prefix; its text is German or English, like the legal pages
 */
export const ebookPath = (lang: Lang): string => pagePath(lang, EBOOK_SLUGS[legalLang(lang)]);

/** Route key of the language homepages in the alternates map */
export const HOME = 'home';

/** Route key of the contents pages in the alternates map */
export const CONTENTS = 'contents';

/** `/inhalt/` in German, `/en/contents/`, `/ja/contents/`, … */
export const contentsPath = (lang: Lang): string =>
	pagePath(lang, lang === DEFAULT_LANG ? 'inhalt' : 'contents');

const TRANSLITERATION: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/**
 * The id of a part's scene on the homepage, from its title: German from the
 * German title, every other language from the English one, like the
 * articles' slugs (`Organisation & Ausbildung` → `organisation-und-ausbildung`)
 */
export const chapterSlug = (title: string, lang: Lang): string =>
	title
		.toLowerCase()
		.replace(/[äöüß]/g, (c) => TRANSLITERATION[c] ?? c)
		.replace(/&/g, lang === DEFAULT_LANG ? 'und' : 'and')
		.normalize('NFD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
