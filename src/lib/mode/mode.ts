/**
 * Light and dark mode. The page follows the system (prefers-color-scheme)
 * until the reader chooses; the choice is stored and set as data-mode on
 * <html>, before first paint (SiteHead.astro repeats the few lines it needs
 * inline). Safe for the server; the browser part is mode-client.ts.
 */
export type Mode = 'light' | 'dark';

/** A stored mode, or following the system */
export type ModeChoice = Mode | 'system';

export const MODES: readonly ModeChoice[] = ['light', 'dark', 'system'];

/** The ground of the page per mode, for the browser toolbar colour (theme-color) */
export const GROUNDS: Record<Mode, { home: string; read: string }> = {
	light: { home: '#f3efe6', read: '#f3efe6' },
	dark: { home: '#111a25', read: '#152030' },
};

/** localStorage key of the choice */
export const MODE_KEY = 'kogakure-mode';

export const isMode = (value: unknown): value is Mode => value === 'light' || value === 'dark';
