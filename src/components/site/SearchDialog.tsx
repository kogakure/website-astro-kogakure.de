/**
 * The search across the book: a dialog with a field and the results (title,
 * chapter, excerpt) in the page's language only, since Pagefind loads the
 * index of `<html lang>`. Loaded by `client:search` (Search.astro) when a
 * search button or `/` asks for it; Pagefind itself loads when it opens.
 * The arrow keys move between the field and the results, Enter in the field
 * opens the first result of what it says. Base UI traps the focus and
 * returns it on close.
 */
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type MouseEvent,
} from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Lang } from '@/i18n/languages';
import { ui } from '@/i18n/ui';
import { EVENTS, trackEvent } from '@/lib/analytics/analytics';
import {
	isSearchShortcut,
	PAGEFIND_URL,
	RESULT_LIMIT,
	toResult,
	type Pagefind,
	type PagefindData,
	type SearchResult,
} from '@/lib/search/search';
import './SearchDialog.css';

interface Props {
	lang: Lang;
}

type Hit = { data: () => Promise<PagefindData> };

/** A search's matches and the field's text they match */
interface Found {
	text: string;
	hits: Hit[];
}

/** The results shown and the matches they come from */
interface Shown {
	hits: Hit[];
	items: SearchResult[];
}

/** Milliseconds Pagefind waits for the reader to stop typing */
const DEBOUNCE = 200;

let pagefind: Promise<Pagefind> | undefined;

/** Pagefind's module, loaded and initialised once; a failed load is tried again next time */
function loadPagefind(): Promise<Pagefind> {
	pagefind ??= (import(/* @vite-ignore */ PAGEFIND_URL) as Promise<Pagefind>)
		.then(async (module) => {
			await module.init();
			return module;
		})
		.catch((error: unknown) => {
			pagefind = undefined;
			throw error;
		});
	return pagefind;
}

/** The search button that is shown */
const shownTrigger = (): HTMLElement | null =>
	[...document.querySelectorAll<HTMLElement>('[data-search-trigger]')].find(
		(trigger) => trigger.offsetParent !== null
	) ?? null;

/** Where the focus goes back to: what had it when the dialog opened */
function focused(): HTMLElement | null {
	const active = document.activeElement;
	return active instanceof HTMLElement && active !== document.body ? active : null;
}

/** Opened by the search button or `/` that loaded this island (client:search); never on the server */
const pending = () =>
	typeof document !== 'undefined' && document.querySelector('[data-search-pending]') !== null;

