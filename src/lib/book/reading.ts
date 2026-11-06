/**
 * The reader's place in the book, for „Lesen“ on the homepage: the last
 * article opened and the section read in it, kept in localStorage. Browser
 * only (ReadingPosition.astro writes it, ResumeLink.astro reads it).
 */

export const READING_KEY = 'kogakure-reading';

export interface ReadingPosition {
	/** The article's translationKey: the same in every language */
	key: string;
	/** The language it was read in: the section's id holds only there */
	lang: string;
	/** The section, `#…`, or empty before the first heading */
	hash: string;
}

const isPosition = (value: unknown): value is ReadingPosition =>
	typeof value === 'object' &&
	value !== null &&
	['key', 'lang', 'hash'].every(
		(field) => typeof (value as Record<string, unknown>)[field] === 'string'
	);

export function savePosition(position: ReadingPosition) {
	try {
		localStorage.setItem(READING_KEY, JSON.stringify(position));
	} catch {
		// private mode: „Lesen“ starts at the beginning of the book
	}
}

export function loadPosition(): ReadingPosition | null {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(READING_KEY) ?? 'null');
		return isPosition(value) ? value : null;
	} catch {
		return null;
	}
}

/** An article of the homepage's language: its URL and title */
export type ArticleLinks = Record<string, [href: string, title: string]>;

/**
 * Where „Lesen“ leads in a language: the stored article in that language,
 * at its section if it was read in the same language; null without a
 * position (the start of the book)
 */
export function resumeTarget(
	position: ReadingPosition | null,
	lang: string,
	articles: ArticleLinks
): { href: string; title: string } | null {
	const article = position && articles[position.key];
	if (!article) return null;
	const [href, title] = article;
	return { href: position.lang === lang ? href + position.hash : href, title };
}
