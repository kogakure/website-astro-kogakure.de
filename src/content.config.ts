import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { glossarySchema, pageSchema, tocSchema } from '@/lib/book/schema';

/** Written by `pnpm import:content`; edit the texts in kogakure-texts */

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

export const collections = { book, toc, glossary };
