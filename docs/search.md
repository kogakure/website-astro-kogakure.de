# Search

A quiet search across the book in every language, with [Pagefind](https://pagefind.app/) (SI-479). There is no navigation bar: „Suche“ sits in the article's top bar (also when it comes back on scroll up), in the contents (the homepage's and `/inhalt/`), on the 404 page and on `/design-system/`, and `/` opens it on every page (not in a field, not while a dialog is open). The design: DESIGN.md › Components › Search.

## The index

`src/integrations/search.ts` runs Pagefind (Node API) after the build and writes `dist/pagefind/` (without Pagefind's own search interfaces, which nothing loads):

- **Articles:** only pages with `data-pagefind-body` are indexed. `BaseLayout` sets it on `<main>` when a template passes `search={{ chapter }}`; only `ArticlePage.astro` does, so the homepages, the contents, the legal pages, the 404 pages and `/design-system/` are not in the index. The chapter becomes the result's `chapter` meta (`data-pagefind-meta="chapter[data-chapter]"`, an attribute, since a title may hold a comma). The title is the page's `h1`.
- **Left out:** `nav` (section list, previous and next), everything `aria-hidden` (plate kanji, the repeated term of a margin gloss), and elements marked `data-pagefind-ignore` (the opener's facts, the glossary's entries). `EXCLUDED` in `src/lib/search/search.ts`.
- **Glossary entries:** each of the 760 entries per language is a result of its own (`glossaryRecords()` in `src/lib/search/records.ts`): the term with its kanji as the title, the glossary as its chapter, linking to its anchor (`/glossar/#kunoichi`).
- **Languages:** Pagefind splits the index by `<html lang>`, lower-cased (`pt-br`, `zh-hans`), and the browser loads the index of the page's language, so a search only finds pages in it. The npm package runs Pagefind's extended binary, which segments Japanese and Chinese.

## The dialog

`Search.astro` (in `BaseLayout`) renders `SearchDialog.tsx` with `client:search`, a client directive of our own (`src/integrations/search-directive.ts`): React, Base UI and the dialog load only when a `[data-search-trigger]` button (`SearchButton.astro`) is clicked or `/` is pressed, and `pagefind.js` only when the dialog opens. Nothing of the search is preloaded.

The dialog is `src/components/ui/dialog.tsx` (shadcn/ui on Base UI, restyled to the tokens): focus trapped and returned, Escape and a click outside close it, the scroll is locked. In it: the field, a live status („12 Treffer“, or „Die Suche ist gerade nicht erreichbar.“ when Pagefind can't load), ten results at a time (title, chapter, Pagefind's excerpt with the words found in `<mark>`) and „Weitere Treffer“, which hands the focus to the first new result. The arrows move between the field and the results; Enter in the field opens the first result, but only once the results are those of what the field says, and not while an input method (Japanese, Chinese, Korean) is composing. If the dialog's script fails to load, the next click or `/` tries again. A chosen result opens once the dialog has closed, so an anchor on the same page (the glossary) scrolls.

It counts one `search` event per search (`lang`, number of results; never the words), when the dialog closes (`docs/seo.md`).

## Development

There is no index before a build. In `pnpm dev`, `/pagefind/` serves the index of the last build from `dist/pagefind/`; without one, `pagefind.js` is a stub that finds nothing. To search the current texts, run `pnpm build` once (or test against `pnpm preview`).

## Reading time

The `reading-time` Markdown plugin writes `minutesRead` into each article's frontmatter (Han and kana per character, 500 a minute; everything else per word, 220 a minute). `ArticlePage.astro` shows it as a fact of the opener („Lesezeit 5 Min.“, `t.readingTime` and `t.minutes()`), except on the glossary, whose entries are not in its text.
