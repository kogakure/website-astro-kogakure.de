import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LANGS } from '@/i18n/languages';
import { offlinePath } from '@/i18n/routes';
import { shellFiles } from './pwa';

/** A dist/ with the offline pages, the manifests and the icons */
function dist(dir: string, page: string) {
	const write = (url: string, text = '') => {
		const file = path.join(dir, url.endsWith('/') ? `${url}index.html` : url);
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, text);
	};
	for (const lang of LANGS) {
		write(offlinePath(lang), page);
		write(lang === 'de' ? '/manifest.webmanifest' : `/${lang}/manifest.webmanifest`);
	}
	for (const icon of [
		'/favicon.svg',
		'/favicon.ico',
		'/apple-touch-icon.png',
		'/icons/icon-192.png',
		'/icons/icon-512.png',
		'/icons/maskable-192.png',
		'/icons/maskable-512.png',
	])
		write(icon);
	return write;
}

describe('shellFiles', () => {
	let dir: string;
	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kogakure-shell-'));
	});
	afterEach(() => fs.rmSync(dir, { recursive: true }));

	it('follows what the offline pages load, but not the islands, fonts or other sites', () => {
		const write = dist(
			dir,
			`<link rel="stylesheet" href="/_astro/page.css">
			<meta property="og:image" content="https://www.kogakure.de/images/og/x.jpg">
			<style>@font-face{src:url(/fonts/serif.woff2)}</style>
			<footer style="--band-edge: url('/images/ink/wash-edge-a.webp')"></footer>
			<astro-island component-url="/_astro/Search.js" renderer-url="/_astro/client.js"></astro-island>
			<script type="module" src="/_astro/page.js"></script>`
		);
		write('/_astro/page.css', 'a{mask:url(/images/ink/wash-edge-b.webp)}');
		write('/_astro/page.js', 'import{a}from"./shared.js";import("./lazy.js")');
		write('/_astro/shared.js');
		write('/images/ink/wash-edge-a.webp');
		const shell = shellFiles(dir);
		expect(shell).toContain('/offline/');
		expect(shell).toContain('/he/offline/');
		expect(shell).toContain('/ja/manifest.webmanifest');
		expect(shell).toContain('/icons/maskable-512.png');
		expect(shell).toEqual(
			expect.arrayContaining([
				'/_astro/page.css',
				'/_astro/page.js',
				'/_astro/shared.js',
				'/images/ink/wash-edge-a.webp',
			])
		);
		for (const left of [
			'/_astro/lazy.js',
			'/_astro/Search.js',
			'/_astro/client.js',
			'/fonts/serif.woff2',
			'/images/og/x.jpg',
			'/images/ink/wash-edge-b.webp',
		])
			expect(shell).not.toContain(left);
	});

	it('fails the build on a file that is not there', () => {
		dist(dir, '<script type="module" src="/_astro/gone.js"></script>');
		expect(() => shellFiles(dir)).toThrow('/_astro/gone.js is not in the build');
	});
});
