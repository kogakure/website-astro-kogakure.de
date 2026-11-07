import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import SearchButton from './SearchButton.astro';

describe('SearchButton', () => {
	it('is a button that opens the search, with its shortcut', async () => {
		const html = await renderAstro(SearchButton, { label: 'Suche' });
		expect(html).toMatch(/<button[^>]*type="button"/);
		expect(html).toContain('data-search-trigger');
		expect(html).toContain('aria-haspopup="dialog"');
		expect(html).toContain('aria-keyshortcuts="/"');
		expect(html).toContain('Suche');
		// The key is a hint for the eye; the shortcut is announced by aria-keyshortcuts
		expect(html).toMatch(/<kbd[^>]*aria-hidden="true"[^>]*>\/<\/kbd>/);
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(SearchButton, { label: 'Suche' });
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
