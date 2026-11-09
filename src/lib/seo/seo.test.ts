import { describe, expect, it } from 'vitest';
import {
	absoluteUrl,
	articleJsonLd,
	bookJsonLd,
	breadcrumbJsonLd,
	hreflangs,
	jsonLdScript,
	pageTitle,
	sitemapXml,
} from './seo';

const kamae = {
	de: '/kamae/',
	en: '/en/kamae/',
	es: '/es/kamae/',
	fr: '/fr/kamae/',
	pt: '/pt/kamae/',
	it: '/it/kamae/',
	nl: '/nl/kamae/',
	ru: '/ru/kamae/',
	ja: '/ja/kamae/',
	zh: '/zh/kamae/',
	ko: '/ko/kamae/',
	he: '/he/kamae/',
};

describe('pageTitle', () => {
	it('follows the old site: title, book, topic', () => {
		expect(pageTitle('de', 'Kamae')).toBe('Kamae · 木隠 · Ninja, Ninjutsu & Kampfkunst');
		expect(pageTitle('ja', '構え')).toBe('構え · 木隠 · 忍者・忍術・武術');
	});

	it('names the book on the homepage', () => {
		expect(pageTitle('en')).toBe('木隠 Kogakure · Ninja, Ninjutsu & Martial Arts');
	});
});

describe('hreflangs', () => {
	it('lists all twelve languages by their tag, and English as x-default', () => {
		const links = hreflangs(kamae);
		expect(links).toHaveLength(13);
		expect(links[0]).toEqual({ hreflang: 'de', href: 'https://www.kogakure.de/kamae/' });
		expect(links.map(({ hreflang }) => hreflang)).toContain('pt-BR');
		expect(links.map(({ hreflang }) => hreflang)).toContain('zh-Hans');
		expect(links.at(-1)).toEqual({
			hreflang: 'x-default',
			href: 'https://www.kogakure.de/en/kamae/',
		});
	});

	it('lists only the versions a page has', () => {
		const links = hreflangs({ de: '/impressum/', en: '/en/imprint/' });
		expect(links.map(({ hreflang }) => hreflang)).toEqual(['de', 'en', 'x-default']);
	});

	it('has no x-default without an English version', () => {
		expect(hreflangs({ de: '/impressum/' }).map(({ hreflang }) => hreflang)).toEqual(['de']);
	});
});

describe('sitemapXml', () => {
	it('gives every version its own <url> with all versions as alternates', () => {
		const xml = sitemapXml([kamae, { de: '/impressum/', en: '/en/imprint/' }]);
		expect(xml.match(/<url>/g)).toHaveLength(14);
		expect(xml.match(/<xhtml:link /g)).toHaveLength(12 * 13 + 2 * 3);
		expect(xml).toContain('<loc>https://www.kogakure.de/he/kamae/</loc>');
		expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
	});

	it('escapes URLs', () => {
		expect(sitemapXml([{ de: '/a&b/' }])).toContain(
			'<loc>https://www.kogakure.de/a&amp;b/</loc>'
		);
	});
});

describe('structured data', () => {
	it('describes each language’s homepage as the book, the German one as the original', () => {
		const de = bookJsonLd('de', '/images/og/home.jpg');
		expect(de).toMatchObject({
			'@type': 'Book',
			'@id': 'https://www.kogakure.de/#book',
			inLanguage: 'de',
			image: 'https://www.kogakure.de/images/og/home.jpg',
		});
		expect(de).not.toHaveProperty('translationOfWork');
		expect(bookJsonLd('zh')).toMatchObject({
			inLanguage: 'zh-Hans',
			translationOfWork: { '@id': 'https://www.kogakure.de/#book' },
		});
	});

	it('describes an article as part of its language’s book', () => {
		const article = articleJsonLd({
			lang: 'en',
			path: '/en/kamae/',
			title: 'Kamae',
			description: 'Five stances',
			image: '/images/og/kamaePage.jpg',
			published: new Date('2006-03-30T17:50:00Z'),
		});
		expect(article).toMatchObject({
			'@type': 'Article',
			headline: 'Kamae',
			mainEntityOfPage: 'https://www.kogakure.de/en/kamae/',
			image: ['https://www.kogakure.de/images/og/kamaePage.jpg'],
			datePublished: '2006-03-30T17:50:00.000Z',
			isPartOf: { '@id': 'https://www.kogakure.de/en/#book' },
		});
	});

	it('leaves out what an article doesn’t have', () => {
		const article = articleJsonLd({ lang: 'de', path: '/kamae/', title: 'Kamae' });
		expect(article).not.toHaveProperty('image');
		expect(article).not.toHaveProperty('datePublished');
	});

	it('links every crumb but the page itself', () => {
		expect(breadcrumbJsonLd([{ name: '木隠 Kogakure', path: '/' }, { name: 'Kamae' }])).toEqual(
			{
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: '木隠 Kogakure',
						item: absoluteUrl('/'),
					},
					{ '@type': 'ListItem', position: 2, name: 'Kamae' },
				],
			}
		);
	});

	it('can never close its script element early', () => {
		const json = jsonLdScript({ headline: '</script><script>alert(1)</script>' });
		expect(json).not.toContain('<');
		expect(JSON.parse(json)).toEqual({ headline: '</script><script>alert(1)</script>' });
	});
});
