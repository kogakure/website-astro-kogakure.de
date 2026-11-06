import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Contents from './Contents.astro';

const parts = [
	{
		href: '/einfuehrung/',
		title: 'Einführung',
		short: '序',
		items: [{ title: 'Vorwort', href: '/vorwort/' }],
	},
	{
		href: '/geschichte/',
		title: 'Geschichte',
		short: '一',
		items: [{ title: 'Iga no Ran', href: '/iga-no-ran/' }],
	},
];

describe('Contents', () => {
	it('lists the parts, linking to their pages, and their articles in order', async () => {
		const html = await renderAstro(Contents, { heading: 'Inhalt', parts });
		expect(html).toMatch(/<h1[^>]*>Inhalt<\/h1>/);
		expect(html).toMatch(/<a href="\/einfuehrung\/"[^>]*>[\s\S]*序[\s\S]*Einführung/);
		expect(html.indexOf('/vorwort/')).toBeLessThan(html.indexOf('/iga-no-ran/'));
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(Contents, { heading: 'Inhalt', parts })
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
