/**
 * Subsets the site's fonts to WOFF2 in public/fonts/ and writes the font
 * manifest (src/lib/fonts/manifest.json), from which BaseLayout writes the
 * @font-face rules. Like the images, the result is committed: Coolify only
 * sees this repo. Runs after every content import (pnpm import:content).
 *
 *   Latin, Cyrillic, Hebrew   one file per script and face, shared by all
 *                             languages: the script's base range plus every
 *                             character of that script in the texts
 *   Japanese, Chinese, Korean per language, exactly the characters the texts
 *                             and UI strings use, in slices: the homepage's
 *                             characters first, the rest by how many pages
 *                             use them, so a page loads only the slices it
 *                             sets (unicode-range). The bold files only hold
 *                             what is set in bold (titles, headings, strong)
 *   Yuji Syuku                per language: the name plates, then the kanji
 *                             of the margin glosses
 *
 * The sources are the OFL fonts of google/fonts at a pinned commit, checked
 * by SHA-256 and cached in .cache/fonts/ (git-ignored). Their licences go to
 * public/fonts/licenses/.
 *
 * Usage: pnpm fonts [--force]
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { entireMetricsCollection } from '@capsizecss/metrics/entireMetricsCollection';
import { fromBuffer } from '@capsizecss/unpack';
import * as fontkit from 'fontkit';
import subsetFont from 'subset-font';
import { LANGS, type Lang } from '../src/i18n/languages.ts';
import { PLATE_TEXT } from '../src/lib/book/plates.ts';
import type { Fallback, FontFile, FontManifest } from '../src/lib/fonts/fonts.ts';
import { characters, CJK, languageText, textHash } from '../src/lib/fonts/text.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.cache/fonts');
const OUT = path.join(ROOT, 'public/fonts');
const LICENSES = path.join(OUT, 'licenses');
const MANIFEST = path.join(ROOT, 'src/lib/fonts/manifest.json');
const force = process.argv.includes('--force');

/** google/fonts at this commit (2026-11-06) */
const COMMIT = '38411257417e616c5d4daa1b9e91a3dbcebe1c2e';

/** Font directory in google/fonts/ofl, file, SHA-256 */
const SOURCES = {
	serif: [
		'sourceserif4',
		'SourceSerif4[opsz,wght].ttf',
		'97b2d4da6e3cb494b5a1e66ae176914d852ccabef49e0c02c0df25f3e39aca0b',
	],
	serifItalic: [
		'sourceserif4',
		'SourceSerif4-Italic[opsz,wght].ttf',
		'15fbc7e4679489a501998c3669272637a6646388ef7e4bd77eebb5bf967a1f42',
	],
	mono: [
		'ibmplexmono',
		'IBMPlexMono-Regular.ttf',
		'6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46',
	],
	monoItalic: [
		'ibmplexmono',
		'IBMPlexMono-Italic.ttf',
		'3362fc791b0652193328b862c1c5f23a789bc7288b1617fa63302f88689a2a34',
	],
	monoMedium: [
		'ibmplexmono',
		'IBMPlexMono-Medium.ttf',
		'a9b4c49bb299e05b5f6c481e7fb5e78943d2793249a0c8874ab574a2d1ea6755',
	],
	hebrew: [
		'frankruhllibre',
		'FrankRuhlLibre[wght].ttf',
		'f9bf26966681037aae894b031bd0dcf2c1bfdfa128dd0640cf276fe62a338a43',
	],
	mincho400: [
		'shipporimincho',
		'ShipporiMincho-Regular.ttf',
		'769b5269f0f9bc6534b352c0e6bd856a566e03ff788f107191c2d835863570b2',
	],
	mincho500: [
		'shipporimincho',
		'ShipporiMincho-Medium.ttf',
		'700e505afc4cded2338eba29478a041e04c1c2ea5114fbb3e0b04e76c302c5d8',
	],
	mincho700: [
		'shipporimincho',
		'ShipporiMincho-Bold.ttf',
		'63bc4eddc74793f671c3ab827c5175e773ffbe569d0bf50ee65375ea9e3bc286',
	],
	brush: [
		'yujisyuku',
		'YujiSyuku-Regular.ttf',
		'82728ebafc8c97391e2dab633414a806f344b8e4e2227d307179f07b548fca61',
	],
	sc: [
		'notoserifsc',
		'NotoSerifSC[wght].ttf',
		'050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9',
	],
	kr: [
		'notoserifkr',
		'NotoSerifKR[wght].ttf',
		'11f8d5de6f1b79195efba3828aaa2ec95c1178f5ae976fb23c8d53250a9938f3',
	],
} as const satisfies Record<string, readonly [string, string, string]>;

