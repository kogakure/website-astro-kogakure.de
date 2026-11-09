# The ebook's covers and pages

Sources of the images the ebook's page shows (SI-504): `pnpm images` makes their WebP widths in `public/images/ebook/` like every other image (`docs/images.md`). They come from the kogakure-book repo, not from kogakure-texts or kogakure-ai-images.

| File                  | What it is                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| `<lang>/cover.jpg`    | The ebook's cover, `dist/<lang>/kogakure-<lang>-cover.jpg` (1600 × 2560)   |
| `<lang>/part.jpg`     | Spread: the scene of Part I and its title page (screen PDF, pages 19–20)   |
| `<lang>/chapter.jpg`  | Spread: the opener of the first chapter and its title page (pages 21–22)   |
| `<lang>/text.jpg`     | Spread: text with a figure and margin glosses (pages 23–24)                |
| `<lang>/glossary.jpg` | Spread: the glossary's first pages (German pages 498–499, English 484–485) |

The spreads were rendered from the screen PDFs of the release that kogakure-book's `dist/` held on 2026-11-09, at 144 dpi, two pages side by side, JPEG 90:

```sh
pdftoppm -f 19 -l 20 -r 144 -png dist/de/kogakure-de-screen.pdf /tmp/part
magick /tmp/part-*.png +append -strip -colorspace sRGB -quality 90 part.jpg
```

Render them again when the book's look changes; the page numbers are in kogakure-book's `build/<lang>/contents-screen.json`.
