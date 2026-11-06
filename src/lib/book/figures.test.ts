import { describe, expect, it } from 'vitest';
import { openerFigure, pageFigures } from './figures';

const MARKDOWN = `
<figure>
<img src="/images/calligraphy/ninja.webp" alt="Two characters">
<figcaption>Ninja</figcaption>
</figure>

Text.

<figure>
<img src="/images/article/kamae-01-stance-that-is-already-movement.webp" alt="A stance">
<figcaption>Das verborgene Dorf der <em>genin</em></figcaption>
</figure>
`;

describe('figures', () => {
	it('reads every figure with its alt text and caption', () => {
		expect(pageFigures(MARKDOWN)).toEqual([
			{ src: '/images/calligraphy/ninja.webp', alt: 'Two characters', caption: 'Ninja' },
			{
				src: '/images/article/kamae-01-stance-that-is-already-movement.webp',
				alt: 'A stance',
				caption: 'Das verborgene Dorf der <em>genin</em>',
			},
		]);
	});

	it('opens an article with its first painting, not a calligraphy', () => {
		expect(openerFigure(MARKDOWN)?.alt).toBe('A stance');
		expect(openerFigure('No figures')).toBeUndefined();
	});
});
