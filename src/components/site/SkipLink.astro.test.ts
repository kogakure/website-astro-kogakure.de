import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import SkipLink from './SkipLink.astro';

describe('SkipLink', () => {
	it('links to the main content by default', async () => {
		const html = await renderAstro(SkipLink, { label: 'Zum Inhalt springen' });
		expect(html).toContain('href="#main"');
		expect(html).toContain('Zum Inhalt springen');
	});

	it('links to a custom target', async () => {
		const html = await renderAstro(SkipLink, { label: 'Skip', target: 'content' });
		expect(html).toContain('href="#content"');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(SkipLink, { label: 'Zum Inhalt springen' });
		const violations = await axeViolations(`${html}<main id="main"></main>`);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
