STATUS: BLOCKED

Card CX5, 2026-10-26 (Asia/Ho_Chi_Minh). No implementation delivered. Compared three local production builds at the requested base c5aa2b53f7547108438603004f6f857b46c322bb, on ai/codex-check-live-v2-r2. No suitable existing production marker was found. No product code or tests were changed. Pushed the prescribed gate-stop report-only branch ai/codex-check-live-v2-r2-report from origin/main (3379777). No PR, Actions, merge, or live request was made.

## Exact blockers and continuation

1. `v2-shell`, `data-layout`, and the other StageLayout literals survive flag-off production tree shaking. The flag is read through `isGameV2()`; importing StageLayout statically leaves its strings in both bundles. Flag-on-only string literals outside preview chunks are all associated with the dev preview import, route parameters, and generated assets (enumerated below). Thus neither a stable StageLayout string nor another suitable production string distinguishes these builds. CX3r is not present at the requested base: it still emits SpritePreview with flag=1. No CX3r production source change was simulated or made.

Smallest proposed product-side addition (NOT applied): on the existing root div in `apps/web/src/layout/StageLayout.tsx`, add `data-game-v2={import.meta.env.VITE_GAME_V2 === '1' ? 'stage-v2-enabled' : undefined}`. The directly compiled conditional is intended to retain `stage-v2-enabled` only in flag-on JS even when StageLayout itself survives in both builds. Rebuild all three modes to validate this proposal before adopting the value as V2_MARKER. Authorization to change that source file, or a revised base containing a suitable existing marker, is needed. This report does not claim the proposed marker has been tested.

2. The requested base has two inherited changed paths outside this card's allowlist: `reports/check-live-v2.md` (absent on main) and `scripts/check-live.mjs`. Following self-check step 3, temporarily restored the runner to origin/main and removed the old report in the isolated task worktree. That immediately exposed an existing offline regression failure: the v1 runner on main has no v2 integration. Retaining the inherited integration needs `scripts/check-live.mjs` allowed. Weakening/deleting the existing test would violate this card. No fix rounds were attempted because the fix requires a file outside the allowlist; implementation stopped. The temporary cleanup was discarded before creating the clean report-only fallback, so neither out-of-scope file appears in the delivered diff.

The existing marker, marker comment, tests, and runbook were not revised: there is no verified replacement to substitute, and the runner scope gate also prevents a passing task branch. This is a blocker report, not a completed marker fix.

## Workspace and gate output

The user's original checkout was on ai/codex-v5-forge with unrelated uncommitted package and Supabase changes. Used an isolated worktree at `/Users/bao/.codex/worktrees/check-live-v2-r2/taskbar hero`; original work was preserved. No AGENTS.md was found in the inspected project tree.

```text
$ git fetch origin +main:refs/remotes/origin/main +ai/codex-check-live-v2:refs/remotes/origin/ai/codex-check-live-v2
(exit 0)
$ git rev-parse origin/ai/codex-check-live-v2
c5aa2b53f7547108438603004f6f857b46c322bb
$ git diff --name-only origin/main...origin/ai/codex-check-live-v2
docs/runbook.md
reports/check-live-v2.md
scripts/check-live-v2.mjs
scripts/check-live-v2.test.mjs
scripts/check-live.mjs
```

FAIL: inherited task branch scope gate; the old report and runner are outside the allowlist. Final fallback branch contains only this allowed report.

## Exact comparison build commands

Run from the isolated repository root after `pnpm install --frozen-lockfile`:

```sh
mkdir -p /tmp/cx5-r2-evidence
VITE_SUPABASE_URL=https://cx5-dummy.supabase.co VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build --outDir /tmp/cx5-r2-evidence/off > /tmp/cx5-r2-evidence/build-off.log 2>&1
VITE_SUPABASE_URL=https://cx5-dummy.supabase.co VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web build --outDir /tmp/cx5-r2-evidence/on > /tmp/cx5-r2-evidence/build-on.log 2>&1
env -u VITE_GAME_V2 VITE_SUPABASE_URL=https://cx5-dummy.supabase.co pnpm --filter @taskbar-hero/web build --outDir /tmp/cx5-r2-evidence/unset > /tmp/cx5-r2-evidence/build-unset.log 2>&1
```

All three build processes exited 0. Actual summary lines:

off:

```text
../../../../../../../../tmp/cx5-r2-evidence/off/assets/index-DMK2UL2Q.css               39.42 kB │ gzip:   8.06 kB
../../../../../../../../tmp/cx5-r2-evidence/off/assets/index-CIkPhxBz.js               136.16 kB │ gzip:  40.03 kB
✓ built in 503ms
```

