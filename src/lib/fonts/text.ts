/**
 * The characters the site sets, per language, for the font subsets
 * (scripts/generate-fonts.ts). Node only: reads the imported content in
 * src/content and the UI strings. fonts.test.ts compares the hash with the
 * manifest, so the fonts can't fall behind the content.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { LANGS, LANGUAGES, type Lang } from '../../i18n/languages.ts';
import { ui } from '../../i18n/ui.ts';
import { BOOK_PLATE, DESIGN_NAME, PLATE_TEXT, SCENES } from '../book/plates.ts';
import type { Glossary, Toc } from '../book/schema.ts';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const CONTENT = path.join(ROOT, 'src/content');

/** Japanese, Chinese and Korean characters: Han, kana, Hangul, CJK punctuation, full-width forms */
export const CJK =
	/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}　-〿ー＀-￯]/u;

/** `_tengu_ (天狗` and `<em>tengu</em> (天狗`: the kanji of a margin gloss, set in the brush face */
const GLOSS = /(?:_[^_\n]+_|\*[^*\n]+\*|<em>[^<]+<\/em>) \(([\p{Script=Han}々〆〇]+)/gu;

/** Front matter title and plate, headings, bold and table headers of a Markdown page */
const BOLD =
	/^(?:title|plate): (.*)$|^#{1,6} (.*)$|\*\*([^*\n]+)\*\*|<(strong|b|th)\b[^>]*>([^<]*)<\/\4>/gmu;

export interface PageText {
	/** File name in src/content/book/<lang>/ without `.md` */
	slug: string;
	/** What it shows: title, excerpt, plate and the body without markup; the glossary page with its entries */
	text: string;
	/** What it sets in bold: title, headings, `strong`, the glossary's terms */
	bold: string;
	/** What it sets in italic: the lede (excerpt) and emphasis */
	italic: string;
	/** The kanji of its margin glosses */
	glosses: string;
}

export interface LanguageText {
	/** Every page of the book */
	pages: PageText[];
	/** On every page: the UI strings and the plates */
	ui: string;
	/** The homepage: the UI, the contents and every page's excerpt */
	home: string;
	/** What the homepage sets in bold: the UI and the contents */
	homeBold: string;
	/** What the homepage sets in italic: the romaji of the title plate */
	homeItalic: string;
	/** The language names of the language select, each in its own script */
	languageNames: string;
}

const read = (file: string) => fs.readFileSync(file, 'utf8');

/** The UI strings of a language, with the counting ones filled in */
const uiText = (lang: Lang) =>
	Object.values(ui(lang))
		.map((value) => (typeof value === 'function' ? value(1, 2, 3) : String(value)))
		.join('\n');

/** The titles of the contents */
function tocTitles(toc: Toc): string {
	const { preface, parts } = toc;
	return [...preface, ...parts.flatMap(({ title, items }) => [{ title }, ...items])]
		.map(({ title }) => title)
		.join('\n');
}

/**
 * What an article sets of other pages, in its top bar and after the text:
 * its part's title and the titles of the previous and the next page
 */
function bookContext(toc: Toc): Map<string, string> {
	const parts = [{ title: '', items: toc.preface }, ...toc.parts];
	const order = parts.flatMap(({ title, items }) =>
		items.map((item) => ({ ...item, part: title }))
	);
	return new Map(
		order.map(({ slug, part }, i) => [
			slug,
			[part, order[i - 1]?.title, order[i + 1]?.title].filter(Boolean).join('\n'),
		])
	);
}

/** The caption of a painting, wherever a page of the language shows it */
function captionOf(image: string, markdown: readonly string[]): string {
	const escaped = image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const figure = new RegExp(
		`<img\\b[^>]*\\bsrc="${escaped}"[^>]*>\\s*<figcaption>([\\s\\S]*?)</figcaption>`
	);
	for (const page of markdown) {
		const match = figure.exec(page);
		if (match) return match[1] ?? '';
	}
	return '';
}

const frontmatter = (page: string): Record<string, unknown> =>
	(parseYaml(/^---\n([\s\S]*?)\n---/.exec(page)?.[1] ?? '') as Record<string, unknown>) ?? {};

export /** The kanji of a page's margin glosses */
const glossKanji = (page: string) => [...page.matchAll(GLOSS)].map((match) => match[1]).join('');

/** The page that also sets the glossary's entries */
const GLOSSARY = 'glossary';

const boldText = (page: string) =>
	[...page.matchAll(BOLD)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[5] ?? '').join('\n');

/** The glossary sets its terms in bold */
const glossaryTerms = (glossary: Glossary) => glossary.entries.map(({ title }) => title);

/** Every field of the glossary's entries */
const glossaryText = (glossary: Glossary) =>
	glossary.entries.map((entry) => Object.values(entry).join('\n'));

/** What a page shows: the front matter's title, excerpt and plate, the body without tags */
function visibleText(page: string): string {
	const { title, excerpt, plate } = frontmatter(page);
	const body = page
		.replace(/^---\n[\s\S]*?\n---/, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\]\([^)]*\)/g, ']');
	return [title, excerpt, plate, body].filter(Boolean).join('\n');
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, '');

