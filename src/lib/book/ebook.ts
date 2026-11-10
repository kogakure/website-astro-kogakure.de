/**
 * The ebook and the PDF of the book (SI-504): built in the kogakure-book
 * repo, German and English, and published as GitHub releases of the public
 * repo kogakure/kogakure-book-releases (`just publish <version>`, SI-506).
 * A new release changes only RELEASE below: its version, its date, the
 * sizes `just publish` prints and the page counts of the screen PDFs.
 */

/** The book's languages: the website's other ten show the English page */
export const EBOOK_LANGS = ['de', 'en'] as const;
export type EbookLang = (typeof EBOOK_LANGS)[number];

export interface EbookFile {
	/** Bytes, as `just publish` lists them */
	size: number;
}

export interface Release {
	version: string;
	/** The day it was published */
	date: string;
	files: Record<EbookLang, { epub: EbookFile; pdf: EbookFile; pages: number }>;
}

export const RELEASE: Release = {
	version: '1.0.1',
	date: '2026-11-10',
	files: {
		de: { epub: { size: 69_400_055 }, pdf: { size: 38_613_308 }, pages: 525 },
		en: { epub: { size: 69_372_270 }, pdf: { size: 38_329_500 }, pages: 510 },
	},
};

export const RELEASES_REPO = 'https://github.com/kogakure/kogakure-book-releases';

/** Supporting the book: Ko-fi takes PayPal, cards, Apple Pay and Google Pay (SI-297) */
export const KOFI_URL = 'https://ko-fi.com/kogakure';

/** A file of a release, as `just publish` names it */
export const releaseFile = (version: string, file: string): string =>
	`${RELEASES_REPO}/releases/download/v${version}/${file}`;

export interface EbookDownload {
	lang: EbookLang;
	kind: 'epub' | 'pdf';
	href: string;
	size: number;
}

/** The two files of a language: the EPUB and the screen PDF */
export function ebookDownloads(lang: EbookLang, release: Release = RELEASE): EbookDownload[] {
	const { version, files } = release;
	return [
		{
			lang,
			kind: 'epub',
			href: releaseFile(version, `kogakure-${lang}-${version}.epub`),
			size: files[lang].epub.size,
		},
		{
			lang,
			kind: 'pdf',
			href: releaseFile(version, `kogakure-${lang}-screen-${version}.pdf`),
			size: files[lang].pdf.size,
		},
	];
}

/** The checksums of a release (`shasum -a 256 -c SHA256SUMS`) */
export const checksumsUrl = (release: Release = RELEASE): string =>
	releaseFile(release.version, 'SHA256SUMS');

/** Every release, older ones too */
export const RELEASES_URL = `${RELEASES_REPO}/releases`;

/**
 * The downloads page: not in the book, and it leads to the ebook before its
 * own downloads (with `ebookFree`, in its font subsets only)
 */
export const DOWNLOADS_PAGE = 'downloadsPage';

/**
 * Pages of the website that are not in the book, by translationKey: the
 * `exclude` of kogakure-book's book/config/book.yaml. Keep both in sync. The
 * book has its own preface (bookPrefacePage) instead of the website's.
 */
export const NOT_IN_EBOOK: ReadonlySet<string> = new Set([
	'chronolyPage',
	DOWNLOADS_PAGE,
	'colophonPage',
	'prefacePage',
	'notFoundPage',
]);

/** Whether a page of the website is a chapter of the ebook too */
export const isInEbook = (translationKey: string): boolean => !NOT_IN_EBOOK.has(translationKey);

/** The cover of a language, an image of the manifest (assets/ebook/, docs/images.md) */
export const ebookCover = (lang: EbookLang): string => `/images/ebook/${lang}/cover.jpg`;

/** The release's day in a language: „9. November 2026“, 2026년 11월 9일 */
export const releaseDate = (locale: string, release: Release = RELEASE): string =>
	new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
		new Date(release.date)
	);

/** 69.4 MB, in the language's number format */
export const megabytes = (bytes: number, locale: string): string =>
	`${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1e6)} MB`;
