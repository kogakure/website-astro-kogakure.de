import { renderMarkdown } from '@/test/markdown';
import { describe, expect, it } from 'vitest';
import { hastGlossedTerms } from './glossed-terms';
import { BOOK_HAST_PLUGINS } from './index';

const render = (markdown: string) => renderMarkdown(markdown, [hastGlossedTerms]);

const gloss = (term: string, kanji: string, meaning?: string) =>
	`<em lang="ja-Latn">${term}</em><span class="gloss"><span class="gloss-term" aria-hidden="true" lang="ja-Latn">${term}</span> <span class="gloss-kanji" lang="ja">${kanji}</span>${
		meaning ? ` <span class="gloss-meaning">${meaning}</span>` : ''
	}</span>`;

describe('hastGlossedTerms', () => {
	it('glosses a term with kanji only', () => {
		expect(render('Das _daken taijutsu_ (打拳体術) des Ninjutsu.')).toBe(
			`<p>Das ${gloss('daken taijutsu', '打拳体術')} des Ninjutsu.</p>\n`
		);
	});

	it('glosses a term with kanji and a quoted meaning', () => {
		expect(render('Ein _tengu_ (天狗, <q>Himmelhund</q>) fliegt.')).toBe(
			`<p>Ein ${gloss('tengu', '天狗', '<q>Himmelhund</q>')} fliegt.</p>\n`
		);
	});

	it('keeps text around the quote inside the meaning', () => {
		expect(render('_ninpō_ (忍法, etwa <q>Methode</q> des Ninja), mehr')).toContain(
			`${gloss('ninpō', '忍法', 'etwa <q>Methode</q> des Ninja')}, mehr`
		);
	});

	it('glosses several terms in one paragraph', () => {
		const html = render('_koppō jutsu_ (骨法術) und _koshi jutsu_ (骨指術).');
		expect(html.match(/class="gloss"/g)).toHaveLength(2);
	});

	it('leaves text without kanji, upright terms and captions alone', () => {
		expect(render('Ein _tengu_ (ein Wesen) fliegt.')).not.toContain('gloss');
		expect(render('Ein tengu (天狗) fliegt.')).not.toContain('gloss');
		expect(
			render('<figure>\n<figcaption><em>Ichimonji</em> (一文字)</figcaption>\n</figure>')
		).not.toContain('gloss');
	});

	it('gives up on nested parentheses or other elements in the meaning', () => {
		expect(render('_x_ (天狗, a (b) c)')).not.toContain('gloss');
		expect(render('_x_ (天狗, <cite>Buch</cite>)')).not.toContain('gloss');
	});

	it('glosses in tight list items and table cells too', () => {
		expect(render('- Die _yamabushi_ (山伏).')).toContain('class="gloss"');
		expect(render('| A |\n| --- |\n| _hara_ (腹) |')).toContain('class="gloss"');
	});
});

describe('the whole pipeline', () => {
	it('glosses first, then writes the quotation marks of the page', () => {
		const html = renderMarkdown(
			'Ein _tengu_ (天狗, <q>Himmelhund</q>) fliegt.',
			BOOK_HAST_PLUGINS
		);
		expect(html).toContain('<span class="gloss-meaning"><q>„Himmelhund“</q></span>');
		expect(html).toContain('<em lang="ja-Latn">tengu</em>');
	});
});
