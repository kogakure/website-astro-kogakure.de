# The book as an app

The book installs as an app (iOS, Android, desktop) and stays readable offline (SI-480). The pieces: the icons, the manifests, the head, the offline pages and the service worker.

## Icons and launch screens

`pnpm icons` (`scripts/generate-icons.ts`) draws every icon from the 木隠 name plate of `NamePlate.astro`: shoji paper, the heavy sumi frame with its inner hairline, the kanji in Yuji Syuku as paths (from the font source of `pnpm fonts`, `scripts/font-sources.ts`), so no font is needed to show them. The files are committed in `public/`, like the images and fonts; run the script again when the plate or the devices change.

| File                       | What it is                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `favicon.svg`              | The plate alone, light and dark by the system (`prefers-color-scheme` in the SVG)    |
| `favicon.ico`              | 16, 32 and 48 px of the light plate, for the browsers without SVG and `/favicon.ico` |
| `apple-touch-icon.png`     | 180 px, the plate on washi (iOS also asks for this path without a link)              |
| `icons/icon-{192,512}.png` | The manifest's icons (`any`)                                                         |
| `icons/maskable-*.png`     | The same, the plate inside the safe zone (a circle of 80%)                           |
| `icons/launch/*.png`       | The iOS launch screens: the plate on washi or Aizome, per device, light and dark     |

The devices are `DEVICES` in `src/lib/pwa/pwa.ts`: iOS shows a launch screen only for an exact match of screen size, pixel ratio and orientation (iPads in both). The head names them with `media` queries that include `prefers-color-scheme`. A new iPhone needs a new line there and `pnpm icons`.

## Manifests

One manifest per language, `/manifest.webmanifest` and `/<lang>/manifest.webmanifest` (`manifest()` in `src/lib/pwa/pwa.ts`): the same app (`id: '/'`), named 木隠 Kogakure (on the home screen 木隠), starting on the homepage of the language it was installed from, with the language's description, `lang` and `dir`. Its colours are the washi of the light mode; in the browser, `theme-color` follows the mode (`SiteHead.astro`, `mode-client.ts`).

## The head

`SiteHead.astro` links the favicons, the touch icon, the language's manifest and the launch screens, and in the built site (`import.meta.env.PROD`) registers `/sw.js` after `load`. In `pnpm dev` there is no service worker.

## Offline pages

`/offline/` and `/<lang>/offline/` (`OfflinePage.astro`): the bare plate 圏外 (what a Japanese phone shows without a signal), why the page is missing, „Erneut versuchen“ (a link to the page's own URL: the service worker shows the offline page in the place of the page asked for) and the pages saved on the device in the page's language, the last read first (`SavedPages.astro`, which reads the service worker's page cache). The interface strings are `offline*` in `src/i18n/ui.ts`. Not in the sitemap, the search index or the book.

## The service worker

`src/integrations/pwa.ts` writes `dist/sw.js` after the build from `src/integrations/sw.js`, its `CONFIG` filled in: the shell, the version (a hash of the shell's files), the offline pages by language prefix, the caches (`src/lib/pwa/caches.ts`).

| Cache                      | What                                                                                                   | Strategy                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `kogakure-shell-<version>` | The twelve offline pages, their styles and scripts, the colophon's ink, icons, manifests (some 700 KB) | Precached on install; one per deploy, the old one deleted when the new worker takes over    |
| `kogakure-pages`           | The pages read, up to 150                                                                              | NetworkFirst; the saved copy without a connection or after 4 seconds; else the offline page |
| `kogakure-assets`          | `/_astro/`, up to 120                                                                                  | CacheFirst (named by their content)                                                         |
| `kogakure-fonts`           | `/fonts/`, up to 80                                                                                    | CacheFirst (named by their content)                                                         |
| `kogakure-images`          | `/images/`, up to 60                                                                                   | CacheFirst                                                                                  |

The limits keep the budget small (the site has some 300 MB of paintings); the oldest entries go first. The page the reader opened before the worker was there is saved when it takes over. The search (`/pagefind/`) needs a connection; without one its dialog says so.

**Updates:** nginx serves `/sw.js` no-cache, so the browser finds a new worker on the next visit. A deploy that changes the shell is a new worker; it installs, takes over at once (`skipWaiting`, `clients.claim`) and deletes the old shell. Pages always come from the network first, so no deploy leaves a reader on a stale page while online.

## Testing

`tests/e2e/pwa.spec.ts` (with the service worker allowed; `playwright.config.ts` blocks it everywhere else, since it would answer requests `page.route()` never sees): a page read opens offline, a page never read shows the offline page of its language, Chromium finds the book installable (`Page.getInstallabilityErrors`), every icon and launch screen exists, no page asks for a missing file. To try it by hand: `pnpm build && pnpm preview`, DevTools › Application.
