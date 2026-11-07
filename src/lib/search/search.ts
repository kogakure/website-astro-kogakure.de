/**
 * The search across the book (SI-479), with Pagefind: the build indexes
 * every article per language (Pagefind splits by `<html lang>`) and each
 * glossary entry as a result of its own; the dialog (SearchDialog.tsx)
 * loads Pagefind only when it opens. Shared by the build
 * (src/integrations/search.ts), the client directive and the dialog, so
 * nothing here imports the book; the glossary's records are in records.ts.
 */
/** Where the build writes Pagefind's bundle, below `dist/` */
export const PAGEFIND_DIR = 'pagefind';

/** Pagefind's browser module; there is no such file before a build (the dev stub stands in) */
export const PAGEFIND_URL = `/${PAGEFIND_DIR}/pagefind.js`;

/** Results shown at a time: the book has 76 articles and 760 glossary entries */
export const RESULT_LIMIT = 10;

/** `data-pagefind-meta` key of the article's part of the book („Kapitel“) */
export const CHAPTER_META = 'chapter';

/** Elements left out of the index: the navigation, and what screen readers skip (plate kanji, a margin gloss's repeated term) */
export const EXCLUDED = ['nav', '[aria-hidden="true"]'];

/** One result, as the dialog shows it */
export interface SearchResult {
	url: string;
	title: string;
	/** The part of the book, or the glossary for its entries */
	chapter?: string | undefined;
	/** HTML: Pagefind's excerpt, the words found in `<mark>` */
	excerpt: string;
}

/** What `pagefind.js` exports, as far as the dialog uses it */
export interface Pagefind {
	init: () => Promise<void>;
	options?: (options: Record<string, unknown>) => Promise<void>;
	/** `null` when a newer search superseded this one */
	debouncedSearch: (
		query: string,
		options?: Record<string, unknown>,
		timeout?: number
	) => Promise<{ results: { data: () => Promise<PagefindData> }[] } | null>;
}

export interface PagefindData {
	url: string;
	meta: Record<string, string | undefined>;
	excerpt: string;
}

export const toResult = ({ url, meta, excerpt }: PagefindData): SearchResult => ({
	url,
	title: meta.title ?? url,
	chapter: meta[CHAPTER_META],
	excerpt,
});

/** Where a `/` is typed, not a shortcut */
const FIELDS =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]';

/**
 * Whether a key press is the `/` shortcut: no modifier (Shift and AltGr
 * aside, which some layouts need for the slash), not while typing in a
 * field, and not while a dialog is open (the search itself, the lightbox)
 */
export function isSearchShortcut(event: KeyboardEvent): boolean {
	if (event.key !== '/' || event.defaultPrevented || event.isComposing) return false;
	const altGraph = event.getModifierState?.('AltGraph') ?? false;
	if (event.metaKey || ((event.ctrlKey || event.altKey) && !altGraph)) return false;
	if ((event.target as HTMLElement | null)?.closest?.(FIELDS)) return false;
	return (
		typeof document === 'undefined' || !document.querySelector('dialog[open], [role="dialog"]')
	);
}
