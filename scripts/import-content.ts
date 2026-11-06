/**
 * Imports the book from kogakure-texts into src/content. Coolify only sees
 * this repo, so the result is committed. Reads (never writes) the texts repo:
 *
 *   texts/new/<lang>/*.md             → src/content/book/<lang>/*.md
 *   texts/new/<lang>/data/toc.json
 *     + preface.json                  → src/content/toc/<lang>.json
 *   texts/new/<lang>/data/glossary.json → src/content/glossary/<lang>.json
 *
 * On the way it drops the `source` field, keeps the WEBSITE-ONLY parts,
 * rewrites image paths to /images/… and adds the translationKey to the TOC.
 * Nothing is written if the book fails validation. Rerunning it on unchanged
 * texts produces no diff.
 *
 * Usage: pnpm import:content [path/to/kogakure-texts]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { LANGS, type Lang } from '../src/i18n/languages.ts';
import { assetExists, CONTENT_DIRS } from '../src/lib/book/read.ts';
import {
	DROPPED_FIELDS,
	dropFields,
	imageSource,
	joinFrontmatter,
	keepWebsiteOnly,
	rewriteImages,
	splitFrontmatter,
} from '../src/lib/book/transform.ts';
import { validateBook, type SourcePage } from '../src/lib/book/validate.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const TEXTS_REPO = path.resolve(process.argv[2] ?? path.join(ROOT, '..', 'kogakure-texts'));
const TEXTS = path.join(TEXTS_REPO, 'texts/new');

if (!fs.existsSync(TEXTS)) {
	console.error(`kogakure-texts not found at ${TEXTS_REPO}`);
	process.exit(1);
}

const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));
const toJson = (value: unknown) => `${JSON.stringify(value, null, '\t')}\n`;

interface Imported extends SourcePage {
	text: string;
}

const pages: Imported[] = [];
const failures: string[] = [];
for (const lang of LANGS) {
	const dir = path.join(TEXTS, lang);
	for (const name of fs
		.readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.toSorted()) {
		try {
			const split = splitFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'));
			const frontmatter = dropFields(split.frontmatter, DROPPED_FIELDS);
			const body = rewriteImages(keepWebsiteOnly(split.body));
			pages.push({
				lang,
				slug: name.slice(0, -3),
				data: parseYaml(frontmatter),
				body,
				text: joinFrontmatter({ frontmatter, body }),
			});
		} catch (error) {
			failures.push(`${lang}/${name}: ${(error as Error).message}`);
		}
	}
}

interface SourceItem {
	title: string;
	slug: string;
}

/** The TOC of one language, each item with the translationKey of its page */
function toc(lang: Lang) {
	const keys = new Map(
		pages
			.filter((page) => page.lang === lang)
			.map((page) => [page.slug, (page.data as { translationKey?: string }).translationKey])
	);
	const item = ({ title, slug }: SourceItem) => ({
		title,
		slug,
		translationKey: keys.get(slug) ?? '',
	});
	const data = path.join(TEXTS, lang, 'data');
	const preface = readJson(path.join(data, 'preface.json')) as SourceItem[];
	const parts = readJson(path.join(data, 'toc.json')) as { title: string; items: SourceItem[] }[];
	return {
		preface: preface.map(item),
		parts: parts.map((part) => ({ title: part.title, items: part.items.map(item) })),
	};
}

const tocs = Object.fromEntries(LANGS.map((lang) => [lang, toc(lang)]));
const glossaries = Object.fromEntries(
	LANGS.map((lang) => [lang, { entries: readJson(path.join(TEXTS, lang, 'data/glossary.json')) }])
);

failures.push(
	...validateBook({
		pages,
		tocs,
		glossaries,
		imageExists: (url) => fs.existsSync(path.join(TEXTS_REPO, imageSource(url))),
		assetExists: assetExists(ROOT),
	})
);

if (failures.length > 0) {
	console.error(
		`The book is not valid, nothing was written:\n${failures.map((f) => `  ${f}`).join('\n')}`
	);
	process.exit(1);
}

// Replace the generated folders as a whole, so deleted texts disappear
for (const dir of Object.values(CONTENT_DIRS)) {
	fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
	fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
}
for (const page of pages) {
	const file = path.join(ROOT, CONTENT_DIRS.book, page.lang, `${page.slug}.md`);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, page.text);
}
for (const lang of LANGS) {
	fs.writeFileSync(path.join(ROOT, CONTENT_DIRS.toc, `${lang}.json`), toJson(tocs[lang]));
	fs.writeFileSync(
		path.join(ROOT, CONTENT_DIRS.glossary, `${lang}.json`),
		toJson(glossaries[lang])
	);
}

console.log(
	`Imported ${pages.length} pages, ${LANGS.length} TOCs and glossaries from ${TEXTS_REPO}`
);
