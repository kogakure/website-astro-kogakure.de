import type { Chapter } from '@/lib/book/book';
import { SCENES } from '@/lib/book/plates';
import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Scene from './Scene.astro';

const chapter: Chapter = {
	index: 1,
	title: 'Geschichte',
	slug: 'geschichte',
	href: '/#geschichte',
	number: 1,
	plate: { name: '歴史', short: '一', number: '第一章' },
	scene: { ...SCENES[1]!, alt: 'Ein Reiter im Kiefernwald', caption: 'Tokugawa in den Bergen' },
	items: [
		{
			title: 'Ursprünge des Ninjutsu',
			href: '/urspruenge-des-ninjutsu/',
			translationKey: 'originsOfNinjutsuPage',
			excerpt: 'Wie alles begann.',
		},
	],
};

describe('Scene', () => {
	it('is the part on the homepage: its anchor, h2, plate revealed in view, its articles', async () => {
		const html = await renderAstro(Scene, { chapter, credit: 'Kapitel 1, 1 Artikel' });
		expect(html).toContain('id="geschichte"');
		expect(html).toMatch(/<h2[^>]*>Geschichte<\/h2>/);
		expect(html).toContain('data-reveal');
		expect(html).toContain('data-frame="bleed"');
		expect(html).toContain('--focal: 55% 45%');
		expect(html).toContain('Tokugawa in den Bergen');
		expect(html).toMatch(/<a class="article-title[^"]*" href="\/urspruenge-des-ninjutsu\/"/);
		expect(html).toContain('Wie alles begann.');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(Scene, { chapter, credit: 'Kapitel 1' })
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
