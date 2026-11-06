# Commands

| Command              | What it does                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm dev`           | Dev server on http://localhost:4321                                                                         |
| `pnpm build`         | Static build into `dist/`                                                                                   |
| `pnpm preview`       | Serves `dist/` (Astro 7 runs it in the foreground; `--background`, `astro preview stop` and `status` exist) |
| `pnpm check`         | `astro check` + Oxlint + Prettier check (the CI gate)                                                       |
| `pnpm format`        | Formats everything with Prettier                                                                            |
| `pnpm lint:fix`      | Oxlint with fixes                                                                                           |
| `pnpm test`          | Vitest: unit and Astro component tests                                                                      |
| `pnpm test:watch`    | Vitest in watch mode                                                                                        |
| `pnpm test:coverage` | Vitest with coverage (`coverage/`)                                                                          |
| `pnpm test:e2e`      | Playwright against the built site (run `pnpm build` first)                                                  |
| `pnpm docker:build`  | Builds the production image `kogakure-local`                                                                |
| `pnpm docker:run`    | Serves the image on http://localhost:8080                                                                   |

Before a pull request: `pnpm check && pnpm test && pnpm build && pnpm test:e2e`.

The first time, install the Playwright browser: `pnpm exec playwright install chromium`.
