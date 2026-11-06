import { describe, expect, it } from 'vitest';
import { LANGS, type Lang } from '@/i18n/languages';
import { buildAlternates, type RoutedPage } from './alternates';

const slug = (lang: Lang, de: string, en: string) => (lang === 'de' ? de : en);

const pages: RoutedPage[] = LANGS.flatMap((lang) => [
	{ lang, slug: slug(lang, 'abhaertung', 'toughening-up'), translationKey: 'toughningUpPage' },
	{ lang, slug: slug(lang, 'nicht-gefunden', 'not-found'), translationKey: 'notFoundPage' },
]);

describe('buildAlternates', () => {
	const alternates = buildAlternates(pages);

	it('lists all twelve language versions of a page', () => {
		expect(alternates.get('toughningUpPage')).toEqual({
			de: '/abhaertung/',
			en: '/en/toughening-up/',
			es: '/es/toughening-up/',
			fr: '/fr/toughening-up/',
			pt: '/pt/toughening-up/',
			it: '/it/toughening-up/',
			nl: '/nl/toughening-up/',
			ru: '/ru/toughening-up/',
			ja: '/ja/toughening-up/',
			zh: '/zh/toughening-up/',
			ko: '/ko/toughening-up/',
			he: '/he/toughening-up/',
		});
	});

	it('has the homepages under the key home', () => {
		expect(alternates.get('home')).toMatchObject({ de: '/', en: '/en/', he: '/he/' });
	});

	it('uses the own route of pages outside the book', () => {
		expect(alternates.get('notFoundPage')).toMatchObject({
			de: '/404.html',
			en: '/en/404/',
			ja: '/ja/404/',
		});
	});

	it('fails when a page is missing in a language', () => {
		expect(() =>
			buildAlternates(pages.filter((p) => !(p.lang === 'ko' && p.slug === 'toughening-up')))
		).toThrow('toughningUpPage is missing in ko');
	});

	it('fails when a language has a page twice', () => {
		expect(() =>
			buildAlternates([
				...pages,
				{ lang: 'en', slug: 'other', translationKey: 'toughningUpPage' },
			])
		).toThrow('toughningUpPage appears twice in en');
	});
});
