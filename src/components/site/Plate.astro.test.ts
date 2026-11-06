import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import OpenerPlate from './OpenerPlate.astro';
import Plate from './Plate.astro';

const PAINTING = '/images/article/kamae-01-stance-that-is-already-movement.webp';

describe('Plate', () => {
	it('cuts the painting with its ink edge, hangs the name plate, sets the caption', async () => {
		const html = await renderAstro(Plate, {
			image: { src: PAINTING, alt: 'A stance' },
			caption: 'Die <em>kamae</em>',
			plate: { name: '体術', number: '第三章' },
			edge: 'c',
			side: 'start',
			reveal: true,
		});
		expect(html).toContain("--edge-mask: url('/images/ink/wash-edge-c.webp')");
		expect(html).toContain('data-side="start"');
		expect(html).toContain('data-reveal');
		expect(html).toContain('alt="A stance"');
		expect(html).toContain('loading="lazy"');
		expect(html).toContain('体術');
		expect(html).toMatch(/<figcaption[^>]*plate-subtitle[\s\S]*<em>kamae<\/em>/);
	});

	it('is the bare plate without a painting', async () => {
		const html = await renderAstro(Plate, { plate: { name: '附録' } });
		expect(html).toContain('is-bare');
		expect(html).not.toContain('<img');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(Plate, {
			image: { src: PAINTING, alt: 'A stance' },
			caption: 'Die Haltung',
			plate: { name: '体術', number: '第三章' },
		});
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('OpenerPlate', () => {
	it('blooms on load and loads its painting first', async () => {
		const html = await renderAstro(OpenerPlate, {
			image: { src: PAINTING, alt: 'A stance', caption: 'Die Haltung' },
			name: '構',
			number: '第三章',
		});
		expect(html).toContain('plate-opener');
		expect(html).toContain('data-bloom');
		expect(html).toContain('fetchpriority="high"');
		expect(html).toContain('tanzaku-opener');
	});

	it('is bare without a painting', async () => {
		const html = await renderAstro(OpenerPlate, { name: '序' });
		expect(html).toContain('is-bare');
	});
});
