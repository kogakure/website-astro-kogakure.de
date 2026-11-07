import { describe, expect, it } from 'vitest';
import {
	dropFields,
	dropGlossaryEntries,
	imageSource,
	imageUrls,
	internalLinks,
	joinFrontmatter,
	keepWebsiteOnly,
	rewriteImages,
	splitFrontmatter,
} from './transform';

describe('frontmatter', () => {
	const text =
		'---\ntitle: Kamae\nsource: src/pages/de/book/kamae.md\ncategories:\n  - training\n---\n\nText\n';

	it('splits and joins without changes', () => {
		expect(joinFrontmatter(splitFrontmatter(text))).toBe(text);
	});

	it('fails without frontmatter', () => {
		expect(() => splitFrontmatter('Text')).toThrow('No frontmatter');
	});

	it('drops fields with their continuation lines', () => {
		const { frontmatter } = splitFrontmatter(text);
		expect(dropFields(frontmatter, ['source'])).toBe('title: Kamae\ncategories:\n  - training');
		expect(dropFields(frontmatter, ['categories'])).toBe(
			'title: Kamae\nsource: src/pages/de/book/kamae.md'
		);
	});
});

describe('keepWebsiteOnly', () => {
	it('keeps the website-only part and drops the markers', () => {
		const body =
			'A\n\n<!-- WEBSITE-ONLY: start. Skip in the book. -->\n\nB\n\n<!-- WEBSITE-ONLY: end -->\n\nC\n';
		expect(keepWebsiteOnly(body)).toBe('A\n\n\nB\n\n\nC\n');
	});

	it('fails on unpaired markers', () => {
		expect(() => keepWebsiteOnly('<!-- WEBSITE-ONLY: start -->\nB\n')).toThrow(
			'without an end'
		);
		expect(() => keepWebsiteOnly('<!-- WEBSITE-ONLY: end -->\n')).toThrow('Unpaired');
		expect(() =>
			keepWebsiteOnly('<!-- WEBSITE-ONLY: start -->\n<!-- WEBSITE-ONLY: start -->\n')
		).toThrow('Unpaired');
	});
});

describe('dropGlossaryEntries', () => {
	it('keeps the text before the first entry', () => {
		expect(
			dropGlossaryEntries(
				'<figure></figure>\n\nIntro.\n\n### aikidō\n\n合気道\n\n### aikuchi\n'
			)
		).toBe('<figure></figure>\n\nIntro.\n');
	});

	it('leaves a body without entries alone', () => {
		expect(dropGlossaryEntries('Intro.\n')).toBe('Intro.\n');
	});
});

describe('images', () => {
	it('rewrites new and old image paths to /images/', () => {
		expect(rewriteImages('<img src="../../../images/new/kamae/ichimonji.webp" alt="">')).toBe(
			'<img src="/images/kamae/ichimonji.webp" alt="">'
		);
		expect(rewriteImages('<img src="../../../images/old/chronology/a.png" alt="">')).toBe(
			'<img src="/images/old/chronology/a.png" alt="">'
		);
	});

	it('maps an image URL back to its file in kogakure-texts', () => {
		expect(imageSource('/images/kamae/ichimonji.webp')).toBe('images/new/kamae/ichimonji.webp');
		expect(imageSource('/images/old/chronology/a.png')).toBe('images/old/chronology/a.png');
	});

	it('lists the image URLs of a text', () => {
		expect(imageUrls('<img src="/a.webp" alt=""> <img alt="" src="/b.webp">')).toEqual([
			'/a.webp',
			'/b.webp',
		]);
	});
});

describe('internalLinks', () => {
	it('finds Markdown and HTML links to the site, without fragments', () => {
		const body =
			'[Glossar](/glossar/#a) [x](https://example.com) <a href="/en/">EN</a> [zip](/downloads/f.zip)';
		expect(internalLinks(body)).toEqual(['/glossar/', '/en/', '/downloads/f.zip']);
	});
});
