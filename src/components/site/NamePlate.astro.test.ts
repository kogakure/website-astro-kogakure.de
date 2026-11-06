import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import NamePlate from './NamePlate.astro';

describe('NamePlate', () => {
	it('sets the kanji and the number, decorative and pinned left to right', async () => {
		const html = await renderAstro(NamePlate, { name: '歴史', number: '第一章' });
		expect(html).toContain('class="tanzaku-number');
		expect(html).toMatch(/第一章[\s\S]*歴史/);
		expect(html).toContain('lang="ja"');
		expect(html).toContain('dir="ltr"');
		expect(html).toContain('aria-hidden="true"');
	});

	it('is part of the accessible name as the title plate, the romaji below the kanji', async () => {
		const html = await renderAstro(NamePlate, {
			name: '木隠',
			number: 'Kogakure',
			size: 'title',
			label: true,
		});
		expect(html).not.toContain('aria-hidden');
		expect(html).toMatch(/木隠[\s\S]*lang="ja-Latn"[^>]*>Kogakure/);
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(NamePlate, {
			name: '木隠',
			number: 'Kogakure',
			size: 'title',
			label: true,
		});
		const violations = await axeViolations(`<h1>${html}</h1>`);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
