import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Lightbox from './Lightbox.astro';

const labels = { zoom: 'Bild vergrößern', close: 'Schließen' };

describe('Lightbox', () => {
	it('is a closed dialog with a named close button, hidden in print', async () => {
		const html = await renderAstro(Lightbox, labels);
		expect(html).toMatch(
			/<dialog[^>]*class="lightbox[^"]*"[^>]*data-zoom-label="Bild vergrößern"/
		);
		expect(html).not.toMatch(/<dialog[^>]* open/);
		expect(html).toContain('aria-label="Schließen"');
		expect(html).toContain('data-print="hidden"');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(Lightbox, labels));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
