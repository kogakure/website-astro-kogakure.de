# Directories

| Path                           | Contents                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/pages/`                   | Routes. Pages only compose layouts and components                                            |
| `src/layouts/`                 | Page shells (`BaseLayout.astro`: head, skip link, `<main>`)                                  |
| `src/components/site/`         | Astro components for the site's structure (skip link, top bar, colophon, …)                  |
| `src/components/ui/`           | shadcn/ui components on Base UI, restyled to the design tokens                               |
| `src/components/COMPONENTS.md` | Catalogue of all components                                                                  |
| `src/lib/`                     | Shared code (`utils.ts` with `cn()`)                                                         |
| `src/lib/book/`                | Book data: schemas, import transforms, validation, alternates map, `book.ts` for pages       |
| `src/lib/markdown/`            | HAST plugins for the texts                                                                   |
| `src/lib/images/`              | Image manifest (`manifest.json`, written by `pnpm images`) and its lookup (`images.ts`)      |
| `src/i18n/`                    | Languages, URL scheme (`routes.ts`) and UI strings (`ui.ts`) in twelve languages             |
| `src/content/`                 | Imported book (`book/`, `toc/`, `glossary/`); never edit by hand                             |
| `src/content.config.ts`        | Content collections `book`, `toc`, `glossary`                                                |
| `src/integrations/`            | Astro integrations (`validate-book.ts` fails the build on broken content)                    |
| `src/components/book/`         | Astro components for the book's pages (title, text, contents, previous/next)                 |
| `scripts/`                     | `import-content.ts`, `generate-images.ts`                                                    |
| `src/styles/global.css`        | Tailwind entry and design tokens                                                             |
| `src/test/`                    | Test helpers: `setup.ts`, `a11y.ts` (axe), `render.ts` (Astro container), `happy-dom-ssr.ts` |
| `tests/e2e/`                   | Playwright tests                                                                             |
| `public/`                      | Files copied as they are: generated images in `images/` (later: fonts, verification files)   |
| `docs/`                        | Topic docs for agents and contributors                                                       |
| `.claude/agents/`              | Project review agents                                                                        |
