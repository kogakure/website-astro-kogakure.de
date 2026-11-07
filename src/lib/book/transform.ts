/**
 * Text transforms of the content import (`scripts/import-content.ts`). Pure
 * string functions, so the import is repeatable and testable.
 */

export interface Split {
	/** YAML between the `---` fences, without them */
	frontmatter: string;
	body: string;
}

export function splitFrontmatter(text: string): Split {
	const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
	if (!match) throw new Error('No frontmatter');
	return { frontmatter: match[1] ?? '', body: text.slice(match[0].length) };
}

export const joinFrontmatter = ({ frontmatter, body }: Split): string =>
	`---\n${frontmatter}\n---\n${body}`;

/** Fields of kogakure-texts that mean nothing on the website */
export const DROPPED_FIELDS = ['source'] as const;

/** Removes top-level YAML keys, including indented continuation lines */
export function dropFields(frontmatter: string, fields: readonly string[]): string {
	const lines = frontmatter.split('\n');
	const kept: string[] = [];
	let dropping = false;
	for (const line of lines) {
		const key = /^([A-Za-z][\w-]*):/.exec(line)?.[1];
		if (key !== undefined) dropping = fields.includes(key);
		else if (!/^\s/.test(line)) dropping = false;
		if (!dropping) kept.push(line);
	}
	return kept.join('\n');
}

const WEBSITE_ONLY = /^<!-- WEBSITE-ONLY: (start|end)\b.*-->\n?/gm;

/**
 * `<!-- WEBSITE-ONLY: start … -->` … `<!-- WEBSITE-ONLY: end -->` marks a part
 * that only the printed book skips. The website keeps the part and drops the
 * markers. Unpaired markers are an error.
 */
export function keepWebsiteOnly(body: string): string {
	let open = false;
	for (const [, kind] of body.matchAll(WEBSITE_ONLY)) {
		if ((kind === 'start') === open) throw new Error(`Unpaired WEBSITE-ONLY marker (${kind})`);
		open = kind === 'start';
	}
	if (open) throw new Error('WEBSITE-ONLY block without an end marker');
	return body.replace(WEBSITE_ONLY, '');
}

/** The translationKey of the glossary page */
export const GLOSSARY_PAGE = 'glossaryPage';

/**
 * The glossary page of kogakure-texts lists its entries as `### term`, for the
 * printed book. The website renders them from glossary.json (Glossary.astro),
 * so the page keeps only its text before the first entry.
 */
export function dropGlossaryEntries(body: string): string {
	const first = body.search(/^### /m);
	return first === -1 ? body : `${body.slice(0, first).trimEnd()}\n`;
}

const IMAGE_SRC = /src="(?:\.\.\/)+images\/(new|old)\/([^"]+)"/g;

/**
 * Relative image paths of kogakure-texts → image URLs of the website:
 * `../../../images/new/kamae/ichimonji.webp` → `/images/kamae/ichimonji.webp`,
 * `../../../images/old/chronology/x.png` → `/images/old/chronology/x.png`.
 * The URL path below `/images/` is the image's key in the manifest (SI-472).
 */
export const rewriteImages = (body: string): string =>
	body.replace(IMAGE_SRC, (_, kind: string, rel: string) => `src="${imageUrl(kind, rel)}"`);

const imageUrl = (kind: string, rel: string) =>
	kind === 'new' ? `/images/${rel}` : `/images/old/${rel}`;

/** The file in kogakure-texts behind an image URL (inverse of rewriteImages) */
export const imageSource = (url: string): string =>
	url.startsWith('/images/old/')
		? `images/old/${url.slice('/images/old/'.length)}`
		: `images/new/${url.slice('/images/'.length)}`;

/** All `src` values of `<img>` elements */
export const imageUrls = (body: string): string[] =>
	[...body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(([, src]) => src ?? '');

/** Site-internal link targets (Markdown and HTML), without the fragment */
export const internalLinks = (body: string): string[] =>
	[...body.matchAll(/\]\((\/[^)\s]*)\)|href="(\/[^"]*)"/g)].map(([, md, html]) =>
		(md ?? html ?? '').replace(/#.*$/, '')
	);
