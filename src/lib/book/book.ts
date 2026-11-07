/**
 * The only way pages access the book. Hands out data, no markup.
 */
import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, isLang, LANGS, type Lang } from '@/i18n/languages';
import {
	chapterSlug,
	CONTENTS,
	contentsPath,
	homePath,
	isInBook,
	LEGAL_PAGES,
	legalPath,
	type LegalPage,
	pagePath,
	routeOf,
	routeParam,
} from '@/i18n/routes';
import { joinCredit, ui } from '@/i18n/ui';
import { buildAlternates, type Alternates } from './alternates';
import { pageFigures } from './figures';
import { glossaryLetters, type GlossaryLetter } from './glossary';
import { chapterLabel, isChapter, SCENES, SECTION_PLATES, type Scene } from './plates';

export type PageEntry = CollectionEntry<'book'>;

/** `de/abhaertung` → { lang: 'de', slug: 'abhaertung' } */
export function parseId(id: string): { lang: Lang; slug: string } {
	const [lang, slug] = id.split('/');
	if (!isLang(lang) || !slug) throw new Error(`Unexpected book entry id: ${id}`);
	return { lang, slug };
}

export const pageUrl = (entry: PageEntry): string => {
	const { lang, slug } = parseId(entry.id);
	return routeOf(lang, slug, entry.data.translationKey);
};

/** `getStaticPaths` of the book pages: every page in the book, in every language */
export async function getBookPaths() {
	const pages = await getCollection('book', (entry) => isInBook(entry.data.translationKey));
	return pages.map((entry) => ({
		params: { route: routeParam(pageUrl(entry)) },
		props: { kind: 'article' as const, entry, lang: parseId(entry.id).lang },
	}));
}

/** The rendered text of a page */
export const renderPage = (entry: PageEntry) => render(entry);

export async function getPage(lang: Lang, translationKey: string): Promise<PageEntry> {
	const entry = (await getCollection('book')).find(
		(page) => parseId(page.id).lang === lang && page.data.translationKey === translationKey
	);
	if (!entry) throw new Error(`No ${lang} page with translationKey ${translationKey}`);
	return entry;
}

/** The glossary's entries in a language, by initial */
export async function getGlossary(lang: Lang): Promise<GlossaryLetter[]> {
	const glossary = await getEntry('glossary', lang);
	if (!glossary) throw new Error(`No glossary for ${lang}`);
	return glossaryLetters(glossary.data.entries, lang);
}

let alternates: Promise<Map<string, Alternates>> | undefined;

const perLang = (path: (lang: Lang) => string) =>
	Object.fromEntries(LANGS.map((lang) => [lang, path(lang)])) as Alternates;

async function allAlternates(): Promise<Map<string, Alternates>> {
	const map = buildAlternates(
		(await getCollection('book')).map((entry) => ({
			...parseId(entry.id),
			translationKey: entry.data.translationKey,
		}))
	);
	map.set(CONTENTS, perLang(contentsPath));
	for (const page of Object.keys(LEGAL_PAGES) as LegalPage[])
		map.set(
			page,
			perLang((lang) => legalPath(lang, page))
		);
	return map;
}

/**
 * All language versions of a page by its key: a page's translationKey,
 * `contents`, `home`, or a legal page (`imprint`, `privacy`)
 */
export async function getAlternates(key: string): Promise<Alternates> {
	alternates ??= allAlternates();
	const versions = (await alternates).get(key);
	if (!versions) throw new Error(`No page with key ${key}`);
	return versions;
}

export interface TocLink {
	title: string;
	href: string;
	translationKey: string;
}

export interface TocPart {
	/** null for the front matter (preface and introduction) */
	title: string | null;
	/** 1-based part number, null for the front matter */
	number: number | null;
	items: TocLink[];
}

export async function getToc(lang: Lang): Promise<TocPart[]> {
	const toc = await getEntry('toc', lang);
	if (!toc) throw new Error(`No TOC for ${lang}`);
	const link = ({
		title,
		slug,
		translationKey,
	}: {
		title: string;
		slug: string;
		translationKey: string;
	}) => ({
		title,
		href: pagePath(lang, slug),
		translationKey,
	});
	return [
		{ title: null, number: null, items: toc.data.preface.map(link) },
		...toc.data.parts.map((part, i) => ({
			title: part.title,
			number: i + 1,
			items: part.items.map(link),
		})),
	];
}

/** The book in reading order */
export const getBookOrder = async (lang: Lang): Promise<TocLink[]> =>
	(await getToc(lang)).flatMap((part) => part.items);

export interface Neighbours {
	previous?: TocLink;
	next?: TocLink;
}

export async function getNeighbours(lang: Lang, translationKey: string): Promise<Neighbours> {
	const order = await getBookOrder(lang);
	const index = order.findIndex((item) => item.translationKey === translationKey);
	if (index === -1) return {};
	return { previous: order[index - 1], next: order[index + 1] };
}

