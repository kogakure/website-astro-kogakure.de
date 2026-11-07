/** /manifest.webmanifest: the German web app manifest (src/lib/pwa/pwa.ts) */
import type { APIRoute } from 'astro';
import { DEFAULT_LANG } from '@/i18n/languages';
import { manifest } from '@/lib/pwa/pwa';

export const GET: APIRoute = () =>
	new Response(JSON.stringify(manifest(DEFAULT_LANG)), {
		headers: { 'Content-Type': 'application/manifest+json' },
	});
