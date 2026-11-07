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
 *   assets, fonts
 *            CacheFirst: named by their content; a file of the shell is
 *            copied over, so the pages saved keep their styles and scripts
 *            when a deploy deletes its shell
 *   images   StaleWhileRevalidate: named by their source, so a painting
 *            made again keeps its name
 *
 * Each runtime cache has a limit of entries; the oldest go first.
 */
const CONFIG = /* CONFIG */ {
	version: 'dev',
	shell: [],
	offline: { fallback: '/offline/', prefixes: {} },
	timeout: 4,
	caches: {
		shell: 'kogakure-shell',
		pages: { name: 'kogakure-pages', limit: 150 },
		assets: { name: 'kogakure-assets', limit: 60 },
		fonts: { name: 'kogakure-fonts', limit: 80 },
		images: { name: 'kogakure-images', limit: 40 },
	},
};

const { caches: CACHES } = CONFIG;
const SHELL = `${CACHES.shell}-${CONFIG.version}`;

/** The runtime cache of a path, and whether a saved copy is fetched again */
const RUNTIME = [
	['/_astro/', CACHES.assets, false],
	['/fonts/', CACHES.fonts, false],
	['/images/', CACHES.images, true],
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
	// The pages' cache holds pages, not a sitemap or text file opened in a tab
	if (cache === CACHES.pages && !response.headers.get('content-type')?.includes('text/html'))
		return;
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
			// The pages open before there was a worker are read too: save them.
			// Fetches wait for the activation, so a slow connection gets no longer
			// than the timeout
			const pages = await caches.open(CACHES.pages.name);
			const clients = await self.clients.matchAll({ type: 'window' });
			await Promise.all(
				clients.map(async (client) => {
					const url = new URL(client.url);
					url.hash = '';
					if (url.origin !== location.origin || isOfflinePage(url.pathname)) return;
					if (await pages.match(url.href, { ignoreSearch: true, ignoreVary: true }))
						return;
					try {
						const signal = AbortSignal.timeout(CONFIG.timeout * 1000);
						await keep(
							new Request(url.href),
							await fetch(url.href, { signal }),
							CACHES.pages
						);
					} catch {
						// Offline or slow: it is saved the next time it is read
					}
				})
			);
		})()
	);
});

/** NetworkFirst for pages, with the saved copy or the offline page as the fallback */
async function page(event) {
	const { request } = event;
	const { pathname } = new URL(request.url);
	// A link with a query (?utm_source) is the same page
	const cached = caches.match(request, {
		cacheName: CACHES.pages.name,
		ignoreSearch: true,
		ignoreVary: true,
	});
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

/** CacheFirst, or StaleWhileRevalidate with `revalidate`, for the files of the site */
async function file(event, cache, revalidate) {
	const { request } = event;
	const fetchAndKeep = () =>
		fetch(request).then((response) => {
			event.waitUntil(keep(request, response.clone(), cache));
			return response;
		});
	const kept = await caches.match(request, { cacheName: cache.name, ignoreVary: true });
	if (kept) {
		if (revalidate) event.waitUntil(fetchAndKeep().catch(() => {}));
		return kept;
	}
	// The shell's copy goes into the runtime cache: the shell is gone after the next deploy
	const shell = await caches.match(request, { cacheName: SHELL, ignoreVary: true });
	if (shell) {
		event.waitUntil(keep(request, shell.clone(), cache));
		return shell;
	}
	return fetchAndKeep();
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== location.origin) return;
	if (request.mode === 'navigate') {
		event.respondWith(page(event));
		return;
	}
	const runtime = RUNTIME.find(([prefix]) => url.pathname.startsWith(prefix));
	if (runtime && !request.headers.has('range')) {
		event.respondWith(file(event, runtime[1], runtime[2]));
		return;
	}
	// Everything else (the icons, the manifests, the search index): the network, then the shell
	event.respondWith(
		fetch(request).catch(
			async () => (await caches.match(request, { cacheName: SHELL })) ?? Response.error()
		)
	);
});
