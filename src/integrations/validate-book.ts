import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readImportedBook } from '../lib/book/read.ts';
import { validateBook } from '../lib/book/validate.ts';
import { generatedFiles } from '../lib/images/images.ts';

/**
 * Fails the build (and the dev server start) when the imported book is
 * broken: the same checks as `pnpm import:content`, except that an image
 * must be in the image manifest with all its files in public/images/
 * (`pnpm images`) instead of in kogakure-texts.
 */
export const validateBookIntegration = (): AstroIntegration => ({
	name: 'kogakure:validate-book',
	hooks: {
		'astro:config:setup': ({ config, logger }) => {
			const root = fileURLToPath(config.root);
			const imageExists = (url: string) => {
				const files = generatedFiles(url);
				return (
					files.length > 0 &&
					files.every((file) => fs.existsSync(path.join(root, 'public', file)))
				);
			};
			const errors = validateBook({ ...readImportedBook(root), imageExists });
			if (errors.length > 0)
				throw new Error(
					`The book is not valid:\n${errors.map((e) => `  ${e}`).join('\n')}`
				);
			logger.info('Book content is valid');
		},
	},
});