type SourceKey = keyof typeof SOURCES;

/** The licence of each font directory */
const LICENSE_FILES = {
	sourceserif4: '5f94c3fd3a23131a417ab5a0c8452de57e70c3cfb9f604d88241f7065ebf9fd9',
	ibmplexmono: '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da',
	frankruhllibre: '4e9720b2544d946737e7dfe0027a62c23c7247f0144f08bc437cdcc2e6a7d828',
	shipporimincho: '41fba056279be5f45ff9a99e44b7b53897b42732f5806d8e666e0ab49ac6bd38',
	yujisyuku: 'ef7c85c72ae94381c8bc4832ae4e6fbabdeafa2bb8a31313cd75dce95a690256',
	notoserifsc: '5e0da210fb04058a8c0087985d2d456b931c2579811a49655721d3cf0c36b6d6',
	notoserifkr: '5e0da210fb04058a8c0087985d2d456b931c2579811a49655721d3cf0c36b6d6',
} as const;

const sha256 = (buffer: Buffer | Uint8Array | string) =>
	createHash('sha256').update(buffer).digest('hex');

/** A file of google/fonts from the cache, downloaded and checked the first time */
async function load(dir: string, file: string, expected: string): Promise<Buffer> {
	const cached = path.join(CACHE, dir, file);
	if (!fs.existsSync(cached)) {
		console.log(`Downloading ${dir}/${file}`);
		const url = `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl/${dir}/${encodeURIComponent(file)}`;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${dir}/${file}: HTTP ${response.status}`);
		fs.mkdirSync(path.dirname(cached), { recursive: true });
		fs.writeFileSync(cached, Buffer.from(await response.arrayBuffer()));
	}
	const buffer = fs.readFileSync(cached);
	const actual = sha256(buffer);
	if (actual !== expected) {
		throw new Error(`${dir}/${file}: SHA-256 ${actual}, expected ${expected}`);
	}
	return buffer;
}

const sources = new Map<SourceKey, Promise<{ buffer: Buffer; font: fontkit.Font }>>();
function source(key: SourceKey) {
	let entry = sources.get(key);
	if (!entry) {
		const [dir, file, expected] = SOURCES[key];
		entry = load(dir, file, expected).then((buffer) => ({
			buffer,
			font: fontkit.create(buffer) as fontkit.Font,
		}));
		sources.set(key, entry);
	}
	return entry;
}

// ----------------------------------------------------------------- ranges

type Range = [number, number];

/**
 * Digits and punctuation are their own subset: the pages of the other
 * scripts (Cyrillic, Hebrew, CJK) set them in Source Serif 4 too, but no
 * Latin letters
 */
const CORE: Range[] = [
	[0x20, 0x40],
	[0x5b, 0x60],
	[0x7b, 0x7e],
	[0xa0, 0xa0],
	[0xa7, 0xa7],
	[0xab, 0xab],
	[0xb7, 0xb7],
	[0xbb, 0xbb],
	[0x2010, 0x2027],
	[0x2030, 0x203a],
	[0x20ac, 0x20ac],
	[0x2116, 0x2116],
	[0x2122, 0x2122],
	[0x2212, 0x2212],
];
const inCore = (cp: number) => CORE.some(([from, to]) => cp >= from && cp <= to);
const inBasic = (cp: number) => (cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a);

const SCRIPTS = {
	core: { base: CORE, test: /(?!)/u },
	/** The basic letters on their own: Russian sets Roman numerals, Chinese romaji */
	basic: {
		base: [
			[0x41, 0x5a],
			[0x61, 0x7a],
		],
		test: /(?!)/u,
	},
	latin: {
		base: [
			[0xa1, 0xff],
			[0x131, 0x131],
			[0x152, 0x153],
			[0x2c6, 0x2c6],
			[0x2dc, 0x2dc],
		],
		test: /[\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u,
	},
	cyrillic: { base: [[0x400, 0x45f]], test: /\p{Script=Cyrillic}/u },
	hebrew: {
		base: [
			[0x591, 0x5f4],
			[0xfb1d, 0xfb4f],
		],
		test: /\p{Script=Hebrew}/u,
	},
} as const satisfies Record<string, { base: Range[]; test: RegExp }>;

type Script = keyof typeof SCRIPTS;

const expand = (ranges: readonly (readonly [number, number])[]) =>
	ranges.flatMap(([from, to]) => Array.from({ length: to - from + 1 }, (_, i) => from + i));

const hex = (n: number) => n.toString(16).toUpperCase();

/** Code points as a unicode-range value, runs joined */
function unicodeRange(codePoints: number[]): string {
	const sorted = [...new Set(codePoints)].toSorted((a, b) => a - b);
	const parts: string[] = [];
	for (let i = 0; i < sorted.length; i++) {
		const start = sorted[i]!;
		let end = start;
		while (sorted[i + 1] === end + 1) end = sorted[++i]!;
		parts.push(start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`);
	}
	return parts.join(',');
}

