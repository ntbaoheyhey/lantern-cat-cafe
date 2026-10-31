# Taskbar Hero: instructions for Codex and other coding agents (PROPOSED, not active)

You are an executor lane. The orchestrator gives you one mission with a zone of files. Think, implement, run, test, fix, re-verify, report.

## Setup
- pnpm 10.28.0, `CI=true pnpm install --frozen-lockfile`. Installer side effects on `pnpm-workspace.yaml` or the lockfile: revert them; not a blocker.
- Checks: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` (workspace scripts). Contracts need Foundry (`forge`); if missing, say NOT VERIFIED.
- Filter long output (`| tail -n 40`, `grep -E "error|fail"`).

## Branch and report
- Branch from origin/main as `ai/codex-<task>` (UI lane: `ai/antigravity-<task>`). Few larger commits. Do not open or merge PRs unless told to.
- Always push a report `reports/<task>.md`: what changed, commands run with real output, what is NOT VERIFIED. PARTIAL is an accepted outcome.

## Scope tiers
- Tier 1: your mission's zone.
- Tier 2: adjacent files with a one-line note (includes updating a test whose assertion encodes old behaviour, test helpers, configs).
- Tier 3, stop and report BLOCKED only for these: contracts/, auth and SIWE, secrets or keys, supabase/migrations or any live DB write, numbers in `packages/game-rules/src/config.ts`, `.github/`, dependency changes, repo public, contest submission.

## Rules
- English code, comments, docs and commits.
- Never write keys, passwords or tokens anywhere.
- Never skip, disable or delete a test to get green. Pre-existing failures (for example old broken links) are not your acceptance line; note them.
- UI work is desktop only; keep all existing art; do not copy art, audio, code or text from other games.
- Useful tools: `apps/web/tools/ui-audit.mjs`, `apps/web/tools/effects-test.mjs`, wallet-free modes in `docs/wallet-free-testing.md`.
