/**
 * The self-hosted fonts: the @font-face rules of a page and the one file it
 * preloads. The files and the manifest are written by `pnpm fonts`
 * (scripts/generate-fonts.ts); no request goes to a font host.
 */
import type { Lang } from '@/i18n/languages';
import manifestJson from './manifest.json' with { type: 'json' };

export interface FontFile {
	family: string;
	style: 'normal' | 'italic';
	/** One weight, or the range of a variable font */
	weight: number | [number, number];
	/** Not on a page's own file: it holds only that page's characters */
	unicodeRange?: string;
	/** URL below /fonts/ */
	file: string;
	bytes: number;
	/** Only on the pages of these languages; shared by all without */
	langs?: Lang[];
	/** A page's own file: only on these pages, `<lang>/<slug>` (the homepage `<lang>/`) */
	pages?: string[];
}

/** A local font, sized to the web font's metrics so the swap moves no line */
export interface Fallback {
	family: string;
	local: string[];
	sizeAdjust: string;
	ascentOverride: string;
	descentOverride: string;
	lineGapOverride: string;
}

export interface FontManifest {
	/** google/fonts commit of the sources */
	commit: string;
	/** Hash of the characters per language (src/lib/fonts/text.ts) */
	text: Partial<Record<Lang, string>>;
	faces: FontFile[];
	fallbacks: Fallback[];
	/** Bytes of fonts a first page can load: the homepage, the median and the largest article */
	budget: Partial<Record<Lang, { home: number; median: number; max: number }>>;
}

export const manifest = manifestJson as FontManifest;

/** The id of a page in the manifest: `<lang>/<slug>`, the homepage `<lang>/` */
export const fontPageId = (lang: Lang, slug = '') => `${lang}/${slug}`;

/**
 * The fonts of a page: the shared ones, those of its language and its own
 * (the CJK and brush characters only it sets). A page outside the book (the
 * 404, the design system) gets the homepage's.
 */
export function fontFiles(lang: Lang, slug = '', from: FontManifest = manifest): FontFile[] {
	const id = fontPageId(lang, slug);
	const known = from.faces.some((file) => file.pages?.includes(id));
	const page = known ? id : fontPageId(lang);
	return from.faces.filter((file) =>
		file.pages ? file.pages.includes(page) : !file.langs || file.langs.includes(lang)
	);
}

const weightOf = ({ weight }: FontFile) =>
	Array.isArray(weight) ? weight.join(' ') : String(weight);

/**
 * The @font-face rules of a page, inlined in its head. A page's own files
 * come first: for overlapping faces the browser tries the last rule first,
 * so the shared files set the characters they hold
 */
/** A page whose fonts another page declares too: a language, and a slug for its own files */
export interface FontSource {
	lang: Lang;
	slug?: string;
}

export function fontFaceCss(lang: Lang, slug = '', from: FontManifest = manifest): string {
	const files = fontFiles(lang, slug, from).toSorted(
		(a, b) => Number(!a.pages) - Number(!b.pages)
	);
	const faces = files.map(
		(file) =>
			`@font-face{font-family:"${file.family}";font-style:${file.style};font-weight:${weightOf(file)};` +
			`font-display:swap;src:url(${file.file}) format("woff2")` +
			`${file.unicodeRange ? `;unicode-range:${file.unicodeRange}` : ''}}`
	);
	const fallbacks = from.fallbacks.map(
		(f) =>
			`@font-face{font-family:"${f.family}";src:${f.local.map((name) => `local("${name}")`).join(',')};` +
			`size-adjust:${f.sizeAdjust};ascent-override:${f.ascentOverride};` +
			`descent-override:${f.descentOverride};line-gap-override:${f.lineGapOverride}}`
	);
	return [...fallbacks, ...faces].join('\n');
}

/** The file of the running text, per script: the one font a page preloads */
const BODY_FILE: Record<Lang, string> = {
	de: 'source-serif-4-basic-',
	en: 'source-serif-4-basic-',
	es: 'source-serif-4-basic-',
	fr: 'source-serif-4-basic-',
	pt: 'source-serif-4-basic-',
	it: 'source-serif-4-basic-',
	nl: 'source-serif-4-basic-',
	ru: 'source-serif-4-cyrillic-',
	he: 'frank-ruhl-libre-hebrew-',
	ja: 'shippori-mincho-400-common-',
	zh: 'noto-serif-sc-400-common-',
	ko: 'noto-serif-kr-400-common-',
};

/** URL of the body face's file, for `<link rel="preload">` */
export const preloadFont = (lang: Lang, from: FontManifest = manifest): string | undefined =>
	from.faces.find(
		(file) =>
			file.file.startsWith(`/fonts/${BODY_FILE[lang]}`) &&
			(!file.langs || file.langs.includes(lang))
	)?.file;
