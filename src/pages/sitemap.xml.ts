/**
 * /sitemap.xml: every page in every language, each with its language
 * versions as hreflang alternates (src/lib/seo/seo.ts)
 */
import type { APIRoute } from 'astro';
import { getSitemapGroups } from '@/lib/book/book';
import { sitemapXml } from '@/lib/seo/seo';

export const GET: APIRoute = async () =>
	new Response(sitemapXml(await getSitemapGroups()), {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
