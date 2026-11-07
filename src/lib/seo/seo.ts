/**
 * What search engines and link previews read (SI-478): the page title, the
 * canonical URL, the hreflang alternates, the sitemap and the structured
 * data (JSON-LD). Pure functions; `PageMeta.astro` writes them into the
 * head, `src/pages/sitemap.xml.ts` into the sitemap.
 */
import {
	DEFAULT_LANG,
	FALLBACK_LANG,
	LANGUAGES,
	language,
	type Lang,
} from '../../i18n/languages.ts';
import { homePath } from '../../i18n/routes.ts';
import { ui } from '../../i18n/ui.ts';
import { BOOK_PLATE } from '../book/plates.ts';

export const SITE_URL = 'https://www.kogakure.de';

/**
 * Every page is `noindex` until the launch. SI-482 sets this to true when
 * the site goes live; robots.txt and the sitemap are ready before.
 */
export const INDEXABLE = false;

/** The book's name: 木隠 Kogakure */
export const SITE_NAME = `${BOOK_PLATE.name} ${BOOK_PLATE.romaji}`;

/** The year the book went online */
export const SINCE = 1999;

export const AUTHOR = { name: 'Stefan Imhoff', url: 'https://www.stefanimhoff.de/' } as const;

/** Some of the twelve language versions of a page: the legal pages exist as text only in German and English */
export type PageVersions = Partial<Record<Lang, string>>;

export const absoluteUrl = (path: string): string => new URL(path, SITE_URL).href;

/**
 * The old site's pattern: `Kamae · 木隠 · Ninja, Ninjutsu & Kampfkunst`;
 * the homepage `木隠 Kogakure · Ninja, Ninjutsu & Kampfkunst`
 */
export const pageTitle = (lang: Lang, title?: string): string =>
	title
		? `${title} · ${BOOK_PLATE.name} · ${ui(lang).topic}`
		: `${SITE_NAME} · ${ui(lang).topic}`;

export interface Hreflang {
	hreflang: string;
	href: string;
}

/**
 * The language versions of a page for `<link rel="alternate">` and the
 * sitemap, and `x-default`: the English version, where `/` sends readers
 * whose browser asks for none of the twelve languages
 */
export function hreflangs(versions: PageVersions): Hreflang[] {
	const links = LANGUAGES.flatMap(({ code, htmlLang }) => {
		const path = versions[code];
		return path ? [{ hreflang: htmlLang, href: absoluteUrl(path) }] : [];
	});
	const fallback = versions[FALLBACK_LANG];
	return fallback ? [...links, { hreflang: 'x-default', href: absoluteUrl(fallback) }] : links;
}

const XML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;',
};

const xml = (value: string): string => value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c);

/** Every version of every page group is one `<url>`, with all versions of its group as alternates */
export function sitemapXml(groups: readonly PageVersions[]): string {
	const urls = groups.flatMap((versions) => {
		const links = hreflangs(versions)
			.map(
				({ hreflang, href }) =>
					`\t\t<xhtml:link rel="alternate" hreflang="${xml(hreflang)}" href="${xml(href)}"/>`
			)
			.join('\n');
		return LANGUAGES.flatMap(({ code }) => {
			const path = versions[code];
			return path
				? [`\t<url>\n\t\t<loc>${xml(absoluteUrl(path))}</loc>\n${links}\n\t</url>`]
				: [];
		});
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		'',
	].join('\n');
}

type JsonLd = Record<string, unknown>;

const author = { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url };

/** The book of a language, referenced by its articles */
export const bookId = (lang: Lang): string => `${absoluteUrl(homePath(lang))}#book`;

const bookRef = (lang: Lang) => ({
	'@type': 'Book',
	'@id': bookId(lang),
	name: SITE_NAME,
	url: absoluteUrl(homePath(lang)),
});

/** The site is a book, in every language: on the homepages. The German one is the original */
export function bookJsonLd(lang: Lang, image?: string): JsonLd {
	return {
		'@context': 'https://schema.org',
		...bookRef(lang),
		alternateName: BOOK_PLATE.romaji,
		description: ui(lang).subtitle,
		inLanguage: language(lang).htmlLang,
		bookFormat: 'https://schema.org/EBook',
		author,
		copyrightHolder: author,
		copyrightYear: SINCE,
		datePublished: String(SINCE),
		isAccessibleForFree: true,
		...(image && { image: absoluteUrl(image) }),
		...(lang !== DEFAULT_LANG && { translationOfWork: bookRef(DEFAULT_LANG) }),
	};
}

export interface ArticleData {
	lang: Lang;
	path: string;
	title: string;
	description?: string | undefined;
	image?: string | undefined;
	published?: Date | undefined;
}

/** An article of the book */
export function articleJsonLd({
	lang,
	path,
	title,
	description,
	image,
	published,
}: ArticleData): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: title,
		...(description && { description }),
		url: absoluteUrl(path),
		mainEntityOfPage: absoluteUrl(path),
		inLanguage: language(lang).htmlLang,
		author,
		...(image && { image: [absoluteUrl(image)] }),
		...(published && { datePublished: published.toISOString() }),
		isPartOf: bookRef(lang),
	};
}

export interface Crumb {
	name: string;
	/** Left out on the last crumb, the page itself */
	path?: string;
}

/** The way from the book to the page */
export const breadcrumbJsonLd = (crumbs: readonly Crumb[]): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: crumbs.map(({ name, path }, i) => ({
		'@type': 'ListItem',
		position: i + 1,
		name,
		...(path && { item: absoluteUrl(path) }),
	})),
});

/** JSON for a `<script type="application/ld+json">`: no `</script>` can end it early */
export const jsonLdScript = (data: JsonLd): string => JSON.stringify(data).replace(/</g, '\\u003c');
