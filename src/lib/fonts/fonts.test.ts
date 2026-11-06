import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGS } from '@/i18n/languages';
import { fontFaceCss, fontFiles, manifest, preloadFont, type FontManifest } from './fonts';
import { allTextHashes } from './text';

const PUBLIC = path.resolve(import.meta.dirname, '../../../public');

/** ≤ about 150 KB of fonts for the first page (SI-473) */
const BUDGET = 150 * 1024;
/** CJK sets more glyphs than any subset can hide: DESIGN.md, Typography › Fonts */
const CJK_BUDGET = 240 * 1024;

describe('font manifest', () => {
	it('is up to date with the content and the UI strings: run pnpm fonts', () => {
		expect(manifest.text).toEqual(allTextHashes());
	});

	it('has every file it lists in public/fonts', () => {
		for (const { file } of manifest.faces) {
			expect(fs.existsSync(path.join(PUBLIC, file)), file).toBe(true);
		}
	});

	it('ships the OFL licence of every family', () => {
		const licences = fs.readdirSync(path.join(PUBLIC, 'fonts/licenses'));
		expect(licences).toHaveLength(7);
		for (const name of licences) {
			expect(fs.readFileSync(path.join(PUBLIC, 'fonts/licenses', name), 'utf8')).toContain(
				'SIL OPEN FONT LICENSE'
			);
		}
	});

	it('keeps the first page of every language within the budget', () => {
		for (const lang of LANGS) {
			const { home, median } = manifest.budget[lang]!;
			const limit = ['ja', 'zh', 'ko'].includes(lang) ? CJK_BUDGET : BUDGET;
			expect(home, `${lang} homepage`).toBeLessThanOrEqual(limit);
			expect(median, `${lang} median article`).toBeLessThanOrEqual(limit);
		}
	});
});

const sample: FontManifest = {
	commit: 'x',
	text: {},
	budget: {},
	fallbacks: [
		{
			family: 'Source Serif 4 Fallback',
			local: ['Georgia'],
			sizeAdjust: '100%',
			ascentOverride: '90%',
			descentOverride: '30%',
			lineGapOverride: '0%',
		},
	],
	faces: [
		{
			family: 'Source Serif 4',
			style: 'normal',
			weight: [400, 700],
			unicodeRange: 'U+41-5A',
			file: '/fonts/serif.woff2',
			bytes: 1,
		},
		{
			family: 'Shippori Mincho',
			style: 'normal',
			weight: 400,
			unicodeRange: 'U+5FCD',
			file: '/fonts/ja-common.woff2',
			bytes: 1,
			langs: ['ja'],
		},
		{
			family: 'Shippori Mincho',
			style: 'normal',
			weight: 400,
			file: '/fonts/ja-ninjutsu.woff2',
			bytes: 1,
			pages: ['ja/ninjutsu'],
		},
		{
			family: 'Shippori Mincho',
			style: 'normal',
			weight: 400,
			file: '/fonts/ja-home.woff2',
			bytes: 1,
			pages: ['ja/'],
		},
	],
};

describe('fontFiles', () => {
	it('gives a page the shared files, its language and its own', () => {
		const files = fontFiles('ja', 'ninjutsu', sample).map(({ file }) => file);
		expect(files).toEqual([
			'/fonts/serif.woff2',
			'/fonts/ja-common.woff2',
			'/fonts/ja-ninjutsu.woff2',
		]);
	});

	it("gives a page outside the book the homepage's files", () => {
		const files = fontFiles('ja', 'design-system', sample).map(({ file }) => file);
		expect(files).toContain('/fonts/ja-home.woff2');
		expect(files).not.toContain('/fonts/ja-ninjutsu.woff2');
	});

	it("leaves out other languages' files", () => {
		expect(fontFiles('de', '', sample).map(({ file }) => file)).toEqual(['/fonts/serif.woff2']);
	});
});

describe('fontFaceCss', () => {
	const css = fontFaceCss('ja', 'ninjutsu', sample);

	it('writes swap faces with their range, a weight range for variable fonts', () => {
		expect(css).toContain(
			'@font-face{font-family:"Source Serif 4";font-style:normal;font-weight:400 700;font-display:swap;src:url(/fonts/serif.woff2) format("woff2");unicode-range:U+41-5A}'
		);
	});

	it("puts a page's own files first, so the shared faces set their characters", () => {
		expect(css.indexOf('ja-ninjutsu')).toBeLessThan(css.indexOf('ja-common'));
		expect(css).toMatch(/ja-ninjutsu\.woff2\) format\("woff2"\)\}/);
	});

	it('adds the size-adjusted local fallback', () => {
		expect(css).toContain(
			'font-family:"Source Serif 4 Fallback";src:local("Georgia");size-adjust:100%'
		);
	});

	it('only points at the site itself', () => {
		for (const lang of LANGS) expect(fontFaceCss(lang)).not.toMatch(/url\((?!\/fonts\/)/);
	});
});

describe('preloadFont', () => {
	it('preloads the body face of every language', () => {
		expect(preloadFont('de')).toMatch(/^\/fonts\/source-serif-4-basic-/);
		expect(preloadFont('ru')).toMatch(/^\/fonts\/source-serif-4-cyrillic-/);
		expect(preloadFont('he')).toMatch(/^\/fonts\/frank-ruhl-libre-hebrew-/);
		expect(preloadFont('ja')).toMatch(/^\/fonts\/shippori-mincho-400-common-/);
		expect(preloadFont('zh')).toMatch(/^\/fonts\/noto-serif-sc-400-common-/);
		expect(preloadFont('ko')).toMatch(/^\/fonts\/noto-serif-kr-400-common-/);
	});
});
