# Testing

## Vitest projects (`vitest.config.ts`)

| Project | Files                    | Environment                                                      |
| ------- | ------------------------ | ---------------------------------------------------------------- |
| `unit`  | `src/**/*.test.{ts,tsx}` | Node (add `// @vitest-environment happy-dom` for DOM tests)      |
| `astro` | `src/**/*.astro.test.ts` | `src/test/happy-dom-ssr.ts`: happy-dom with Vite's SSR transform |

The `astro` project uses Astro's Vite config (`getViteConfig`). Its environment is happy-dom, so axe has a DOM, but code is transformed for SSR: the Astro container needs the server build of `.astro` files, and the plain `happy-dom` environment would compile them for the client.

## Markdown plugin tests

`renderMarkdown(markdown, plugins, lang)` from `src/test/markdown.ts` renders like a book page of `lang`, with only the given plugins.

## Astro component tests

```ts
import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import SkipLink from './SkipLink.astro';

const html = await renderAstro(SkipLink, { label: 'Zum Inhalt springen' });
const violations = await axeViolations(html);
expect(violations, describeViolations(violations)).toHaveLength(0);
```

Every component gets a test for its output and one for accessibility. `axeViolations` turns off iframe scanning and the `region` rule (it only makes sense for whole pages).

## End-to-end tests

Playwright (`playwright.config.ts`) builds nothing itself: it serves `dist/` with `astro preview --port 4329 --ignore-lock`, so it never reuses another dev server or trips over Astro's preview lock. Projects: `desktop` (Chrome) and `mobile` (Pixel 7).

- **Accessibility:** every page type in German, Hebrew and Japanese gets an axe scan with `@axe-core/playwright`, by day and by night (`templates.spec.ts`), the legal pages, the design system and the search dialog theirs.
- **Budgets** (`budgets.spec.ts`): every page type in seven languages, measured in the browser as it loads: JavaScript (10 KB), fonts (230 KB, 380 KB in CJK; the glossary 330 KB and 530 KB) and the image that is the largest contentful paint (500 KB). The limits are at the top of the file. The search loads its code only when it is opened, so it counts for no page.
- **Print** (`print.spec.ts`): an article prints in day colours on white, without bars and switches, at rest, every figure loaded and kept with its caption, links with their address.

## Screenshot tests

`tests/screenshots/` locks the look of every page type (home, article, chapter, contents, glossary, 404) in German, English, Hebrew and Japanese, by day and by night, on desktop and mobile: 96 screenshots of the first screen; a chapter is its scene on the homepage. Reduced motion, so every page is at rest.

The browser runs in the official Playwright image of the installed version (`mcr.microsoft.com/playwright:v<version>-noble`), so the baselines are rendered on Linux on a Mac and in CI alike. `scripts/screenshots.ts` starts it as a `run-server`, runs `playwright test --config playwright.screenshots.config.ts` here against it and stops it; the browser reaches the preview server (port 4349, always started fresh) through Playwright's tunnel. Docker must run.

```sh
pnpm build
pnpm test:screenshots                     # compare with the baselines
pnpm test:screenshots --update-snapshots  # after a change of the look: new baselines
```

The baselines are in `tests/screenshots/__screenshots__/<project>/`. Look at every changed one before committing it. After an update of `@playwright/test`, the image changes with it: new baselines.

## Lighthouse

Unlighthouse (`unlighthouse.config.ts`) runs Lighthouse on every page type in German, English, Hebrew, Japanese and Chinese against the production image, which compresses and caches as the live site does. Mobile with simulated throttling, one page at a time, in a German browser (elsewhere the first visit to `/` goes on to its language). It needs Google Chrome.

```sh
pnpm docker:build && pnpm docker:run   # in a second terminal
pnpm lighthouse                        # mobile
pnpm lighthouse --desktop
```

The report is in `.unlighthouse/` (`npx sirv-cli .unlighthouse` to look at it; `ci-result.json` has every score). `--desktop` runs on Lighthouse's own desktop network (10 Mbit/s, 40 ms); Unlighthouse alone would put a desktop on the phone's slow 4G.

Scores of SI-481 (54 pages):

| Category       | Mobile | Desktop |
| -------------- | -----: | ------: |
| Performance    | 78–100 |  94–100 |
| Accessibility  |    100 |     100 |
| Best practices |    100 |     100 |
| SEO            |  63–69 |   63–69 |

Exceptions to 100:

- **SEO** on the legal, 404 and offline pages: they stay `noindex` (`docs/seo.md`). Against the Docker image on localhost every page gets `X-Robots-Tag: noindex` from nginx, since only www.kogakure.de is indexed.
- **Performance on a phone, on every page whose largest paint is a painting** (78–91; the homepages and the contents score 98–100, they paint text first). On slow 4G Lighthouse estimates the painting at 3.5–6 s, not because of the painting (the imprint's is 60 KB at the 800 px a phone loads, and still lands at 4.9 s), but because its estimate counts the files of high priority that are requested before the painting appears: the page's fonts (150–300 KB) and the ink masks Chrome asks for at once as the styles are applied: the edge of the opener (50–115 KB), the brush sweep (133 KB) and the first section divider (30–56 KB, 900 px wide for a stroke of about 10rem; the dividers further down come at low priority). Nothing blocks: total blocking time 0 ms, layout shift 0. On a desktop the same pages score 94–99. The levers, each a design decision of its own: masks the size they are shown at (the dividers at about 480 px), a small subset for the language names in the language menu (the German pages load the Cyrillic and Hebrew files, 54 KB, for „Русский“ and „עברית“), and a crop of the band for the opener instead of the whole painting (Abhärtung: 472 KB at 1400 px, what a phone with a denser screen loads).
