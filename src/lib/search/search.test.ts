import { describe, expect, it, vi } from 'vitest';
import { isSearchShortcut, toResult } from './search';

/** A key press on a target that is, or is in, a form field (`field`) or not */
const press = (key: string, init: Partial<KeyboardEvent> = {}, field = false) =>
	({
		key,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		defaultPrevented: false,
		isComposing: false,
		target: { closest: () => (field ? {} : null) },
		...init,
	}) as unknown as KeyboardEvent;

describe('isSearchShortcut', () => {
	it('is the slash on the page', () => {
		expect(isSearchShortcut(press('/'))).toBe(true);
		// Some layouts need Shift for the slash
		expect(isSearchShortcut(press('/', { shiftKey: true }))).toBe(true);
	});

	it('is not another key, a key with a modifier, or a slash typed into a field', () => {
		expect(isSearchShortcut(press('k'))).toBe(false);
		expect(isSearchShortcut(press('/', { metaKey: true }))).toBe(false);
		expect(isSearchShortcut(press('/', { ctrlKey: true }))).toBe(false);
		expect(isSearchShortcut(press('/', { altKey: true }))).toBe(false);
		expect(isSearchShortcut(press('/', {}, true))).toBe(false);
		expect(isSearchShortcut(press('/', { isComposing: true }))).toBe(false);
		expect(isSearchShortcut(press('/', { defaultPrevented: true }))).toBe(false);
	});

	it('lets AltGr through, which some layouts need for the slash', () => {
		const altGraph = { ctrlKey: true, altKey: true, getModifierState: () => true };
		expect(isSearchShortcut(press('/', altGraph))).toBe(true);
	});

	it('is not a shortcut while a dialog is open', () => {
		vi.stubGlobal('document', { querySelector: () => ({}) });
		expect(isSearchShortcut(press('/'))).toBe(false);
		vi.unstubAllGlobals();
	});
});

describe('toResult', () => {
	it('takes the title, chapter and excerpt of a Pagefind result', () => {
		expect(
			toResult({
				url: '/kunoichi/',
				meta: { title: 'Kunoichi', chapter: 'Organisation & Ausbildung' },
				excerpt: 'Weibliche <mark>Ninja</mark>',
			})
		).toEqual({
			url: '/kunoichi/',
			title: 'Kunoichi',
			chapter: 'Organisation & Ausbildung',
			excerpt: 'Weibliche <mark>Ninja</mark>',
		});
	});

	it('falls back to the URL without a title', () => {
		expect(toResult({ url: '/a/', meta: {}, excerpt: '' }).title).toBe('/a/');
	});
});
