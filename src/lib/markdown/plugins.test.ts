import { renderMarkdown } from '@/test/markdown';
import { describe, expect, it } from 'vitest';
import { hastBanners } from './banners';
import { hastFigures } from './figures';
import { hastHeadingIds, headingId } from './heading-ids';
import { hastNoBreakDash, noBreakDash } from './no-break-dash';
import { readingMinutes } from './reading-time';
import { hastTables } from './tables';

describe('noBreakDash', () => {
	it('glues a spaced dash to the word before it', () => {
		expect(noBreakDash('Inrō – Reiseapotheke')).toBe('Inrō – Reiseapotheke');
		expect(noBreakDash('Инро — аптечка')).toBe('Инро — аптечка');
	});

	it('leaves range dashes alone', () => {
		expect(noBreakDash('1560–1568')).toBe('1560–1568');
	});

	it('runs on every text node', () => {
		expect(renderMarkdown('## Inrō – Reiseapotheke\n\nA _b_ – c', [hastNoBreakDash])).toBe(
			'<h2>Inrō – Reiseapotheke</h2>\n<p>A <em>b</em> – c</p>\n'
		);
	});
});

describe('headingId', () => {
	it('drops diacritics and spells umlauts out', () => {
		expect(headingId('Kōga – Ryū')).toBe('koga-ryu');
		expect(headingId('Abhärtung ist unangenehm')).toBe('abhaertung-ist-unangenehm');
	});

	it('keeps letters of other scripts', () => {
		expect(headingId('指と手')).toBe('指と手');
		expect(headingId('갑옷과 투구')).toBe('갑옷과-투구');
		expect(headingId('אימון הגוף')).toBe('אימון-הגוף');
	});

	it('never returns an empty id', () => {
		expect(headingId('–')).toBe('section');
	});
});

describe('hastHeadingIds', () => {
	it('makes repeated headings unique and starts fresh on every page', () => {
		const markdown = '## Kamae\n\n### Kamae\n\n## Kamae';
		const expected =
			'<h2 id="kamae">Kamae</h2>\n<h3 id="kamae-2">Kamae</h3>\n<h2 id="kamae-3">Kamae</h2>\n';
		expect(renderMarkdown(markdown, [hastHeadingIds])).toBe(expected);
		expect(renderMarkdown(markdown, [hastHeadingIds])).toBe(expected);
	});
});

const lookup = (src: string) =>
	src === '/images/kamae/a.webp'
		? {
				src: '/images/kamae/a-800.webp',
				width: 800,
				height: 600,
				srcset: '/images/kamae/a-800.webp 800w',
				sizes: '100vw',
			}
		: undefined;

describe('hastFigures', () => {
	const figure =
		'<figure>\n<img src="/images/kamae/a.webp" alt="A stance">\n<figcaption>A</figcaption>\n</figure>';

	it('loads figure images lazily', () => {
		const html = renderMarkdown(figure, [hastFigures()]);
		expect(html).toContain('loading="lazy"');
		expect(html).toContain('decoding="async"');
	});

	it('takes the file, size and srcset from the manifest lookup', () => {
		const html = renderMarkdown(figure, [hastFigures({ lookup })]);
		expect(html).toContain('src="/images/kamae/a-800.webp"');
		expect(html).toContain('width="800"');
		expect(html).toContain('height="600"');
		expect(html).toContain('srcset="/images/kamae/a-800.webp 800w"');
		expect(html).toContain('sizes="100vw"');
	});

	it('marks the figure with the kind of its image', () => {
		expect(renderMarkdown(figure, [hastFigures()])).toContain('<figure data-kind="kamae">');
	});

	it('leaves images outside figures alone', () => {
		expect(renderMarkdown('<p><img src="/x.webp" alt=""></p>', [hastFigures()])).not.toContain(
			'loading'
		);
	});
});

describe('hastBanners', () => {
	it('names the note by its bold title', () => {
		const html = renderMarkdown(
			'<aside class="banner">\n\n**Warnung**\n\nNicht schlagen.\n\n</aside>\n\n<aside class="banner">\n\n**Zwei**\n\nText.\n\n</aside>',
			[hastBanners]
		);
		expect(html).toContain('<aside class="banner" role="note" aria-labelledby="banner-1">');
		expect(html).toContain(
			'<p id="banner-1" class="banner-title"><strong>Warnung</strong></p>'
		);
		expect(html).toContain('aria-labelledby="banner-2"');
	});

	it('leaves a banner without a title unnamed', () => {
		const html = renderMarkdown('<aside class="banner">\n\nText mit **fett**.\n\n</aside>', [
			hastBanners,
		]);
		expect(html).toContain('<aside class="banner" role="note">');
		expect(html).not.toContain('aria-labelledby');
	});

	it('ignores other asides', () => {
		expect(renderMarkdown('<aside>\n\nx\n\n</aside>', [hastBanners])).not.toContain('role');
	});
});

describe('readingMinutes', () => {
	it('counts words', () => {
		expect(readingMinutes('wort '.repeat(440))).toBe(2);
	});

	it('counts Chinese and Japanese per character', () => {
		expect(readingMinutes('忍'.repeat(1000))).toBe(2);
	});

	it('is at least one minute', () => {
		expect(readingMinutes('')).toBe(1);
	});
});

describe('hastTables', () => {
	it('scopes the header cells of the table head to their column', () => {
		const html = renderMarkdown('| Nr. | Name |\n| --- | --- |\n| 1 | Kasumi |', [hastTables]);
		expect(html).toContain('<th scope="col">Nr.</th>');
		expect(html).toContain('<th scope="col">Name</th>');
		expect(html).not.toContain('<td scope');
	});
});
