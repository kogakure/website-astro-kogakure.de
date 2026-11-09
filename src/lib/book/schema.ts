/**
 * Schemas of the imported content. Shared by the content collections
 * (`src/content.config.ts`) and the import script, so both reject the same
 * content.
 */
import { z } from 'astro/zod';

/** Category keys, the same English values in every language (kogakure-texts SI-470) */
export const CATEGORIES = [
	'biography',
	'guidelines',
	'history',
	'organization',
	'philosophy',
	'religion',
	'schools',
	'strategy',
	'tactics',
	'tools',
	'training',
	'war',
	'weapons',
] as const;

/** A title; `&shy;` is a leftover of the old site, the browser hyphenates German itself */
const title = z
	.string()
	.min(1)
	.refine((value) => !value.includes('&shy;'), 'Leftover &shy; of the old site in a title');

export const pageSchema = z
	.object({
		title,
		/** Sort key of the old site; the book order comes from the TOC */
		priority: z.number().int(),
		date: z.coerce.date().optional(),
		author: z.string().optional(),
		translator: z.string().optional(),
		excerpt: z.string().max(400).optional(),
		/** Ties the twelve language versions of a page together */
		translationKey: z.string().regex(/^[a-zA-Z0-9]+$/),
		categories: z.array(z.enum(CATEGORIES)).default([]),
		/** The name-plate term of the article (SI-476) */
		plate: z.string().optional(),
	})
	.strict();

export type PageData = z.infer<typeof pageSchema>;

const tocItemSchema = z
	.object({
		title,
		slug: z.string().regex(/^[a-z0-9-]+$/),
		translationKey: z.string(),
	})
	.strict();

/** The book order of one language: the front matter, then the parts */
export const tocSchema = z
	.object({
		preface: z.array(tocItemSchema).min(1),
		parts: z.array(z.object({ title, items: z.array(tocItemSchema).min(1) }).strict()),
	})
	.strict();

export type Toc = z.infer<typeof tocSchema>;
export type TocItem = z.infer<typeof tocItemSchema>;

const glossaryEntrySchema = z
	.object({
		title: z.string().min(1),
		sort: z.string().min(1),
		japanese: z.string().optional(),
		chinese: z.string().optional(),
		sanskrit: z.string().optional(),
		translation: z.string().optional(),
		description: z.string().min(1).optional(),
	})
	.strict();

export const glossarySchema = z.object({ entries: z.array(glossaryEntrySchema).min(1) }).strict();

export type Glossary = z.infer<typeof glossarySchema>;

/** A legal page of the website (src/legal/), German and English */
export const legalSchema = z
	.object({
		title,
		description: z.string().min(1),
		/** When the text was last changed in substance */
		updated: z.coerce.date(),
	})
	.strict();

/**
 * The ebook's page (src/ebook/, SI-504), German and English: the title, the
 * lede under it, and the text after the downloads
 */
export const ebookSchema = z
	.object({
		title,
		/** The lede under the title, also the page's description */
		description: z.string().min(1),
	})
	.strict();
