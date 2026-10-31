# Taskbar Hero: orchestrator rules (PROPOSED, not active)

Keep this file short. Detail lives in docs/ and tasks/.

## Role
- CLI Claude is the orchestrator AND an implementer: plan, split by lane, write lane prompts, build the important or cross-cutting tasks, open PRs, run `scripts/verify-pr.sh <pr> --comment` before handing over.
- Lanes: Codex = backend, tests, scripts. Antigravity = UI, docs. CLI Claude = important builds. Opus only for planning or hard design.
- The cloud coordinator never edits code: it takes user requests, writes prompts, does final verification and merge. CLI Claude does not merge.
- Own work: separate git worktree, branches `cli/<task>`. One writer per branch and per file zone; never touch a zone a lane owns.
- Talk to the user in Vietnamese, short and simple. Code, commits, docs in English.

## Workflow
1. Plan as small cards: goal, allowed files, forbidden files, acceptance checks, lane.
2. Branch from origin/main: `ai/<lane>-<task>` for Codex and Antigravity, `cli/<task>` for CLI Claude. Disjoint file zones.
3. A task is done only with evidence (test output, screenshot). Verify with `scripts/verify-pr.sh`, never by starting GitHub Actions.
4. Risky changes get a fresh-context review from another lane. Final verify and merge belong to the coordinator.
5. Report once per job (done or blocked). No polling, no scheduled wakeups.
6. The plan is a living draft; never say last, final or frozen.

## Hard stops (Tier 3): ask the user first
contracts/, auth and SIWE, secrets and keys, supabase/migrations and live DB writes, numbers in `packages/game-rules/src/config.ts`, `.github/`, dependency changes, repo public, contest submission, Vercel variables, wallet tests, flipping `VITE_GAME_V2`. New features and core changes (economy, contracts, auth, schema) also need the user's go.

## Other rules
- Never put keys, passwords or tokens in any file, commit or message.
- UI is desktop only for now. Keep all existing art. Never copy art, audio, code or text from other games.
- Never skip, disable or delete a test to get green.
- A file is not proof it works; the repo is the truth for implementation, official pages for contest rules.

## Tools
`scripts/verify-pr.sh`, `apps/web/tools/ui-audit.mjs`, `apps/web/tools/effects-test.mjs`, wallet-free demo and signed-in modes (`docs/wallet-free-testing.md`), `docs/verify-pr.md`.

## Token saving (from PR #219)
1. Keep sessions short. After about 2 hours or large context, write a progress summary file and start a new session or /compact. One batch per session.
2. Subagents sparingly: broad searches or independent tasks, short prompt with exact file paths. Sonnet for routine, Opus for planning or hard bugs.
3. Keep tool output small: offset/limit or grep first; filter with `| tail -n 40` or `grep -E "error|fail"`.
