---
name: 木隠 Kogakure
description: A German book about the ninja and ninjutsu, opened like an ink prologue and read on calm paper, by day on washi and by night on indigo.
colors:
  washi: "#f3efe6"
  shoji: "#faf8f4"
  sumi: "#16110c"
  sumi-brown: "#33261a"
  umber: "#5a3b1e"
  ochre: "#9a7444"
  ochre-pale: "#d3bb8f"
  seal: "#a3301c"
  aizome: "#111a25"
  aizome-read: "#152030"
  aizome-band: "#0a1019"
  aizome-ink: "#070c13"
  aizome-hover: "#1b2a3c"
  aizome-press: "#233650"
  kinari: "#e3dccb"
  kinari-plate: "#e6dfcf"
  kinari-subtitle: "#ebe5d6"
  gofun: "#dcd6c8"
  ash: "#bdb8ab"
  slate: "#8e9aa8"
  mist-blue: "#9fb0c3"
  khaki-gold: "#c4b283"
  indigo-wash: "#34557c"
  indigo-line: "#4b6585"
  indigo-link: "#5d7896"
  indigo-select: "#2f4a6b"
  plate-ink-night: "#0e1620"
  seal-night: "#cf4a2e"
typography:
  display:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Shippori Mincho, Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, Georgia, serif"
    fontSize: "clamp(2.6rem, 1.6rem + 4vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Shippori Mincho, Georgia, serif"
    fontSize: "clamp(2.2rem, 1.5rem + 2.6vw, 3.6rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Shippori Mincho, Georgia, serif"
    fontSize: "clamp(1.6rem, 1.3rem + 1vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  lede:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Shippori Mincho, Georgia, serif"
    fontSize: "clamp(1.3rem, 1.1rem + 0.6vw, 1.6rem)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Shippori Mincho, Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, Georgia, serif"
    fontSize: "clamp(1.25rem, 1.15rem + 0.35vw, 1.34375rem)"
    fontWeight: 400
    lineHeight: 1.62
  caption:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Shippori Mincho, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, Frank Ruhl Libre, Shippori Mincho, Hiragino Mincho ProN, ui-monospace, monospace"
    fontSize: "clamp(0.9375rem, 0.88rem + 0.2vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 2
  plate:
    fontFamily: "Yuji Syuku, Shippori Mincho, Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif"
    fontSize: "clamp(1.75rem, 1rem + 3.2vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.06em"
  kanji:
    fontFamily: "Shippori Mincho, Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif"
    fontWeight: 500
rounded:
  hairline: "1px"
spacing:
  gutter: "clamp(1.25rem, 5vw, 4rem)"
  measure: "32.5em"
  page: "86rem"
  scene: "clamp(4.5rem, 9vw, 8rem)"
  section: "2.6em"
  list-gap: "1.75rem"
components:
  name-plate:
    backgroundColor: "{colors.shoji}"
    textColor: "{colors.sumi}"
    typography: "{typography.plate}"
    padding: "0.28em 0.55em 0.28em 0.42em"
  name-plate-night:
    backgroundColor: "{colors.kinari-plate}"
    textColor: "{colors.plate-ink-night}"
  subtitle:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.shoji}"
    typography: "{typography.label}"
    padding: "0.28em 0.7em"
  subtitle-night:
    backgroundColor: "{colors.aizome-ink}"
    textColor: "{colors.kinari-subtitle}"
  article-entry-hover:
    backgroundColor: "{colors.shoji}"
    textColor: "{colors.sumi}"
    padding: "0.75rem"
  article-entry-hover-night:
    backgroundColor: "{colors.aizome-hover}"
    textColor: "{colors.kinari}"
  colophon-band:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.shoji}"
    padding: "3.5rem {spacing.gutter} 4rem"
  colophon-band-night:
    backgroundColor: "{colors.aizome-band}"
    textColor: "{colors.kinari}"
  mode-option:
    textColor: "{colors.ochre-pale}"
    rounded: "{rounded.hairline}"
    padding: "0.5em 0.8em"
  mode-option-selected:
    backgroundColor: "{colors.ochre-pale}"
    textColor: "{colors.sumi}"
  top-bar:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.sumi}"
    height: "2.75rem"
  seal-mark:
    backgroundColor: "{colors.seal}"
    rounded: "{rounded.hairline}"
    size: "0.62em"
