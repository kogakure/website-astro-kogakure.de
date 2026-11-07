/**
 * The book as an app (SI-480): the web app manifest, the icons and the iOS
 * launch screens (the 木隠 name plate, drawn by `pnpm icons`). Shared by the
 * icon script, the manifests and the head (SiteHead.astro). Pure; no browser
 * or Node APIs. What the service worker keeps is in caches.ts.
 */
import { LANGUAGES, language, type Lang } from '../../i18n/languages.ts';
import { homePath } from '../../i18n/routes.ts';
import { ui } from '../../i18n/ui.ts';
import { BOOK_PLATE } from '../book/plates.ts';
import { GROUNDS, type Mode } from '../mode/mode.ts';
import { SITE_NAME } from '../seo/seo.ts';

/** The service worker, at the root so its scope is the whole site; nginx serves it no-cache */
export const SW_URL = '/sw.js';

export const FAVICON_SVG = '/favicon.svg';
/** For browsers without SVG favicons, and every browser's request for /favicon.ico */
export const FAVICON_ICO = '/favicon.ico';
/** iOS asks for this path even without a link to it */
export const APPLE_TOUCH_ICON = '/apple-touch-icon.png';
export const ICON_DIR = '/icons';
export const LAUNCH_DIR = `${ICON_DIR}/launch`;

/** The manifest of a language: the same app, opening in the reader's language */
export const manifestPath = (lang: Lang): string => `${homePath(lang)}manifest.webmanifest`;

export interface ManifestIcon {
	src: string;
	sizes: string;
	type: 'image/png';
	purpose: 'any' | 'maskable';
}

/** The plate on its ground (`any`), and smaller inside the safe zone (`maskable`) */
export const MANIFEST_ICONS: readonly ManifestIcon[] = (['any', 'maskable'] as const).flatMap(
	(purpose) =>
		[192, 512].map((size) => ({
			src: `${ICON_DIR}/${purpose === 'any' ? 'icon' : 'maskable'}-${size}.png`,
			sizes: `${size}x${size}`,
			type: 'image/png' as const,
			purpose,
		}))
);

/**
 * The web app manifest of a language. One app (`id`) in every language;
 * it starts on the homepage of the language it was installed from.
 */
export function manifest(lang: Lang) {
	const { htmlLang, dir } = language(lang);
	return {
		id: '/',
		name: SITE_NAME,
		short_name: BOOK_PLATE.name,
		description: `${ui(lang).subtitle}. ${ui(lang).topic}`,
		lang: htmlLang,
		dir,
		start_url: homePath(lang),
		scope: '/',
		display: 'standalone',
		orientation: 'any',
		background_color: GROUNDS.light.home,
		theme_color: GROUNDS.light.home,
		categories: ['books', 'education'],
		icons: MANIFEST_ICONS,
	};
}

/** The languages' manifests, for the build */
export const MANIFESTS = LANGUAGES.map(({ code }) => ({ lang: code, path: manifestPath(code) }));

/**
 * The iOS devices' screens in CSS pixels (portrait) and their pixel ratio.
 * iOS shows a launch screen only when one matches the device exactly; iPads
 * also launch in landscape.
 */
const DEVICES: readonly { width: number; height: number; ratio: number; tablet?: true }[] = [
	{ width: 375, height: 667, ratio: 2 }, // iPhone SE (2nd, 3rd), 8
	{ width: 414, height: 736, ratio: 3 }, // iPhone 8 Plus
	{ width: 375, height: 812, ratio: 3 }, // iPhone X, XS, 11 Pro, 12 mini, 13 mini
	{ width: 414, height: 896, ratio: 2 }, // iPhone XR, 11
	{ width: 414, height: 896, ratio: 3 }, // iPhone XS Max, 11 Pro Max
	{ width: 390, height: 844, ratio: 3 }, // iPhone 12, 13, 14, 16e
	{ width: 428, height: 926, ratio: 3 }, // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
	{ width: 393, height: 852, ratio: 3 }, // iPhone 14 Pro, 15, 15 Pro, 16
	{ width: 430, height: 932, ratio: 3 }, // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
	{ width: 402, height: 874, ratio: 3 }, // iPhone 16 Pro, 17, 17 Pro
	{ width: 420, height: 912, ratio: 3 }, // iPhone Air
	{ width: 440, height: 956, ratio: 3 }, // iPhone 16 Pro Max, 17 Pro Max
	{ width: 744, height: 1133, ratio: 2, tablet: true }, // iPad mini (6th, 7th)
	{ width: 768, height: 1024, ratio: 2, tablet: true }, // iPad mini 5, iPad 9.7″
	{ width: 810, height: 1080, ratio: 2, tablet: true }, // iPad 10.2″
	{ width: 820, height: 1180, ratio: 2, tablet: true }, // iPad Air (4th, 5th), iPad (10th, 11th)
	{ width: 834, height: 1112, ratio: 2, tablet: true }, // iPad Pro 10.5″
	{ width: 834, height: 1194, ratio: 2, tablet: true }, // iPad Pro 11″, Air 11″
	{ width: 834, height: 1210, ratio: 2, tablet: true }, // iPad Pro 11″ (M4, M5)
	{ width: 1024, height: 1366, ratio: 2, tablet: true }, // iPad Pro 12.9″, Air 13″
	{ width: 1032, height: 1376, ratio: 2, tablet: true }, // iPad Pro 13″ (M4, M5)
];

export interface LaunchScreen {
	href: string;
	media: string;
	/** In device pixels */
	width: number;
	height: number;
	mode: Mode;
}

/** Every launch screen: each device, orientation and mode */
export const LAUNCH_SCREENS: readonly LaunchScreen[] = DEVICES.flatMap(
	({ width, height, ratio, tablet }) =>
		(tablet ? (['portrait', 'landscape'] as const) : (['portrait'] as const)).flatMap(
			(orientation) =>
				(['light', 'dark'] as const).map((mode) => {
					const [w, h] = orientation === 'portrait' ? [width, height] : [height, width];
					const size = `${w * ratio}x${h * ratio}`;
					return {
						href: `${LAUNCH_DIR}/${size}-${mode}.png`,
						media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation}) and (prefers-color-scheme: ${mode})`,
						width: w * ratio,
						height: h * ratio,
						mode,
					};
				})
		)
);
