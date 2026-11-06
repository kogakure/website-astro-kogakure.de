# Directories

| Path                           | Contents                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/pages/`                   | Routes. Pages only compose layouts and components                                            |
| `src/layouts/`                 | Page shells (`BaseLayout.astro`: head, skip link, `<main>`)                                  |
| `src/components/site/`         | Astro components for the site's structure (skip link, top bar, colophon, …)                  |
| `src/components/ui/`           | shadcn/ui components on Base UI, restyled to the design tokens                               |
| `src/components/COMPONENTS.md` | Catalogue of all components                                                                  |
| `src/lib/`                     | Shared code (`utils.ts` with `cn()`)                                                         |
| `src/styles/global.css`        | Tailwind entry and design tokens                                                             |
| `src/test/`                    | Test helpers: `setup.ts`, `a11y.ts` (axe), `render.ts` (Astro container), `happy-dom-ssr.ts` |
| `tests/e2e/`                   | Playwright tests                                                                             |
| `public/`                      | Files copied as they are (later: images, fonts, verification files)                          |
| `docs/`                        | Topic docs for agents and contributors                                                       |
| `.claude/agents/`              | Project review agents                                                                        |
