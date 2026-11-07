/**
 * The first visit to `/` (SI-478). German lives at the root; a reader whose
 * browser asks for another of the twelve languages goes to that language's
 * homepage, everyone else to English:
 *
 * - only on `/` itself: deep links (search results, `/#geschichte`) stay
 * - only once: the next visit to `/` shows the German homepage (any visit
 *   to `/` counts, also one that stays)
 * - the reader's own choice in the language select (`LANGUAGE_KEY`) always
 *   wins over the browser's languages
 * - never without localStorage, or `/` could not be reached at all, and
 *   never for crawlers, which index `/` as German
 *
 * `FirstVisit.astro` inlines the function into the German homepage's head,
 * before first paint: it uses nothing but its arguments.
 */

export interface FirstVisitConfig {
	/** The homepage of each language, by code */
	homes: Record<string, string>;
	/** The language of `/` */
	root: string;
	/** For browsers that ask for none of the languages */
	fallback: string;
	/** localStorage key of the reader's own choice */
	choiceKey: string;
	/** localStorage key set on the first visit */
	seenKey: string;
}

export interface FirstVisitWindow {
	localStorage: Pick<Storage, 'getItem' | 'setItem'>;
	navigator: { languages?: readonly string[]; language?: string; userAgent: string };
	location: { hash: string; search: string; replace: (url: string) => void };
}

export function firstVisit(config: FirstVisitConfig, win: FirstVisitWindow): void {
	let choice: string | null;
	let seen: string | null;
	try {
		choice = win.localStorage.getItem(config.choiceKey);
		seen = win.localStorage.getItem(config.seenKey);
		win.localStorage.setItem(config.seenKey, '1');
	} catch {
		return;
	}
	if (win.location.hash) return;
	// Own keys only: `constructor` or `toString` are no language
	const known = (code: string | null) => code !== null && Object.hasOwn(config.homes, code);
	// The query (a campaign's utm_*) goes along, for the statistics of the page it lands on
	const go = (code: string) => win.location.replace(config.homes[code] + win.location.search);
	if (known(choice)) {
		if (choice !== config.root) go(choice!);
		return;
	}
	if (seen || /bot|crawl|spider|slurp|lighthouse/i.test(win.navigator.userAgent)) return;
	const preferred = win.navigator.languages?.length
		? win.navigator.languages
		: [win.navigator.language ?? ''];
	let lang = config.fallback;
	for (const tag of preferred) {
		const primary = tag.toLowerCase().split('-')[0] ?? '';
		// Hebrew's old code, still sent by some Android browsers
		const code = primary === 'iw' ? 'he' : primary;
		if (known(code)) {
			lang = code;
			break;
		}
	}
	if (lang !== config.root && known(lang)) go(lang);
}
