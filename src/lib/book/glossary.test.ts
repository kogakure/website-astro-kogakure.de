import { describe, expect, it } from 'vitest';
import glossary from '../../content/glossary/de.json';
import { glossaryLetters, initial, quoteHtml } from './glossary';

describe('initial', () => {
	it('drops diacritics and capitalizes', () => {
		expect(initial('Ōtomo')).toBe('O');
		expect(initial('aikido')).toBe('A');
	});
});

describe('quoteHtml', () => {
	it('writes the marks of the language into q', () => {
		expect(quoteHtml('Die <q>Kunst</q>', 'de')).toBe('Die <q>„Kunst“</q>');
		expect(quoteHtml('<q>術</q>', 'ja')).toBe('<q>「術」</q>');
	});
});

describe('glossaryLetters', () => {
	it('groups by initial with unique anchors', () => {
		const letters = glossaryLetters(
			[
				{ title: 'aikidō', sort: 'Aikido', japanese: '合気道', translation: 'Weg' },
				{ title: 'Buddha', sort: 'Buddha', sanskrit: 'बुद्ध', description: '<em>x</em>' },
				{ title: 'Dao', sort: 'Dao', chinese: '道' },
				{ title: 'dao', sort: 'Dao' },
				{ title: 'b', sort: 'B' },
			],
			'de'
		);
		expect(letters.map((l) => [l.letter, l.id])).toEqual([
			['A', 'a'],
			['B', 'b'],
			['D', 'd'],
		]);
		expect(letters[0]?.entries[0]).toMatchObject({
			id: 'aikido',
			term: 'aikidō',
			script: { text: '合気道', lang: 'ja' },
			origin: undefined,
		});
		expect(letters[1]?.entries.map((e) => [e.id, e.origin, e.script?.lang])).toEqual([
			['buddha', 'sanskrit', 'sa'],
			['b-2', undefined, undefined],
		]);
		expect(letters[2]?.entries.map((e) => e.id)).toEqual(['dao', 'dao-2']);
	});

	it('keeps all 760 entries of the German glossary', () => {
		const letters = glossaryLetters(glossary.entries, 'de');
		expect(letters.flatMap((l) => l.entries)).toHaveLength(glossary.entries.length);
		expect(letters.map((l) => l.letter).join('')).toMatch(/^A.*Z$/);
	});
});
