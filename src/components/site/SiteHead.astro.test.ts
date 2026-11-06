import { fontFiles } from '@/lib/fonts/fonts';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import SiteHead from './SiteHead.astro';

describe('SiteHead', () => {
	it('inlines the self-hosted fonts and preloads the body face', async () => {
		const html = await renderAstro(SiteHead, { lang: 'de' });
		expect(html).toMatch(
			/<link rel="preload" href="\/fonts\/source-serif-4-basic-[^"]+" as="font" type="font\/woff2" crossorigin/
		);
		expect(html).toContain('@font-face{font-family:"Source Serif 4"');
		expect(html).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
	});

	it('colours the toolbar per mode, with the reading ground', async () => {
		const html = await renderAstro(SiteHead, { lang: 'de', ground: 'read' });
		expect(html).toMatch(
			/name="theme-color" media="\(prefers-color-scheme: dark\)" content="#152030"/
		);
	});

	it('applies a stored mode before first paint', async () => {
		const html = await renderAstro(SiteHead, { lang: 'de' });
		expect(html).toContain('kogakure-mode');
		expect(html).toContain('prefers-reduced-motion');
	});

	it('adds the fonts of quoted pages without repeating rules', async () => {
		const html = await renderAstro(SiteHead, {
			lang: 'de',
			fontPages: [
				{ lang: 'de' },
				{ lang: 'ja' },
				{ lang: 'ja', slug: 'origins-of-ninjutsu' },
			],
		});
		expect(html).toContain('Shippori Mincho');
		// The quoted page's own subsets come along
		for (const { file } of fontFiles('ja', 'origins-of-ninjutsu').filter(({ pages }) => pages))
			expect(html).toContain(file);
		const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
		const rules = css.split('\n');
		expect(new Set(rules).size).toBe(rules.length);
	});
});
