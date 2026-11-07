/**
 * Draws the app's icons from the 木隠 name plate (the tanzaku of
 * NamePlate.astro: shoji paper, a heavy sumi frame with an inner hairline,
 * the kanji in Yuji Syuku), as paths, so no font is needed to show them.
 * Writes into public/, committed like the images and fonts (SI-480):
 *
 *   favicon.svg                 the plate alone, light and dark by the system
 *   favicon.ico                 16, 32 and 48 px of the light plate
 *   apple-touch-icon.png        180 px, the plate on washi
 *   icons/icon-<size>.png       the manifest's icons, the plate on washi
 *   icons/maskable-<size>.png   the same, the plate inside the safe zone
 *   icons/launch/*.png          the iOS launch screens, light and dark
 *                               (LAUNCH_SCREENS in src/lib/pwa/pwa.ts)
 *
 * Usage: pnpm icons
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { source } from './font-sources.ts';
import { BOOK_PLATE } from '../src/lib/book/plates.ts';
import { GROUNDS, type Mode } from '../src/lib/mode/mode.ts';
import {
	APPLE_TOUCH_ICON,
	FAVICON_ICO,
	FAVICON_SVG,
	LAUNCH_DIR,
	LAUNCH_SCREENS,
	MANIFEST_ICONS,
} from '../src/lib/pwa/pwa.ts';

const PUBLIC = path.resolve(import.meta.dirname, '../public');
const TOKENS = fs.readFileSync(
	path.resolve(import.meta.dirname, '../src/styles/tokens.css'),
	'utf8'
);

/** A colour role of tokens.css in a mode: `--plate: light-dark(#faf8f4, #e6dfcf)` */
function token(name: string, mode: Mode): string {
	const match = new RegExp(
		`${name}:\\s*light-dark\\(((?:[^(),]|\\([^)]*\\))+),\\s*((?:[^(),]|\\([^)]*\\))+)\\)`
	).exec(TOKENS);
	if (!match) throw new Error(`tokens.css: no light-dark() for ${name}`);
	return (mode === 'light' ? match[1] : match[2])!.trim();
}

/** The plate's colours per mode, from the design's roles */
const COLOURS = Object.fromEntries(
	(['light', 'dark'] as const).map((mode) => [
		mode,
		{
			ground: GROUNDS[mode].home,
			plate: token('--plate', mode),
			ink: token('--plate-ink', mode),
			shadow: token('--shadow-ink', mode),
		},
	])
) as Record<Mode, { ground: string; plate: string; ink: string; shadow: string }>;

/*
 * The plate's measures in em, as NamePlate.astro sets them in vertical-rl:
 * the column is the line height wide, each kanji 1em tall plus the letter
 * spacing; the padding is asymmetric, since the brush sets its ink a little
 * right of the column's middle
 */
const FRAME = 0.085;
const HAIRLINE = { inset: 0.159, width: 0.022 };
const PADDING = { top: 0.47, bottom: 0.43, right: 0.31, left: 0.25 };
const LINE = 1.02;
const ADVANCE = 1.06;
const KANJI = [...BOOK_PLATE.name];
const WIDTH = FRAME * 2 + PADDING.left + LINE + PADDING.right;
const HEIGHT = FRAME * 2 + PADDING.top + KANJI.length * ADVANCE + PADDING.bottom;

const brush = (await source('brush')).font;
/** The top of a kanji's em box above its baseline, in font units (OS/2 typo ascender) */
const EM_TOP = brush['OS/2'].typoAscender;
const GLYPHS = KANJI.map((kanji) => brush.glyphForCodePoint(kanji.codePointAt(0)!).path.toSVG());

const round = (n: number) => Math.round(n * 100) / 100;

/** The plate, `height` px tall, its top left at x, y; colours as fills or classes */
function plate(
	x: number,
	y: number,
	height: number,
	paint: { plate: string; ink: string; line: string; shadow?: string | undefined },
	shadow = false
): string {
	const em = height / HEIGHT;
	const width = WIDTH * em;
	const rect = (inset: number) =>
		`x="${round(x + inset * em)}" y="${round(y + inset * em)}" width="${round(width - 2 * inset * em)}" height="${round(height - 2 * inset * em)}"`;
	const parts: string[] = [];
	// The plate hangs in front of its ground: 0 0.35em 0.9em -0.45em
	if (shadow && paint.shadow) {
		parts.push(
			`<rect x="${round(x + 0.45 * em)}" y="${round(y + 0.8 * em)}" width="${round(width - 0.9 * em)}" height="${round(height - 0.9 * em)}" fill="${paint.shadow}" filter="url(#hang)"/>`
		);
	}
	parts.push(
		`<rect ${rect(0)} ${paint.ink}/>`,
		`<rect ${rect(FRAME)} ${paint.plate}/>`,
		`<rect ${rect(HAIRLINE.inset)} ${paint.line} stroke-width="${round(HAIRLINE.width * em)}"/>`
	);
	const scale = em / brush.unitsPerEm;
	const left = x + (FRAME + PADDING.left + (LINE - 1) / 2) * em;
	GLYPHS.forEach((d, i) => {
		const top = y + (FRAME + PADDING.top + i * ADVANCE) * em + EM_TOP * scale;
		parts.push(
			`<path transform="translate(${round(left)} ${round(top)}) scale(${round(scale * 1e4) / 1e4} ${-round(scale * 1e4) / 1e4})" d="${d}" ${paint.ink}/>`
		);
	});
	return parts.join('');
}

