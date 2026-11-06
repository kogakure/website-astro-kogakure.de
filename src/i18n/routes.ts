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