on:

```text
../../../../../../../../tmp/cx5-r2-evidence/on/assets/SpritePreview-DrGwRUam.css        0.69 kB │ gzip:   0.34 kB
../../../../../../../../tmp/cx5-r2-evidence/on/assets/index-DMK2UL2Q.css               39.42 kB │ gzip:   8.06 kB
../../../../../../../../tmp/cx5-r2-evidence/on/assets/SpritePreview-3p1eMsUi.js        22.86 kB │ gzip:   8.51 kB
../../../../../../../../tmp/cx5-r2-evidence/on/assets/index-Dqp4GYit.js               136.56 kB │ gzip:  40.21 kB
✓ built in 337ms
```

unset:

```text
../../../../../../../../tmp/cx5-r2-evidence/unset/assets/index-DMK2UL2Q.css               39.42 kB │ gzip:   8.06 kB
../../../../../../../../tmp/cx5-r2-evidence/unset/assets/index-CIkPhxBz.js               136.16 kB │ gzip:  40.03 kB
✓ built in 658ms
```

## Exact grep commands and output

```sh
for mode in off on unset; do
  echo "$mode:"
  rg -l -F 'v2-shell' /tmp/cx5-r2-evidence/$mode/assets/*.js
  echo "v2-shell grep EXIT $?"
  rg -o 'SpritePreview-[A-Za-z0-9_-]+\.js' /tmp/cx5-r2-evidence/$mode/assets/index-*.js
  echo "preview grep EXIT $?"
done
```

```text
off:
/tmp/cx5-r2-evidence/off/assets/index-CIkPhxBz.js
v2-shell grep EXIT 0
preview grep EXIT 1
on:
/tmp/cx5-r2-evidence/on/assets/index-Dqp4GYit.js
v2-shell grep EXIT 0
SpritePreview-3p1eMsUi.js
SpritePreview-3p1eMsUi.js
preview grep EXIT 0
unset:
/tmp/cx5-r2-evidence/unset/assets/index-CIkPhxBz.js
v2-shell grep EXIT 0
preview grep EXIT 1
```

These greps disprove the preferred StageLayout class marker and reproduce why SpritePreview currently appears unique. Hashed filenames are evidence only; no hashed filename was adopted as a marker.

Also parsed all JS with TypeScript's `createSourceFile`, walked string and no-substitution template literals, excluded files whose names begin `SpritePreview-` or `ArenaPreview-`, then subtracted flag-off literal values from flag-on values. Actual output:

```text
Flag-on-only string literals (excluding preview chunks):
"./SpritePreview-3p1eMsUi.js"
"assets/SpritePreview-3p1eMsUi.js"
"assets/SpritePreview-DrGwRUam.css"
"assets/react-KPuNr9iS.js"
"dev"
"sprites"
Flag-off / unset literal sets identical: true
```

The `dev` / `sprites` values are the preview route check in main.tsx. All other unique values are generated asset references for its dynamic import. No suitable non-preview production literal emerged. The flag-off and unset literal sets are identical.

## Required checks actually run

The following checks ran from the isolated task branch root after the allowlist restoration, before creating the report-only fallback. All six repo checks completed successfully. The separate script tests below failed and are NOT included in `pnpm test` (root `pnpm test` only runs workspace package tests).

PASS: `pnpm install --frozen-lockfile`

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 462ms using pnpm v10.28.0
```

PASS: `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/check-live-v2-r2/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

PASS: `pnpm typecheck`

```text

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/check-live-v2-r2/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

PASS: `pnpm lint`

```text

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/check-live-v2-r2/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

PASS: `pnpm test`

```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test: Done
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test: Done
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test: Done
```

PASS: `pnpm build`

```text
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/check-live-v2-r2/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ built in 348ms
apps/web build: Done
```

FAIL: `node --test scripts/check-live-v2.test.mjs` (exit 1), after restoring `scripts/check-live.mjs` to main as the allowlist requires. Exact failing test/assertion excerpt:

