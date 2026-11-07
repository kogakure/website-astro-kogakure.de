/**
 * Generates the website's images once, so the build processes none. Reads
 * (never writes) the sibling repos and writes public/images/ and
 * src/lib/images/manifest.json, both committed:
 *
 *   kogakure-texts/images/new/mapping.csv
 *     + kogakure-ai-images/assets/**     → images/<key>-<width>.webp
 *   kogakure-texts/images/old/**         → images/old/<key>-<width>.webp
 *   the opener of every article          → images/og/<translationKey>.jpg
 *   the images of src/legal/             → the same, og/imprint.jpg, og/privacy.jpg
 *   kogakure-prototyping ink assets      → images/ink/*.webp
 *
 * Only the images the imported texts use are generated (run
 * `pnpm import:content` first). Widths: 800, 1400, 2000, and 2750 for the
 * paintings; each from the original, or from its 2× upscale where the
 * original is too small, never enlarged past the largest source. An image
 * whose source and settings are unchanged (hash in the manifest) is skipped;
 * files no image needs any more are deleted.
 *
 * Usage: pnpm images [--force] [--texts dir] [--ai-images dir] [--prototyping dir]
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { readImportedBook, readLegalPages } from '../src/lib/book/read.ts';
import { imageUrls } from '../src/lib/book/transform.ts';
import {
	BAND_WIDTH,
	findOpener,
	imageFile,
	imageKey,
	inkFile,
	isPainting,
	type Manifest,
	OG_SIZE,
	ogFile,
	parseFocus,
	WIDTHS,
} from '../src/lib/images/images.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const { values: args } = parseArgs({
	options: {
		force: { type: 'boolean', default: false },
		texts: { type: 'string', default: path.join(ROOT, '..', 'kogakure-texts') },
		'ai-images': { type: 'string', default: path.join(ROOT, '..', 'kogakure-ai-images') },
		prototyping: { type: 'string', default: path.join(ROOT, '..', 'kogakure-prototyping') },
	},
});

const TEXTS = path.resolve(args.texts);
const AI_IMAGES = path.resolve(args['ai-images']);
const INK = path.resolve(args.prototyping, 'prototypes/gekiga-2-modes/assets/ink');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(PUBLIC, 'images');
const MANIFEST = path.join(ROOT, 'src/lib/images/manifest.json');

/** Part of every hash: changing the encoding regenerates everything */
const SETTINGS = JSON.stringify({
	v: 1,
	widths: WIDTHS,
	band: BAND_WIDTH,
	webp: { quality: 72, effort: 6 },
	og: { ...OG_SIZE, jpeg: { quality: 82, mozjpeg: true } },
});

for (const [name, dir] of [
	['kogakure-texts', TEXTS],
	['kogakure-ai-images', AI_IMAGES],
]) {
	if (!fs.existsSync(dir!)) {
		console.error(`${name} not found at ${dir}`);
		process.exit(1);
	}
}

const sha = (...parts: (string | Buffer)[]) => {
	const hash = createHash('sha256');
	for (const part of parts) hash.update(part);
	return hash.digest('hex').slice(0, 16);
};
const publicPath = (url: string) => path.join(PUBLIC, url);
const toJson = (value: unknown) => `${JSON.stringify(value, null, '\t')}\n`;

const previous: Manifest = fs.existsSync(MANIFEST)
	? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
	: { images: {}, og: {}, ink: {} };
const next: Manifest = { images: {}, og: {}, ink: {} };
/** Every file below public/images/ that stays */
const expected = new Set<string>();
const errors: string[] = [];
let generated = 0;

/** The mapping of kogakure-texts: website image → original and focus point */
const mapping = new Map(
	fs
		.readFileSync(path.join(TEXTS, 'images/new/mapping.csv'), 'utf8')
		.trim()
		.split('\n')
		.slice(1)
		.map((line) => {
			const [key = '', original = '', , focus = ''] = line.split(',');
			return [key, { original, focus: focus.trim() || undefined }] as const;
		})
);

interface Source {
	file: string;
	width: number;
	height: number;
}

/** Size as displayed: EXIF orientation applied, as `.rotate()` does */
const source = async (file: string): Promise<Source> => {
	const { autoOrient } = await sharp(file).metadata();
	return { file, ...autoOrient };
};

/** Content of the original, but only size and time of the large upscale (derived from it) */
const fileStamp = (file: string) => {
	const { size, mtimeMs } = fs.statSync(file);
	return `${size}:${Math.round(mtimeMs)}`;
};