const parseRange = (range: string): Range[] =>
	range.split(',').map((part) => {
		const [from, to = from] = part.slice(2).split('-');
		return [parseInt(from!, 16), parseInt(to, 16)];
	});

const codePointsOf = (chars: Iterable<string>) => [...chars].map((c) => c.codePointAt(0)!);

// ----------------------------------------------------------------- faces

interface Face {
	family: string;
	source: SourceKey;
	style?: 'normal' | 'italic';
	/** One weight, or the range of a variable font */
	weight: number | [number, number];
	/** Variable fonts: pin or limit the axes */
	axes?: Record<string, number | { min: number; max: number }>;
	/**
	 * OpenType features to keep; the rest go, with the glyphs only they
	 * reach (Source Serif's small caps, fractions, figure sets)
	 */
	features?: string[];
}

const TEXT_FEATURES = ['kern', 'liga', 'clig', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'rlig'];

/** CJK: vertical forms for the plates, and the spacing browsers apply (text-spacing-trim) */
const CJK_FEATURES = [
	...TEXT_FEATURES,
	'vert',
	'vrt2',
	'vkna',
	'vkrn',
	'chws',
	'vchw',
	'halt',
	'vhal',
];

/**
 * Source Serif 4 upright keeps its optical sizes from text (20) up to
 * display (60): the large headings take the display cut. The italic sets
 * text only (the lede, terms) and is pinned to the text size and 400
 */
const LATIN_FACES: Face[] = [
	{
		family: 'Source Serif 4',
		source: 'serif',
		weight: [400, 700],
		axes: { wght: { min: 400, max: 700 }, opsz: { min: 20, max: 60 } },
		features: TEXT_FEATURES,
	},
	{
		family: 'Source Serif 4',
		source: 'serifItalic',
		style: 'italic',
		weight: 400,
		axes: { wght: 400, opsz: 20 },
		features: TEXT_FEATURES,
	},
	{ family: 'IBM Plex Mono', source: 'mono', weight: 400, features: TEXT_FEATURES },
	{
		family: 'IBM Plex Mono',
		source: 'monoItalic',
		style: 'italic',
		weight: 400,
		features: TEXT_FEATURES,
	},
	{ family: 'IBM Plex Mono', source: 'monoMedium', weight: 500, features: TEXT_FEATURES },
];

