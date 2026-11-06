# Git workflow

- `master` is protected: never commit or push to it directly, never force-push.
- One Linear issue (team _kogakure_, project _Migration to Astro_) is one branch and one pull request. Use the issue's branch name from Linear (`gitBranchName`).
- Commit messages: `<ISSUE-ID>: <summary>`, e.g. `SI-469: Add the Vitest setup with axe`.
- The pre-commit hook (Husky + lint-staged) lints, formats and runs related tests. If it fails, fix the cause; never skip it with `--no-verify`.
- Before opening a pull request: `pnpm check && pnpm test && pnpm build && pnpm test:e2e`, and the relevant agents in `.claude/agents/` for UI changes.
- Open the pull request with `gh pr create`, link it in the Linear issue and set the issue to _In Review_. Stefan reviews and merges.
