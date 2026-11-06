import { renderMarkdown } from '@/test/markdown';
import { describe, expect, it } from 'vitest';
import { hastQuotes } from './quotes';

const render = (markdown: string, lang?: string) => renderMarkdown(markdown, [hastQuotes], lang);

describe('hastQuotes', () => {
	it('writes the quotation marks of the page language', () => {
		expect(render('Die <q>Schatten</q>.')).toContain('<q>„Schatten“</q>');
		expect(render('The <q>shadows</q>.', 'en')).toContain('<q>“shadows”</q>');
		expect(render('Les <q>ombres</q>.', 'fr')).toContain('<q>« ombres »</q>');
		expect(render('<q>影</q>', 'ja')).toContain('<q>「影」</q>');
	});

	it('takes the inner pair for nested quotes', () => {
		expect(render('<q>Er sagte <q>nein</q>.</q>')).toContain(
			'<q>„Er sagte <q>‚nein‘</q>.“</q>'
		);
	});

	it('follows the lang attribute of the quote or an ancestor', () => {
		expect(render('Der Spruch <q lang="ja">忍</q>.')).toContain('<q lang="ja">「忍」</q>');
		expect(render('<span lang="en">An <q>idea</q></span>')).toContain('<q>“idea”</q>');
	});

	it('falls back to German for an unknown language', () => {
		expect(render('<q lang="xx">?</q>')).toContain('„?“');
	});

	it('ignores romanized Japanese when choosing the marks', () => {
		expect(render('<em lang="ja-Latn">Die <q>x</q></em>')).toContain('<q>„x“</q>');
	});

	it('alternates through three levels', () => {
		expect(render('<q>a <q>b <q>c</q></q></q>')).toContain('<q>„a <q>‚b <q>„c“</q>‘</q>“</q>');
	});
});
