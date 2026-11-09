import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import EbookDownloads from './EbookDownloads.astro';
import EbookTeaser from './EbookTeaser.astro';

const file = (lang: string, kind: string) => ({
	label: kind.toUpperCase(),
	href: `https://example.org/kogakure-${lang}.${kind}`,
	type: kind === 'epub' ? 'application/epub+zip' : 'application/pdf',
	size: '69,4 MB',
});

const props = {
	heading: 'Herunterladen',
	cover: { src: '/images/ebook/de/cover.jpg', alt: 'Das Cover des Buches' },
	languages: [
		{ lang: 'de' as const, files: [file('de', 'epub'), file('de', 'pdf')] },
		{ lang: 'en' as const, files: [file('en', 'epub'), file('en', 'pdf')] },
	],
	release: {
		text: 'Version 1.0.0, 9. November 2026',
		links: [{ href: 'https://example.org/SHA256SUMS', label: 'Prüfsummen' }],
	},
	licences:
		'Text: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>',
};

describe('EbookDownloads', () => {
	it('lists each language with its files, their types and sizes', async () => {
		const html = await renderAstro(EbookDownloads, props);
		expect(html).toMatch(/<section[^>]*aria-labelledby="downloads"/);
		expect(html).toMatch(/<h2 id="downloads"[^>]*>Herunterladen<\/h2>/);
		expect(html).toMatch(/<span class="ebook-lang"[^>]*lang="de"[^>]*>\s*Deutsch/);
		expect(html).toMatch(/<span class="ebook-lang"[^>]*lang="en"[^>]*>\s*English/);
		expect(html).toMatch(
			/<a href="https:\/\/example.org\/kogakure-en.epub" type="application\/epub\+zip" hreflang="en"[^>]*>\s*EPUB/
		);
		expect(html).toContain('69,4 MB');
		// Each link names its language for a screen reader's links list
		expect(html).toMatch(
			/EPUB<span class="sr-only"[^>]*>\s*\(<span lang="en"[^>]*>English<\/span>, 69,4 MB\)/
		);
		expect(html).toContain('alt="Das Cover des Buches"');
		expect(html).toContain('Prüfsummen');
		expect(html).toContain('CC BY-NC-SA 4.0</a>');
	});

	it('keeps the page’s language where the text around it is foreign', async () => {
		const html = await renderAstro(EbookDownloads, { ...props, lang: 'he' });
		expect(html).toMatch(/<section[^>]*lang="he"[^>]*dir="rtl"/);
		expect(await renderAstro(EbookDownloads, props)).not.toMatch(/<section[^>]*lang=/);
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(EbookDownloads, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('EbookTeaser', () => {
	const teaser = {
		href: '/buch/',
		label: 'Das Buch als E-Book und PDF',
		cover: '/images/ebook/de/cover.jpg',
		place: 'after-text' as const,
	};

	it('is one link with its line, the cover decorative', async () => {
		const html = await renderAstro(EbookTeaser, {
			...teaser,
			before: 'Dieser Artikel ist auch ein Kapitel des Buches.',
		});
		expect(html).toContain('data-place="after-text"');
		expect(html).toMatch(/<img[^>]*\salt[\s>]/);
		expect(html).toMatch(
			/Dieser Artikel ist auch ein Kapitel des Buches\.<\/span>\s*<a href="\/buch\/"[^>]*>\s*Das Buch als E-Book und PDF/
		);
		expect(html.match(/<a /g)).toHaveLength(1);
	});

	it('puts a line after the link on the homepage', async () => {
		const html = await renderAstro(EbookTeaser, {
			...teaser,
			place: 'prologue',
			after: 'Kostenlos, auf Deutsch und Englisch',
		});
		expect(html).toMatch(/E-Book und PDF<\/a>\s*<span[^>]*>Kostenlos/);
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(
			await renderAstro(EbookTeaser, {
				...teaser,
				before: 'Dieser Artikel ist auch ein Kapitel des Buches.',
			})
		);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
