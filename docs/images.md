# Images

Astro's image module would be too slow for this many images, so `pnpm images` generates them once and the result is committed (plain git, no LFS). The build processes no images (`passthroughImageService`).

## Generate

```sh
pnpm import:content   # first: the script reads which images the texts use
pnpm images           # from ../kogakure-texts, ../kogakure-ai-images, ../kogakure-prototyping
pnpm images --force   # regenerate everything
```

`scripts/generate-images.ts` (sharp) reads the sibling repos and writes `public/images/` and `src/lib/images/manifest.json`:

| Source                                                                                  | Generated                                  |
| --------------------------------------------------------------------------------------- | ------------------------------------------ |
| `kogakure-texts/images/new/mapping.csv` → original in `kogakure-ai-images/assets/**`    | `images/<key>-<width>.webp`                |
| `kogakure-texts/images/old/**` (the old screenshots of Chronology and Downloads)        | `images/old/<key>-<width>.webp`            |
| The opener of every page, at its focus point                                            | `images/og/<translationKey>.jpg`, 1200×630 |
| `kogakure-prototyping/prototypes/gekiga-2-modes/assets/ink/*.webp` (masks, dividers, …) | `images/ink/*.webp`, as they are           |
| `assets/ebook/<lang>/*.jpg` in this repo: the book's covers and spreads (SI-504)        | `images/ebook/<lang>/<name>-<width>.webp`  |

Only images the imported texts use are generated. The original is the `*-ai-NN-selected.png` of `mapping.csv`; where it is narrower than a width, its 2× upscale `*-ai-NN-upscaled.png` (local only, not in git) is the source. Nothing is enlarged past its largest source. A source between two widths (the old screenshots) also keeps its own width, unless it is less than 20% wider than the last width it reaches.

| Width | Images                                                                             |
| ----: | ---------------------------------------------------------------------------------- |
|   800 | all                                                                                |
|  1400 | all (except old screenshots narrower than that)                                    |
|  2000 | all new images (the ebook's only where they are that wide: the covers are 1600)    |
|  2750 | paintings (`article/`, `historical/`) at least that wide: the opener and the bands |

WebP quality 72, effort 6: these widths are only shown at 2× density, where the paper texture looks the same as at 80 and the files are about a quarter smaller. OG images are JPEG (quality 82, mozjpeg), because not every network previews WebP.

The manifest keeps a hash of each source (the original's content, the upscale's size and time) and the settings: a rerun only regenerates what changed. Changing the settings in the script regenerates everything. When the manifest changes, the script clears Astro's content cache, which would otherwise keep figures rendered with the old manifest.

`public/images/` belongs to the script: it deletes every file there that it doesn't generate. If that is more than a fifth of the files (an incomplete import?), it stops; `--force` deletes them anyway.

## Manifest

An image's key is its URL path below `/images/`, as the texts use it: `/images/kamae/ichimonji.webp` → `kamae/ichimonji.webp`. Per image: size of the original, `aspect`, `focus` (`object-position` from the `focus` column of `mapping.csv`), the generated `widths` and the `hash`. Also `og` (by `translationKey`) and `ink` (by file name).

`src/lib/images/images.ts` reads it: `getImage(url)` (src, srcset, size, focus), `findOpener(urls)`, `getOgImage(translationKey)`, `inkFile(name)`, `SIZES`.

## Use

- **Texts:** the `figures` Markdown plugin replaces the `src` of every figure with the generated file and adds `srcset`, `sizes`, `width`, `height`, `loading="lazy"`.
- **Pages:** `Picture.astro` (`src/components/site/`). `priority` for the opener (eager, `fetchpriority="high"`), everything else lazy. `sizes="band"` for the opener and full-width bands, `figure` (default) for figures. A focus point becomes `--focal` (not `--focus`, the focus ring's colour); the image's `object-position` is `var(--focal, 50% 50%)`, and layouts that crop differently set their own fallback.
- **Opener:** the article's first painting (`article/`, `historical/`); diagrams, objects and technique images don't open an article.

The build fails if the texts use an image that isn't in the manifest or whose files are missing in `public/images/` (`src/integrations/validate-book.ts`).
