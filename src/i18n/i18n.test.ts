import { describe, expect, it } from 'vitest';
import { isLang, language, LANGS } from './languages';
import { homePath, isInBook, notFoundPath, pagePath, routeOf } from './routes';
import { UI } from './ui';

describe('languages', () => {
	it('has twelve languages, German first, Hebrew right to left', () => {
		expect(LANGS).toHaveLength(12);
		expect(LANGS[0]).toBe('de');
		expect(language('he').dir).toBe('rtl');
		expect(LANGS.filter((lang) => language(lang).dir === 'rtl')).toEqual(['he']);
	});

	it('recognizes language codes', () => {
		expect(isLang('ja')).toBe(true);
		expect(isLang('jp')).toBe(false);
		expect(isLang(undefined)).toBe(false);
	});
});

describe('routes', () => {
	it('keeps German at the root and prefixes the other languages', () => {
		expect(homePath('de')).toBe('/');
		expect(homePath('zh')).toBe('/zh/');
		expect(pagePath('de', 'abhaertung')).toBe('/abhaertung/');
		expect(pagePath('en', 'toughening-up')).toBe('/en/toughening-up/');
		expect(pagePath('he', 'toughening-up')).toBe('/he/toughening-up/');
	});

	it('gives the 404 page its own route', () => {
		expect(isInBook('notFoundPage')).toBe(false);
		expect(isInBook('kamaePage')).toBe(true);
		expect(routeOf('de', 'nicht-gefunden', 'notFoundPage')).toBe(notFoundPath('de'));
		expect(routeOf('ko', 'not-found', 'notFoundPage')).toBe('/ko/404/');
		expect(routeOf('ko', 'kamae', 'kamaePage')).toBe('/ko/kamae/');
	});
});

describe('UI strings', () => {
	it('has every string in every language', () => {
		const keys = Object.keys(UI.de).toSorted();
		for (const lang of LANGS) expect(Object.keys(UI[lang]).toSorted(), lang).toEqual(keys);
	});

	it('uses the plural rules of the language', () => {
		expect(UI.de.sectionCount(1)).toBe('1 Abschnitt');
		expect(UI.de.sectionCount(5)).toBe('5 Abschnitte');
		expect(UI.ru.sectionCount(1)).toBe('1 раздел');
		expect(UI.ru.sectionCount(3)).toBe('3 раздела');
		expect(UI.ru.sectionCount(11)).toBe('11 разделов');
		expect(UI.ru.credit(1999, 9, 76)).toBe('С 1999 года. 9 частей, 76 статей.');
	});
});
