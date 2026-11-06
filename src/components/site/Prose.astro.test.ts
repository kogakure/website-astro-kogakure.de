import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Banner from './Banner.astro';
import Glossed from './Glossed.astro';
import Prose from './Prose.astro';

describe('Prose', () => {
	it('wraps the text, with the margin column and the opener when asked', async () => {
		const html = await renderAstro(
			Prose,
			{ margin: true, opener: true },
			{ default: '<p>Text</p>' }
		);
		expect(html).toMatch(/class="prose prose-margin"/);
		expect(html).toContain('data-opener');
		expect(html).toContain('<p>Text</p>');
	});
});

describe('Glossed', () => {
	it('writes the markup of the glossed-terms plugin', async () => {
		const html = await renderAstro(Glossed, {
			term: 'tengu',
			kanji: '天狗',
			meaning: '<q>„Himmelhund“</q>',
		});
		expect(html).toMatch(/<em lang="ja-Latn">tengu<\/em><span class="gloss">/);
		expect(html).toMatch(/class="gloss-term" aria-hidden="true" lang="ja-Latn">tengu/);
		expect(html).toContain('<span class="gloss-kanji" lang="ja">天狗</span>');
		expect(html).toContain('<span class="gloss-meaning"><q>„Himmelhund“</q></span>');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(Glossed, { term: 'tengu', kanji: '天狗' });
		const violations = await axeViolations(`<p>${html}</p>`);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('Banner', () => {
	it('is a note named by its title', async () => {
		const html = await renderAstro(
			Banner,
			{ title: 'Warnung', id: 'banner-1' },
			{ default: '<p>Nie mit voller Kraft.</p>' }
		);
		expect(html).toContain('role="note"');
		expect(html).toContain('aria-labelledby="banner-1"');
		expect(html).toMatch(/class="banner-title" id="banner-1"><strong>Warnung/);
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(
			Banner,
			{ title: 'Warnung', id: 'b' },
			{ default: '<p>Text</p>' }
		);
		const violations = await axeViolations(`<main>${html}</main>`);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
