import type { Chapter } from '@/lib/book/book';
import { SCENES } from '@/lib/book/plates';
import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Scene from './Scene.astro';

const chapter: Chapter = {
	index: 1,
	key: 'chapter-1',
	title: 'Geschichte',
	slug: 'geschichte',
	href: '/geschichte/',
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
	it('on the homepage: an h2 linking to the part, the plate revealed as it comes into view', async () => {
		const html = await renderAstro(Scene, {
			chapter,
			credit: 'Kapitel 1, 1 Artikel',
			href: chapter.href,
		});
		expect(html).toContain('id="geschichte"');
		expect(html).toMatch(/<h2[^>]*><a href="\/geschichte\/"[^>]*>Geschichte<\/a><\/h2>/);
		expect(html).toContain('data-reveal');
		expect(html).toContain('data-frame="bleed"');
		expect(html).toContain('--focus: 55% 45%');
		expect(html).toContain('Tokugawa in den Bergen');
		expect(html).toMatch(/<a class="article-title[^"]*" href="\/urspruenge-des-ninjutsu\/"/);
		expect(html).toContain('Wie alles begann.');
	});

	it('on its own page: the h1, the plate blooms and loads first', async () => {
		const html = await renderAstro(Scene, { chapter, credit: 'Kapitel 1', page: true });
		expect(html).toMatch(/<h1[^>]*>Geschichte<\/h1>/);
		expect(html).toContain('data-bloom');
		expect(html).toContain('fetchpriority="high"');
		expect(html).not.toContain('id="geschichte"');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(Scene, { chapter, credit: 'Kapitel 1', href: chapter.href })
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
