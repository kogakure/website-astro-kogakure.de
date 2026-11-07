// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import {
	isPosition,
	loadPosition,
	READING_KEY,
	resume,
	resumeTarget,
	savePosition,
} from './reading';

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

describe('resume', () => {
	afterEach(() => {
		localStorage.clear();
		document.body.innerHTML = '';
	});

	// ResumeLink.astro inlines the function's source: it must run without its module
	const inlined = new Function(`return ${resume.toString()}`)() as typeof resume;

	function box() {
		document.body.innerHTML = `<div data-resume data-lang="en" data-label="Read: {title}" data-articles='${JSON.stringify(ARTICLES)}'><a href="/en/preface/"><span class="read-link-text">Read: Preface</span></a></div>`;
		return document.querySelector<HTMLElement>('[data-resume]')!;
	}

	for (const [name, fn] of [
		['resume', resume],
		['resume, inlined', inlined],
	] as const) {
		it(`${name}: points „Read“ at the stored article`, () => {
			savePosition({ key: 'toughningUpPage', lang: 'en', hash: '#sand' });
			const element = box();
			fn(element, READING_KEY, isPosition, resumeTarget);
			expect(element.querySelector('a')?.getAttribute('href')).toBe(
				'/en/toughening-up/#sand'
			);
			expect(element.textContent).toBe('Read: Toughening Up');
		});

		it(`${name}: keeps the start without a valid position`, () => {
			localStorage.setItem(READING_KEY, '{"key":1}');
			const element = box();
			fn(element, READING_KEY, isPosition, resumeTarget);
			expect(element.querySelector('a')?.getAttribute('href')).toBe('/en/preface/');
		});
	}
});
