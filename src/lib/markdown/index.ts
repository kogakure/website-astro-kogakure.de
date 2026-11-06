import type { HastPluginList } from 'satteri';
import { hastBanners } from './banners.ts';
import { hastFigures } from './figures.ts';
import { hastGlossedTerms } from './glossed-terms.ts';
import { hastHeadingIds } from './heading-ids.ts';
import { hastNoBreakDash } from './no-break-dash.ts';
import { hastQuotes } from './quotes.ts';
import { hastReadingTime } from './reading-time.ts';
import { hastTables } from './tables.ts';

/** Markdown features of the texts: raw HTML as real elements, no SmartyPants (the texts are typeset) */
export const MARKDOWN_FEATURES = { gfm: true, rawHtml: true, smartPunctuation: false } as const;

/**
 * The HAST plugins of the book, in order. Factories run once per document.
 * Glosses come before quotes: a gloss moves the `<q>` of its meaning.
 */
export const BOOK_HAST_PLUGINS: HastPluginList = [
	hastHeadingIds,
	hastGlossedTerms,
	hastQuotes,
	hastNoBreakDash,
	hastFigures(),
	hastBanners,
	hastTables,
	hastReadingTime,
];