/** The original and, for the new images, its upscale */
async function sourcesOf(
	key: string
): Promise<{ original: Source; upscale?: Source; focus?: string }> {
	if (key.startsWith('old/')) {
		return { original: await source(path.join(TEXTS, 'images', key)) };
	}
	const row = mapping.get(key);
	if (!row) throw new Error('not in images/new/mapping.csv');
	const original = path.join(AI_IMAGES, row.original);
	const upscale = original.replace(/-selected\.png$/, '-upscaled.png');
	return {
		original: await source(original),
		...(upscale !== original && fs.existsSync(upscale)
			? { upscale: await source(upscale) }
			: {}),
		...(row.focus ? { focus: row.focus } : {}),
	};
}

/** The smallest source at least `width` wide */
const sourceFor = (width: number, original: Source, upscale?: Source) =>
	original.width >= width ? original : (upscale ?? original);

async function image(key: string) {
	const { original, upscale, focus } = await sourcesOf(key);
	const largest = Math.max(original.width, upscale?.width ?? 0);
	const all = [...WIDTHS, ...(isPainting(key) ? [BAND_WIDTH] : [])];
	const targets = all.filter((w) => w <= largest);
	// A source between two widths (the old screenshots) also keeps its own,
	// unless it is barely wider than the last width it reaches
	const below = targets.at(-1);
	const widths =
		below === undefined || (largest < all.at(-1)! && largest > below * 1.2)
			? [...targets, largest]
			: targets;
	const hash = sha(
		SETTINGS,
		fs.readFileSync(original.file),
		upscale ? fileStamp(upscale.file) : ''
	);
	const files = widths.map((w) => imageFile(key, w));
	files.forEach((file) => expected.add(publicPath(file)));
	next.images[key] = {
		width: original.width,
		height: original.height,
		aspect: Math.round((original.width / original.height) * 10000) / 10000,
		...(focus ? { focus } : {}),
		widths,
		hash,
	};
	if (
		!args.force &&
		previous.images[key]?.hash === hash &&
		files.every((file) => fs.existsSync(publicPath(file)))
	)
		return;
	for (const [i, width] of widths.entries()) {
		const out = publicPath(files[i]!);
		fs.mkdirSync(path.dirname(out), { recursive: true });
		await sharp(sourceFor(width, original, upscale).file)
			.rotate()
			.resize({ width })
			.webp({ quality: 72, effort: 6 })
			.toFile(out);
	}
	generated++;
}

/** 1200×630, cropped from the opener at its focus point */
async function og(translationKey: string, key: string) {
	const { original, upscale, focus } = await sourcesOf(key);
	const imageHash = next.images[key]!.hash;
	const hash = sha(SETTINGS, imageHash, focus ?? '');
	const out = publicPath(ogFile(translationKey));
	expected.add(out);
	next.og[translationKey] = { image: key, hash };
	if (!args.force && previous.og[translationKey]?.hash === hash && fs.existsSync(out)) return;
	const scale = Math.max(OG_SIZE.width / original.width, OG_SIZE.height / original.height);
	const from = scale > 1 && upscale ? upscale : original;
	const coverScale = Math.max(OG_SIZE.width / from.width, OG_SIZE.height / from.height);
	const width = Math.round(from.width * coverScale);
	const height = Math.round(from.height * coverScale);
	const [fx, fy] = parseFocus(focus);
	fs.mkdirSync(path.dirname(out), { recursive: true });
	await sharp(from.file)
		.rotate()
		.resize(width, height)
		.extract({
			left: Math.round((width - OG_SIZE.width) * fx),
			top: Math.round((height - OG_SIZE.height) * fy),
			...OG_SIZE,
		})
		.jpeg({ quality: 82, mozjpeg: true })
		.toFile(out);
	generated++;
}

/** The ink assets come as they are from the prototype */
async function ink() {
	if (!fs.existsSync(INK)) {
		console.warn(`Ink assets not found at ${INK}, keeping the generated ones`);
		for (const [name, entry] of Object.entries(previous.ink)) {
			next.ink[name] = entry;
			expected.add(publicPath(inkFile(name)));
		}
		return;
	}
	for (const name of fs
		.readdirSync(INK)
		.filter((f) => f.endsWith('.webp'))
		.toSorted()) {
		const file = path.join(INK, name);
		const buffer = fs.readFileSync(file);
		const { width, height } = await source(file);
		const out = publicPath(inkFile(name));
		expected.add(out);
		next.ink[name] = { width, height, hash: sha(buffer) };
		if (!fs.existsSync(out) || !fs.readFileSync(out).equals(buffer)) {
			fs.mkdirSync(path.dirname(out), { recursive: true });
			fs.writeFileSync(out, buffer);
			generated++;
		}
	}
}

