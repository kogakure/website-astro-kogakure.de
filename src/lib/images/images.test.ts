import { describe, expect, it } from 'vitest';
import {
	findOpener,
	generatedFiles,
	getImage,
	getOgImage,
	imageFile,
	imageKey,
	isPainting,
	manifest,
	parseFocus,
	type Manifest,
} from './images';

const fixture: Manifest = {
	images: {
		'article/kamae-01.webp': {
			width: 2048,
			height: 1152,
			aspect: 1.7778,
			widths: [800, 1400, 2000, 2750],
			hash: 'a',
		},
		'historical/hattori-hanzo.webp': {
			width: 1024,
			height: 1536,
			aspect: 0.6667,
			focus: '50% 20%',
			widths: [800, 1400, 2000],
			hash: 'b',
		},
		'old/downloads/ogama.jpg': {
			width: 640,
			height: 480,
			aspect: 1.3333,
			widths: [640],
			hash: 'c',
		},
	},
	og: { kamaePage: { image: 'article/kamae-01.webp', hash: 'd' } },
	ink: {},
};

describe('imageKey and imageFile', () => {
	it('keys an image by its path below /images/', () => {
		expect(imageKey('/images/kamae/ichimonji.webp')).toBe('kamae/ichimonji.webp');
		expect(imageKey('/fonts/x.woff2')).toBeUndefined();
	});

	it('names a generated file by its width, always WebP', () => {
		expect(imageFile('kamae/ichimonji.webp', 800)).toBe('/images/kamae/ichimonji-800.webp');
		expect(imageFile('old/chronology/history-1999.jpg', 800)).toBe(
			'/images/old/chronology/history-1999-800.webp'
		);
	});
});

describe('getImage', () => {
	it('gives every width in the srcset and 1400 as the fallback', () => {
		expect(getImage('/images/article/kamae-01.webp', fixture)).toEqual({
			src: '/images/article/kamae-01-1400.webp',
			srcset:
				'/images/article/kamae-01-800.webp 800w, /images/article/kamae-01-1400.webp 1400w, ' +
				'/images/article/kamae-01-2000.webp 2000w, /images/article/kamae-01-2750.webp 2750w',
			width: 2048,
			height: 1152,
		});
	});

	it('hands out the focus point', () => {
		expect(getImage('/images/historical/hattori-hanzo.webp', fixture)?.focus).toBe('50% 20%');
	});

	it('falls back to the smallest width of a small image', () => {
		expect(getImage('/images/old/downloads/ogama.jpg', fixture)).toMatchObject({
			src: '/images/old/downloads/ogama-640.webp',
			srcset: '/images/old/downloads/ogama-640.webp 640w',
		});
	});

	it('knows nothing of images outside the manifest', () => {
		expect(getImage('/images/kamae/missing.webp', fixture)).toBeUndefined();
		expect(getImage('/elsewhere/kamae-01.webp', fixture)).toBeUndefined();
		expect(generatedFiles('/images/kamae/missing.webp', fixture)).toEqual([]);
	});

	it('lists all generated files of an image', () => {
		expect(generatedFiles('/images/historical/hattori-hanzo.webp', fixture)).toEqual([
			'/images/historical/hattori-hanzo-800.webp',
			'/images/historical/hattori-hanzo-1400.webp',
			'/images/historical/hattori-hanzo-2000.webp',
		]);
	});
});

describe('findOpener', () => {
	it('takes the first painting, skipping diagrams, objects and technique images', () => {
		expect(
			findOpener([
				'/images/vector/gogyo-cycle.webp',
				'/images/kamae/ichimonji.webp',
				'/images/historical/sonshi.webp',
				'/images/article/gogyo-01.webp',
			])
		).toBe('/images/historical/sonshi.webp');
	});

	it('finds none without a painting', () => {
		expect(findOpener(['/images/old/chronology/history-1999.jpg'])).toBeUndefined();
		expect(findOpener([])).toBeUndefined();
	});

	it('tells paintings by their folder', () => {
		expect(isPainting('article/x.webp')).toBe(true);
		expect(isPainting('tools/x.webp')).toBe(false);
	});
});

describe('getOgImage', () => {
	it('gives the 1200×630 crop of a page with an opener', () => {
		expect(getOgImage('kamaePage', fixture)).toEqual({
			src: '/images/og/kamaePage.jpg',
			width: 1200,
			height: 630,
		});
		expect(getOgImage('glossaryPage', fixture)).toBeUndefined();
	});
});

describe('parseFocus', () => {
	it('reads object-position percentages and falls back to the centre', () => {
		expect(parseFocus('50% 18%')).toEqual([0.5, 0.18]);
		expect(parseFocus(undefined)).toEqual([0.5, 0.5]);
		expect(parseFocus('center')).toEqual([0.5, 0.5]);
	});
});

describe('the committed manifest', () => {
	it('has every width up to the largest source, ascending', () => {
		for (const [key, entry] of Object.entries(manifest.images)) {
			expect(entry.widths.length, key).toBeGreaterThan(0);
			expect(entry.widths, key).toEqual(entry.widths.toSorted((a, b) => a - b));
		}
		const newImages = Object.entries(manifest.images).filter(
			([key]) => !key.startsWith('old/')
		);
		for (const [key, entry] of newImages)
			expect(entry.widths.slice(0, 3), key).toEqual([800, 1400, 2000]);
	});

	it('has an OG image for every opener it names', () => {
		for (const { image } of Object.values(manifest.og)) {
			expect(isPainting(image)).toBe(true);
			expect(manifest.images[image]).toBeDefined();
		}
	});
});
