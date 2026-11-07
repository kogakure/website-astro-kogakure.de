/**
 * The glossary entries as search results of their own (Pagefind custom
 * records), written by the build (src/integrations/search.ts). Node only.
 */
import { language, LANGS, type Lang } from '../../i18n/languages.ts';
import { routeOf } from '../../i18n/routes.ts';
import { glossaryLetters } from '../book/glossary.ts';
import type { Glossary } from '../book/schema.ts';
import { GLOSSARY_PAGE } from '../book/transform.ts';
import { CHAPTER_META } from './search.ts';

/** A Pagefind custom record (`addCustomRecord`) */
export interface SearchRecord {
	url: string;
	content: string;
	language: string;
	meta: Record<string, string>;
}

interface BookPage {
	lang: string;
	slug: string;
	data: unknown;
}

const stripTags = (html: string): string => html.replace(/<[^>]*>/g, '');

/**
 * Every glossary entry as a result of its own, linking to its anchor on the
 * glossary page of its language: the term with its kanji as the title, the
 * glossary as its chapter, the meaning and description as its text
 */
export function glossaryRecords(
	pages: readonly BookPage[],
	glossaries: Partial<Record<Lang, Glossary>>
): SearchRecord[] {
	return LANGS.flatMap((lang) => {
		const glossary = glossaries[lang];
		const page = pages.find(
			(p) =>
				p.lang === lang &&
				(p.data as { translationKey?: string }).translationKey === GLOSSARY_PAGE
		);
		if (!glossary || !page) return [];
		const path = routeOf(lang, page.slug, GLOSSARY_PAGE);
		const { title } = page.data as { title: string };
		return glossaryLetters(glossary.entries, lang).flatMap(({ entries }) =>
			entries.map((entry) => ({
				url: `${path}#${entry.id}`,
				content: [
					entry.term,
					entry.script?.text,
					entry.translation,
					entry.description && stripTags(entry.description),
				]
					.filter(Boolean)
					.join('. '),
				// As Pagefind writes `<html lang>`: lower case (pt-br, zh-hans)
				language: language(lang).htmlLang.toLowerCase(),
				meta: {
					title: entry.script ? `${entry.term} ${entry.script.text}` : entry.term,
					[CHAPTER_META]: title,
				},
			}))
		);
	});
}
