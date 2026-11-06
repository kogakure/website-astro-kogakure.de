# Fonts

Every face is self-hosted WOFF2 (no Google Fonts, for GDPR and speed), subset at build time to what the texts set. Like the images, the result is committed: Coolify only sees this repo.

## Generate

```sh
pnpm fonts            # after every content import; pnpm import:content runs it
pnpm fonts --force    # rewrite every file
```

`scripts/generate-fonts.ts` downloads the OFL sources of google/fonts at a pinned commit (checked by SHA-256, cached in `.cache/fonts/`, git-ignored), subsets them with `subset-font` (harfbuzz) and writes `public/fonts/*.woff2`, the licences to `public/fonts/licenses/` and `src/lib/fonts/manifest.json`. File names carry a hash of their content, so identical subsets (the kanji of most Latin editions) are one file. The characters come from `src/lib/fonts/text.ts`: the visible text of every page (title, excerpt, body without markup), the UI strings, the contents and the plates.

| Face                   | Sets                                         | Subsets                                                                      |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Source Serif 4         | Text and headings                            | Variable: upright opsz 20–60 and wght 400–700; italic pinned to opsz 20, 400 |
| IBM Plex Mono 400, 500 | Subtitles, labels (500: skip link, position) | Static                                                                       |
| Frank Ruhl Libre       | Hebrew                                       | Variable wght 400–700                                                        |
| Shippori Mincho        | Kanji in text; the text face of Japanese     | Static: 500 and 700 in the other languages, 400 and 700 in Japanese          |
| Noto Serif SC, KR      | The text face of Chinese and Korean          | Instanced to 400 and 700                                                     |
| Yuji Syuku             | Name plates and the kanji of margin glosses  | The plates, plus each page's gloss kanji                                     |

- **Latin, Cyrillic, Hebrew:** shared by all languages, one file per script and face: `core` (digits, punctuation), `basic` (A–Z), `latin` (the rest of Latin-1 and what the texts use beyond it), `cyrillic`, `hebrew`. A Russian page doesn't load Latin letters for a Roman numeral it doesn't set; a Japanese page only loads `core`.
- **Japanese, Chinese, Korean (and the kanji in other languages):** per language one `common` file with the characters on at least 30% of its pages, and per page one `page` file with exactly its other characters (no `unicode-range`: it holds only that page's characters). The bold files hold only what the page sets in bold (title, headings, `strong`, the glossary's terms).
- **OpenType features:** only kerning, ligatures, marks, locale forms, and for CJK the vertical forms (the plates) and the spacing browsers apply. Source Serif's small caps, fractions and figure sets would double its size.

## Use

`SiteHead.astro` (in `BaseLayout`) inlines the `@font-face` rules of the page (`fontFaceCss(lang, slug)`): the shared files, the language's and the page's own; a page outside the book gets the homepage's. It preloads the body face (`preloadFont(lang)`). Every face has `font-display: swap`; Source Serif 4 and IBM Plex Mono have size-adjusted local fallbacks (Georgia, Courier New) in the stacks, so the swap moves no line. Book pages pass their slug (`fontPage`). A page that quotes other pages declares their fonts too (`fontPages`: a language, and a slug for that page's own files); `/design-system/` does this for its paintings' captions and its German, Hebrew and Japanese samples.

## Budget

About 150 KB of fonts for the first page. `pnpm fonts` prints it per language for the homepage, the median and the largest article; the manifest keeps it (`budget`), and `fonts.test.ts` fails above 150 KB (Latin, Cyrillic, Hebrew) or 240 KB (CJK).

| Language      | Homepage | Median article | Largest (glossary) |
| ------------- | -------: | -------------: | -----------------: |
| de, en, es, … |   125 KB |         145 KB |             257 KB |
| ru            |   116 KB |         147 KB |             310 KB |
| he            |    62 KB |          72 KB |             229 KB |
| ja            |   158 KB |         158 KB |             367 KB |
| ko            |   153 KB |         158 KB |             353 KB |
| zh            |   230 KB |         227 KB |             445 KB |

CJK pages set several hundred distinct glyphs at about 0.2 KB each; Chinese also sets romaji in Latin. Two levers if that is too much, both design decisions: synthetic bold instead of the bold CJK files (about −25%), or the system's CJK serif first.

`fonts.test.ts` also fails when the manifest is older than the content or the UI strings: run `pnpm fonts`.