const SCRIPT_FACES: Record<Script, Face[]> = {
	core: LATIN_FACES,
	basic: LATIN_FACES,
	latin: LATIN_FACES,
	cyrillic: LATIN_FACES,
	hebrew: [
		{
			family: 'Frank Ruhl Libre',
			source: 'hebrew',
			weight: [400, 700],
			axes: { wght: { min: 400, max: 700 } },
			features: TEXT_FEATURES,
		},
	],
};

/** The CJK text face of a language, regular and bold; Shippori Mincho for the kanji of the others */
function cjkFaces(lang: Lang): [Face, Face] {
	if (lang === 'zh' || lang === 'ko') {
		const [family, key] = lang === 'zh' ? ['Noto Serif SC', 'sc'] : ['Noto Serif KR', 'kr'];
		const face = (weight: number): Face => ({
			family,
			source: key as SourceKey,
			weight,
			axes: { wght: weight },
			features: CJK_FEATURES,
		});
		return [face(400), face(700)];
	}
	// Japanese reads in Shippori Mincho 400; kanji in other texts are 500 (DESIGN.md)
	const regular = lang === 'ja' ? 400 : 500;
	return [
		{
			family: 'Shippori Mincho',
			source: `mincho${regular}`,
			weight: regular,
			features: CJK_FEATURES,
		},
		{ family: 'Shippori Mincho', source: 'mincho700', weight: 700, features: CJK_FEATURES },
	];
}

const BRUSH: Face = { family: 'Yuji Syuku', source: 'brush', weight: 400, features: CJK_FEATURES };

/**
 * A character used on at least this share of a language's pages goes into
 * the file all its pages share; the rest of a page's characters into the
 * page's own file
 */
const COMMON_SHARE = 0.3;

/** The id of a page in the manifest, `<lang>/<slug>`; the homepage is `<lang>/` */
const pageId = (lang: Lang, slug = '') => `${lang}/${slug}`;

// ----------------------------------------------------------------- subset

const manifest: FontManifest = { commit: COMMIT, text: {}, faces: [], fallbacks: [], budget: {} };
const written = new Set<string>();

const faceName = (face: Face) =>
	[
		face.family.toLowerCase().replaceAll(' ', '-'),
		typeof face.weight === 'number' ? face.weight : undefined,
		face.style === 'italic' ? 'italic' : undefined,
	]
		.filter(Boolean)
		.join('-');

/**
 * Writes one subset, named by its content, and adds it to the manifest; a
 * subset two languages share (the kanji of most Latin editions) is one file
 */
async function subset(
	face: Face,
	codePoints: Iterable<number>,
	name: string,
	scope: { lang?: Lang; page?: string } = {}
) {
	const { buffer, font } = await source(face.source);
	const covered = [...new Set(codePoints)].filter((cp) => font.hasGlyphForCodePoint(cp));
	if (covered.length === 0) return;
	const text = String.fromCodePoint(...covered.toSorted((a, b) => a - b));
	const options = {
		targetFormat: 'woff2' as const,
		...(face.axes ? { variationAxes: face.axes } : {}),
		...(face.features ? { keepFeatures: face.features } : {}),
	};
	const key = sha256(JSON.stringify([SOURCES[face.source][2], options, text])).slice(0, 10);
	const file = `${name}-${key}.woff2`;
	const known = manifest.faces.find((entry) => entry.file === `/fonts/${file}`);
	if (known) {
		if (scope.lang) known.langs?.push(scope.lang);
		if (scope.page) known.pages?.push(scope.page);
		return;
	}
	const out = path.join(OUT, file);
	if (force || !fs.existsSync(out))
		fs.writeFileSync(out, await subsetFont(buffer, text, options));
	written.add(file);
	manifest.faces.push({
		family: face.family,
		style: face.style ?? 'normal',
		weight: face.weight,
		// A page's own file holds only characters of that page: it needs no range
		...(scope.page ? {} : { unicodeRange: unicodeRange(covered) }),
		file: `/fonts/${file}`,
		bytes: fs.statSync(out).size,
		...(scope.lang ? { langs: [scope.lang] } : {}),
		...(scope.page ? { pages: [scope.page] } : {}),
	});
}

