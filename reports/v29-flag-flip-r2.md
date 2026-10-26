STATUS: BLOCKED

Preparation only. The required baseline is unavailable, so no flip was applied and no product fix was attempted. This report-only branch is `ai/codex-v29-flag-flip-r2-report`, based on `origin/main` at `337977751204b5ea59d8f0cabfb91fb4cd4a391f`. The flip remains unmerged pending D6.

## Work and exact blocker

FAIL: fetching the required `ai/codex-fix-resize-hygiene` baseline failed. The remote does not advertise that branch. The CX2 commit cannot be identified from the supplied request; substituting main or the unrelated historical `ai/codex-b3-cx2` would not satisfy the baseline requirement. Followed the card's gate-stop instruction and created a report-only branch instead of `ai/codex-v29-flag-flip-r2`.

PASS: read the request, checked the repository for AGENTS.md (none found), inspected the real verification script, and confirmed the source flip branch and both source commits exist. Source commits were fetched for inspection only; neither was cherry-picked.

```text
$ git fetch origin '+main:refs/remotes/origin/main' '+ai/codex-fix-resize-hygiene:refs/remotes/origin/ai/codex-fix-resize-hygiene' '+ai/codex-v29-flag-flip:refs/remotes/origin/ai/codex-v29-flag-flip'
fatal: couldn't find remote ref ai/codex-fix-resize-hygiene
[exit 128]

$ git ls-remote --heads origin ai/codex-fix-resize-hygiene ai/codex-v29-flag-flip ai/codex-v29-flag-flip-r2 ai/codex-v29-flag-flip-r2-report
b82ccbaf7c2be588300014c539665f580bf030cb refs/heads/ai/codex-v29-flag-flip
[exit 0; only the source flip branch was present before this task's push]

$ git ls-remote --exit-code --heads origin ai/codex-fix-resize-hygiene
[no output; exit 2]

$ git fetch origin '+ai/codex-v29-flag-flip:refs/remotes/origin/ai/codex-v29-flag-flip'
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      ai/codex-v29-flag-flip -> origin/ai/codex-v29-flag-flip
[exit 0]

$ git log -3 --format='%H %an <%ae> %s' origin/ai/codex-v29-flag-flip
b82ccbaf7c2be588300014c539665f580bf030cb ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> docs: record guarded cut-over commit and one-commit revert
28a5469f4d5d6d23d2bf1d0178b089fb75e5a835 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> feat(web): prepare guarded v2 default and classic rollback build
fd318c4910e50152fdb0522593762288e76efbda ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> docs: record verified v16 stack and stage screenshots
```

## Checks actually run

This is a reports-only diff. Full suite skipped: docs only. Installation and generation were still attempted as required; neither passed. No check of the unapplied flip is claimed.

FAIL: `pnpm install --frozen-lockfile` (exit 1):

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

FAIL: one environment retry, `CI=true pnpm install --frozen-lockfile` (exit 1; no source fix):

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Packages: +504
✓ Lockfile passes supply-chain policies (520 entries in 16.6s)
Progress: resolved 504, reused 0, downloaded 495, added 504, done

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

FAIL: `pnpm gen:deno && git diff --exit-code -- supabase/functions` (exit 1). The runtime's pnpm fallback started an automatic dependency installation instead of reaching the generator. This overlapped the installation retry and failed during setup:

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
✓ Lockfile passes supply-chain policies (520 entries in 16.4s)
[ENOENT] ENOENT: no such file or directory, mkdir '/workspace/taskbar-hero/node_modules/.pnpm/@wagmi+core@2.22.1_@tanstack+query-core@5.104.5_@types+react@19.3.0_react@19.3.1_typesc_1aa2edade2e58a7fbbd2f8264d1a31f8/node_modules'
[ERROR] Command failed with exit code 254: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
```

The installer also generated `allowBuilds` placeholders in `pnpm-workspace.yaml`. Immediately restored that file from HEAD; no workspace, lockfile, or dependency declaration change is retained. Did not run `pnpm approve-builds` or change policy. No further installation fixes attempted.

PASS: standalone `git diff --exit-code -- supabase/functions` (exit 0, no output). This confirms no tracked function changes, **not** successful generation.

PASS: after restoring the generated workspace change, `git diff --exit-code -- pnpm-lock.yaml pnpm-workspace.yaml package.json apps/web/package.json` (exit 0, no output).

NOT VERIFIED: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `cd apps/web && pnpm test:e2e`, classic rollback build/tests, default production build, and preview filename/content grep were not run because the baseline gate stopped implementation. No stale dist output used as evidence.

## Acceptance and self-check

- FAIL: create the requested implementation branch from the CX2 baseline and apply the two flip commits. Required remote baseline is missing; report-only fallback used.
- NOT VERIFIED: cherry-pick conflict resolution, full unit suite, and whole browser suite on the integrated stack.
- NOT VERIFIED: classic rollback (`VITE_GAME_V2=0`) build and classic tests.
- NOT VERIFIED: preview guard fix and default production tree-shaking. No default build or grep was run; no preview absence claim.
- PASS: state the live prerequisite explicitly: **the flip needs the V8 migration applied live first; the live project's migration list currently ends at `20261023181343 forge_today`, so v2 server mode would fail. NOT VERIFIED here.** This live-state statement comes from the user's card; no live Supabase access, migration application, or database writes were performed.
- PASS: identify the existing source one-commit rollback: `git revert 28a5469f4d5d6d23d2bf1d0178b089fb75e5a835`. Inspected its seven-file diff and the separate documentation commit `b82ccbaf7c2be588300014c539665f580bf030cb`. NOT VERIFIED: an r2 rollback hash or execution, since no r2 implementation commit exists. A future cherry-pick/squash will have a new hash that must replace the source hash in its rollback instructions.
- PASS: no existing test assertion changed; no tests skipped, disabled, weakened, deleted, or given longer timeouts. No product fix rounds used.
- PASS: only the allowlisted report is retained. No contracts, auth/SIWE, secrets, content numbers, signature, migration, dependency, or workspace edits retained. No PR, main push/merge, GitHub Actions dispatch, deploy, Vercel change, Site sharing change, repository visibility change, or contest submission.

## Final repository gates and files touched

Final gate output and report-only push result are recorded below after committing the report.

## What is needed to continue

Restore `ai/codex-fix-resize-hygiene` with the reported CX2 commit, or supply that exact full commit hash so the required baseline can be fetched and verified. Then start the requested implementation branch from that commit and perform the cherry-picks, allowed preview fix, and all acceptance checks within the two-fix-round limit.

The current installer also needs a supported dependency setup. It requests build approval that would generate `pnpm-workspace.yaml` changes, a forbidden file outside the allowlist; those changes were restored. Resolve the runtime setup within the existing dependency policy before relying on pnpm checks. No new file permission is needed for the missing-baseline gate itself.