```text
✔ discovers only v2 directories, sorted, including a future boss function (2.030333ms)
✔ anonymous POST requires exactly 401 and distinguishes function from gateway (0.14925ms)
✔ CORS requires a 2xx and the matching or wildcard origin (11.406917ms)
✔ HTML modules resolve against SITE and ignore external, classic and non-asset scripts (0.621625ms)
✔ real API detection looks for the configured Supabase host (0.077584ms)
✔ marker verdict covers pre/post with present/absent markers, and skip (0.068958ms)
✔ fresh import makes no network request (0.451708ms)
✔ real repository has v2-state and valid v2 directory names (0.217417ms)
✖ live runner preserves v1 lines in off mode and counts v2 failures in its exit status (213.549417ms)
ℹ tests 9
ℹ suites 0
ℹ pass 8
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 350.040083

✖ failing tests:

test at scripts/check-live-v2.test.mjs:86:1
✖ live runner preserves v1 lines in off mode and counts v2 failures in its exit status (213.549417ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /FAIL  function v2-state refuses anonymous POST - offline fixture/. Input:
```

The remaining assertion input contains v1 lines only, ending `21 CHECK(S) FAILED`, all fetches replaced by the test's `offline fixture`. This test performed no live requests. Required fix file: `scripts/check-live.mjs`, to retain the inherited v2 runner integration. No test was skipped, disabled, weakened, deleted, changed to .only/.skip, or given a higher timeout; no snapshot was changed. Pre-existing package-suite skipped/expected-fail counts above were not modified.

E2E was not required: no apps/web/**, packages/**, package.json or pnpm-lock.yaml change is delivered. No Forge checks were required by this diff. No live runner command was invoked except its existing test harness with fetch stubbed before import.

After switching to the report-only fallback, repeated its required checks from the root (both exit 0). Full suite skipped on the final branch: docs only; the earlier full-suite output above is from the investigation branch and is not claimed as a final-branch full-suite rerun.

PASS: `pnpm install --frozen-lockfile`

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 395ms using pnpm v10.28.0
```

PASS: `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/check-live-v2-r2/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

## Acceptance self-check

- PASS: started investigation on ai/codex-check-live-v2-r2 from the exact requested c5aa2b5 base; preserved unrelated original checkout changes.
- PASS: built apps/web with the same dummy Supabase URL for flag=0, flag=1, and unset; exact commands and actual grep results recorded.
- PASS: investigated stable production literals, excluded dev/preview chunks, added no product code; no suitable marker found, smallest product-side proposal documented.
- FAIL: replacement V2_MARKER and comment not delivered; no verified candidate exists.
- FAIL: build-output/fixture regression asserting marker only in flag-on not delivered; such an assertion cannot truthfully pass with the available production literals. Every existing test was preserved.
- FAIL: runbook marker paragraph not updated because no valid replacement was established.
- PASS: report includes exact build commands, grep output, blockers and real required check outputs.
- PASS: install, generated Deno drift, typecheck, lint, root package tests and build passed during investigation; final report-only install and drift also passed.
- FAIL: existing offline runner regression after mandatory inherited scope cleanup; needs the runner file allowed, no permitted fix was available.
- PASS: final delivered changes confined to reports/check-live-v2-r2.md; no forbidden product/Supabase/contract/workflow changes retained, no live request.
- PASS: no test weakening, extra timeout, test deletion, or golden change.
- PASS: gate-stop report-only branch created from main, committed with required author, and pushed (final verification recorded below).

## NOT verified

No CX3r-applied build was available at this base; no production deployment/health/flag state was requested or checked. Proposed product attribute is unimplemented and unverified. No suitable replacement marker, marker fixture regression, or finished runbook update is delivered. E2E and Forge were not run because delivered scope does not trigger them. Final fallback branch received docs-only checks, not another full suite. To continue, authorize the minimal StageLayout marker (or provide a base with a suitable existing marker) and allow retaining `scripts/check-live.mjs`'s inherited v2 integration. Rebuild all modes, implement marker/fixtures/docs, rerun required checks, then push the implementation branch.

## Final scope and author verification

Actual checkpoint output at the first report commit, before adding this verification section:

```text
$ git fetch origin +main:refs/remotes/origin/main && git diff --name-only origin/main...HEAD
reports/check-live-v2-r2.md
$ git diff --stat origin/main...HEAD
 reports/check-live-v2-r2.md | 316 ++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 316 insertions(+)
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
$ git status --short
(no output)
$ git diff --check origin/main...HEAD
(no output; exit 0)
```

PASS: only the allowed report is delivered. PASS: all fallback branch commits use the required author. This section increases the report's line count beyond the checkpoint stat above. Push destination is exclusively `origin ai/codex-check-live-v2-r2-report`, using `git push -u origin ai/codex-check-live-v2-r2-report`. No PR, Actions, or merge is part of this task.
