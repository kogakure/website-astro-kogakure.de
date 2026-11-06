import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import ArticleHead from './ArticleHead.astro';

const props = {
	image: {
		src: '/images/article/kamae-01-stance-that-is-already-movement.webp',
		alt: 'A stance',
		caption: 'Die <em>kamae</em>',
	},
	plate: { name: '体術', number: '第三章' },
	title: 'Kamae',
	excerpt: 'Die Haltungen',
	facts: [
		{ term: 'Kapitel', text: '3, Körperliches Training', href: '/koerperliches-training/' },
		{ term: 'Abschnitte', text: '6' },
	],
};

describe('ArticleHead', () => {
	it('sets the opener, the title as the h1, the lede and the facts', async () => {
		const html = await renderAstro(ArticleHead, props);
		expect(html).toContain('plate-opener');
		expect(html).toContain('fetchpriority="high"');
		expect(html).toMatch(/<h1[^>]*>Kamae<\/h1>/);
		expect(html).toContain('Die Haltungen');
		expect(html).toMatch(
			/<dt[^>]*>Kapitel<\/dt>\s*<dd[^>]*><a href="\/koerperliches-training\/"/
		);
		expect(html).toMatch(/<dt[^>]*>Abschnitte<\/dt>\s*<dd[^>]*>6<\/dd>/);
		expect(html).toContain('data-draw');
	});

	it('has the bare plate without a painting', async () => {
		const html = await renderAstro(ArticleHead, { ...props, image: undefined });
		expect(html).toContain('is-bare');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(ArticleHead, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