/** A local font sized to the web font's metrics, so the swap moves no line */
async function fallback(
	family: string,
	key: SourceKey,
	local: string[],
	metrics: { unitsPerEm: number; xWidthAvg: number }
): Promise<Fallback> {
	const primary = await fromBuffer((await source(key)).buffer);
	const scale = primary.xWidthAvg / primary.unitsPerEm / (metrics.xWidthAvg / metrics.unitsPerEm);
	const percent = (value: number) =>
		`${((value / primary.unitsPerEm / scale) * 100).toFixed(2)}%`;
	return {
		family: `${family} Fallback`,
		local,
		sizeAdjust: `${(scale * 100).toFixed(2)}%`,
		ascentOverride: percent(primary.ascent),
		descentOverride: percent(Math.abs(primary.descent)),
		lineGapOverride: '0%',
	};
}

// ----------------------------------------------------------------- run

fs.mkdirSync(LICENSES, { recursive: true });

const texts = new Map(LANGS.map((lang) => [lang, languageText(lang)]));
for (const lang of LANGS) manifest.text[lang] = textHash(lang);

// Shared script subsets: the base range plus what any language uses
const used = characters(
	[...texts.values()]
		.flatMap(({ pages, home, languageNames }) => [
			...pages.map(({ text }) => text),
			home,
			languageNames,
		])
		.join('')
).filter((c) => !CJK.test(c));
for (const [script, { base, test }] of Object.entries(SCRIPTS) as [
	Script,
	(typeof SCRIPTS)[Script],
][]) {
	const codePoints = [...expand(base), ...codePointsOf(used.filter((c) => test.test(c)))].filter(
		(cp) => script === 'core' || script === 'basic' || (!inCore(cp) && !inBasic(cp))
	);
	for (const face of SCRIPT_FACES[script])
		await subset(face, codePoints, `${faceName(face)}-${script}`);
}

/** A page as the fonts see it: what it sets in regular, in bold, in the brush face */
interface Unit {
	id: string;
	/** Everything it sets (the shared Latin files) */
	text: string;
	italic: string;
	regular: Set<string>;
	bold: Set<string>;
	brush: Set<string>;
}

const isCjk = (c: string) => CJK.test(c);
const cjkSet = (...parts: string[]) => new Set([...parts.join('')].filter(isCjk));
const plates = new Set(PLATE_TEXT);

/** The pages of a language, the homepage first */
function units(lang: Lang): Unit[] {
	const { pages, ui, home, homeBold, homeItalic, languageNames } = texts.get(lang)!;
	return [
		{
			id: pageId(lang),
			text: home,
			italic: homeItalic,
			regular: cjkSet(home, languageNames),
			bold: cjkSet(homeBold),
			brush: plates,
		},
		...pages.map(({ slug, text, bold, italic, glosses }) => ({
			id: pageId(lang, slug),
			text: `${ui}\n${text}`,
			italic,
			regular: cjkSet(ui, languageNames, text),
			bold: cjkSet(ui, bold),
			brush: new Set([...plates, ...glosses]),
		})),
	];
}

/** Characters on at least COMMON_SHARE of the pages */
function common(sets: Set<string>[]): Set<string> {
	const count = new Map<string, number>();
	for (const set of sets) for (const c of set) count.set(c, (count.get(c) ?? 0) + 1);
	return new Set([...count].filter(([, n]) => n >= sets.length * COMMON_SHARE).map(([c]) => c));
}

/** One file for the characters many pages share, one per page for the rest */
async function perPage(face: Face, lang: Lang, sets: { id: string; chars: Set<string> }[]) {
	const shared = common(sets.map(({ chars }) => chars));
	await subset(face, codePointsOf(shared), `${faceName(face)}-common`, { lang });
	for (const { id, chars } of sets) {
		const own = [...chars].filter((c) => !shared.has(c));
		await subset(face, codePointsOf(own), `${faceName(face)}-page`, { page: id });
	}
}

