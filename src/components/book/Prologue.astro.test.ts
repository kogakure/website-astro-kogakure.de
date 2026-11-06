import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Prologue from './Prologue.astro';

const props = {
	subtitle: '„Hinter Blättern und Bäumen verborgen“',
	credit: 'Seit 1999. 10 Teile, 76 Artikel.',
	heading: 'Inhalt',
	parts: [
		{ href: '#einfuehrung', short: '序', title: 'Einführung' },
		{ href: '#geschichte', short: '一', title: 'Geschichte' },
	],
};

describe('Prologue', () => {
	it('sets the title plate as the h1 in the vortex, the subtitle, credit and contents', async () => {
		const html = await renderAstro(Prologue, props, {
			default: '<a href="/vorwort/">Lesen</a>',
		});
		expect(html).toMatch(/<h1 class="prologue-title[^"]*"[^>]*>\s*<span[^>]*tanzaku-title/);
		expect(html).toContain("--vortex-ninja: url('/images/ink/vortex-ninja.webp')");
		expect(html).toContain('Hinter Blättern und Bäumen verborgen');
		expect(html).toContain('Seit 1999. 10 Teile, 76 Artikel.');
		expect(html).toContain('<a href="/vorwort/">Lesen</a>');
		expect(html).toMatch(/<a href="#geschichte"[^>]*>[\s\S]*一[\s\S]*Geschichte/);
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(Prologue, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
