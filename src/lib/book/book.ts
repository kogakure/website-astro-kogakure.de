/**
 * The only way pages access the book. Hands out data, no markup.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { isLang, type Lang } from '@/i18n/languages';
import { pagePath, routeOf } from '@/i18n/routes';
import { buildAlternates, type Alternates } from './alternates';

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

export async function getPage(lang: Lang, translationKey: string): Promise<PageEntry> {
	const entry = (await getCollection('book')).find(
		(page) => parseId(page.id).lang === lang && page.data.translationKey === translationKey
	);
	if (!entry) throw new Error(`No ${lang} page with translationKey ${translationKey}`);
	return entry;
}

let alternates: Map<string, Alternates> | undefined;

/** All language versions of a page by translationKey (or `home`) */
export async function getAlternates(key: string): Promise<Alternates> {
	alternates ??= buildAlternates(
		(await getCollection('book')).map((entry) => ({
			...parseId(entry.id),
			translationKey: entry.data.translationKey,
		}))
	);
	const versions = alternates.get(key);
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
