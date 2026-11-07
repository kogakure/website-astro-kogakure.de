/**
 * The glossary page's entries from glossary.json, grouped by their initial
 * for the A–Z jump list. Pure functions; `getGlossary()` in book.ts loads them.
 */
import type { Lang } from '../../i18n/languages.ts';
import { headingId } from '../markdown/heading-ids.ts';
import { QUOTES } from '../markdown/quotes.ts';
import type { Glossary } from './schema.ts';

type Entry = Glossary['entries'][number];

export interface GlossaryEntry {
	/** Anchor, the id the entry's `h3` had (`aikidō` → `aikido`) */
	id: string;
	/** The romanized term */
	term: string;
	/** The term in its script: kanji, Chinese characters or Sanskrit */
	script?: { text: string; lang: 'ja' | 'zh' | 'sa' } | undefined;
	/** Not Japanese: the language the term comes from */
	origin?: 'chinese' | 'sanskrit' | undefined;
	translation?: string | undefined;
	/** HTML, with the quotation marks of the language written into `<q>` */
	description?: string | undefined;
}

export interface GlossaryLetter {
	/** „A“ */
	letter: string;
	/** Anchor of the letter's heading */
	id: string;
	entries: GlossaryEntry[];
}

/** The initial a term is sorted under: `Ōtomo` → `O` */
export const initial = (sort: string): string => sort.normalize('NFD').charAt(0).toUpperCase();

/** Writes the quotation marks of the language into every `<q>` (like quotes.ts for Markdown) */
export function quoteHtml(html: string, lang: Lang): string {
	const [open, close] = QUOTES[lang];
	return html.replace(/<q>/g, `<q>${open}`).replace(/<\/q>/g, `${close}</q>`);
}

function script(entry: Entry): GlossaryEntry['script'] {
	if (entry.japanese) return { text: entry.japanese, lang: 'ja' };
	if (entry.chinese) return { text: entry.chinese, lang: 'zh' };
	if (entry.sanskrit) return { text: entry.sanskrit, lang: 'sa' };
	return undefined;
}

const origin = (entry: Entry): GlossaryEntry['origin'] =>
	entry.chinese ? 'chinese' : entry.sanskrit ? 'sanskrit' : undefined;

/** The entries by initial, in the order of glossary.json, each with a unique anchor */
export function glossaryLetters(entries: readonly Entry[], lang: Lang): GlossaryLetter[] {
	const letters = new Map<string, GlossaryLetter>();
	const used = new Set<string>();
	const unique = (base: string) => {
		let id = base;
		for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
		used.add(id);
		return id;
	};
	for (const entry of entries) {
		const letter = initial(entry.sort);
		let group = letters.get(letter);
		if (!group) {
			group = { letter, id: unique(headingId(letter)), entries: [] };
			letters.set(letter, group);
		}
		group.entries.push({
			id: unique(headingId(entry.title)),
			term: entry.title,
			script: script(entry),
			origin: origin(entry),
			translation: entry.translation,
			description: entry.description && quoteHtml(entry.description, lang),
		});
	}
	return [...letters.values()];
}
