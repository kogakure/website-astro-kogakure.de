// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { loadPosition, READING_KEY, resumeTarget, savePosition } from './reading';

const ARTICLES = { toughningUpPage: ['/en/toughening-up/', 'Toughening Up'] as [string, string] };

describe('reading position', () => {
	afterEach(() => localStorage.clear());

	it('stores the last article and section', () => {
		savePosition({ key: 'toughningUpPage', lang: 'en', hash: '#sand' });
		expect(loadPosition()).toEqual({ key: 'toughningUpPage', lang: 'en', hash: '#sand' });
	});

	it('ignores anything stored that is not a position', () => {
		localStorage.setItem(READING_KEY, '{"key":1}');
		expect(loadPosition()).toBeNull();
		localStorage.setItem(READING_KEY, 'not json');
		expect(loadPosition()).toBeNull();
	});

	it('resumes at the section in the same language', () => {
		const position = { key: 'toughningUpPage', lang: 'en', hash: '#sand' };
		expect(resumeTarget(position, 'en', ARTICLES)).toEqual({
			href: '/en/toughening-up/#sand',
			title: 'Toughening Up',
		});
	});

	it('resumes at the article in another language, whose ids differ', () => {
		const position = { key: 'toughningUpPage', lang: 'de', hash: '#sand' };
		expect(resumeTarget(position, 'en', ARTICLES)?.href).toBe('/en/toughening-up/');
	});

	it('starts at the beginning without a position or for an unknown article', () => {
		expect(resumeTarget(null, 'en', ARTICLES)).toBeNull();
		expect(resumeTarget({ key: 'gone', lang: 'en', hash: '' }, 'en', ARTICLES)).toBeNull();
	});
});
