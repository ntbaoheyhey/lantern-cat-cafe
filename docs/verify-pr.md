# Verifying changes without GitHub Actions minutes

The repo is private, so GitHub gives 2000 free Actions minutes a month. To save them:

- `.github/workflows/ci.yml` runs only after a push to `main` (slim: typecheck, lint, unit tests, build, and Foundry when contracts changed; docs-only pushes skip it) and when started by hand from Actions > CI > Run workflow (full, with Playwright). A newer run cancels an older one. Pull requests and other branches do not trigger it.
- `scripts/verify-pr.sh <pr-number> [--comment]` checks a PR in a throwaway worktree: merges the PR head with the latest `main`, then runs install, deno.json drift, typecheck, lint, unit tests, build, Playwright (when web files changed) and `forge test` (when contracts changed and Foundry is installed). `--comment` posts the result on the PR. `FORCE_ALL=1` runs every step.
- Codex and Antigravity push a branch (`ai/<tool>-<task>`) and write `reports/<task>.md` with what changed, their local test output and open questions. The orchestrator verifies the branch with the same steps, then merges.