const hang = (em: number) =>
	`<defs><filter id="hang" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${round(0.45 * em)}"/></filter></defs>`;

/** The plate on its ground, `share` of the shorter side tall, centred */
function scene(width: number, height: number, mode: Mode, share: number): string {
	const colours = COLOURS[mode];
	const plateHeight = Math.min(width, height) * share;
	const x = (width - (plateHeight * WIDTH) / HEIGHT) / 2;
	const y = (height - plateHeight) / 2;
	const paint = {
		plate: `fill="${colours.plate}"`,
		ink: `fill="${colours.ink}"`,
		line: `fill="none" stroke="${colours.ink}"`,
		shadow: colours.shadow,
	};
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${hang(plateHeight / HEIGHT)}<rect width="${width}" height="${height}" fill="${colours.ground}"/>${plate(x, y, plateHeight, paint, true)}</svg>`;
}

/** The favicon's colours of a mode, by class: plate, ink, hairline */
const faviconCss = (mode: Mode) =>
	`.p{fill:${COLOURS[mode].plate}}.i{fill:${COLOURS[mode].ink}}.l{fill:none;stroke:${COLOURS[mode].ink}}`;

/** The favicon: the plate alone, the full height of a square, light or dark by the system */
function favicon(): string {
	const size = 100;
	const x = (size - (size * WIDTH) / HEIGHT) / 2;
	const style = `${faviconCss('light')}@media (prefers-color-scheme:dark){${faviconCss('dark')}}`;
	const svg = plate(x, 0, size, { plate: 'class="p"', ink: 'class="i"', line: 'class="l"' });
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><style>${style}</style>${svg}</svg>\n`;
}

/** A Windows icon file holding PNGs (Vista and later read them) */
function ico(images: { size: number; png: Buffer }[]): Buffer {
	const header = Buffer.alloc(6 + 16 * images.length);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	let offset = header.length;
	images.forEach(({ size, png }, i) => {
		const entry = 6 + 16 * i;
		header.writeUInt8(size >= 256 ? 0 : size, entry);
		header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
		header.writeUInt16LE(1, entry + 4);
		header.writeUInt16LE(32, entry + 6);
		header.writeUInt32LE(png.length, entry + 8);
		header.writeUInt32LE(offset, entry + 12);
		offset += png.length;
	});
	return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

const write = async (url: string, data: Buffer | string) => {
	const file = path.join(PUBLIC, url);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, data);
	return fs.statSync(file).size;
};

// Full colour: a palette would band the plate's soft shadow
const png = (svg: string) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

const svg = favicon();
await write(FAVICON_SVG, svg);
// The ICO's light plate: the dark variant needs the media query only SVG has
const lightSvg = svg.replace(/@media.*\}\}/, '');
await write(
	FAVICON_ICO,
	ico(
		await Promise.all(
			[16, 32, 48].map(async (size) => ({
				size,
				png: await sharp(Buffer.from(lightSvg), { density: (72 * size) / 100 })
					.resize(size, size)
					.png()
					.toBuffer(),
			}))
		)
	)
);
await write(APPLE_TOUCH_ICON, await png(scene(180, 180, 'light', 0.78)));
for (const icon of MANIFEST_ICONS) {
	const size = Number.parseInt(icon.sizes, 10);
	// Maskable: the plate inside the safe zone, a circle of 80% of the icon
	await write(
		icon.src,
		await png(scene(size, size, 'light', icon.purpose === 'maskable' ? 0.64 : 0.8))
	);
}

const launchDir = path.join(PUBLIC, LAUNCH_DIR);
const launchFiles = new Set(LAUNCH_SCREENS.map(({ href }) => path.basename(href)));
if (fs.existsSync(launchDir)) {
	for (const name of fs.readdirSync(launchDir))
		if (!launchFiles.has(name)) fs.unlinkSync(path.join(launchDir, name));
}
let launchBytes = 0;
for (const screen of LAUNCH_SCREENS) {
	launchBytes += await write(
		screen.href,
		await png(scene(screen.width, screen.height, screen.mode, 0.36))
	);
}
console.log(
	`Icons written; ${LAUNCH_SCREENS.length} launch screens, ${(launchBytes / 1024).toFixed(0)} KB in all`
);