---

# Design System: 木隠 Kogakure

Extracted from the prototype `prototypes/gekiga-2-modes` (Gekiga 劇画, light and dark) in kogakure-prototyping, the winner of the design exploration (SI-319; the decision and how it was reached: `research/decisions.md` there). Ported to this site in SI-473: the tokens in `src/styles/`, the components in `src/components/` (catalogue: `src/components/COMPONENTS.md`), every token and component on `/design-system/`. When this file and the prototype disagree, the prototype's behaviour is the evidence, and this file is corrected.

**Modes.** Every colour role has a day value (Washi) and a night value (Aizome), written once as `light-dark(<day>, <night>)` and resolved by `color-scheme`. The page follows the system; a stored choice (`data-mode="light" | "dark"` on `<html>`, applied before first paint) pins it. In the tokens above, the night values carry their own names; `-night` components are the same component on Aizome.

## Overview

**Creative North Star: "The Ink Prologue"**

The book opens the way the ink prologue of a film opens: scene by scene, each part of the book a toned painting cut by a wet ink edge, named by a vertical name plate (tanzaku) in brush kanji, with one line beneath it like a subtitle. Then the page turns into a book: calm paper, a reading column set like a printed page, figures with an ink edge, Japanese terms glossed in the margin. The drama lives in the ink, never in the figures: no throwing stars, no masks, no blood, no splatter fields. The narrator of the texts is calm and factual, and the page around them is too.

By day it is sumi ink and text on washi, with ochre washes and one seal red. By night the ink turns into a light pigment on indigo cloth (Aizome): unbleached text, khaki-gold headings, the brush in gofun white over a lighter indigo wash, lit paper plates. Both modes share one set of colour roles, so a component never knows which mode it is in.

Motion is ink too, and it runs once: a plate blooms out of its ink edge when it comes into view, the vortex of the prologue drifts and comes to rest, the next page spreads like wet ink from where the reader clicked. Nothing loops, nothing is tied to the scroll position.

**Key Characteristics:**

