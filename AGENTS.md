# AGENTS.md

## Project

木隠 (_kogakure_, "hidden behind leaves and trees") is an online book about the ninja and ninjutsu by Stefan Imhoff, published at [kogakure.de](https://www.kogakure.de/) since 1999. This repo is the new website: a static Astro site in twelve languages, built from the rewritten texts, the new AI paintings and the Gekiga design.

The plan and all issues are in the Linear project _Migration to Astro_ (P-SI-13). Each issue is one pull request into `master`.

## Quick start

- Install: `pnpm install` (Node and pnpm versions in `mise.toml`)
- Dev server: `pnpm dev`
- All checks: `pnpm check && pnpm test && pnpm build && pnpm test:e2e`

## Hard rules

- **The new content always wins.** Texts come from `kogakure-texts/texts/new`, images from `kogakure-ai-images`. The old 11ty site is a reference for URLs and legal facts only. If something is missing, it is created new, in all twelve languages.
- **Design:** every UI decision follows the Gekiga design system (`DESIGN.md`; until SI-473 brings it here, `~/Code/personal/kogakure-prototyping/DESIGN.md`).
- **Components:** pages only compose components from `src/components/` (catalogue in `src/components/COMPONENTS.md`). Astro components by default; React + shadcn/ui (Base UI) only for interactive parts.
- **No secrets** in the repo. It becomes public at launch.
- Logical CSS properties only (Hebrew is right-to-left).

## Topics

- Tech stack (`docs/tech-stack.md`): what the project uses and why
- Directories (`docs/directories.md`): where things live
- Commands (`docs/commands.md`): develop, check, test, build, Docker
- Content (`docs/content.md`): import from kogakure-texts, validation, routes, UI strings, Markdown plugins
- Images (`docs/images.md`): pregenerated WebP sizes, manifest, Picture, OG images, ink assets
- Testing (`docs/testing.md`): unit, component, accessibility and end-to-end tests
- Git workflow (`docs/git-workflow.md`): branches, commits, pull requests, Linear

## Agents

Project agents in `.claude/agents/`: `design-system-enforcer`, `a11y-auditor`, `component-architecture-auditor`, `performance-bundle-analyst`, `qa-reviewer`. Run the relevant ones before opening a pull request that changes UI.
