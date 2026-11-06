import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import BookNav from './BookNav.astro';

const labels = { label: 'Weiter im Buch', previousLabel: 'Zuvor', nextLabel: 'Als Nächstes' };
const previous = { title: 'Vorwort', href: '/vorwort/' };
const next = { title: 'Inrō – Reiseapotheke', href: '/inro/' };
const back = { href: '/geschichte/', label: 'Zurück zu Geschichte', kanji: '第一章' };

describe('BookNav', () => {
	it('links the previous and the next page and the way back to the part', async () => {
		const html = await renderAstro(BookNav, { ...labels, previous, next, back });
		expect(html).toContain('aria-label="Weiter im Buch"');
		expect(html).toMatch(/Zuvor<\/span>\s*<a href="\/vorwort\/" rel="prev"/);
		expect(html).toMatch(/Als Nächstes<\/span>\s*<a href="\/inro\/" rel="next"/);
		expect(html).toContain('Inrō – Reiseapotheke');
		expect(html).toMatch(
			/<a href="\/geschichte\/" class="read-link[\s\S]*第一章[\s\S]*Zurück zu Geschichte/
		);
	});

	it('renders only the links that exist', async () => {
		const html = await renderAstro(BookNav, { ...labels, next });
		expect(html).not.toContain('Zuvor');
		expect(html).toContain('rel="next"');
		expect(html).not.toContain('read-link');
	});

	it('renders nothing without neighbours or a way back', async () => {
		expect((await renderAstro(BookNav, labels)).trim()).toBe('');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(BookNav, { ...labels, previous, next, back })
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
