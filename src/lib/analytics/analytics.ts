/**
 * Umami, the self-hosted statistics of the privacy policy (SI-478):
 * cookieless, no IP addresses. Production only: `Analytics.astro` loads the
 * script where `ANALYTICS` is set (the Docker build), and it counts only on
 * www.kogakure.de (`data-domains`), never in a local build of the image.
 *
 * Besides page views it counts four events: a change of language or mode,
 * a search and a download.
 */
export const UMAMI = {
	script: 'https://umami.kogakure.cloud/script.js',
	websiteId: '5e9cff30-527b-460b-b5ce-a1de01404c06',
	domains: 'www.kogakure.de',
} as const;

export const EVENTS = {
	/** `{ from, to }`: language codes */
	language: 'language-switch',
	/** `{ mode }`: light, dark or system */
	mode: 'mode-switch',
	/** `{ lang, results }` (SI-479) */
	search: 'search',
	/** `{ file }`: by `data-umami-event` on the link, see `downloadEvent` */
	download: 'download',
} as const;

type EventData = Record<string, string | number | boolean>;
type UmamiTrack = (name: string, data?: EventData) => unknown;

/** Counts an event; does nothing without the script (dev, tests, blockers) and never throws */
export function trackEvent(name: string, data?: EventData): void {
	try {
		const umami = (globalThis as { umami?: { track?: UmamiTrack } }).umami;
		void umami?.track?.(name, data);
	} catch {
		// statistics must never break the page
	}
}

/**
 * The `data-umami-event` attributes of a link to a file in `/downloads/`:
 * Umami counts the click itself, without a script of ours
 */
export function downloadEvent(href: string): Record<string, string> | undefined {
	const file = href.match(/^\/downloads\/([^/?#]+\.[a-z0-9]+)(?:[?#]|$)/i)?.[1];
	return file
		? { 'data-umami-event': EVENTS.download, 'data-umami-event-file': file }
		: undefined;
}
