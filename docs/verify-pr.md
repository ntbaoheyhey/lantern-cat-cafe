# Verifying changes without GitHub Actions minutes

The repo is private, so GitHub gives 2000 free Actions minutes a month. To save them:

- `.github/workflows/ci.yml` is manual only for now (Actions > CI > Run workflow; full, with Playwright), so it uses no minutes. When the quota resets it can run slim after each push to `main` again: add `push: { branches: [main] }` under `on:`. Pull requests and other branches never trigger it. `deploy-functions.yml` still runs when `supabase/functions` or `packages/` change on main (a few seconds) because it ships the Edge Functions.
- `scripts/verify-pr.sh <pr-number> [--comment]` checks a PR in a throwaway worktree: merges the PR head with the latest `main`, then runs install, deno.json drift, typecheck, lint, unit tests, build, Playwright (when web files changed) and `forge test` (when contracts changed and Foundry is installed). `--comment` posts the result on the PR. `FORCE_ALL=1` runs every step.
- Codex and Antigravity push a branch (`ai/<tool>-<task>`) and write `reports/<task>.md` with what changed, their local test output and open questions. The orchestrator verifies the branch with the same steps, then merges.
