import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isLang, language, languageChoices, LANGS, PREFIXED_LANGS } from './languages';
import {
	chapterSlug,
	contentsPath,
	homePath,
	isInBook,
	legalPath,
	notFoundPath,
	offlinePath,
	pagePath,
	routeOf,
	routeParam,
} from './routes';
import { joinCredit, UI } from './ui';

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

	it('offers every language in its own name, linking to the page in it', () => {
		const alternates = Object.fromEntries(LANGS.map((lang) => [lang, `/${lang}/x/`])) as Record<
			(typeof LANGS)[number],
			string
		>;
		const choices = languageChoices(alternates, 'he');
		expect(choices).toHaveLength(12);
		expect(choices.find((choice) => choice.current)).toEqual({
			code: 'he',
			lang: 'he',
			name: 'עברית',
			href: '/he/x/',
			current: true,
		});
		expect(choices.find((choice) => choice.lang === 'zh-Hans')?.name).toBe('中文');
	});

	it('prefixes every language but German', () => {
		expect(PREFIXED_LANGS).toHaveLength(11);
		expect(PREFIXED_LANGS).not.toContain('de');
	});
});

describe('routes', () => {
	it('gives the contents its own page and the parts their anchors', () => {
		expect(contentsPath('de')).toBe('/inhalt/');
		expect(contentsPath('ja')).toBe('/ja/contents/');
		expect(chapterSlug('Organisation & Ausbildung', 'de')).toBe('organisation-und-ausbildung');
		expect(chapterSlug('Körperliches Training', 'de')).toBe('koerperliches-training');
		expect(chapterSlug('Einführung', 'de')).toBe('einfuehrung');
		expect(chapterSlug('Weapons & Tools', 'ja')).toBe('weapons-and-tools');
		expect(chapterSlug('The Legacy of the Ninja', 'en')).toBe('the-legacy-of-the-ninja');
	});

	it('keeps German at the root and prefixes the other languages', () => {
		expect(homePath('de')).toBe('/');
		expect(homePath('zh')).toBe('/zh/');
		expect(pagePath('de', 'abhaertung')).toBe('/abhaertung/');
		expect(pagePath('en', 'toughening-up')).toBe('/en/toughening-up/');
		expect(pagePath('he', 'toughening-up')).toBe('/he/toughening-up/');
	});

	it('turns a path into the param of a rest route', () => {
		expect(routeParam('/abhaertung/')).toBe('abhaertung');
		expect(routeParam('/en/toughening-up/')).toBe('en/toughening-up');
	});

	it('gives the 404 page its own route', () => {
		expect(isInBook('notFoundPage')).toBe(false);
		expect(isInBook('kamaePage')).toBe(true);
		expect(routeOf('de', 'nicht-gefunden', 'notFoundPage')).toBe(notFoundPath('de'));
		expect(routeOf('ko', 'not-found', 'notFoundPage')).toBe('/ko/404/');
		expect(routeOf('ko', 'kamae', 'kamaePage')).toBe('/ko/kamae/');
	});

	it('gives every language its offline page, below its prefix', () => {
		expect(offlinePath('de')).toBe('/offline/');
		expect(offlinePath('he')).toBe('/he/offline/');
	});

	it('serves the service worker no-cache in nginx', () => {
		const conf = fs.readFileSync('nginx.conf', 'utf8');
		const sw = /location = \/sw\.js \{([^}]*)\}/.exec(conf)?.[1];
		expect(sw).toContain('Cache-Control "no-cache, no-store, must-revalidate"');
		expect(sw).toContain('X-Content-Type-Options "nosniff"');
	});

	it('serves the 404 page of every prefixed language in nginx', () => {
		const conf = fs.readFileSync('nginx.conf', 'utf8');
		const langs = /location ~ \^\/\(\?<lang>([a-z|]+)\)\//.exec(conf)?.[1]?.split('|');
		expect(langs?.toSorted()).toEqual([...PREFIXED_LANGS].toSorted());
	});

	it('gives every language its legal pages, below its own prefix', () => {
		expect(legalPath('de', 'imprint')).toBe('/impressum/');
		expect(legalPath('de', 'privacy')).toBe('/datenschutz/');
		expect(legalPath('en', 'imprint')).toBe('/en/imprint/');
		expect(legalPath('ja', 'privacy')).toBe('/ja/privacy/');
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

describe('credit lines', () => {
	it('joins with the comma of the language', () => {
		expect(joinCredit('de', ['Kapitel 1', '10 Artikel'])).toBe('Kapitel 1, 10 Artikel');
		expect(joinCredit('ja', ['第1章', '全10編'])).toBe('第1章、全10編');
	});

	it('counts articles by the plural rules of the language', () => {
		expect(UI.en.articleCount(1)).toBe('1 article');
		expect(UI.ru.articleCount(3)).toBe('3 статьи');
		expect(UI.ru.articleCount(5)).toBe('5 статей');
	});
});
