/**
 * The browser part of mode.ts: read, choose and watch the light or dark
 * mode. Used by the mode choice in the colophon (ModeSwitch.astro).
 */
import { isMode, MODE_KEY, type Mode } from './mode';

const media = () => matchMedia('(prefers-color-scheme: dark)');

export const systemMode = (): Mode => (media().matches ? 'dark' : 'light');

export function storedMode(): Mode | null {
	try {
		const mode = localStorage.getItem(MODE_KEY);
		return isMode(mode) ? mode : null;
	} catch {
		return null;
	}
}

export const currentMode = (): Mode => storedMode() ?? systemMode();

/** Each theme-color meta shows its own mode, or the chosen one */
function toolbar(mode: Mode | null) {
	for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
		const shown = mode ?? meta.dataset.natural;
		const colour = shown === 'dark' ? meta.dataset.dark : meta.dataset.light;
		if (colour) meta.content = colour;
	}
}

/** A mode, or null to follow the system again */
export function chooseMode(mode: Mode | null) {
	try {
		if (mode) localStorage.setItem(MODE_KEY, mode);
		else localStorage.removeItem(MODE_KEY);
	} catch {
		// private mode: the choice holds for this page only
	}
	const root = document.documentElement;
	if (mode) root.dataset.mode = mode;
	else delete root.dataset.mode;
	toolbar(mode);
	dispatchEvent(new Event('modechange'));
}

/** Follows a change of the system mode while the page is open */
export function watchSystemMode() {
	media().addEventListener('change', () => {
		toolbar(storedMode());
		dispatchEvent(new Event('modechange'));
	});
}
