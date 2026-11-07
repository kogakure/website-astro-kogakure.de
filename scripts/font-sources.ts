/**
 * The OFL fonts of google/fonts the site's fonts are made from, at a pinned
 * commit, checked by SHA-256 and cached in .cache/fonts/ (git-ignored). Used
 * by generate-fonts.ts (the subsets) and generate-icons.ts (the name plate of
 * the icons).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as fontkit from 'fontkit';

const CACHE = path.resolve(import.meta.dirname, '../.cache/fonts');

/** google/fonts at this commit (2026-11-06) */
export const COMMIT = '38411257417e616c5d4daa1b9e91a3dbcebe1c2e';

/** Font directory in google/fonts/ofl, file, SHA-256 */
export const SOURCES = {
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

export type SourceKey = keyof typeof SOURCES;

export const sha256 = (buffer: Buffer | Uint8Array | string) =>
	createHash('sha256').update(buffer).digest('hex');

/** A file of google/fonts from the cache, downloaded and checked the first time */
export async function load(dir: string, file: string, expected: string): Promise<Buffer> {
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
export function source(key: SourceKey) {
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
