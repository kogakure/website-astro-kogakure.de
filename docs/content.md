# Content

The book's texts live in the sibling repo `kogakure-texts` and are imported into this repo, because Coolify only sees this repo. Never edit `src/content/` by hand: change the text in kogakure-texts and import again.

## Import

```sh
pnpm import:content                      # from ../kogakure-texts
pnpm import:content path/to/kogakure-texts
```

`scripts/import-content.ts` reads `texts/new/<lang>/` of all twelve languages and writes:

| Source in kogakure-texts                  | Imported to                        |
| ----------------------------------------- | ---------------------------------- |
| `texts/new/<lang>/*.md` (77 per language) | `src/content/book/<lang>/*.md`     |
| `data/preface.json` + `data/toc.json`     | `src/content/toc/<lang>.json`      |
| `data/glossary.json` (760 entries)        | `src/content/glossary/<lang>.json` |

On the way it drops the `source` field, keeps the `<!-- WEBSITE-ONLY -->` parts (the website shows what the printed book skips) and rewrites image paths: `../../../images/new/<cat>/<name>.webp` → `/images/<cat>/<name>.webp`, `images/old/…` → `/images/old/…`. The path below `/images/` is the image's key in the image manifest (`docs/images.md`). The TOC items get the `translationKey` of their page.

The import is repeatable: rerunning it on unchanged texts produces no diff. It writes nothing if the book fails validation. `src/content/` is in `.prettierignore`: Prettier would rewrite the Chinese `*…*` emphasis.

## Validation

`src/lib/book/validate.ts` checks the whole book. The import runs it before writing; the build runs it again on the imported files (`src/integrations/validate-book.ts`) and fails on any error:

- frontmatter matches the schema (`src/lib/book/schema.ts`, also the content collection schema): unknown fields and categories are errors
- every language has every `translationKey`, once; translations use the English file name
- the twelve TOCs have the same parts and order; every book page is in it once, pages outside the book are not
- the twelve glossaries have the same entries in the same order
- every internal link leads to a route or a file in `public/` (the font zip is pending, SI-477)
- every image exists: in kogakure-texts for the import, in the image manifest and `public/images/` for the build

## Routes

`src/i18n/routes.ts` keeps the URLs of the old site:

| Language           | URL                             | Example                  |
| ------------------ | ------------------------------- | ------------------------ |
| German             | `/<german-slug>/`               | `/abhaertung/`           |
| English            | `/en/<slug>/`                   | `/en/toughening-up/`     |
| The 10 others      | `/<lang>/<english-slug>/`       | `/ja/toughening-up/`     |
| Homepages          | `/`, `/en/`, `/ja/`, …          |                          |
| Contents           | `/inhalt/`, `/<lang>/contents/` | `/en/contents/`          |
| 404 (outside book) | `/404.html`, `/<lang>/404/`     | nginx per prefix: SI-477 |

Titles in the front matter and the TOC mark break points as `&shy;`; the schema turns it into a soft hyphen (U+00AD), and `BaseLayout` drops it from `<title>` and the description.

The slug is the file name. Pages are matched across languages by `translationKey`, never by slug. Pages outside the book (`notFoundPage`) have their own route and are not in the TOC, the book order, previous/next, the sitemap or the search index: use `isInBook()`.

All of them come from the one rest route `src/pages/[...route].astro`. The parts of the book have no pages of their own: they are scenes on the homepage, and links lead to their anchor (`/#geschichte`, `/ja/#history`). The anchor comes from the part's title in the TOC, German for German and English for the rest, like the articles' slugs (`chapterSlug()`: `Organisation & Ausbildung` → `organisation-und-ausbildung`); the front matter is `einfuehrung` / `introduction`.

**Parts:** `getChapters(lang)` in `book.ts` gives the ten sections of the book (front matter, eight chapters, appendix) with their name plate, their scene (painting from `SCENES` in `plates.ts`, alt text and caption from the page that shows it) and their articles with ledes.

**Alternates map:** `buildAlternates()` (`src/lib/book/alternates.ts`) gives the URLs of all twelve language versions of every page, by `translationKey` (homepages: `home`, the contents: `contents`). Pages get it from `getAlternates()` in `src/lib/book/book.ts`, the only way pages access the book.

## Languages and UI strings

`src/i18n/languages.ts`: code, `htmlLang` (`pt-BR`, `zh-Hans`), name in the language itself, direction (Hebrew `rtl`). `src/i18n/ui.ts`: every interface string in twelve languages, with plurals by `Intl.PluralRules`. Book content (titles, part names, the 404 text) comes from kogakure-texts, never from `ui.ts`.

## Markdown

The texts stay `.md` with raw HTML. Astro renders them with Sätteri, `rawHtml: true` (figures and info boxes become real elements for the plugins) and no SmartyPants (the texts are typeset). HAST plugins in `src/lib/markdown/`, in this order:

| Plugin          | Does                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `heading-ids`   | Ids in every script, without Latin diacritics (`Kōga` → `koga`), unique per page                                                                                                                                                                                               |
| `glossed-terms` | `<em>term</em> (漢字, <q>…</q>)` in paragraphs → `span.gloss` (term, kanji, meaning)                                                                                                                                                                                           |
| `quotes`        | Writes the quotation marks of the language into `<q>` (`„…“`, `«…»`, `「…」`); CSS `quotes: none`                                                                                                                                                                              |
| `no-break-dash` | No-break space before a spaced dash; `noBreakDash()` for titles                                                                                                                                                                                                                |
| `figures`       | Figure images from the image manifest: generated file, `srcset`, `sizes`, size, lazy; the figure's `data-kind` (the image's folder) picks its ink edge: paintings rotate through all ten, everything else gets the gentlest, calligraphy and hand seals lose their black frame |
| `tables`        | `scope="col"` on the header cells of a table head                                                                                                                                                                                                                              |
| `banners`       | `aside.banner` → `role="note"`, named by its bold title                                                                                                                                                                                                                        |
| `reading-time`  | `minutesRead` in the frontmatter (Han and kana per character)                                                                                                                                                                                                                  |

Stateful plugins are factories: Sätteri calls them once per document. Modules that `scripts/import-content.ts` imports use relative imports with `.ts`, because Node runs the script without Vite.
