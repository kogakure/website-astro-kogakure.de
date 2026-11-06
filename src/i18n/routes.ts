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
