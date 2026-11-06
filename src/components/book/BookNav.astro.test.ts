import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import BookNav from './BookNav.astro';

const labels = { label: 'Weiter im Buch', previousLabel: 'Zuvor', nextLabel: 'Als Nächstes' };
const previous = { title: 'Vorwort', href: '/vorwort/' };
const next = { title: 'Inrō – Reiseapotheke', href: '/inro/' };

describe('BookNav', () => {
	it('links the previous and the next page', async () => {
		const html = await renderAstro(BookNav, { ...labels, previous, next });
		expect(html).toContain('aria-label="Weiter im Buch"');
		expect(html).toMatch(/Zuvor:\s*<a href="\/vorwort\/" rel="prev"/);
		expect(html).toMatch(/Als Nächstes:\s*<a href="\/inro\/" rel="next"/);
		expect(html).toContain('Inrō – Reiseapotheke');
	});

	it('renders only the links that exist', async () => {
		const html = await renderAstro(BookNav, { ...labels, next });
		expect(html).not.toContain('Zuvor');
		expect(html).toContain('rel="next"');
	});

	it('renders nothing without neighbours', async () => {
		expect((await renderAstro(BookNav, labels)).trim()).toBe('');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(BookNav, { ...labels, previous, next })
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
