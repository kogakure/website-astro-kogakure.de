# Testing

## Vitest projects (`vitest.config.ts`)

| Project | Files                    | Environment                                                      |
| ------- | ------------------------ | ---------------------------------------------------------------- |
| `unit`  | `src/**/*.test.{ts,tsx}` | Node (add `// @vitest-environment happy-dom` for DOM tests)      |
| `astro` | `src/**/*.astro.test.ts` | `src/test/happy-dom-ssr.ts`: happy-dom with Vite's SSR transform |

The `astro` project uses Astro's Vite config (`getViteConfig`). Its environment is happy-dom, so axe has a DOM, but code is transformed for SSR: the Astro container needs the server build of `.astro` files, and the plain `happy-dom` environment would compile them for the client.

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

Playwright (`playwright.config.ts`) builds nothing itself: it serves `dist/` with `astro preview --port 4329 --ignore-lock`, so it never reuses another dev server or trips over Astro's preview lock. Projects: `desktop` (Chrome) and `mobile` (Pixel 7). Every page type gets an axe scan with `@axe-core/playwright`. Screenshot tests follow in SI-481.
