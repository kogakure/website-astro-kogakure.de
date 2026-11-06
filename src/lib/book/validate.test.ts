import { describe, expect, it } from 'vitest';
import { LANGS, type Lang } from '@/i18n/languages';
import { pageSchema, tocSchema } from './schema';
import { validateBook, type BookInput, type SourcePage } from './validate';

const slugs = (lang: Lang) =>
	lang === 'de'
		? { prefacePage: 'vorwort', kamaePage: 'kamae', notFoundPage: 'nicht-gefunden' }
		: { prefacePage: 'preface', kamaePage: 'kamae', notFoundPage: 'not-found' };

/** A tiny valid book: a preface, one article and the 404 page in all languages */
function book(): BookInput {
	const pages: SourcePage[] = LANGS.flatMap((lang) =>
		Object.entries(slugs(lang)).map(([translationKey, slug], i) => ({
			lang,
			slug,
			data: {
				title: `${lang} ${slug}`,
				priority: i,
				translationKey,
				categories: ['training'],
			},
			body:
				lang === 'de' && slug === 'vorwort'
					? 'Zum [Glossar](/kamae/) und [EN](/en/kamae/).'
					: 'Text',
		}))
	);
	const tocs = Object.fromEntries(
		LANGS.map((lang) => [
			lang,
			{
				preface: [
					{
						title: 'Vorwort',
						slug: slugs(lang).prefacePage,
						translationKey: 'prefacePage',
					},
				],
				parts: [
					{
						title: 'Teil',
						items: [{ title: 'Kamae', slug: 'kamae', translationKey: 'kamaePage' }],
					},
				],
			},
		])
	);
	const glossaries = Object.fromEntries(
		LANGS.map((lang) => [
			lang,
			{ entries: [{ title: 'kamae', sort: 'Kamae', description: lang }] },
		])
	);
	return { pages, tocs, glossaries };
}

const page = (input: BookInput, lang: Lang, slug: string) => {
	const found = input.pages.find((p) => p.lang === lang && p.slug === slug);
	if (!found) throw new Error(`no ${lang}/${slug}`);
	return found as { -readonly [K in keyof SourcePage]: SourcePage[K] };
};

