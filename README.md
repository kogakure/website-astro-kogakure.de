# 木隠 kogakure.de

The new website of 木隠 (_kogakure_), an online book about the ninja and ninjutsu, published since 1999. A static [Astro](https://astro.build/) site in twelve languages.

## Development

```sh
mise install          # Node and pnpm, versions in mise.toml
pnpm install
pnpm dev              # http://localhost:4321
```

Checks before a pull request:

```sh
pnpm check && pnpm test && pnpm build && pnpm test:e2e
```

More in [`AGENTS.md`](AGENTS.md) and [`docs/`](docs/).

## Deployment

The `Dockerfile` builds the site and serves it with nginx; it runs on Coolify.

```sh
pnpm docker:build && pnpm docker:run   # http://localhost:8080
```

Coolify runs two apps from this repository, both deploying `master`:

| App        | Domain                                  | Build variables                  |
| ---------- | --------------------------------------- | -------------------------------- |
| Staging    | the staging domain                      | none: every page stays `noindex` |
| Production | `www.kogakure.de` (`kogakure.de` → www) | `INDEXABLE=true` (`docs/seo.md`) |

The redirect from `kogakure.de` to `https://www.kogakure.de` is Coolify's (both domains on the production app, redirect to www); nginx in the container serves one host. After going live: `pnpm check:old-urls https://www.kogakure.de`.

## Licences

| What                                                                                 | Licence                                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| The code                                                                             | MIT (`LICENSE`)                                                                            |
| The texts (`src/content/`, imported from kogakure-texts; `src/legal/`, `src/ebook/`) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), © Stefan Imhoff     |
| The images (`public/images/`, `assets/`)                                             | © Stefan Imhoff, all rights reserved: not to be reused on their own                        |
| The fonts (`public/fonts/`)                                                          | SIL Open Font License 1.1, each in `public/fonts/licenses/`                                |
| The Iga ninja font (`public/downloads/`)                                             | © Stefan Imhoff, its source in [kogakure/font-ingo](https://github.com/kogakure/font-ingo) |
