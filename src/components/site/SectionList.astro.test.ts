import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import SectionList from './SectionList.astro';
import TopBar from './TopBar.astro';

const SECTIONS = [
	{ id: 'was-ist-ninjutsu', text: 'Was ist Ninjutsu?' },
	{ id: 'die-schriftzeichen', text: 'Die Schriftzeichen' },
];

describe('SectionList', () => {
	it('links every section under its heading', async () => {
		const html = await renderAstro(SectionList, { heading: 'Abschnitte', sections: SECTIONS });
		expect(html).toContain('aria-labelledby="sections-title"');
		expect(html).toContain('href="#was-ist-ninjutsu"');
		expect(html).toContain('data-section-list');
	});

	it('runs the sections on as an index or as letters', async () => {
		const index = await renderAstro(SectionList, {
			heading: 'Abschnitte',
			sections: SECTIONS,
			layout: 'index',
		});
		expect(index).toMatch(/class="sections is-index/);
		const letters = await renderAstro(SectionList, {
			heading: 'Von A bis Z',
			sections: [{ id: 'a', text: 'A' }],
			layout: 'letters',
		});
		expect(letters).toMatch(/class="sections is-letters/);
		expect(letters).toContain('href="#a"');
	});

	it('renders nothing without sections', async () => {
		expect(
			await renderAstro(SectionList, { heading: 'Abschnitte', sections: [] })
		).not.toContain('<nav');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(SectionList, { heading: 'Abschnitte', sections: SECTIONS });
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('TopBar', () => {
	const props = {
		label: 'Buch',
		home: { href: '/', label: 'Inhalt' },
		chapter: { href: '/#geschichte', title: 'Geschichte', kanji: '第一章' },
	};

	it('leads home and to the chapter', async () => {
		const html = await renderAstro(TopBar, props);
		expect(html).toContain('aria-label="Buch"');
		expect(html).toMatch(/href="\/"[\s\S]*木隠[\s\S]*Inhalt/);
		expect(html).toMatch(/href="\/#geschichte"[\s\S]*第一章[\s\S]*Geschichte/);
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(TopBar, props);
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
