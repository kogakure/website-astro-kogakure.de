/**
 * The service worker's caches (SI-480), shared by the build that writes it
 * (src/integrations/pwa.ts) and the offline page's list of saved pages: no
 * imports, so the browser loads only these lines. The shell (the offline
 * pages and what they load, the icons) is versioned per deploy; the rest
 * grows as the reader reads, each with a limit of entries (the oldest go
 * first): the site has some 300 MB of paintings and 12 MB of font subsets.
 */
export const CACHES = {
	/** `kogakure-shell-<version>` */
	shell: 'kogakure-shell',
	/** The HTML of the pages read, NetworkFirst: online the reader always gets the page as deployed */
	pages: { name: 'kogakure-pages', limit: 150 },
	/** /_astro/: named by their content hash, CacheFirst */
	assets: { name: 'kogakure-assets', limit: 120 },
	/** /fonts/: the subsets, named by their content hash, CacheFirst */
	fonts: { name: 'kogakure-fonts', limit: 80 },
	/** /images/: the paintings in the size the page chose, CacheFirst */
	images: { name: 'kogakure-images', limit: 60 },
} as const;

/** Seconds a page may take before a saved copy is shown instead */
export const NETWORK_TIMEOUT = 4;
