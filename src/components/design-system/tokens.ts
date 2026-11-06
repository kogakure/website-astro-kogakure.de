/**
 * What /design-system/ shows of the tokens (src/styles/tokens.css), with a
 * line on each, in English like the page. The values come from the CSS
 * itself: the samples use the custom properties.
 */

export interface Token {
	name: string;
	use: string;
}

export const COLOUR_GROUPS: { title: string; roles: Token[] }[] = [
	{
		title: 'Ground and text',
		roles: [
			{ name: '--ground', use: 'Ground of the pages: washi, aizome by night' },
			{ name: '--ground-read', use: 'Ground of the reading page, a little lighter by night' },
			{ name: '--text', use: 'Running text' },
			{ name: '--text-2', use: 'Second text: lede, captions, sections' },
			{ name: '--text-3', use: 'Third text: credits, labels, chapter numbers' },
			{ name: '--heading', use: 'Headings: sumi, khaki gold by night' },
			{ name: '--link-line', use: 'Link underlines' },
			{ name: '--rule', use: 'Hairlines' },
			{ name: '--focus', use: 'Focus ring' },
			{ name: '--select', use: 'Text selection' },
		],
	},
	{
		title: 'Ink and plates',
		roles: [
			{ name: '--ink', use: 'The brush: sumi, gofun by night' },
			{ name: '--wash', use: 'The wash under the ink: ochre, indigo by night' },
			{ name: '--plate', use: 'Paper of the name plate' },
			{ name: '--plate-ink', use: 'Frame and lettering of the name plate' },
			{ name: '--plate-num', use: 'Chapter number on the plate' },
			{ name: '--sub-bg', use: 'Subtitle box' },
			{ name: '--sub-text', use: 'Subtitle text' },
			{ name: '--sub-edge', use: 'Edge of the subtitle box' },
		],
	},
	{
		title: 'Band, states, seal',
		roles: [
			{ name: '--band', use: 'The colophon band' },
			{ name: '--band-text', use: 'Text on the band' },
			{ name: '--band-mute', use: 'Labels on the band, the chosen option' },
			{ name: '--band-line', use: 'Lines on the band' },
			{ name: '--hover', use: 'Lighter paper on hover' },
			{ name: '--press', use: 'Pressed' },
			{ name: '--seal', use: 'The seal: the one accent, only as a mark' },
		],
	},
];

export const TYPE_SCALE: (Token & { sample: string; className: string })[] = [
	{
		name: 'Display',
		use: '700, article titles',
		className: 'type-display',
		sample: 'Ninjutsu',
	},
	{
		name: 'Headline',
		use: '600, part titles on the homepage',
		className: 'type-headline',
		sample: 'History',
	},
	{
		name: 'Title',
		use: '600, sections in an article',
		className: 'type-title',
		sample: 'The characters',
	},
	{
		name: 'Lede',
		use: '400 italic, the lede',
		className: 'type-lede',
		sample: 'At the heart of ninjutsu lies a free and righteous mind.',
	},
	{
		name: 'Body',
		use: '400, 20 to 21.5 px, line height 1.62, measure 32.5em',
		className: 'type-body',
		sample: 'According to tradition, Momochi Sandayū was one of the three great leaders of the Iga-ryū.',
	},
	{
		name: 'Caption',
		use: '400, 17 px, captions',
		className: 'type-caption',
		sample: 'The blade above the heart',
	},
	{
		name: 'Label',
		use: 'IBM Plex Mono 400, only subtitles and a few labels',
		className: 'type-label',
		sample: 'Section 3 of 6',
	},
	{
		name: 'Plate',
		use: 'Yuji Syuku, only on name plates and in margin glosses',
		className: 'type-plate',
		sample: '歴史',
	},
];

export const SPACING: Token[] = [
	{ name: '--gutter', use: 'Page margin: clamp(1.25rem, 5vw, 4rem)' },
	{ name: '--measure', use: 'Measure: 32.5em, about 69 characters' },
	{ name: '--page', use: 'Page width: 86rem' },
	{ name: '--scene', use: 'Space between scenes: clamp(4.5rem, 9vw, 8rem)' },
	{ name: '--section', use: 'Space before a section: 2.6em' },
	{ name: '--list-gap', use: 'Space in lists: 1.75rem' },
];

export const BREAKPOINTS: Token[] = [
	{ name: 'sm · 30em', use: 'Contents in two columns' },
	{ name: 'md · 48em', use: 'Proportions of the plates, subtitle on the painting' },
	{ name: 'lg · 60em', use: 'Prologue: stage and text side by side' },
	{ name: 'xl · 64em', use: 'A part title beside its articles' },
	{ name: '2xl · 75em', use: 'Section list, margin glosses, height of the opener' },
];

export const SHADOWS: Token[] = [
	{ name: '--shadow-plate', use: 'The name plate hangs in front of its painting' },
	{ name: '--shadow-lift', use: 'A readable article lifts on hover' },
	{ name: '--shadow-popover', use: 'The sections from the top bar' },
];

/**
 * A motion token, drawn on the page: a dot travels a track whose length is
 * the duration, with the token's timing curve; an easing also shows its
 * curve (the control points of its cubic-bezier())
 */
export interface MotionToken extends Token {
	ms: number;
	easing: string;
	curve?: [number, number, number, number];
}

export const MOTION: MotionToken[] = [
	{
		name: '--ease-out',
		use: 'cubic-bezier(0.16, 1, 0.3, 1): plates, top bar',
		ms: 1100,
		easing: 'var(--ease-out)',
		curve: [0.16, 1, 0.3, 1],
	},
	{
		name: '--ease-rest',
		use: 'cubic-bezier(0.3, 0.5, 0.2, 1): the ink comes to rest',
		ms: 1100,
		easing: 'var(--ease-rest)',
		curve: [0.3, 0.5, 0.2, 1],
	},
	{
		name: '--ease-wipe',
		use: 'cubic-bezier(0.65, 0, 0.35, 1): the brushstroke',
		ms: 1000,
		easing: 'var(--ease-wipe)',
		curve: [0.65, 0, 0.35, 1],
	},
	{
		name: '--duration-reveal',
		use: '1100 ms: a plate blooms',
		ms: 1100,
		easing: 'var(--ease-out)',
	},
	{
		name: '--duration-sweep',
		use: '1000 ms: the brushstroke, 900 ms delayed',
		ms: 1000,
		easing: 'var(--ease-wipe)',
	},
	{
		name: '--duration-vortex',
		use: '3400 ms: the vortex of the prologue, under 5 s',
		ms: 3400,
		easing: 'var(--ease-rest)',
	},
	{
		name: '--duration-transition',
		use: '1100 ms: the next page spreads out',
		ms: 1100,
		easing: 'cubic-bezier(0.33, 0, 0.2, 1)',
	},
	{
		name: '--duration-bar',
		use: '300 ms: the top bar comes and goes',
		ms: 300,
		easing: 'var(--ease-out)',
	},
];
