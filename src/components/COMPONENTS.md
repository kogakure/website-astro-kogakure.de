# Components

Pages are built only from these components. Add every new component here, with its folder, purpose and props.

## `site/`: Astro components for the site's structure

| Component        | Purpose                                                                         | Props                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SkipLink.astro` | First focusable link; jumps to the main content                                 | `label` (required, localised), `target` (default `main`)                                                                                                                                             |
| `Picture.astro`  | An image of the manifest in its generated WebP widths; focus point as `--focus` | `src` (`/images/…` as in the texts), `alt`, `sizes` (`figure`, `band` or a value), `priority` (the opener); other `<img>` attributes pass through. Fails the build for an image outside the manifest |

## `book/`: Astro components for the book's pages

Unstyled until the design system arrives (SI-473).

| Component         | Purpose                                         | Props                                                                 |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `BookTitle.astro` | 木隠 as the page heading with the subtitle      | `subtitle` (localised)                                                |
| `Contents.astro`  | Table of contents: front matter, then the parts | `heading`, `introduction` (localised), `parts` (`getToc()`)           |
| `PageText.astro`  | Title, lede and the rendered text (slot)        | `title`, `excerpt`                                                    |
| `BookNav.astro`   | Previous and next page in the book order        | `label`, `previousLabel`, `nextLabel` (localised), `previous`, `next` |

## `ui/`: shadcn/ui on Base UI

None yet. Add with `pnpm dlx shadcn@latest add <name>` and restyle to the design tokens (no rounded corners, no cards).