const plainClick = (event: MouseEvent) =>
	event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export default function SearchDialog({ lang }: Props) {
	const t = ui(lang);
	const [open, setOpen] = useState(pending);
	// Opened at once: the focus goes back to what had it when the reader asked
	const [opener] = useState(() => (pending() ? focused() : null));
	const [query, setQuery] = useState('');
	/** The last search's matches; `null` before the first */
	const [search, setSearch] = useState<Found | null>(null);
	const [limit, setLimit] = useState(RESULT_LIMIT);
	const [results, setResults] = useState<Shown | null>(null);
	const [failed, setFailed] = useState(false);
	const input = useRef<HTMLInputElement>(null);
	const list = useRef<HTMLOListElement>(null);
	const returnTo = useRef<HTMLElement | null>(opener);
	/** A result chosen: the page to go to once the dialog has closed */
	const destination = useRef<string | null>(null);
	/** „Weitere Treffer“ pressed: the first new result takes the focus (the button may go) */
	const focusResult = useRef<number | null>(null);

	const show = useCallback(() => {
		returnTo.current = focused();
		setOpen(true);
	}, []);

	// Opened again by the search buttons and `/`
	useEffect(() => {
		const onClick = (event: globalThis.MouseEvent) => {
			if (!(event.target as Element | null)?.closest?.('[data-search-trigger]')) return;
			event.preventDefault();
			show();
		};
		const onKey = (event: globalThis.KeyboardEvent) => {
			if (!isSearchShortcut(event)) return;
			event.preventDefault();
			show();
		};
		document.addEventListener('click', onClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onClick);
			document.removeEventListener('keydown', onKey);
		};
	}, [show]);

	const text = query.trim();
	// An empty field shows nothing; while the reader types, the last search stays
	const found = text && search ? search.hits : null;
	const shown = found && results ? results.items : [];
	/** The results shown are those of what the field says */
	const current = search?.text === text && results?.hits === search.hits;

	// Searches as the reader types; Pagefind drops the searches typed over
	useEffect(() => {
		if (!open || !text) return;
		const stale = new AbortController();
		loadPagefind()
			.then((module) => module.debouncedSearch(text, {}, DEBOUNCE))
			.then((response) => {
				if (stale.signal.aborted || !response) return;
				setSearch({ text, hits: response.results });
				setLimit(RESULT_LIMIT);
			})
			.catch((error: unknown) => {
				if (stale.signal.aborted) return;
				console.error('Search failed', error);
				setFailed(true);
			});
		return () => stale.abort();
	}, [text, open]);

	// The data of the results shown
	useEffect(() => {
		if (!search) return;
		const { hits } = search;
		const stale = new AbortController();
		Promise.all(hits.slice(0, limit).map((hit) => hit.data()))
			.then((data) => {
				if (!stale.signal.aborted) setResults({ hits, items: data.map(toResult) });
			})
			.catch((error: unknown) => {
				if (stale.signal.aborted) return;
				console.error('Search failed', error);
				setFailed(true);
			});
		return () => stale.abort();
	}, [search, limit]);

	useEffect(() => {
		const index = focusResult.current;
		if (index === null || !results || results.items.length <= index) return;
		focusResult.current = null;
		list.current?.querySelectorAll('a')[index]?.focus();
	}, [results]);

	const onInput = (value: string) => {
		setQuery(value);
		setFailed(false);
		focusResult.current = null;
	};

	const onOpenChange = (next: boolean) => {
		if (next) return show();
		// One count per search: its language and how many results it found
		if (found) trackEvent(EVENTS.search, { lang, results: found.length });
		setOpen(false);
	};

	const onOpenChangeComplete = (isOpen: boolean) => {
		if (isOpen) return;
		const url = destination.current;
		destination.current = null;
		setQuery('');
		setSearch(null);
		setResults(null);
		setFailed(false);
		focusResult.current = null;
		// Only once the scroll lock is gone, so an anchor on this page (the glossary) scrolls
		if (url) location.assign(url);
	};

	const choose = (url: string) => {
		destination.current = url;
		onOpenChange(false);
	};

	const onResultClick = (event: MouseEvent, url: string) => {
		if (!plainClick(event)) return;
		event.preventDefault();
		choose(url);
	};

	// Arrows: from the field into the results, between them, back to the field
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		// Not the Enter that picks a word of an input method (Japanese, Chinese, Korean)
		if (event.key === 'Enter' && event.nativeEvent.isComposing) return;
		const first = shown[0];
		if (event.key === 'Enter' && event.target === input.current && current && first) {
			event.preventDefault();
			choose(first.url);
			return;
		}
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		const links = [...(list.current?.querySelectorAll('a') ?? [])];
		const at = links.indexOf(event.target as HTMLAnchorElement);
		if (links.length === 0 || (at < 0 && event.target !== input.current)) return;
		const next =
			event.key === 'ArrowDown' ? links[at + 1] : at > 0 ? links[at - 1] : input.current;
		if (next) {
			event.preventDefault();
			next.focus();
		}
	};

	const status = failed
		? t.searchFailed
		: found === null
			? ''
			: found.length > 0
				? t.searchResults(found.length)
				: t.searchNoResults;

	return (
		<Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
			<DialogContent
				className="search"
				initialFocus={input}
				finalFocus={() =>
					destination.current ? false : (returnTo.current ?? shownTrigger() ?? true)
				}
				onKeyDown={onKeyDown}
			>
				<div className="search-head">
					<DialogTitle id="search-title">{t.search}</DialogTitle>
					<DialogClose>{t.close}</DialogClose>
				</div>
				<input
					ref={input}
					className="search-field"
					type="search"
					value={query}
					onChange={(event) => onInput(event.target.value)}
					placeholder={t.searchPlaceholder}
					aria-labelledby="search-title"
					aria-describedby="search-status"
					autoComplete="off"
					spellCheck={false}
					enterKeyHint="search"
				/>
				<output id="search-status" className="search-status">
					{status}
				</output>
				<div className="search-body">
					{shown.length > 0 && (
						<ol ref={list} className="search-results">
							{shown.map((result) => (
								<li key={result.url} className="search-result">
									<a
										href={result.url}
										onClick={(event) => onResultClick(event, result.url)}
									>
										{result.title}
									</a>
									{result.chapter && (
										<span className="search-chapter">{result.chapter}</span>
									)}
									<span
										className="search-excerpt"
										// Pagefind's excerpt of our own pages: escaped text and <mark>
										dangerouslySetInnerHTML={{ __html: result.excerpt }}
									/>
								</li>
							))}
						</ol>
					)}
					{found && found.length > limit && shown.length > 0 && (
						<button
							type="button"
							className="search-more"
							onClick={() => {
								focusResult.current = limit;
								setLimit(limit + RESULT_LIMIT);
							}}
						>
							{t.searchMore}
						</button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
