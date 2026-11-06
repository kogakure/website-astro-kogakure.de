import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Contents from './Contents.astro';

const parts = [
	{
		title: null,
		number: null,
		items: [{ title: 'Vorwort', href: '/vorwort/', translationKey: 'prefacePage' }],
	},
	{
		title: 'Geschichte',
		number: 1,
		items: [{ title: 'Iga no Ran', href: '/iga-no-ran/', translationKey: 'igaNoRanPage' }],
	},
];

describe('Contents', () => {
	it('lists the parts and their pages in order', async () => {
		const html = await renderAstro(Contents, {
			heading: 'Inhalt',
			introduction: 'Einführung',
			parts,
		});
		expect(html).toContain('>Inhalt</h2>');
		expect(html.indexOf('Einführung')).toBeLessThan(html.indexOf('Geschichte'));
		expect(html).toContain('href="/iga-no-ran/"');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(Contents, {
			heading: 'Inhalt',
			introduction: 'Einführung',
			parts,
		});
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
