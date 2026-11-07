# Commands

| Command               | What it does                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`            | Dev server on http://localhost:4321; the search uses the last build's index, or finds nothing without one (`docs/search.md`)       |
| `pnpm import:content` | Imports the book from `../kogakure-texts` into `src/content/` (`docs/content.md`), then runs `pnpm fonts`                          |
| `pnpm fonts`          | Subsets the fonts to what the texts set: `public/fonts/` and the font manifest (`docs/fonts.md`)                                   |
| `pnpm icons`          | Draws the favicons, app icons and iOS launch screens from the name plate into `public/` (`docs/pwa.md`)                            |
| `pnpm images`         | Generates the WebP sizes, OG images and ink assets into `public/images/` (`docs/images.md`)                                        |
| `pnpm build`          | Static build into `dist/`, then the search index into `dist/pagefind/` and the service worker into `dist/sw.js`                    |
| `pnpm preview`        | Serves `dist/` (Astro 7 runs it in the foreground; `--background`, `astro preview stop` and `status` exist)                        |
| `pnpm check`          | `astro check` + Oxlint + Prettier check (the CI gate)                                                                              |
| `pnpm format`         | Formats everything with Prettier                                                                                                   |
| `pnpm lint:fix`       | Oxlint with fixes                                                                                                                  |
| `pnpm test`           | Vitest: unit and Astro component tests                                                                                             |
| `pnpm test:watch`     | Vitest in watch mode                                                                                                               |
| `pnpm test:coverage`  | Vitest with coverage (`coverage/`)                                                                                                 |
| `pnpm test:e2e`       | Playwright against the built site (run `pnpm build` first)                                                                         |
| `pnpm docker:build`   | Builds the production image `kogakure-local`                                                                                       |
| `pnpm docker:run`     | Serves the image on http://localhost:8080                                                                                          |
| `pnpm check:old-urls` | Every URL of the old site answers 200 or a 301 to the right page (`docs/seo.md`); against `http://localhost:8080` or the URL given |

Before a pull request: `pnpm check && pnpm test && pnpm build && pnpm test:e2e`.

The first time, install the Playwright browser: `pnpm exec playwright install chromium`.
