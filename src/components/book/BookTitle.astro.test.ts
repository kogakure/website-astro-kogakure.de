import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import BookTitle from './BookTitle.astro';

describe('BookTitle', () => {
	it('renders 木隠 as a Japanese heading with the subtitle', async () => {
		const html = await renderAstro(BookTitle, { subtitle: 'Hidden behind leaves and trees' });
		expect(html).toMatch(/<h1[^>]*lang="ja"[^>]*>木隠<\/h1>/);
		expect(html).toContain('Hidden behind leaves and trees');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(BookTitle, { subtitle: 'Verborgen' })
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
