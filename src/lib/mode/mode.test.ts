// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isMode, MODE_KEY } from './mode';
import { chooseMode, currentMode, storedMode } from './mode-client';

describe('mode', () => {
	beforeEach(() => {
		document.head.innerHTML = `
			<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f3efe6" data-natural="light" data-light="#f3efe6" data-dark="#152030">
			<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#152030" data-natural="dark" data-light="#f3efe6" data-dark="#152030">`;
	});

	afterEach(() => {
		localStorage.clear();
		delete document.documentElement.dataset.mode;
	});

	it('knows the two modes', () => {
		expect(isMode('dark')).toBe(true);
		expect(isMode('system')).toBe(false);
	});

	it('stores a choice and pins it on <html> and the toolbar', () => {
		chooseMode('dark');
		expect(localStorage.getItem(MODE_KEY)).toBe('dark');
		expect(document.documentElement.dataset.mode).toBe('dark');
		expect(storedMode()).toBe('dark');
		expect(currentMode()).toBe('dark');
		for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
			expect(meta.content).toBe('#152030');
		}
	});

	it('follows the system again without a choice', () => {
		chooseMode('light');
		chooseMode(null);
		expect(localStorage.getItem(MODE_KEY)).toBeNull();
		expect(document.documentElement.dataset.mode).toBeUndefined();
		const [light, dark] = document.querySelectorAll<HTMLMetaElement>(
			'meta[name="theme-color"]'
		);
		expect(light?.content).toBe('#f3efe6');
		expect(dark?.content).toBe('#152030');
	});

	it('tells the page about a change', () => {
		let changed = false;
		addEventListener('modechange', () => (changed = true), { once: true });
		chooseMode('light');
		expect(changed).toBe(true);
	});

	it('ignores anything stored that is not a mode', () => {
		localStorage.setItem(MODE_KEY, 'sepia');
		expect(storedMode()).toBeNull();
	});
});
