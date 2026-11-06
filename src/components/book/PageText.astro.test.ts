import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import PageText from './PageText.astro';

describe('PageText', () => {
	it('renders the title, the lede and the text', async () => {
		const html = await renderAstro(
			PageText,
			{ title: 'Inrō – Reiseapotheke', excerpt: 'Eine kleine Dose.' },
			{ default: '<p>Der Text.</p>' }
		);
		expect(html).toContain('<h1 class="text-3xl">Inrō – Reiseapotheke</h1>');
		expect(html).toContain('Eine kleine Dose.');
		expect(html).toContain('<p>Der Text.</p>');
	});

	it('leaves out a missing lede', async () => {
		const html = await renderAstro(PageText, { title: 'Glossar' });
		expect(html).not.toContain('text-xl');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(
			PageText,
			{ title: 'Kamae', excerpt: 'Stellungen.' },
			{ default: '<p>Text</p>' }
		);
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