/** Emphasis in Markdown and HTML */
const ITALIC = /(?<![\w*])[_*]([^_*\n]+)[_*](?![\w*])|<(em|i|cite)\b[^>]*>([^<]*)<\/\2>/gu;

const italicText = (page: string) =>
	[...page.matchAll(ITALIC)].map((m) => m[1] ?? m[3] ?? '').join('\n');

export function languageText(lang: Lang): LanguageText {
	const dir = path.join(CONTENT, 'book', lang);
	const glossary = JSON.parse(read(path.join(CONTENT, 'glossary', `${lang}.json`))) as Glossary;
	const toc = JSON.parse(read(path.join(CONTENT, 'toc', `${lang}.json`))) as Toc;
	const context = bookContext(toc);
	const files = fs
		.readdirSync(dir)
		.filter((name) => name.endsWith('.md'))
		.toSorted()
		.map((name) => ({ slug: name.slice(0, -3), markdown: read(path.join(dir, name)) }));
	const pages = files.map(({ slug, markdown }) => {
		const isGlossary = slug === GLOSSARY;
		const around = context.get(slug) ?? '';
		return {
			slug,
			text: [
				visibleText(markdown),
				around,
				...(isGlossary ? glossaryText(glossary) : []),
			].join('\n'),
			bold: [boldText(markdown), around, ...(isGlossary ? glossaryTerms(glossary) : [])].join(
				'\n'
			),
			italic: [String(frontmatter(markdown).excerpt ?? ''), italicText(markdown)].join('\n'),
			glosses: glossKanji(markdown),
		};
	});
	// The captions of the homepage's scenes
	const captions = SCENES.map(({ image }) =>
		captionOf(
			image,
			files.map((f) => f.markdown)
		)
	);
	// /design-system/ is English and loads the English homepage's subsets
	const design = lang === 'en' ? DESIGN_NAME.kanji : '';
	const uiAndPlates = `${uiText(lang)}\n${PLATE_TEXT}${design}`;
	const excerpts = files.map(({ markdown }) => String(frontmatter(markdown).excerpt ?? ''));
	return {
		pages,
		ui: uiAndPlates,
		home: [uiAndPlates, tocTitles(toc), ...excerpts, ...captions.map(stripTags)].join('\n'),
		homeBold: `${uiAndPlates}\n${tocTitles(toc)}`,
		homeItalic: [BOOK_PLATE.romaji, ...captions.map(italicText)].join('\n'),
		languageNames: LANGUAGES.map(({ name }) => name).join(' '),
	};
}

/** The distinct characters of a text, sorted by code point */
export const characters = (text: string): string[] =>
	[...new Set(text)].toSorted((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);

/** A hash of everything the subsets depend on */
export function textHash(lang: Lang): string {
	const { pages, home, homeBold, languageNames } = languageText(lang);
	const hash = createHash('sha256');
	for (const part of [home + languageNames, homeBold])
		hash.update(characters(part).join('')).update('\0');
	for (const { slug, text, bold, glosses } of pages) {
		hash.update(slug).update('\0');
		for (const part of [text, bold, glosses])
			hash.update(characters(part).join('')).update('\0');
	}
	return hash.digest('hex').slice(0, 16);
}

export const allTextHashes = (): Record<Lang, string> =>
	Object.fromEntries(LANGS.map((lang) => [lang, textHash(lang)])) as Record<Lang, string>;
