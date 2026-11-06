/**
 * Checks the whole book across all twelve languages. The import refuses to
 * write broken content, and the build runs the same checks on the imported
 * files (`src/integrations/validate-book.ts`).
 */
import { DEFAULT_LANG, isLang, LANGS, type Lang } from '../../i18n/languages.ts';
import { homePath, isInBook, routeOf } from '../../i18n/routes.ts';
import { glossarySchema, pageSchema, tocSchema, type Toc } from './schema.ts';
import { imageUrls, internalLinks } from './transform.ts';

export interface SourcePage {
	lang: Lang;
	/** File name without `.md` */
	slug: string;
	/** Parsed frontmatter, not yet validated */
	data: unknown;
	body: string;
}

export interface BookInput {
	pages: readonly SourcePage[];
	tocs: Partial<Record<Lang, unknown>>;
	glossaries: Partial<Record<Lang, unknown>>;
	/** Only the import can check images: the build has no access to kogakure-texts */
	imageExists?: (url: string) => boolean;
	/** Files below `public/` that pages may link to */
	assetExists?: (path: string) => boolean;
}

/** Link and image syntax that internalLinks() and imageUrls() don't read */
const UNCHECKED_FORMS = /\b(?:src|href)='|!\[[^\]]*\]\(|\bsrcset=/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ENGLISH: Lang = 'en';

export function validateBook(input: BookInput): string[] {
	const errors: string[] = [];
	const error = (where: string, message: string) => errors.push(`${where}: ${message}`);

	// Frontmatter and slugs
	const keys = new Map<Lang, Map<string, string>>(LANGS.map((lang) => [lang, new Map()]));
	for (const page of input.pages) {
		const where = `${page.lang}/${page.slug}.md`;
		if (!SLUG.test(page.slug)) error(where, 'the file name is not a URL slug');
		if (page.lang === DEFAULT_LANG && (isLang(page.slug) || page.slug === '404'))
			error(where, 'the slug collides with a language prefix or the 404 page');
		const parsed = pageSchema.safeParse(page.data);
		if (!parsed.success) {
			for (const issue of parsed.error.issues)
				error(where, `frontmatter ${issue.path.join('.') || '(root)'}: ${issue.message}`);
			continue;
		}
		const slugs = keys.get(page.lang);
		const { translationKey } = parsed.data;
		if (slugs?.has(translationKey))
			error(
				where,
				`translationKey ${translationKey} is also used by ${slugs.get(translationKey)}.md`
			);
		slugs?.set(translationKey, page.slug);
	}

	// Every language has every page; translations use the English slug
	const allKeys = new Set([...keys.values()].flatMap((slugs) => [...slugs.keys()]));
	for (const lang of LANGS) {
		const slugs = keys.get(lang) ?? new Map<string, string>();
		if (slugs.size === 0) {
			error(lang, 'no pages');
			continue;
		}
		const missing = [...allKeys].filter((key) => !slugs.has(key));
		if (missing.length > 0) error(lang, `missing translationKey ${missing.join(', ')}`);
		if (lang === DEFAULT_LANG || lang === ENGLISH) continue;
		for (const [key, slug] of slugs) {
			const english = keys.get(ENGLISH)?.get(key);
			if (english && slug !== english)
				error(`${lang}/${slug}.md`, `file name must be the English slug ${english}`);
		}
	}

	// Book order: one structure in all languages, every book page exactly once
	const tocs = new Map<Lang, Toc>();
	for (const lang of LANGS) {
		const parsed = tocSchema.safeParse(input.tocs[lang]);
		if (!parsed.success)
			error(`${lang} toc`, parsed.error.issues.map((i) => i.message).join('; '));
		else tocs.set(lang, parsed.data);
	}
	const reference = tocs.get(DEFAULT_LANG);
	for (const [lang, toc] of tocs) {
		const slugs = keys.get(lang) ?? new Map<string, string>();
		const items = [...toc.preface, ...toc.parts.flatMap((part) => part.items)];
		for (const item of items) {
			if (slugs.get(item.translationKey) !== item.slug)
				error(
					`${lang} toc`,
					`${item.slug} does not match a page with translationKey ${item.translationKey}`
				);
		}
		const listed = items.map((item) => item.translationKey);
		const twice = listed.filter((key, i) => listed.indexOf(key) !== i);
		if (twice.length > 0) error(`${lang} toc`, `listed twice: ${twice.join(', ')}`);
		for (const key of slugs.keys()) {
			if (isInBook(key) && !listed.includes(key))
				error(`${lang} toc`, `${key} is not in the book order`);
			if (!isInBook(key) && listed.includes(key))
				error(`${lang} toc`, `${key} is outside the book`);
		}
		if (reference && lang !== DEFAULT_LANG && shape(toc) !== shape(reference))
			error(`${lang} toc`, `parts or order differ from ${DEFAULT_LANG}`);
	}

	// Glossary: the same entries in the same order
	const glossaryTitles = new Map<Lang, string>();
	for (const lang of LANGS) {
		const parsed = glossarySchema.safeParse(input.glossaries[lang]);
		if (!parsed.success)
			error(`${lang} glossary`, parsed.error.issues.map((i) => i.message).join('; '));
		else glossaryTitles.set(lang, parsed.data.entries.map((entry) => entry.sort).join('\n'));
	}
	const glossaryReference = glossaryTitles.get(DEFAULT_LANG);
	for (const [lang, titles] of glossaryTitles) {
		if (glossaryReference !== undefined && titles !== glossaryReference)
			error(`${lang} glossary`, `entries differ from ${DEFAULT_LANG}`);
	}

	// Links and images
	const routes = new Set<string>(LANGS.map(homePath));
	for (const [lang, slugs] of keys)
		for (const [key, slug] of slugs) routes.add(routeOf(lang, slug, key));
	for (const page of input.pages) {
		const where = `${page.lang}/${page.slug}.md`;
		if (UNCHECKED_FORMS.test(page.body))
			error(
				where,
				'uses a link or image form the checks do not read (single quotes, ![](), srcset)'
			);
		for (const link of internalLinks(page.body)) {
			const isFile = /\.[a-z0-9]+$/i.test(link);
			if (isFile ? !input.assetExists?.(link) : !routes.has(link))
				error(where, `link to ${link} leads nowhere`);
		}
		for (const src of imageUrls(page.body)) {
			if (!src.startsWith('/images/')) error(where, `image ${src} is not below /images/`);
			else if (input.imageExists && !input.imageExists(src))
				error(where, `image ${src} does not exist`);
		}
	}

	return errors;
}

/** The order of translationKeys per part, independent of titles and slugs */
const shape = (toc: Toc): string =>
	JSON.stringify([
		toc.preface.map((item) => item.translationKey),
		...toc.parts.map((part) => part.items.map((item) => item.translationKey)),
	]);