/** Runs `task` on every item, `limit` at a time */
async function pool<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
	let index = 0;
	await Promise.all(
		Array.from({ length: limit }, async () => {
			while (index < items.length) await task(items[index++]!);
		})
	);
}

const filesBelow = (dir: string): string[] =>
	fs.existsSync(dir)
		? fs
				.readdirSync(dir, { recursive: true, withFileTypes: true })
				.filter((entry) => entry.isFile())
				.map((entry) => path.join(entry.parentPath, entry.name))
		: [];

// The images the texts use; the opener of every page (same in every language)
const book = readImportedBook(ROOT);
/** public/images/ belongs to this script: anything it doesn't generate is deleted */
const PRUNE_LIMIT = 0.2;
const keys = new Set<string>();
const openers = new Map<string, string>();
for (const page of book.pages) {
	const urls = imageUrls(page.body);
	for (const url of urls) {
		const key = imageKey(url);
		if (key) keys.add(key);
		else errors.push(`${page.lang}/${page.slug}: image ${url} is not below /images/`);
	}
	const translationKey = (page.data as { translationKey: string }).translationKey;
	const opener = imageKey(findOpener(urls) ?? '');
	const known = openers.get(translationKey);
	if (opener && known && known !== opener)
		errors.push(`${page.lang}/${page.slug}: opener ${opener} differs from ${known}`);
	if (opener) openers.set(translationKey, opener);
}
// The legal pages' openers, written here (src/legal/); their preview image is
// named after the page: og/imprint.jpg, og/privacy.jpg
for (const page of readLegalPages(ROOT)) {
	const urls = imageUrls(page.body);
	for (const url of urls) {
		const key = imageKey(url);
		if (key) keys.add(key);
		else errors.push(`legal ${page.lang}/${page.slug}: image ${url} is not below /images/`);
	}
	const opener = imageKey(findOpener(urls) ?? '');
	const name = page.lang === 'en' ? page.slug : undefined;
	if (opener && name) openers.set(name, opener);
}
if (keys.size === 0) {
	console.error('The imported texts use no images: run pnpm import:content first');
	process.exit(1);
}

const started = Date.now();
await pool([...keys].toSorted(), 4, async (key) => {
	try {
		await image(key);
	} catch (error) {
		errors.push(`${key}: ${(error as Error).message}`);
	}
});
await pool([...openers].toSorted(), 4, async ([translationKey, key]) => {
	if (!next.images[key]) return;
	try {
		await og(translationKey, key);
	} catch (error) {
		errors.push(`og ${translationKey}: ${(error as Error).message}`);
	}
});
await ink();

if (errors.length > 0) {
	console.error(`${errors.length} errors, nothing written to the manifest:`);
	for (const error of errors) console.error(`  ${error}`);
	process.exit(1);
}

const stale = filesBelow(OUT).filter((file) => !expected.has(file));
if (stale.length > expected.size * PRUNE_LIMIT && !args.force) {
	console.error(
		`${stale.length} files in public/images would be deleted: is the import complete? ` +
			'Rerun with --force to delete them.'
	);
	process.exit(1);
}
for (const file of stale) fs.unlinkSync(file);
const removed = stale.length;
for (const dir of fs
	.readdirSync(OUT, { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => path.join(entry.parentPath, entry.name))
	.toSorted((a, b) => b.length - a.length)) {
	if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

const sorted = (record: Record<string, unknown>) =>
	Object.fromEntries(Object.entries(record).toSorted(([a], [b]) => a.localeCompare(b)));
const written = toJson({ images: sorted(next.images), og: sorted(next.og), ink: sorted(next.ink) });
if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, 'utf8') !== written) {
	fs.writeFileSync(MANIFEST, written);
	// Astro's content cache doesn't know the figures depend on the manifest
	for (const cache of ['.astro/data-store.json', 'node_modules/.astro/data-store.json'])
		fs.rmSync(path.join(ROOT, cache), { force: true });
}

const files = filesBelow(OUT);
const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(
	`${keys.size} images, ${openers.size} OG images, ${Object.keys(next.ink).length} ink assets: ` +
		`${generated} generated, ${removed} files removed in ${Math.round((Date.now() - started) / 1000)} s. ` +
		`public/images: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`
);
