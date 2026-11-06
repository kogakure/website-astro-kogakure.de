# Tech stack

| Area                     | Choice                                              | Notes                                                                            |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Framework                | Astro 7                                             | Static output (`dist/`), `trailingSlash: 'always'` like the old site             |
| Language                 | TypeScript 6, strict                                | TypeScript 7 is not supported by `@astrojs/check` yet                            |
| Runtime                  | Node 26 LTS, pnpm 12                                | Pinned in `mise.toml`, `.nvmrc` and `packageManager`                             |
| Styling                  | Tailwind CSS 4 via `@tailwindcss/vite`              | Design tokens in `src/styles/global.css`                                         |
| Interactive parts        | React 19 islands, shadcn/ui on Base UI              | Style `base-lyra`, RTL enabled (`components.json`); `cn()` from the `cn` package |
| Images                   | Pregenerated WebP sizes, committed                  | Astro's image service is `passthroughImageService()` (build time)                |
| Lint                     | Oxlint                                              | Also lints the script part of `.astro` files (`.oxlintrc.json`)                  |
| Types                    | `astro check`                                       | Checks `.astro`, `.ts` and `.tsx`                                                |
| Format                   | Prettier with the Astro and Tailwind plugins        | Tabs, single quotes, width 100                                                   |
| Git hooks                | Husky + lint-staged                                 | Lint, format and related tests on commit                                         |
| Unit and component tests | Vitest 5, happy-dom, axe-core                       | See `docs/testing.md`                                                            |
| End-to-end tests         | Playwright + `@axe-core/playwright`                 | Against `astro preview` on port 4329                                             |
| CI                       | GitHub Actions (`.github/workflows/ci.yml`)         | Checks, unit, e2e, Docker image, gitleaks                                        |
| Hosting                  | Docker (Node build → nginx) on Coolify, Hetzner VPS | `Dockerfile`, `nginx.conf`                                                       |

## Dependency policy

`pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`: pnpm only installs versions that are at least one day old. If a fresh release is blocked, pin the previous version instead of loosening the rule.
