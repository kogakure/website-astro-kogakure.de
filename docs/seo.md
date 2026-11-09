# Languages, SEO, redirects and analytics

How readers land in their language, what search engines and link previews read, how the old URLs keep working, and what the statistics count (SI-478).

## First visit to `/`

German lives at `/`. On the first visit to `/` itself, the browser's languages (`navigator.languages`, in order) decide where the reader starts: the first of the twelve goes to its homepage (`/fr/`, `/ja/`, …), German stays, anything else goes to English (`FALLBACK_LANG`).

- **Once:** `FIRST_VISIT_KEY` in localStorage; the next visit to `/` shows the German homepage.
- **The reader's own choice wins:** the language select stores `LANGUAGE_KEY`; with it, `/` goes to that language's homepage, or stays for German.
- **Never on deep links:** only `/` without a fragment. Articles, `/#geschichte` and every other URL from a search result open as they are.
- **Never without localStorage** (without it `/` could never be reached) **and never for crawlers**, which index `/` as German.

`src/i18n/first-visit.ts` holds the logic as one self-contained function, unit tested; `FirstVisit.astro` inlines it into the German homepage's head, before anything loads, so a reader who is sent on never sees the German page first (`location.replace`, so Back doesn't return to `/`). The e2e tests (`tests/e2e/seo.spec.ts`) run in a German browser by default (`locale: 'de-DE'` in `playwright.config.ts`).

## What search engines read

`src/lib/seo/seo.ts` builds it, `PageMeta.astro` writes it into every head (through `BaseLayout`):

| What                         | Where                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<title>`                    | The old site's pattern: `Kamae · 木隠 · Ninja, Ninjutsu & Kampfkunst`, the homepage `木隠 Kogakure · …` (`pageTitle()`, `topic` in `src/i18n/ui.ts`)                                                                                                                                                           |
| Canonical URL                | Every indexed page                                                                                                                                                                                                                                                                                             |
| hreflang                     | All twelve versions by their `htmlLang` (`pt-BR`, `zh-Hans`) and `x-default` → English                                                                                                                                                                                                                         |
| Open Graph, Twitter card     | Title, description (the article's excerpt), `og:locale` and its alternates. Image: the article's opener crop (`images/og/<translationKey>.jpg`)                                                                                                                                                                |
| JSON-LD                      | `Book` on the homepages (the translations as `translationOfWork` of the German one), `Article` and `BreadcrumbList` on articles, breadcrumbs elsewhere                                                                                                                                                         |
| `noindex`                    | Always: the imprint and the privacy policy in every language, the 404 pages and `/design-system/` (no canonical, hreflang or sitemap entry). Every other page unless the build sets `INDEXABLE=true`: the production app in Coolify does (a build variable, SI-482); staging, local builds and the tests don't |
| `/sitemap.xml`               | `src/pages/sitemap.xml.ts`: every indexed page in every language with its versions as `xhtml:link` alternates                                                                                                                                                                                                  |
| `/robots.txt`, `/humans.txt` | `public/`. `Disallow: /sprueche/` stays: it is required for legal reasons. The legal pages are not disallowed on purpose: a crawler that may not fetch them never sees their `noindex`, and every page links to them, so their bare URLs could still show up in results                                        |

The homepages and the contents have no opener: their preview image is `og/home.jpg`, the old man reading aloud at the hearth (`DEFAULT_PREVIEW` in `src/lib/images/images.ts`, a painting of Die 5 Gebote der Ninja).

The verification files of Google, Bing, Yandex, Brave and Keybase are in `public/` and `public/.well-known/`, byte for byte as on the old site (Prettier leaves them alone). The favicon and the other icons come with the PWA (SI-480).

To check sample pages, use Google's [Rich Results Test](https://search.google.com/test/rich-results) and an hreflang validator. Before the launch, use the code tab with the built HTML from `dist/`.

## Old URLs

The book's slugs are those of the old site. nginx (`nginx.conf`) redirects the rest with a 301 before choosing a location:

| Old                                             | New                                    |
| ----------------------------------------------- | -------------------------------------- |
| `/artikel/<slug>`                               | `/<slug>`                              |
| `/empfehlungen/`, `/en/recommendations/`        | the colophon (it names the books)      |
| `/downloads/book-kogakure.{pdf,epub,mobi}`      | `/downloads/`                          |
| `/assets/images/downloads/{ingo,ogama}.jpg`     | their WebP in `/images/old/downloads/` |
| `/assets/images/branding/og/banner-{de,en}.png` | the homepage's preview image           |

`scripts/old-urls.txt` lists the URLs of the old live sitemap and the older links; `pnpm check:old-urls [base]` checks that each answers 200, or 301 to the right page, which answers 200. Run it against the production image (`pnpm docker:build && pnpm docker:run`, default `http://localhost:8080`), and against https://www.kogakure.de after the launch. Paths marked `! SI-480` aren't there yet and show up as pending.

## Analytics

Umami, self-hosted at umami.kogakure.cloud, without cookies or IP addresses (the privacy policy). `Analytics.astro` loads the script only when the build has `ANALYTICS=true` (`astro:env`, set in the `Dockerfile`), and `data-domains` makes it count only on www.kogakure.de: `pnpm build`, the e2e tests and a local Docker run count nothing.

Besides page views it counts four events (`EVENTS` in `src/lib/analytics/analytics.ts`):

| Event             | Data              | From                                                                                     |
| ----------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `language-switch` | `from`, `to`      | `LanguageSelect.astro`                                                                   |
| `mode-switch`     | `mode`            | `ModeSwitch.astro`                                                                       |
| `download`        | `file`            | Links into `/downloads/`: `data-umami-event` (Markdown plugin `downloads`)               |
| `search`          | `lang`, `results` | `SearchDialog.tsx`: one per search, when the dialog closes; never the words searched for |

`trackEvent()` does nothing without the script and never throws. A new event goes into `EVENTS` and into the privacy policy (`src/legal/`).
