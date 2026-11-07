import type { AstroIntegration } from 'astro';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LANG, LANGS } from '../i18n/languages.ts';
import { homePath, offlinePath } from '../i18n/routes.ts';
import { CACHES, NETWORK_TIMEOUT } from '../lib/pwa/caches.ts';
import {
	APPLE_TOUCH_ICON,
	FAVICON_ICO,
	FAVICON_SVG,
	MANIFEST_ICONS,
	MANIFESTS,
	SW_URL,
} from '../lib/pwa/pwa.ts';

/**
 * What an offline page loads as it opens: its styles and scripts, and the
 * ink of its inline styles (the colophon's edge). Left to the runtime
 * caches, which every page read fills: the fonts (a language needs few of
 * the subsets of all twelve), the ink the stylesheet names for all pages
 * (1.3 MB), and the islands' chunks (the search, which needs a connection).
 */
const PAGE_LOADS = /\s(?:src|href)="(\/_astro\/[^"]+)"|url\('?(\/images\/[^')]+)'?\)/g;
/** A chunk's static imports of its neighbours in /_astro/: `from"./languages.js"` */
const CHUNK_IMPORTS = /(?:from|import)\s*["']\.\/([\w.-]+\.js)["']/g;

/** A URL's file in dist/: a page's index.html */
const distFile = (outDir: string, url: string) =>
	path.join(outDir, url.endsWith('/') ? `${url}index.html` : url);

/** The files a page or chunk loads with it */
const loads = (url: string, text: string): string[] =>
	url.endsWith('/')
		? Array.from(text.matchAll(PAGE_LOADS), ([, asset, ink]) => (asset ?? ink) as string)
		: url.endsWith('.js')
			? Array.from(text.matchAll(CHUNK_IMPORTS), ([, name]) => `/_astro/${name}`)
			: [];

/**
 * The offline pages and everything they load, in dist/: the shell the
 * service worker precaches
 */
export function shellFiles(outDir: string): string[] {
	const shell = new Set<string>([
		...LANGS.map(offlinePath),
		...MANIFESTS.map(({ path: url }) => url),
		FAVICON_SVG,
		FAVICON_ICO,
		APPLE_TOUCH_ICON,
		...MANIFEST_ICONS.map(({ src }) => src),
	]);
	const queue = [...shell];
	for (const url of queue) {
		const file = distFile(outDir, url);
		if (!fs.existsSync(file))
			throw new Error(`Service worker shell: ${url} is not in the build`);
		if (!/\/$|\.js$/.test(url)) continue;
		for (const next of loads(url, fs.readFileSync(file, 'utf8'))) {
			if (shell.has(next)) continue;
			shell.add(next);
			queue.push(next);
		}
	}
	return [...shell].toSorted();
}

/** The worker's version: the hash of its shell's files, so a deploy that changes one is a new worker */
function version(outDir: string, shell: readonly string[]): string {
	const hash = createHash('sha256');
	for (const url of shell) {
		hash.update(url);
		hash.update(fs.readFileSync(distFile(outDir, url)));
	}
	return hash.digest('hex').slice(0, 12);
}

/**
 * The book as an app (SI-480): after the build, writes the service worker
 * (src/integrations/sw.js, its CONFIG filled in) to dist/sw.js, with the
 * offline pages and what they load as its shell.
 */
export const pwaIntegration = (): AstroIntegration => ({
	name: 'kogakure:pwa',
	hooks: {
		'astro:build:done': ({ dir, logger }) => {
			const outDir = fileURLToPath(dir);
			const shell = shellFiles(outDir);
			const config = {
				version: version(outDir, shell),
				shell,
				offline: {
					fallback: offlinePath(DEFAULT_LANG),
					prefixes: Object.fromEntries(
						LANGS.filter((lang) => lang !== DEFAULT_LANG).map((lang) => [
							homePath(lang),
							offlinePath(lang),
						])
					),
				},
				timeout: NETWORK_TIMEOUT,
				caches: CACHES,
			};
			const template = fs.readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
			const sw = template.replace(
				/\/\* CONFIG \*\/ \{[\s\S]*?\n\};/,
				`${JSON.stringify(config, null, '\t')};`
			);
			if (sw === template) throw new Error('Service worker: no CONFIG in sw.js');
			fs.writeFileSync(path.join(outDir, SW_URL), sw);
			const bytes = shell.reduce(
				(sum, url) => sum + fs.statSync(distFile(outDir, url)).size,
				0
			);
			logger.info(
				`Service worker ${config.version}: ${shell.length} files in its shell, ${(bytes / 1024).toFixed(0)} KB`
			);
		},
	},
});