export interface ChapterItem extends TocLink {
	excerpt?: string | undefined;
}

/** A section of the book, a scene on the homepage: the front matter, a chapter or the appendix */
export interface Chapter {
	/** 0 for the front matter, 1–8 for the chapters, 9 for the appendix */
	index: number;
	title: string;
	/** The id of its scene on the homepage */
	slug: string;
	/** Its scene on the homepage */
	href: string;
	/** The chapter's number, null for the front matter and the appendix */
	number: number | null;
	/** The name plate: kanji, the short kanji of the contents, the number line (第一章) */
	plate: { name: string; short: string; number: string | null };
	/** The painting of its scene, with the alt text and caption of the page that shows it */
	scene: Scene & { alt: string; caption: string };
	items: ChapterItem[];
}

/** The figures of every page of a language, by image */
async function figuresOf(lang: Lang) {
	const pages = await getCollection('book', (entry) => parseId(entry.id).lang === lang);
	return new Map(pages.flatMap((entry) => pageFigures(entry.body ?? '').map((f) => [f.src, f])));
}

async function loadChapters(lang: Lang): Promise<Chapter[]> {
	const [toc, englishToc, figures, pages] = await Promise.all([
		getToc(lang),
		getToc('en'),
		figuresOf(lang),
		getCollection('book', (entry) => parseId(entry.id).lang === lang),
	]);
	if (toc.length !== SECTION_PLATES.length)
		throw new Error(
			`The ${lang} TOC has ${toc.length} sections, the plates ${SECTION_PLATES.length}`
		);
	const excerpts = new Map(pages.map((entry) => [entry.data.translationKey, entry.data.excerpt]));
	return toc.map((part, index) => {
		const title = part.title ?? ui(lang).introduction;
		const slugTitle =
			lang === DEFAULT_LANG ? title : (englishToc[index]?.title ?? ui('en').introduction);
		const slug = chapterSlug(slugTitle, lang);
		const scene = SCENES[index]!;
		const figure = figures.get(scene.image);
		if (!figure) throw new Error(`No ${lang} page shows the scene ${scene.image}`);
		const plate = SECTION_PLATES[index]!;
		const number = isChapter(index) ? index : null;
		return {
			index,
			title,
			slug,
			href: `${homePath(lang)}#${slug}`,
			number,
			plate: {
				name: plate.name,
				short: plate.short,
				number: number ? chapterLabel(number) : null,
			},
			scene: { ...scene, alt: figure.alt, caption: figure.caption },
			items: part.items.map((item) => ({
				...item,
				excerpt: excerpts.get(item.translationKey),
			})),
		};
	});
}

const chapters = new Map<Lang, Promise<Chapter[]>>();

/** The ten sections of the book in a language, each with its scene and articles */
export function getChapters(lang: Lang): Promise<Chapter[]> {
	let loaded = chapters.get(lang);
	if (!loaded) {
		loaded = loadChapters(lang);
		chapters.set(lang, loaded);
	}
	return loaded;
}

/** The section a page belongs to */
export const chapterOf = async (lang: Lang, translationKey: string) =>
	(await getChapters(lang)).find((chapter) =>
		chapter.items.some((item) => item.translationKey === translationKey)
	);

/**
 * The pages besides the book's articles, in every language: the homepage,
 * the contents and the legal pages. The rest route renders them.
 */
export const getSitePaths = () =>
	LANGS.flatMap((lang) => [
		{
			params: { route: routeParam(homePath(lang)) || undefined },
			props: { kind: 'home' as const, lang },
		},
		{
			params: { route: routeParam(contentsPath(lang)) },
			props: { kind: 'contents' as const, lang },
		},
		...(Object.keys(LEGAL_PAGES) as LegalPage[]).map((page) => ({
			params: { route: routeParam(legalPath(lang, page)) },
			props: { kind: 'legal' as const, lang, page },
		})),
	]);

export type LegalEntry = CollectionEntry<'legal'>;

/** A legal page in German or English */
export async function getLegalPage(lang: 'de' | 'en', page: LegalPage): Promise<LegalEntry> {
	const entry = await getEntry('legal', `${lang}/${LEGAL_PAGES[page][lang]}`);
	if (!entry) throw new Error(`No ${lang} ${page} page in src/legal/`);
	return entry;
}

/** The rendered text of a legal page */
export const renderLegalPage = (entry: LegalEntry) => render(entry);

/** „Kapitel 1, 10 Artikel“: a part's place in the book and its size */
export function chapterCredit(lang: Lang, chapter: Chapter): string {
	const t = ui(lang);
	const place = chapter.number
		? t.chapterNumber(chapter.number)
		: chapter.index === 0
			? t.beforeChapters
			: t.afterChapters;
	return joinCredit(lang, [place, t.articleCount(chapter.items.length)]);
}
