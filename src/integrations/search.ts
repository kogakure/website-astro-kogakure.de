import type { AstroIntegration, ViteUserConfig } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Lang } from '../i18n/languages.ts';
import { readImportedBook } from '../lib/book/read.ts';
import type { Glossary } from '../lib/book/schema.ts';
import { glossaryRecords } from '../lib/search/records.ts';
import { EXCLUDED, PAGEFIND_DIR, PAGEFIND_URL } from '../lib/search/search.ts';

/** `pnpm dev` without a built index: a Pagefind that finds nothing */
const STUB = `export const init = async () => {};
export const options = async () => {};
export const debouncedSearch = async () => ({ results: [] });`;

/** A plugin object of Vite, which is no dependency of its own here */
type VitePlugin = Exclude<
	NonNullable<ViteUserConfig['plugins']>[number],
	false | null | undefined | unknown[] | Promise<unknown>
>;

const MIME: Record<string, string> = {
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.wasm': 'application/wasm',
};

/**
 * In `pnpm dev`, /pagefind/ serves the index of the last build (dist/pagefind),
 * so the search finds real pages once the site was built; without one,
 * pagefind.js is a stub that finds nothing
 */
const devPagefind = (outDir: string): VitePlugin => ({
	name: 'kogakure:pagefind-dev',
	apply: 'serve',
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			const url = req.url?.split('?')[0] ?? '';
			if (!url.startsWith(`/${PAGEFIND_DIR}/`)) return next();
			const file = path.join(outDir, url);
			const inside = !path.relative(path.join(outDir, PAGEFIND_DIR), file).startsWith('..');
			if (inside && fs.existsSync(file) && fs.statSync(file).isFile()) {
				res.setHeader(
					'Content-Type',
					MIME[path.extname(file)] ?? 'application/octet-stream'
				);
				res.end(fs.readFileSync(file));
			} else if (url === PAGEFIND_URL) {
				res.setHeader('Content-Type', MIME['.js'] as string);
				res.end(STUB);
			} else {
				res.statusCode = 404;
				res.end();
			}
		});
	},
});

/** Files of Pagefind's bundle that nothing loads: its ready-made search interfaces */
const UNUSED = /^pagefind-(ui|modular-ui|component-ui|highlight)\.(js|css)$/;

/** Fails the build on an error of a Pagefind step */
function fail(step: string, result: { errors: string[] }) {
	if (result.errors.length > 0) throw new Error(`Pagefind ${step}: ${result.errors.join(', ')}`);
}

/**
 * The search (SI-479): after the build, Pagefind indexes the pages marked
 * `data-pagefind-body` (the articles) and the glossary entries as records of
 * their own, into dist/pagefind/. Registers `client:search`, which loads the
 * search dialog only when it is opened, and the dev server's Pagefind.
 */
export const searchIntegration = (): AstroIntegration => {
	let root = '';
	return {
		name: 'kogakure:search',
		hooks: {
			'astro:config:setup': ({ config, addClientDirective, updateConfig }) => {
				root = fileURLToPath(config.root);
				addClientDirective({
					name: 'search',
					entrypoint: fileURLToPath(new URL('./search-directive.ts', import.meta.url)),
				});
				updateConfig({ vite: { plugins: [devPagefind(fileURLToPath(config.outDir))] } });
			},
			'astro:build:done': async ({ dir, logger }) => {
				const pagefind = await import('pagefind');
				const outDir = fileURLToPath(dir);
				const bundle = path.join(outDir, PAGEFIND_DIR);
				try {
					const { index, errors } = await pagefind.createIndex({
						excludeSelectors: EXCLUDED,
					});
					if (!index) throw new Error(`Pagefind: ${errors.join(', ')}`);
					const pages = await index.addDirectory({ path: outDir });
					fail('pages', pages);
					// Valid: validate-book.ts checked the book when the build started
					const { pages: book, glossaries } = readImportedBook(root);
					const records = glossaryRecords(
						book,
						glossaries as Partial<Record<Lang, Glossary>>
					);
					for (const record of records)
						fail('glossary', await index.addCustomRecord(record));
					fail('write', await index.writeFiles({ outputPath: bundle }));
					logger.info(
						`Indexed the articles of ${pages.page_count} HTML files and ${records.length} glossary entries`
					);
				} finally {
					await pagefind.close();
				}
				// Pagefind's own search interfaces: the dialog is ours
				for (const file of fs.readdirSync(bundle))
					if (UNUSED.test(file)) fs.rmSync(path.join(bundle, file));
			},
		},
	};
};
