import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	checksumsUrl,
	ebookCover,
	ebookDownloads,
	EBOOK_LANGS,
	isInEbook,
	megabytes,
	NOT_IN_EBOOK,
	RELEASE,
	type Release,
} from './ebook';
import { manifest } from '../images/images';

const release: Release = {
	version: '2.1.0',
	date: '2027-01-01',
	files: {
		de: { epub: { size: 1 }, pdf: { size: 2 }, pages: 3 },
		en: { epub: { size: 4 }, pdf: { size: 5 }, pages: 6 },
	},
};

describe('ebookDownloads', () => {
	it('names the files as `just publish` does, below the release’s tag', () => {
		expect(ebookDownloads('en', release)).toEqual([
			{
				lang: 'en',
				kind: 'epub',
				href: 'https://github.com/kogakure/kogakure-book-releases/releases/download/v2.1.0/kogakure-en-2.1.0.epub',
				size: 4,
			},
			{
				lang: 'en',
				kind: 'pdf',
				href: 'https://github.com/kogakure/kogakure-book-releases/releases/download/v2.1.0/kogakure-en-screen-2.1.0.pdf',
				size: 5,
			},
		]);
		expect(checksumsUrl(release)).toBe(
			'https://github.com/kogakure/kogakure-book-releases/releases/download/v2.1.0/SHA256SUMS'
		);
	});

	it('has a version, a date and every file’s size for the current release', () => {
		expect(RELEASE.version).toMatch(/^\d+\.\d+\.\d+$/);
		expect(RELEASE.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		for (const lang of EBOOK_LANGS) {
			const { epub, pdf, pages } = RELEASE.files[lang];
			expect(epub.size, lang).toBeGreaterThan(0);
			expect(pdf.size, lang).toBeGreaterThan(0);
			expect(pages, lang).toBeGreaterThan(0);
		}
	});
});

describe('isInEbook', () => {
	it('leaves out the pages the book excludes, each one a page of the website', () => {
		const keys = new Set(
			fs
				.readdirSync('src/content/book/de')
				.map(
					(name) =>
						/^translationKey: (\S+)$/m.exec(
							fs.readFileSync(path.join('src/content/book/de', name), 'utf8')
						)?.[1]
				)
		);
		for (const key of NOT_IN_EBOOK) expect(keys.has(key), key).toBe(true);
		expect(isInEbook('downloadsPage')).toBe(false);
		expect(isInEbook('kamaePage')).toBe(true);
	});
});

describe('ebookCover', () => {
	it('is an image of the manifest in each language', () => {
		for (const lang of EBOOK_LANGS)
			expect(manifest.images[ebookCover(lang).replace('/images/', '')], lang).toBeDefined();
	});
});

describe('megabytes', () => {
	it('gives one decimal in the language’s format', () => {
		expect(megabytes(69_399_978, 'de')).toBe('69,4 MB');
		expect(megabytes(38_329_500, 'en')).toBe('38.3 MB');
	});
});
