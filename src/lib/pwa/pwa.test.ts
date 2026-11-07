import { describe, expect, it } from 'vitest';
import { LANGS } from '@/i18n/languages';
import { GROUNDS } from '@/lib/mode/mode';
import { LAUNCH_SCREENS, MANIFEST_ICONS, manifest, manifestPath } from './pwa';

describe('manifest', () => {
	it('is one app in every language, starting in it', () => {
		for (const lang of LANGS) {
			const app = manifest(lang);
			expect(app.id).toBe('/');
			expect(app.short_name).toBe('木隠');
			expect(app.start_url).toBe(lang === 'de' ? '/' : `/${lang}/`);
		}
		expect(manifest('he')).toMatchObject({ lang: 'he', dir: 'rtl' });
		expect(manifest('pt').lang).toBe('pt-BR');
	});

	it('opens on the washi of the light mode', () => {
		expect(manifest('de').background_color).toBe(GROUNDS.light.home);
		expect(manifest('de').theme_color).toBe(GROUNDS.light.home);
	});

	it('has icons for every use, maskable too', () => {
		expect(MANIFEST_ICONS.map(({ src, purpose }) => `${purpose} ${src}`)).toEqual([
			'any /icons/icon-192.png',
			'any /icons/icon-512.png',
			'maskable /icons/maskable-192.png',
			'maskable /icons/maskable-512.png',
		]);
	});

	it('lives below the language prefix', () => {
		expect(manifestPath('de')).toBe('/manifest.webmanifest');
		expect(manifestPath('ja')).toBe('/ja/manifest.webmanifest');
	});
});

describe('launch screens', () => {
	it('are one file per screen, mode and orientation', () => {
		const files = LAUNCH_SCREENS.map(({ href }) => href);
		expect(new Set(files).size).toBe(files.length);
		const queries = LAUNCH_SCREENS.map(({ media }) => media);
		expect(new Set(queries).size).toBe(queries.length);
	});

	it('match the device exactly, by mode', () => {
		expect(LAUNCH_SCREENS).toContainEqual({
			href: '/icons/launch/1179x2556-dark.png',
			media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)',
			width: 1179,
			height: 2556,
			mode: 'dark',
		});
	});

	it('turn with an iPad, not with an iPhone', () => {
		const landscape = LAUNCH_SCREENS.filter(({ media }) => media.includes('landscape'));
		expect(landscape.length).toBeGreaterThan(0);
		for (const { width, height } of landscape) expect(width).toBeGreaterThan(height);
		expect(landscape.every(({ media }) => !media.includes('device-width: 393px'))).toBe(true);
	});
});
