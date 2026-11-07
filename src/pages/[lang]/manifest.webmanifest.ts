/** /<lang>/manifest.webmanifest: the web app manifest of the other eleven languages */
import type { APIRoute, GetStaticPaths } from 'astro';
import { PREFIXED_LANGS, type Lang } from '@/i18n/languages';
import { manifest } from '@/lib/pwa/pwa';

export const getStaticPaths = (() =>
	PREFIXED_LANGS.map((lang) => ({ params: { lang }, props: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ lang: Lang }> = ({ props }) =>
	new Response(JSON.stringify(manifest(props.lang)), {
		headers: { 'Content-Type': 'application/manifest+json' },
	});
