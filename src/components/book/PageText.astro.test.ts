import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import PageText from './PageText.astro';

describe('PageText', () => {
	it('sets the text in the reading column', async () => {
		const html = await renderAstro(PageText, { opener: true }, { default: '<p>Text</p>' });
		expect(html).toMatch(/class="page-text"[\s\S]*<div data-opener class="prose"/);
		expect(html).toContain('<p>Text</p>');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(PageText, {}, { default: '<p>Text</p>' });
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