for (const lang of LANGS) {
	const pages = units(lang);
	const [regular, heavy] = cjkFaces(lang);
	await perPage(
		regular,
		lang,
		pages.map((unit) => ({ id: unit.id, chars: unit.regular }))
	);
	await perPage(
		heavy,
		lang,
		pages.map((unit) => ({ id: unit.id, chars: unit.bold }))
	);
	// Chinese and Korean set their characters in their own face; Shippori
	// Mincho only sets what is marked lang="ja" there: the plates' kanji
	if (lang === 'zh' || lang === 'ko') {
		for (const face of cjkFaces('de')) {
			await subset(face, codePointsOf(plates), `${faceName(face)}-plates`, { lang });
		}
	}
	await subset(BRUSH, codePointsOf(plates), `${faceName(BRUSH)}-plates`, { lang });
	for (const { id, brush } of pages) {
		const glosses = [...brush].filter((c) => !plates.has(c));
		await subset(BRUSH, codePointsOf(glosses), `${faceName(BRUSH)}-page`, { page: id });
	}
}

const { georgia, courierNew } = entireMetricsCollection;
manifest.fallbacks = [
	await fallback('Source Serif 4', 'serif', ['Georgia', 'Times New Roman'], georgia),
	await fallback('IBM Plex Mono', 'mono', ['Courier New', 'Courier'], courierNew),
];

for (const [dir, expected] of Object.entries(LICENSE_FILES)) {
	fs.writeFileSync(path.join(LICENSES, `${dir}-OFL.txt`), await load(dir, 'OFL.txt', expected));
}

/**
 * What a first page loads: the shared files its characters fall into, bold
 * ones only for what it sets in bold, and its own files. Not the medium mono
 * (only the skip link sets it) and no italic where the script has none
 * (Hebrew, CJK: global.css)
 */
const UPRIGHT: readonly Lang[] = ['he', 'ja', 'zh', 'ko'];
const BOLD_FAMILIES = new Set(['Shippori Mincho', 'Noto Serif SC', 'Noto Serif KR']);

function firstLoad(lang: Lang, unit: Unit): number {
	const regular = codePointsOf(new Set(unit.text));
	const italic = codePointsOf(new Set(unit.italic));
	const bold = codePointsOf(unit.bold);
	const brush = codePointsOf(plates);
	const loads = (file: FontFile) => {
		if (file.pages) return file.pages.includes(unit.id);
		if (file.langs && !file.langs.includes(lang)) return false;
		if (file.family === 'IBM Plex Mono' && file.weight === 500) return false;
		if (file.style === 'italic' && UPRIGHT.includes(lang)) return false;
		const chars =
			file.family === BRUSH.family
				? brush
				: BOLD_FAMILIES.has(file.family) && file.weight === 700
					? bold
					: file.family === 'Source Serif 4' && file.style === 'italic'
						? italic
						: regular;
		const ranges = parseRange(file.unicodeRange!);
		return chars.some((cp) => ranges.some(([from, to]) => cp >= from && cp <= to));
	};
	return manifest.faces.filter(loads).reduce((sum, file) => sum + file.bytes, 0);
}

for (const lang of LANGS) {
	const [homepage, ...rest] = units(lang);
	const articles = rest.map((unit) => firstLoad(lang, unit)).toSorted((a, b) => a - b);
	manifest.budget[lang] = {
		home: firstLoad(lang, homepage!),
		median: articles[Math.floor(articles.length / 2)]!,
		max: articles.at(-1)!,
	};
}

for (const name of fs.readdirSync(OUT)) {
	if (name.endsWith('.woff2') && !written.has(name)) fs.unlinkSync(path.join(OUT, name));
}
manifest.faces.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`.padStart(9);
const total = manifest.faces.reduce((sum, file) => sum + file.bytes, 0);
console.log(`${manifest.faces.length} font files, ${kb(total).trim()} in all. First page:`);
console.log('        homepage  article (median)  article (max)');
for (const lang of LANGS) {
	const { home, median, max } = manifest.budget[lang]!;
	console.log(`  ${lang}  ${kb(home)}  ${kb(median)}         ${kb(max)}`);
}
