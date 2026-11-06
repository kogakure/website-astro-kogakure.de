/**
 * Reads the imported content from disk (Node only): for the build-time check
 * of the book, which runs outside Astro's content layer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { LANGS } from '../../i18n/languages.ts';
import { splitFrontmatter } from './transform.ts';
import type { BookInput, SourcePage } from './validate.ts';

/** Where the import writes, relative to the project root */
export const CONTENT_DIRS = {
	book: 'src/content/book',
	toc: 'src/content/toc',
	glossary: 'src/content/glossary',
} as const;

/**
 * Files the texts link to that other issues bring:
 * the Iga ninja font is part of the downloads page (SI-477).
 */
const PENDING_ASSETS = new Set(['/downloads/iga-ninja-font.zip']);

export const assetExists =
	(root: string) =>
	(url: string): boolean =>
		PENDING_ASSETS.has(url) || fs.existsSync(path.join(root, 'public', url));

const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));

export function readImportedBook(root: string): BookInput {
	const pages: SourcePage[] = [];
	for (const lang of LANGS) {
		const dir = path.join(root, CONTENT_DIRS.book, lang);
		if (!fs.existsSync(dir)) continue;
		for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
			const { frontmatter, body } = splitFrontmatter(
				fs.readFileSync(path.join(dir, name), 'utf8')
			);
			pages.push({ lang, slug: name.slice(0, -3), data: parseYaml(frontmatter), body });
		}
	}
	const perLang = (dir: string) =>
		Object.fromEntries(
			LANGS.map((lang) => [lang, path.join(root, dir, `${lang}.json`)])
				.filter(([, file]) => fs.existsSync(file as string))
				.map(([lang, file]) => [lang, readJson(file as string)])
		);
	return {
		pages,
		tocs: perLang(CONTENT_DIRS.toc),
		glossaries: perLang(CONTENT_DIRS.glossary),
		assetExists: assetExists(root),
	};
}
