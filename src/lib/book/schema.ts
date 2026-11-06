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

export const pageSchema = z
	.object({
		title: z.string().min(1),
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
		title: z.string().min(1),
		slug: z.string().regex(/^[a-z0-9-]+$/),
		translationKey: z.string(),
	})
	.strict();

/** The book order of one language: the front matter, then the parts */
export const tocSchema = z
	.object({
		preface: z.array(tocItemSchema).min(1),
		parts: z.array(
			z.object({ title: z.string().min(1), items: z.array(tocItemSchema).min(1) }).strict()
		),
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
