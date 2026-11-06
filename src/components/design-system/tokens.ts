/**
 * What /design-system/ shows of the tokens (src/styles/tokens.css), with a
 * line on each, in German like the page. The values come from the CSS
 * itself: the samples use the custom properties.
 */

export interface Token {
	name: string;
	use: string;
}

export const COLOUR_GROUPS: { title: string; roles: Token[] }[] = [
	{
		title: 'Grund und Text',
		roles: [
			{ name: '--ground', use: 'Grund der Seiten: Washi, nachts Aizome' },
			{ name: '--ground-read', use: 'Grund der Leseseite, nachts etwas heller' },
			{ name: '--text', use: 'Fließtext' },
			{ name: '--text-2', use: 'Zweiter Text: Lede, Bildunterschriften, Abschnitte' },
			{ name: '--text-3', use: 'Dritter Text: Credits, Labels, Kapitelnummern' },
			{ name: '--heading', use: 'Überschriften: Sumi, nachts Khakigold' },
			{ name: '--link-line', use: 'Unterstreichung der Links' },
			{ name: '--rule', use: 'Haarlinien' },
			{ name: '--focus', use: 'Fokusring' },
			{ name: '--select', use: 'Textauswahl' },
		],
	},
	{
		title: 'Tusche und Tafeln',
		roles: [
			{ name: '--ink', use: 'Pinsel: Sumi, nachts Gofun' },
			{ name: '--wash', use: 'Lavierung unter der Tusche: Ocker, nachts Indigo' },
			{ name: '--plate', use: 'Papier der Namenstafel' },
			{ name: '--plate-ink', use: 'Rahmen und Schrift der Namenstafel' },
			{ name: '--plate-num', use: 'Kapitelnummer auf der Tafel' },
			{ name: '--sub-bg', use: 'Untertitelkasten' },
			{ name: '--sub-text', use: 'Untertitel' },
			{ name: '--sub-edge', use: 'Kante des Untertitelkastens' },
		],
	},
	{
		title: 'Band, Zustände, Siegel',
		roles: [
			{ name: '--band', use: 'Band des Kolophons' },
			{ name: '--band-text', use: 'Text auf dem Band' },
			{ name: '--band-mute', use: 'Labels auf dem Band, gewählte Option' },
			{ name: '--band-line', use: 'Linien auf dem Band' },
			{ name: '--hover', use: 'Helleres Papier beim Hover' },
			{ name: '--press', use: 'Gedrückt' },
			{ name: '--seal', use: 'Das Siegel: einziger Akzent, nur als Marke' },
		],
	},
];

export const TYPE_SCALE: (Token & { sample: string; className: string })[] = [
	{
		name: 'Display',
		use: '700, Artikeltitel',
		className: 'type-display',
		sample: 'Ninjutsu',
	},
	{
		name: 'Headline',
		use: '600, Titel eines Teils auf der Startseite',
		className: 'type-headline',
		sample: 'Geschichte',
	},
	{
		name: 'Title',
		use: '600, Abschnitte im Artikel',
		className: 'type-title',
		sample: 'Die Schriftzeichen',
	},
	{
		name: 'Lede',
		use: '400 kursiv, der Vorspann',
		className: 'type-lede',
		sample: 'Im Kern des Ninjutsu steht ein freier und rechter Geist.',
	},
	{
		name: 'Body',
		use: '400, 20 bis 21,5 px, Zeilenhöhe 1,62, Satzbreite 32,5 em',
		className: 'type-body',
		sample: 'Der Überlieferung nach war Momochi Sandayū einer der drei großen Anführer des Iga-Ryū.',
	},
	{
		name: 'Caption',
		use: '400, 17 px, Bildunterschriften',
		className: 'type-caption',
		sample: 'Die Klinge über dem Herzen',
	},
	{
		name: 'Label',
		use: 'IBM Plex Mono 400, nur Untertitel und wenige Labels',
		className: 'type-label',
		sample: 'Abschnitt 3 von 6',
	},
	{
		name: 'Plate',
		use: 'Yuji Syuku, nur auf Namenstafeln und in Randglossen',
		className: 'type-plate',
		sample: '歴史',
	},
];

export const SPACING: Token[] = [
	{ name: '--gutter', use: 'Seitenrand: clamp(1.25rem, 5vw, 4rem)' },
	{ name: '--measure', use: 'Satzbreite: 32.5em, etwa 69 Zeichen' },
	{ name: '--page', use: 'Seitenbreite: 86rem' },
	{ name: '--scene', use: 'Abstand der Szenen: clamp(4.5rem, 9vw, 8rem)' },
	{ name: '--section', use: 'Abstand vor einem Abschnitt: 2.6em' },
	{ name: '--list-gap', use: 'Abstand in Listen: 1.75rem' },
];

export const BREAKPOINTS: Token[] = [
	{ name: 'sm · 30em', use: 'Inhalt in zwei Spalten' },
	{ name: 'md · 48em', use: 'Proportionen der Tafeln, Untertitel auf dem Bild' },
	{ name: 'lg · 60em', use: 'Prolog: Bühne und Text nebeneinander' },
	{ name: 'xl · 64em', use: 'Titel eines Teils neben seinen Artikeln' },
	{ name: '2xl · 75em', use: 'Abschnittsleiste, Randglossen, Höhe des Openers' },
];

export const SHADOWS: Token[] = [
	{ name: '--shadow-plate', use: 'Die Namenstafel hängt vor ihrem Bild' },
	{ name: '--shadow-lift', use: 'Ein lesbarer Artikel hebt sich beim Hover' },
	{ name: '--shadow-popover', use: 'Die Abschnitte aus der Kopfleiste' },
];

export const MOTION: Token[] = [
	{ name: '--ease-out', use: 'cubic-bezier(0.16, 1, 0.3, 1): Tafeln, Kopfleiste' },
	{ name: '--ease-rest', use: 'cubic-bezier(0.3, 0.5, 0.2, 1): die Tusche kommt zur Ruhe' },
	{ name: '--ease-wipe', use: 'cubic-bezier(0.65, 0, 0.35, 1): der Pinselstrich' },
	{ name: '--duration-reveal', use: '1100 ms: eine Tafel blüht auf' },
	{ name: '--duration-sweep', use: '1000 ms: der Pinselstrich, 900 ms verzögert' },
	{ name: '--duration-vortex', use: '3400 ms: der Wirbel des Prologs, unter 5 s' },
	{ name: '--duration-transition', use: '1100 ms: die nächste Seite breitet sich aus' },
	{ name: '--duration-bar', use: '300 ms: die Kopfleiste kommt und geht' },
];