- Two surfaces: the prologue (homepage, the article's opener) is cinematic; the reading column is a printed page.
- Name plates (tanzaku) carry chapter identity in brush kanji, always vertical.
- Paintings are cut by wet ink edges (ten edge masks), never by rectangles or circles.
- One accent, the seal red, as a mark only: the reading position, a readable article, the skip link.
- Day (Washi) and night (Aizome) are two materials, not an inverted palette.
- German long-form first: 20–21.5px text, about 69 characters per line, hyphenation, and Japanese set with care (margin glosses, CJK fallbacks, macrons).
- Motion once, on entry or on interaction; static with reduced motion; everything visible without JavaScript.
- Logical properties throughout, so a right-to-left edition (Hebrew) mirrors without overrides.

## Colors

Ink and paper, an ochre wash in two strengths and one seal red by day; indigo cloth, unbleached thread and a khaki gold by night.

### Primary

- **Seal Red** (day `{colors.seal}`, night `{colors.seal-night}`): the hanko. Marks the reading position in the section list, the start of a readable article, the "Lesen" link and the skip link's focus ring. Never text, never a fill larger than a seal (3.65:1 on Aizome).

### Secondary

- **Ochre Wash** (`{colors.ochre}`): the wet wash under the black ink of the vortex and the brushstroke sweep (at 55% opacity), link underlines and rules on washi. A wash, not a text colour (3.69:1 on washi).
- **Pale Ochre** (`{colors.ochre-pale}`): text selection, the pressed state, labels on the sumi band (10:1 there).
- **Indigo Wash** (`{colors.indigo-wash}`, night): the ochre's night counterpart under the gofun ink (at 70%), the chapter number on name plates, the subtitle edge.
- **Khaki Gold** (`{colors.khaki-gold}`, night): headings on Aizome (7.8–8.4:1). By day headings are sumi.

### Neutral

- **Washi** (`{colors.washi}`): the paper of both pages by day. Slightly cool cream, a little less yellow than a warm cream.
- **Shoji** (`{colors.shoji}`): the paper of the name plates, the lifted hover box of a readable article, the text on the sumi band and in subtitles.
- **Sumi** (`{colors.sumi}`): body text, headings, the brush ink, the frame of the name plates, the subtitle boxes and the colophon band (16.4:1 on washi).
- **Sumi Brown** (`{colors.sumi-brown}`): secondary text: excerpts, captions, section links (12.8:1).
- **Umber** (`{colors.umber}`): tertiary text: credits, labels, the chapter number on plates (8.8:1).
- **Aizome** (`{colors.aizome}`) and **Aizome Read** (`{colors.aizome-read}`): the night ground of the homepage and the slightly lighter one of the reading page; with a stone grain (two SVG turbulence tiles at 5.5%).
- **Kinari** (`{colors.kinari}`): night body text (12.8:1 on Aizome, 12:1 on Aizome Read); **Ash** (`{colors.ash}`) and **Slate** (`{colors.slate}`) its secondary and tertiary steps (Slate is the lowest measured text contrast, 6.1:1).
- **Gofun** (`{colors.gofun}`): the brush ink by night (vortex, sweep, dividers).
- **Kinari Plate** (`{colors.kinari-plate}`) with **Plate Ink Night** (`{colors.plate-ink-night}`): name plates by night, lit paper with dark ink.
- Night band and subtitle: **Aizome Band** (`{colors.aizome-band}`), **Aizome Ink** (`{colors.aizome-ink}`), **Kinari Subtitle** (`{colors.kinari-subtitle}`), **Mist Blue** (`{colors.mist-blue}`), **Indigo Line** (`{colors.indigo-line}`); states: **Aizome Hover** (`{colors.aizome-hover}`), **Aizome Press** (`{colors.aizome-press}`), **Indigo Select** (`{colors.indigo-select}`), **Indigo Link** (`{colors.indigo-link}`).

The paintings keep their natural colour; by night they are dimmed a little (`brightness(0.9) saturate(0.92)`). The browser toolbar colour follows the ground of the page in each mode. Print pins day colours on white paper and sets the text at a book page's size, about 11pt (the 20px floor is for screens).

### Named Rules

**The One Seal Rule.** Seal red appears only as a seal: a small square mark or a 2px line on top of a readable article. If a second red element appears on a screen, one of them is wrong.

**The Wash Is Not Ink Rule.** Ochre and indigo washes never carry text. Body text never sits on a wash or on a painting; the only text on a painting is a subtitle, in its own dark box.

**The One Role, Two Materials Rule.** A colour is defined once, as a role with a day and a night value. Components use roles (`--text`, `--plate`, `--seal`), never mode-specific values.

## Typography

**Text and headings:** Source Serif 4 (optical sizes; fallback Frank Ruhl Libre, then the Japanese serifs, Georgia)
**Kanji in text:** Shippori Mincho (fallback Hiragino Mincho ProN, Yu Mincho, Noto Serif JP)
**Name plates and margin glosses:** Yuji Syuku (brush)
**Subtitles and small labels:** IBM Plex Mono

**Character:** A book serif with a display optical size for the large headings, set against a brush face that only ever appears on the plates. The mono is the film's subtitle, used for subtitle lines and a few labels, never for running text. Type was fixed after comparing ten alternatives (`gekiga-2-type`).

All faces need latin-ext (macrons: Kōga-Ryū, Bansenshūkai, Jūnantaisō). Every face is self-hosted WOFF2, subset at build time to what the texts set (`pnpm fonts`, `docs/fonts.md`); no request goes to a font host.

### Hierarchy

- **Display** (700, `clamp(2.6rem, 1.6rem + 4vw, 5rem)`, 1.02, tracking -0.025em, balanced): the article title under the opener.
- **Headline** (600, `clamp(2.2rem, 1.5rem + 2.6vw, 3.6rem)`, 1.04, -0.02em): the title of each part of the book under its plate on the homepage.
- **Title** (600, `clamp(1.6rem, 1.3rem + 1vw, 2rem)`, 1.15, -0.015em): section headings in an article, each with a dry-brush divider above it.
- **Lede** (400 italic, `clamp(1.3rem, 1.1rem + 0.6vw, 1.6rem)`, 1.45): the article's excerpt under its title.
- **Body** (400, 20px → 21.5px fluid, 1.62): running text. Measure 32.5em, about 69 characters per line (p90 72) at desktop, 36 at 390px. `hyphens: auto`, `text-wrap: pretty`.
- **Caption** (400, 17px, 1.5): figure captions in the text; credits and facts at 15–16px.
- **Label** (IBM Plex Mono 400, 15–17px, line height 2): subtitle lines, one dark box per line; the position in the top bar; the legend of the mode choice.
- **Plate** (Yuji Syuku, vertical): 1.75–4.25rem on homepage plates, 1.5–4.6rem on the article opener, 1.9rem small, 25cqi of the ensō stage for the title plate 木隠; margin glosses at 2.1rem.

The scale steps by about 1.25 between text sizes; the jump to the plate kanji is deliberate, poster scale.

### Named Rules

**The Brush Belongs to the Plate Rule.** Yuji Syuku appears only on name plates and in the kanji of margin glosses. Kanji in running text and captions are Shippori Mincho. The glossary sets its 760 entries' kanji in the margin like glosses, but in Shippori Mincho: the brush face for some 600 kanji would weigh more than the whole page.

**The Subtitle Rule.** Mono is the film's subtitle: a short line in a dark box over or under a painting. It never sets a paragraph, a heading or a list.

**The Reading Floor Rule.** Body text is never below 20px on screen (print: about 11pt), and a line never holds more than 75 characters.

### Scripts

The book appears in twelve languages (SI-465, `prototypes/gekiga-2-stress`). Hyphenation, italics and German quotes are conventions of the German edition, not of the design; each script sets its own.

- **Latin and Cyrillic** (de, en, es, fr, it, nl, pt, ru): the type as above; Source Serif 4 and IBM Plex Mono have Cyrillic. Only German has `hyphens: auto` tuned for long compounds.
- **Hebrew** (he): `dir="rtl"`, the letters from Frank Ruhl Libre (already in the serif and mono stacks). No italics: the lede, captions and terms are upright, emphasis is 600.
- **Japanese, Chinese, Korean** (ja, zh, ko): a CJK text face loaded only on those pages: Shippori Mincho (ja, 400), Noto Serif SC (zh), Noto Serif KR (ko), also as the mono's fallback, so Chinese never falls to Japanese forms. No hyphenation, `line-break: strict`, Korean `word-break: keep-all`, line height 1.85, no negative tracking on headings, emphasis marks instead of italics (ja sesame over, zh dots under, ko 600). The 32.5em measure stays: about 30 characters per line on desktop, 16 on a phone.
- **Quotation marks** follow the language (`quotes: auto`); only German pins „…“.
- **Name plates** keep the brush (Yuji Syuku) and the kanji in every language.

## Layout

Two spatial models, one per surface.

**The prologue (homepage).** A title stage (the ensō vortex with the 木隠 plate as the h1, sized in container units so the plate keeps its proportion to the circle) next to the book's subtitle, a credit line, the "Lesen" link and the contents (ten parts, kanji numeral and German title, in two columns). Then the ten parts as scenes in normal page flow, each scene a plate (16:9 from 48em, 4:3 below; some cropped tight or bled to the full width as a cinematic band) followed by its title and, from 64em beside it, its articles (`86rem` page, gutters `clamp(1.25rem, 5vw, 4rem)`, `clamp(4.5rem, 9vw, 8rem)` between scenes). Name plates alternate sides from scene to scene. The first plate's wet edge breaks the fold.

**The reading page (article).** A top bar (the way home, the chapter), the opener (one plate, 2:1, from 75em held to `min(44svh, 30rem)` so the title and lede are in the first screen), the title block, a brushstroke sweep, then the reading column: `minmax(0, 32.5em)` centred; from 75em a three-column grid (`13rem | 32.5em | 13rem`) with the section list sticky in the start column and the margin glosses in the end column. Figures are wider than the text (`min(44em, 100vw - 2 × gutter)`; in the three-column grid across the two gutters only, so the margin glosses run on beside them). After the text: what comes next in the book, the way back to the chapter, then the colophon.

**Breakpoints:** 30em (contents in two columns), 48em (plate proportions, subtitle on the painting), 60em (prologue stage and text side by side), 64em (a part's title beside its article list), 75em (section rail, margin glosses, opener height). Mobile-first; the narrow layouts are complete designs, not collapses. As Tailwind variants: `sm` 30em, `md` 48em, `lg` 60em, `xl` 64em, `2xl` 75em.

**Direction:** logical properties only. `dir="rtl"` mirrors the layout; brushstrokes and the vortex mirror with it, paintings never do, and neither does the shinobi in the vortex's ink (its ink layer mirrors back). Name plates stay vertical-rl with `dir="ltr"` pinned.

### Named Rules

**The Fold Rule.** On the reading page the title is in the first screen at 1440×900 and 1280×720; on a phone the title is in the first screen.

**The No Home Navigation Rule.** No site navigation bar. The way into the book is the contents on the homepage, and the way back is the top bar (木隠 Inhalt, the chapter) and the links after the text.

## Elevation & Depth

Paper and ink, not cards. Depth comes from the ink layering (black ink over an ochre wash, gofun over indigo), from the name plates that hang slightly in front of their paintings, and from the lighter paper a readable article lifts onto when hovered. Shadows are soft, offset downward and tinted with the ink colour; nothing glows.

### Shadow Vocabulary

- **Plate hang** (`box-shadow: 0 0.35em 0.9em -0.45em var(--shadow-ink)`): a name plate in front of its painting.
- **Lift** (`box-shadow: 0 0 0 0.75rem var(--hover), 0 0.75rem 1.5rem -0.5rem var(--shadow-soft)`): a readable article entry on hover or focus; the first spread extends the lighter paper around the entry.
- **Popover** (`box-shadow: 0 1rem 2.5rem -1rem var(--shadow-ink)`): the section list opened from the top bar, and the search dialog.

### Named Rules

**The Flat Paper Rule.** Surfaces are flat at rest. Only a plate hangs, and only a readable article lifts, and only while it is hovered or focused.

## Shapes

Ink edges and hairline rectangles. Paintings, figures and the colophon band are cut by wet, dry, torn or scrubbed ink edges (ten masks, a–j, ordered so neighbours never look alike); never by a rectangle, a rounded box or a circle. Everything drawn as UI is a sharp rectangle with a 1px corner (`{rounded.hairline}`): the name plates (a heavy sumi frame with an inner hairline), the subtitle boxes, the seal, the mode choice, the popover. Rules are 1px hairlines in the rule colour; the only heavier line is the 2px seal-red top of a readable article.

The ensō vortex is the one circle of the site, and it is ink, not geometry. Its ink ring hides a shinobi in the brushwork (an idea of a designer friend of Stefan's, `gekiga-2-kakure`), seen only on a second look: the ring is turned 32° so the title plate leaves the figure's face free, and the ochre or indigo wash beneath stays the plain vortex, so no second figure shows in it. Dry-brush dividers (five strokes of different length, mirrored on the second round) open every section of an article.

## Components

### Name Plate (tanzaku)

The signature. A vertical plate in brush kanji naming a part of the book or an article.

- **Form:** shoji paper (`{colors.shoji}`; by night `{colors.kinari-plate}`), a heavy sumi frame (0.085em) with an inner hairline (0.022em, inset 0.17em), the plate hang shadow. Always `writing-mode: vertical-rl`, `dir="ltr"`.
- **Content:** the name in Yuji Syuku, the number (第一章) as a thin column beside it in umber (by night indigo). The title plate 木隠 sets the romaji "Kogakure" horizontally beneath the kanji, in the serif italic.
- **Sizes:** title (25cqi of the ensō stage), plate, opener, small (figure markers).
- **Accessibility:** decorative (`aria-hidden`) unless it is the h1; the German heading next to it carries the meaning. As the h1 its accessible name is "木隠 Kogakure".
- **Placement:** hangs over the top edge of its painting (`-1.6rem`), 6% in from the side; alternates sides on the homepage.

### Plate

A painting cut by an ink edge, with a name plate and a subtitle.

- **Painting:** natural colour, `object-fit: cover` with a focus point per painting (stored with the image, in kogakure-texts' `mapping.csv`); dimmed a little by night. Taken from the originals, not the 1000 px previews: about 2000 px wide at 2×, the full-width bands about 2750 px.
- **Opener:** the article's first painting (`article/`, `historical/`); diagrams, objects and technique images don't open an article. An article without a painting gets one made in the book's style; until then, the bare plate: the name plate on an ink wash cut by the same wet edge.
- **Edge:** one of the ten ink-edge masks.
- **Subtitle:** the painting's caption, centred near the bottom of the painting (from 48em) or just under it.
- **Reveal:** once, when it comes into view: the edge mask blooms from 62% to 100% while the painting comes out of a light blur (1100 ms, `cubic-bezier(0.16, 1, 0.3, 1)`), the name plate settles 300 ms later, the subtitle last. Nothing is hidden without JavaScript or with reduced motion.

### Subtitle

- **Style:** IBM Plex Mono on a dark box per line (`box-decoration-break: clone`), shoji text on sumi (17.7:1); by night kinari on the deepest indigo (15.6:1); a 1px edge in umber or indigo.
- **Use:** under or over a painting, and the book's subtitle in the prologue. One or two lines, balanced.

### Article Entry

- **Readable:** the title in 600 with a seal mark and an underline in seal red, a 2px seal-red line on top. The whole entry is one link (the title's `::after` covers it); on hover or focus it lifts onto the lighter paper (Lift shadow), the underline thickens to 2px; the focus ring goes around the entry (`outline-offset: 0.75rem`).
- **Not written yet:** the title in 400 in the secondary text colour, no seal, not a link.
- **Excerpt:** 18px in the secondary text colour.

### Section List and Position

- **Wide (from 75em):** a sticky list beside the text, never taller than the screen (a long article scrolls its list on its own and keeps the current section in view); each section has a small hairline square that becomes the seal when it is the current section (`aria-current="location"`).
- **Narrow:** the list stands after the title block. The top bar is sticky; it slides away while the reader reads on and comes back when they scroll up (300 ms), now showing the way home and the position ("Abschnitt 3 von 6" in mono, with the seal), which opens the section list in a popover. The current section is the last heading above the upper third of the screen.

### Margin Gloss

A Japanese term in the text, `tengu (天狗, „Himmelhund“)`, becomes a gloss at build time: inline in parentheses on narrow screens, in the outer margin from 75em (the term, its kanji in Yuji Syuku in the heading colour, the meaning). Screen readers hear it in the sentence ("tengu 天狗 Himmelhund"); the repeated term in the margin is hidden from them.

### Search

- **Entry:** „Suche“, quiet like the top bar's links: in the article's top bar (also in the bar that comes back on scroll up, the only way in on a phone), beside the contents' heading on the homepage and on the contents page, on the 404 page. The `/` key opens it on every page; its key cap shows beside the word from 48em on devices that hover. Hidden without JavaScript.
- **Dialog:** the reading paper in a hairline frame with a 1px corner and the popover shadow, on a veil of the page's ground (85%), near the top of the screen; a short fade, none with reduced motion. The label „Suche“ and „Schließen“ in mono, the field in the text face, the count of results in mono.
- **Results:** a list with hairlines between the entries; each entry one link (the title in 600), its part of the book in mono, the excerpt in the secondary text colour with the words found on the selection colour (never the seal). On hover the lighter paper.

### Colophon and Mode Choice

- **Band:** the page ends on a sumi band (by night the deepest indigo) whose top edge is wet ink, brushed in by a sweep. The book's name, the copyright, the way back.
- **Mode choice:** "Darstellung: Hell · Dunkel · System", three segments in a hairline frame; the chosen one lit (pale ochre on sumi with dark text, about 9–10:1). "System" follows `prefers-color-scheme` and is the default; a choice is stored and applied before first paint. Hidden without JavaScript, where the page follows the system.
- **Language:** a select beside it with a button (choosing alone changes nothing, WCAG 3.2.2): the page in each of the twelve languages, each in its own name; without JavaScript a list of links.

### Links and Focus

- **Links:** inherit the text colour, 1px underline in the link-line colour, 0.2em offset; on hover the underline takes the text colour; the read link carries the seal.
- **Focus:** a 2px solid ring in the text colour, 3px offset, on every interactive element; the skip link's ring is seal red. On the colophon band the ring is in the band's text colour, and the mode options draw it inset (-4px), inside their shared frame.
- **Selection:** pale ochre by day, indigo by night.

### Motion

- **Plate reveal:** see Plate.
- **Article opener:** blooms on load, the brushstroke sweep draws in from the reading start (`clip-path`, 1000 ms, delayed 900 ms).
- **Vortex:** on load the ink drifts (turning back 16° to its resting turn, the ochre wash 48°) and comes to rest in 3.4 s (`cubic-bezier(0.3, 0.5, 0.2, 1)`), under 5 s so it needs no pause control; the title plate fades in after it.
- **Page transition:** between every two pages the new page spreads like wet ink from where the reader clicked (cross-document view transition, a radial mask with an 18vmax soft front, 1100 ms); back, forward and typed URLs spread from the middle. Browsers without view transitions change at once.
- **Mode change:** instant.
- **Reduced motion:** everything static and visible; no view transition.

### Book Cover

The cover of the print book and the ebook is the homepage's title stage (SI-317; `prototypes/gekiga-2-cover`, concept Ensō): on washi, the 木隠 title plate (romaji „Kogakure“ beneath the kanji) in the ink ring over its ochre wash; below, the subtitle „Hinter Blättern und Bäumen verborgen“ in its sumi box and the author in the serif (600). The ink ring is the website's, with the hidden shinobi (see Shapes). The cover is a fixed object: day colours, never mirrored, every size in container units so the ebook (1:1.6) and a shop thumbnail at 80 px are the same design. Spine: a slim plate at the head, „Kogakure“ and the author running down. Back: the blurb about the subject, the ten parts with their kanji, `kogakure.de`, space for the barcode. Format, paper, spine and imprint are settled in the book project.

## Do's and Don'ts

### Do:

- **Do** keep body text at 20–21.5px with a 32.5em measure and `hyphens: auto`.
- **Do** define every colour once as a role with a day and a night value (`light-dark()`), and use the role.
- **Do** cut paintings with the ink-edge masks, and give every painting a focus point so faces survive the crop.
- **Do** use the seal red only as a mark: the reading position, a readable article, the read link, the skip link's ring.
- **Do** keep the title and lede in the first screen of an article at 1440×900 and 1280×720.
- **Do** run every motion once, on entry or on interaction, and make it static with `prefers-reduced-motion`.
- **Do** use logical properties, so `dir="rtl"` mirrors the layout without overrides.
- **Do** set kanji with `lang="ja"` and a CJK fallback stack; check macrons in every face.
- **Do** let each script set its own hyphenation, emphasis and quotation marks (Typography › Scripts).
- **Do** carry the plate term (the kanji on an article's name plate) as content: an article field with the chapter's kanji as the fallback.

### Don't:

- **Don't** use ninja clichés: throwing stars, black masks, blood, splatter fields, "shadow warrior" imagery. The drama is in the ink. The one exception is the shinobi hidden in the vortex's ink ring (homepage and cover): a figure made of the ink, seen only on a second look.
- **Don't** put body text on a wash or on a painting; only a subtitle box sits on a painting.
- **Don't** use Yuji Syuku outside name plates and margin glosses, or IBM Plex Mono for running text.
- **Don't** add a home navigation bar or a hamburger menu.
- **Don't** loop motion, tie it to the scroll position or pin sections.
- **Don't** cross-fade the whole page when the mode changes.
- **Don't** use the ochre or indigo washes, or the seal red, as text colours.
- **Don't** round corners beyond 1px or put content in cards.
- **Don't** mirror paintings in a right-to-left layout.

## Implementation

| Part                                                                 | Where                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour roles, type scale, spacing, shadows, motion                   | `src/styles/tokens.css` (custom properties), as Tailwind utilities in `src/styles/global.css` (`bg-ground`, `text-text-2`, `font-serif`, `p-gutter`, `shadow-plate`, …; no default palette) |
| Base, per-script rules, print                                        | `src/styles/global.css`; the per-script rules apply to the page's language or a `.script-root`                                                                                              |
| The reading text: dividers, figures, glosses, banners, lists, tables | `src/styles/prose.css`, inside `Prose.astro`                                                                                                                                                |
| Motion, reveal, page transition, reduced motion                      | `src/styles/motion.css`, `Ink.astro`, the inline scripts of `SiteHead.astro`                                                                                                                |
| Light and dark                                                       | `src/lib/mode/`, applied before first paint by `SiteHead.astro`; `.mode-light` / `.mode-dark` pin a mode for one element                                                                    |
| Fonts                                                                | `pnpm fonts` writes `public/fonts/` and `src/lib/fonts/manifest.json`; `SiteHead.astro` inlines the @font-face rules of the page (`docs/fonts.md`)                                          |
| Plate kanji, ink edges                                               | `src/lib/book/plates.ts`; the ink assets in `public/images/ink/` (`docs/images.md`)                                                                                                         |

### Fonts

Self-hosted WOFF2 only, `font-display: swap`, the body face preloaded, size-adjusted local fallbacks (Georgia for Source Serif 4, Courier New for IBM Plex Mono) so the swap moves no line. Source Serif 4 upright keeps its optical sizes from 20 to 60 and the weights 400–700; the italic sets text only and is pinned to opsz 20 and 400. Latin, Cyrillic and Hebrew come as shared subsets per script (digits and punctuation, basic letters, the rest), Japanese, Chinese and Korean as one file per language with the characters most pages share plus one file per page with exactly the rest; the bold CJK files hold only what is set in bold.

**Budget:** about 150 KB of fonts for the first page. Met for Latin, Cyrillic and Hebrew (homepage and the median article). Japanese and Korean pages are close (about 155–160 KB), Chinese about 230 KB: CJK sets several hundred distinct glyphs per page at about 0.2 KB each. The glossary pages, which set every term, are the largest (up to about 450 KB in Chinese). The numbers per language are in the manifest (`budget`) and printed by `pnpm fonts`.
