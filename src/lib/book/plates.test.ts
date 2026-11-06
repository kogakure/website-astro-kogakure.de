import { describe, expect, it } from 'vitest';
import {
	chapterLabel,
	isChapter,
	kanjiNumeral,
	PLATE_TEXT,
	SCENES,
	sceneEdge,
	SECTION_PLATES,
} from './plates';

describe('plates', () => {
	it('writes kanji numerals', () => {
		expect(kanjiNumeral(1)).toBe('一');
		expect(kanjiNumeral(10)).toBe('十');
		expect(kanjiNumeral(12)).toBe('十二');
		expect(() => kanjiNumeral(20)).toThrow('No kanji numeral for 20');
	});

	it('labels chapters', () => {
		expect(chapterLabel(3)).toBe('第三章');
	});

	it('has one plate and one scene per section of the book', () => {
		expect(SECTION_PLATES).toHaveLength(10);
		expect(SCENES).toHaveLength(10);
	});

	it('counts eight chapters between the front matter and the appendix', () => {
		expect([0, 1, 8, 9].map(isChapter)).toEqual([false, true, true, false]);
	});

	it('alternates the ink edges so neighbours never repeat', () => {
		const edges = Array.from({ length: 12 }, (_, i) => sceneEdge(i));
		expect(new Set(edges.slice(0, 10)).size).toBe(10);
		expect(edges[10]).toBe(edges[0]);
	});

	it('lists every character a plate can show', () => {
		for (const c of ['木', '隠', '第', '章', '図', '〇', '附', '録'])
			expect(PLATE_TEXT).toContain(c);
	});
});
