import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import PageMeta from './PageMeta.astro';

const versions = {
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

const article = {
	lang: 'ja',
	title: '構え · 木隠 · 忍者・忍術・武術',
	ogTitle: '構え',
	description: '三秒で五つの構え。',
	canonical: '/ja/kamae/',
	versions,
	image: { src: '/images/og/kamaePage.jpg', width: 1200, height: 630, alt: '竹林の男' },
	type: 'article',
	jsonLd: [{ '@context': 'https://schema.org', '@type': 'Article', headline: '構え' }],
};

describe('PageMeta', () => {
	it('writes the title, the canonical URL and every language version', async () => {
		const html = await renderAstro(PageMeta, article);
		expect(html).toContain('<title>構え · 木隠 · 忍者・忍術・武術</title>');
		expect(html).toContain('<link rel="canonical" href="https://www.kogakure.de/ja/kamae/">');
		expect(html.match(/rel="alternate" hreflang=/g)).toHaveLength(13);
		expect(html).toContain('hreflang="x-default" href="https://www.kogakure.de/en/kamae/"');
	});

	it('writes the link preview with the opener crop', async () => {
		const html = await renderAstro(PageMeta, article);
		expect(html).toContain('<meta property="og:type" content="article">');
		expect(html).toContain('<meta property="og:locale" content="ja_JP">');
		expect(html.match(/og:locale:alternate/g)).toHaveLength(11);
		expect(html).toContain(
			'<meta property="og:image" content="https://www.kogakure.de/images/og/kamaePage.jpg">'
		);
		expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
		expect(html).toContain('<script type="application/ld+json">{"@context"');
	});

	it('keeps pages out of the index until the launch, and 404 pages for good', async () => {
		expect(await renderAstro(PageMeta, article)).toContain('content="noindex"');
		const notFound = await renderAstro(PageMeta, {
			lang: 'de',
			title: 'Seite nicht gefunden',
			ogTitle: 'Seite nicht gefunden',
			description: 'Seite nicht gefunden',
			noindex: true,
		});
		expect(notFound).toContain('<meta name="robots" content="noindex">');
		expect(notFound).not.toContain('rel="canonical"');
		expect(notFound).not.toContain('hreflang');
		expect(notFound).toContain('<meta name="twitter:card" content="summary">');
	});
});
