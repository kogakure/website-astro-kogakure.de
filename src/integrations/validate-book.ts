import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { readImportedBook } from '../lib/book/read.ts';
import { validateBook } from '../lib/book/validate.ts';

/**
 * Fails the build (and the dev server start) when the imported book is
 * broken: the same checks as `pnpm import:content`, without the images,
 * which only the import can see.
 */
export const validateBookIntegration = (): AstroIntegration => ({
	name: 'kogakure:validate-book',
	hooks: {
		'astro:config:setup': ({ config, logger }) => {
			const errors = validateBook(readImportedBook(fileURLToPath(config.root)));
			if (errors.length > 0)
				throw new Error(
					`The book is not valid:\n${errors.map((e) => `  ${e}`).join('\n')}`
				);
			logger.info('Book content is valid');
		},
	},
});