describe('validateBook', () => {
	it('accepts a complete book', () => {
		expect(validateBook(book())).toEqual([]);
	});

	it('reports invalid frontmatter', () => {
		const input = book();
		page(input, 'fr', 'kamae').data = {
			title: '',
			priority: 'x',
			translationKey: 'kamaePage',
			extra: 1,
		};
		const errors = validateBook(input);
		expect(errors).toContainEqual(expect.stringMatching(/^fr\/kamae\.md: frontmatter title/));
		expect(errors).toContainEqual(
			expect.stringMatching(/^fr\/kamae\.md: frontmatter priority/)
		);
		expect(errors).toContainEqual(
			expect.stringMatching(/^fr\/kamae\.md: frontmatter \(root\): .*extra/)
		);
	});

	it('reports unknown categories', () => {
		const input = book();
		page(input, 'en', 'kamae').data = {
			title: 'Kamae',
			priority: 1,
			translationKey: 'kamaePage',
			categories: ['Waffen'],
		};
		expect(validateBook(input)).toContainEqual(
			expect.stringMatching(/^en\/kamae\.md: frontmatter categories/)
		);
	});

	it('reports a page missing in a language', () => {
		const input = book();
		input.pages = input.pages.filter((p) => !(p.lang === 'ko' && p.slug === 'kamae'));
		expect(validateBook(input)).toContain('ko: missing translationKey kamaePage');
	});

	it('reports a language without pages', () => {
		const input = book();
		input.pages = input.pages.filter((p) => p.lang !== 'he');
		expect(validateBook(input)).toContain('he: no pages');
	});

	it('reports a translationKey used twice in a language', () => {
		const input = book();
		page(input, 'es', 'preface').data = {
			title: 'X',
			priority: 1,
			translationKey: 'kamaePage',
		};
		expect(validateBook(input)).toContainEqual(
			expect.stringContaining('translationKey kamaePage is also used by')
		);
	});

	it('reports a translation that does not use the English slug', () => {
		const input = book();
		page(input, 'nl', 'kamae').slug = 'houdingen';
		expect(validateBook(input)).toContain(
			'nl/houdingen.md: file name must be the English slug kamae'
		);
	});

	it('reports a TOC with another order than German', () => {
		const input = book();
		const toc = input.tocs.ja as { parts: { title: string; items: unknown[] }[] };
		const [part] = toc.parts;
		if (!part) throw new Error('no part');
		toc.parts = [part, { ...part, title: 'Noch ein Teil' }];
		const errors = validateBook(input);
		expect(errors).toContain('ja toc: listed twice: kamaePage');
		expect(errors).toContain('ja toc: parts or order differ from de');
	});

	it('reports a book page missing from the TOC and an outside page in it', () => {
		const input = book();
		const toc = input.tocs.it as {
			parts: { items: { slug: string; translationKey: string }[] }[];
		};
		const [part] = toc.parts;
		if (!part) throw new Error('no part');
		part.items = [
			{
				...part.items[0],
				title: '404',
				slug: 'not-found',
				translationKey: 'notFoundPage',
			} as never,
		];
		const errors = validateBook(input);
		expect(errors).toContain('it toc: kamaePage is not in the book order');
		expect(errors).toContain('it toc: notFoundPage is outside the book');
	});

	it('reports a TOC item without a matching page', () => {
		const input = book();
		const toc = input.tocs.pt as { preface: { slug: string }[] };
		const [item] = toc.preface;
		if (item) item.slug = 'prefacio';
		expect(validateBook(input)).toContain(
			'pt toc: prefacio does not match a page with translationKey prefacePage'
		);
	});

	it('reports glossaries that differ from German', () => {
		const input = book();
		input.glossaries.ru = { entries: [{ title: 'ken', sort: 'Ken' }] };
		expect(validateBook(input)).toContain('ru glossary: entries differ from de');
	});

	it('reports links that lead nowhere', () => {
		const input = book();
		page(input, 'de', 'kamae').body =
			'[a](/glossar/) [b](/en/kamae/#x) [c](/downloads/font.zip)';
		const errors = validateBook({ ...input, assetExists: () => false });
		expect(errors).toContain('de/kamae.md: link to /glossar/ leads nowhere');
		expect(errors).toContain('de/kamae.md: link to /downloads/font.zip leads nowhere');
		expect(errors).not.toContainEqual(expect.stringContaining('/en/kamae/'));
	});

	it('does not accept the 404 page under its slug', () => {
		const input = book();
		page(input, 'de', 'kamae').body = '[x](/nicht-gefunden/)';
		expect(validateBook(input)).toContain(
			'de/kamae.md: link to /nicht-gefunden/ leads nowhere'
		);
	});

	it('reports missing images and images outside /images/', () => {
		const input = book();
		page(input, 'zh', 'kamae').body =
			'<img src="/images/a.webp" alt=""> <img src="../x.webp" alt="">';
		const errors = validateBook({ ...input, imageExists: () => false });
		expect(errors).toContain('zh/kamae.md: image /images/a.webp does not exist');
		expect(errors).toContain('zh/kamae.md: image ../x.webp is not below /images/');
	});

	it('reports link and image forms the checks cannot read', () => {
		const input = book();
		page(input, 'en', 'kamae').body = "<img src='/images/a.webp' alt=''>";
		page(input, 'es', 'kamae').body = '![Bild](/images/a.webp)';
		const errors = validateBook(input);
		expect(errors).toContainEqual(
			expect.stringMatching(/^en\/kamae\.md: uses a link or image form/)
		);
		expect(errors).toContainEqual(
			expect.stringMatching(/^es\/kamae\.md: uses a link or image form/)
		);
	});

	it('reports a German slug that collides with a language prefix', () => {
		const input = book();
		page(input, 'de', 'kamae').slug = 'en';
		expect(validateBook(input)).toContain(
			'de/en.md: the slug collides with a language prefix or the 404 page'
		);
	});
});

describe('titles', () => {
	it('reject the &shy; leftovers of the old site', () => {
		const page = {
			title: 'Trainings&shy;faktoren',
			priority: 1,
			translationKey: 'trainingFactorsPage',
		};
		expect(pageSchema.safeParse(page).success).toBe(false);
		expect(pageSchema.safeParse({ ...page, title: 'Trainingsfaktoren' }).success).toBe(true);
		expect(
			tocSchema.safeParse({
				preface: [
					{ title: 'Vor&shy;wort', slug: 'vorwort', translationKey: 'prefacePage' },
				],
				parts: [],
			}).success
		).toBe(false);
	});
});
