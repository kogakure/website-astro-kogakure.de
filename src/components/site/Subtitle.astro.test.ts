import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Subtitle from './Subtitle.astro';
import Sweep from './Sweep.astro';

describe('Subtitle', () => {
	it('sets the line as HTML in its box', async () => {
		const html = await renderAstro(Subtitle, {
			html: 'Das Dorf der <em>genin</em>',
			as: 'figcaption',
		});
		expect(html).toMatch(
			/<figcaption[^>]*class="subtitle[^>]*><span[^>]*>Das Dorf der <em>genin<\/em><\/span>/
		);
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(Subtitle, {
			html: '„Hinter Blättern und Bäumen verborgen“',
		});
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('Sweep', () => {
	it('is decorative and draws in only when asked', async () => {
		expect(await renderAstro(Sweep)).toMatch(/aria-hidden="true"/);
		expect(await renderAstro(Sweep)).not.toContain('data-draw');
		expect(await renderAstro(Sweep, { draw: true })).toContain('data-draw');
		expect(await renderAstro(Sweep, { variant: 'band' })).toContain('sweep-band');
	});
});
