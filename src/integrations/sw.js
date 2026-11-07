/**
 * The service worker (SI-480). The build (src/integrations/pwa.ts) fills in
 * CONFIG and writes it to dist/sw.js; nginx serves it no-cache, so every
 * deploy with a new shell is a new worker, which takes over at once.
 *
 *   shell    precached on install, one cache per deploy: the offline page
 *            of every language and what it loads, the icons, the manifests
 *   pages    NetworkFirst: online the reader gets the page as deployed;
 *            without a connection (or after CONFIG.timeout seconds) the
 *            saved copy, and for a page never read the offline page of its
 *            language
 *   assets, fonts, images
 *            CacheFirst: named by their content (images by their source),
 *            kept as they are loaded, each cache with a limit of entries
 */
const CONFIG = /* CONFIG */ {
	version: 'dev',
	shell: [],
	offline: { fallback: '/offline/', prefixes: {} },
	timeout: 4,
	caches: {
		shell: 'kogakure-shell',
		pages: { name: 'kogakure-pages', limit: 150 },
		assets: { name: 'kogakure-assets', limit: 120 },
		fonts: { name: 'kogakure-fonts', limit: 80 },
		images: { name: 'kogakure-images', limit: 60 },
	},
};

const { caches: CACHES } = CONFIG;
const SHELL = `${CACHES.shell}-${CONFIG.version}`;

/** The runtime cache of a path, CacheFirst */
const RUNTIME = [
	['/_astro/', CACHES.assets],
	['/fonts/', CACHES.fonts],
	['/images/', CACHES.images],
];

/** The offline page of the language a path is in */
const offlinePath = (pathname) =>
	Object.entries(CONFIG.offline.prefixes).find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
	CONFIG.offline.fallback;

const isOfflinePage = (pathname) =>
	Object.values(CONFIG.offline.prefixes).includes(pathname) ||
	pathname === CONFIG.offline.fallback;

/** Keeps a cache within its limit: the oldest entries go first */
async function trim({ name, limit }) {
	const cache = await caches.open(name);
	const keys = await cache.keys();
	await Promise.all(
		keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key))
	);
}

/** Saves a response in a runtime cache, if it is a whole page or file of the site */
async function keep(request, response, cache) {
	// A redirected response may not answer a navigation: the browser would refuse it
	if (response.status !== 200 || response.type !== 'basic' || response.redirected) return;
	await (await caches.open(cache.name)).put(request, response);
	await trim(cache);
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(SHELL)
			// Past the HTTP cache: the shell of this deploy, not the last one
			.then((cache) =>
				cache.addAll(CONFIG.shell.map((url) => new Request(url, { cache: 'reload' })))
			)
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const name of await caches.keys())
				if (name.startsWith(`${CACHES.shell}-`) && name !== SHELL)
					await caches.delete(name);
			await self.registration.navigationPreload?.enable();
			await self.clients.claim();
			// The pages open before there was a worker are read too: save them
			const pages = await caches.open(CACHES.pages.name);
			for (const client of await self.clients.matchAll({ type: 'window' })) {
				const url = new URL(client.url);
				url.hash = '';
				if (url.origin !== location.origin || isOfflinePage(url.pathname)) continue;
				if (await pages.match(url.href, { ignoreVary: true })) continue;
				try {
					await keep(new Request(url.href), await fetch(url.href), CACHES.pages);
				} catch {
					// Offline already: it is saved the next time it is read
				}
			}
		})()
	);
});

/** NetworkFirst for pages, with the saved copy or the offline page as the fallback */
async function page(event) {
	const { request } = event;
	const { pathname } = new URL(request.url);
	const cached = caches.match(request, { cacheName: CACHES.pages.name, ignoreVary: true });
	const network = (async () => {
		const response = (await event.preloadResponse) ?? (await fetch(request));
		// A server error is no page: the saved copy is better
		if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
		if (!isOfflinePage(pathname))
			event.waitUntil(keep(request, response.clone(), CACHES.pages));
		return response;
	})();
	event.waitUntil(network.catch(() => {}));
	// A slow connection: the saved copy after the timeout, if there is one
	const timeout = new Promise((resolve) => setTimeout(resolve, CONFIG.timeout * 1000))
		.then(() => cached)
		.then((response) => response ?? network);
	try {
		return await Promise.race([network, timeout]);
	} catch {
		return (
			(await cached) ??
			(await caches.match(offlinePath(pathname), { cacheName: SHELL })) ??
			Response.error()
		);
	}
}

/** CacheFirst for the files named by their content */
async function file(event, cache) {
	const cached = await caches.match(event.request, { ignoreVary: true });
	if (cached) return cached;
	const response = await fetch(event.request);
	event.waitUntil(keep(event.request, response.clone(), cache));
	return response;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== location.origin) return;
	if (request.mode === 'navigate') {
		event.respondWith(page(event));
		return;
	}
	const runtime = RUNTIME.find(([prefix]) => url.pathname.startsWith(prefix))?.[1];
	if (runtime && !request.headers.has('range')) {
		event.respondWith(file(event, runtime));
		return;
	}
	// Everything else (the icons, the manifests, the search index): the network, then the shell
	event.respondWith(
		fetch(request).catch(
			async () => (await caches.match(request, { cacheName: SHELL })) ?? Response.error()
		)
	);
});
