import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { ebookSchema, glossarySchema, legalSchema, pageSchema, tocSchema } from '@/lib/book/schema';

/** book, toc and glossary are written by `pnpm import:content`; edit the texts in kogakure-texts */

/** Every page of the book, id `<lang>/<slug>` */
const book = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/book' }),
	schema: pageSchema,
});

/** The book order per language, id `<lang>` */
const toc = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/toc' }),
	schema: tocSchema,
});

/** The glossary entries per language, id `<lang>` */
const glossary = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/glossary' }),
	schema: glossarySchema,
});

/**
 * The legal pages, written for the website (not imported): German and
 * English, id `<lang>/<slug>`
 */
const legal = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/legal' }),
	schema: legalSchema,
});

/**
 * The ebook's page, written for the website (not imported): German and
 * English, id `<lang>/<slug>` (SI-504)
 */
const ebook = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/ebook' }),
	schema: ebookSchema,
});

export const collections = { book, toc, glossary, legal, ebook };
