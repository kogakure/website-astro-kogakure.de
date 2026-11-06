import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Picture from './Picture.astro';

// Real images of the manifest: a landscape painting and a portrait with a focus point
const LANDSCAPE = '/images/article/kamae-01-stance-that-is-already-movement.webp';
const PORTRAIT = '/images/historical/hattori-hanzo.webp';

describe('Picture', () => {
	it('renders the generated widths with the size of the original', async () => {
		const html = await renderAstro(Picture, { src: LANDSCAPE, alt: 'A stance' });
		const base = '/images/article/kamae-01-stance-that-is-already-movement';
		expect(html).toContain(`src="${base}-1400.webp"`);
		expect(html).toContain(`${base}-800.webp 800w`);
		expect(html).toContain(`${base}-2750.webp 2750w`);
		expect(html).toContain('width="2048"');
		expect(html).toContain('height="1152"');
		expect(html).toContain('alt="A stance"');
	});

	it('is lazy and sized for a figure by default', async () => {
		const html = await renderAstro(Picture, { src: LANDSCAPE, alt: '' });
		expect(html).toContain('loading="lazy"');
		expect(html).toContain('decoding="async"');
		expect(html).not.toContain('fetchpriority');
		expect(html).toContain('sizes="(min-width: 48em) 44em, 100vw"');
	});

	it('loads the opener first, sized as a band', async () => {
		const html = await renderAstro(Picture, {
			src: LANDSCAPE,
			alt: '',
			sizes: 'band',
			priority: true,
		});
		expect(html).toContain('loading="eager"');
		expect(html).toContain('fetchpriority="high"');
		expect(html).not.toContain('decoding');
		expect(html).toContain('sizes="(min-width: 86rem) 82rem, 100vw"');
	});

	it('takes a sizes value of its own', async () => {
		const html = await renderAstro(Picture, { src: LANDSCAPE, alt: '', sizes: '50vw' });
		expect(html).toContain('sizes="50vw"');
	});

	it('passes other attributes through without overriding its own', async () => {
		const html = await renderAstro(Picture, {
			src: LANDSCAPE,
			alt: '',
			class: 'plate',
			id: 'opener',
			loading: 'eager',
		});
		expect(html).toContain('id="opener"');
		expect(html).toMatch(/class="[^"]*\bplate\b/);
		expect(html).toContain('loading="lazy"');
		expect(html).not.toContain('loading="eager"');
	});

	it('only takes own keys of SIZES as layouts', async () => {
		const html = await renderAstro(Picture, { src: LANDSCAPE, alt: '', sizes: 'constructor' });
		expect(html).toContain('sizes="constructor"');
	});

	it('sets the focus point for cropping layouts', async () => {
		expect(await renderAstro(Picture, { src: PORTRAIT, alt: '' })).toContain(
			'style="--focal: 50% 20%"'
		);
		expect(await renderAstro(Picture, { src: LANDSCAPE, alt: '' })).not.toContain('--focal:');
	});

	it('fails for an image outside the manifest', async () => {
		await expect(
			renderAstro(Picture, { src: '/images/kamae/missing.webp', alt: '' })
		).rejects.toThrow('not in the image manifest');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(Picture, { src: LANDSCAPE, alt: 'A stance' });
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
