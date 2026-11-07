import type { ClientDirective } from 'astro';
import { isSearchShortcut } from '../lib/search/search.ts';

/**
 * `client:search`: the search dialog's island loads (React, Base UI, the
 * dialog) only when the reader asks for it, with a search button
 * (`[data-search-trigger]`) or the `/` key. `data-search-pending` on the
 * island tells the dialog to open once it has hydrated. If loading fails
 * (offline, a new version mid-visit), the next click or `/` tries again.
 */
const searchDirective: ClientDirective = (load, _options, el) => {
	const listen = (on: boolean) => {
		if (on) {
			document.addEventListener('click', onClick);
			document.addEventListener('keydown', onKey);
		} else {
			document.removeEventListener('click', onClick);
			document.removeEventListener('keydown', onKey);
		}
	};
	const start = async (event: Event) => {
		event.preventDefault();
		listen(false);
		el.dataset.searchPending = '';
		try {
			const hydrate = await load();
			await hydrate();
		} catch (error) {
			delete el.dataset.searchPending;
			listen(true);
			console.error('Search failed to load', error);
		}
	};
	const onClick = (event: MouseEvent) => {
		if ((event.target as Element | null)?.closest?.('[data-search-trigger]')) void start(event);
	};
	const onKey = (event: KeyboardEvent) => {
		if (isSearchShortcut(event)) void start(event);
	};
	listen(true);
};

export default searchDirective;

declare module 'astro' {
	interface AstroClientDirectives {
		'client:search'?: boolean;
	}
}
