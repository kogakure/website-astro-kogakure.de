import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import ReadLink from './ReadLink.astro';
import Seal from './Seal.astro';

describe('Seal', () => {
	it('is a decorative mark', async () => {
		expect(await renderAstro(Seal)).toMatch(/class="seal[^"]*"[^>]*aria-hidden="true"/);
	});
});

describe('ReadLink', () => {
	it('links with the seal before its text', async () => {
		const html = await renderAstro(ReadLink, { href: '/ninjutsu/' }, { default: 'Lesen' });
		expect(html).toContain('href="/ninjutsu/"');
		expect(html).toMatch(/class="seal[\s\S]*Lesen/);
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(ReadLink, { href: '/ninjutsu/' }, { default: 'Lesen' });
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
