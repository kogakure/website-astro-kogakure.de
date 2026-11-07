/**
 * The kanji on the name plates (tanzaku), the same in every language: the
 * book's title, one term per section of the book and the chapter numbers.
 * A design choice of the prototype (gekiga-2-modes/plates.ts); an article's
 * own term comes from its `plate` field (SI-476).
 */

export const BOOK_PLATE = { name: '木隠', romaji: 'Kogakure' } as const;

/** The offline page's plate: 圏外, „out of range“, what a Japanese phone shows without a signal */
export const OFFLINE_PLATE = '圏外';

/** One plate per section in book order: the front matter, the eight chapters, the appendix */
export const SECTION_PLATES = [
	{ name: '序', short: '序' },
	{ name: '歴史', short: '一' },
	{ name: '組織', short: '二' },
	{ name: '体術', short: '三' },
	{ name: '忍具', short: '四' },
	{ name: '精神', short: '五' },
	{ name: '兵法', short: '六' },
	{ name: '伝承', short: '七' },
	{ name: '掟', short: '八' },
	{ name: '附録', short: '附' },
] as const;

/** Sections 1–8 are the chapters; 0 is the front matter, 9 the appendix */
export const isChapter = (index: number): boolean => index >= 1 && index <= 8;

export interface Scene {
	/** The painting, as the texts use it; its alt text and caption come from the page that shows it */
	image: string;
	/** `bleed`: a cinematic band across the page; `tight`: cropped into the figures */
	frame?: 'bleed' | 'tight';
	/** object-position: where the scene's subject sits */
	focus: string;
}

/**
 * The scene of each section in book order, on the homepage and its chapter
 * page: a painting of the book (gekiga-2-modes/plates.ts)
 */
export const SCENES: readonly Scene[] = [
	{
		image: '/images/article/the-5-commandments-of-the-ninja-02-reading-between-lines.webp',
		focus: '40% 55%',
	},
	{
		image: '/images/article/demise-01-guiding-tokugawa-through-mountains.webp',
		frame: 'bleed',
		focus: '55% 45%',
	},
	{
		image: '/images/article/organization-of-the-ryu-03-hidden-genin-village.webp',
		focus: '50% 60%',
	},
	{
		image: '/images/article/training-factors-01-endurance-running-in-forest.webp',
		frame: 'tight',
		focus: '55% 55%',
	},
	{
		image: '/images/article/kumogakure-ryu-03-making-fire-in-any-weather.webp',
		frame: 'tight',
		focus: '60% 55%',
	},
	{
		image: '/images/article/godai-01-five-elements-in-one-landscape.webp',
		frame: 'bleed',
		focus: '50% 60%',
	},
	{ image: '/images/article/koga-ryu-02-mapping-hara-castle.webp', focus: '50% 55%' },
	{ image: '/images/article/modern-history-03-long-walk-to-teacher.webp', focus: '40% 55%' },
	{
		image: '/images/article/the-5-commandments-of-the-ninja-01-letting-feelings-pass-like-smoke.webp',
		frame: 'tight',
		focus: '40% 50%',
	},
	{ image: '/images/article/bansenshukai-02-ten-hand-bound-volumes.webp', focus: '45% 50%' },
];

const NUMERALS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const;

/** 1 → 一, 12 → 十二 (up to 19) */
export function kanjiNumeral(n: number): string {
	if (!Number.isInteger(n) || n < 0 || n > 19) throw new Error(`No kanji numeral for ${n}`);
	return n <= 10 ? NUMERALS[n]! : `十${NUMERALS[n - 10]!}`;
}

/** 1 → 第一章 */
export const chapterLabel = (n: number): string => `第${kanjiNumeral(n)}章`;

/** The design's name, as /design-system/ shows it */
export const DESIGN_NAME = { name: 'Gekiga', kanji: '劇画' } as const;

/** Caption marker of the figures, 図二, 図三, … (`cjk-decimal` in CSS) */
export const FIGURE_MARK = '図';

/**
 * Every character a name plate can show, for the brush face's subset
 * (scripts/generate-fonts.ts): figure markers count with `cjk-decimal`
 * digits 〇一二…九
 */
export const PLATE_TEXT = [
	BOOK_PLATE.name,
	...SECTION_PLATES.flatMap(({ name, short }) => [name, short]),
	'第章',
	...NUMERALS,
	FIGURE_MARK,
].join('');

/** The ten ink-edge masks, a–j (public/images/ink/wash-edge-*.webp) */
export const EDGES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const;
export type Edge = (typeof EDGES)[number];

/**
 * The edge of the n-th scene: the order alternates the edges' families
 * (wet, bloom, dry, torn, scrub), so neighbouring plates never look alike
 */
const SCENE_EDGES: readonly Edge[] = ['a', 'c', 'e', 'g', 'i', 'b', 'd', 'f', 'h', 'j'];
export const sceneEdge = (index: number): Edge => SCENE_EDGES[index % SCENE_EDGES.length]!;
