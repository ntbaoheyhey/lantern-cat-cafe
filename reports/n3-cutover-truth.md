STATUS: PARTIAL

# CXN3 — cut-over truth (living draft)

1 November 2026 (Asia/Ho_Chi_Minh). The documentation, catalog query and unsigned checker are implemented. **Live readiness remains NO-GO**: the strict oversized probes fail, and the pre-existing Deno import guard is not green. No deployment, SQL application to a live database, auth change, wallet operation, transaction or workflow was performed.

## Pieces and acceptance

| Test | Result | Evidence |
| --- | --- | --- |
| T1: current cut-over procedure | PASS | Recorded Oct 26/27 owner confirmations, Vercel environment switch, D8 dropped, owner-only release steps, rollback retaining all v2 rows. Retired code-switch procedure only in History. Eight Node tests include the retired-reference check. |
| T2: exact pending migration table | PASS | Automated filename comparison: Nov 3, 4, 6 and 7, including CXN1; each is newer than 20261102000000. Pending means awaiting owner confirmation, not evidence of absence. |
| T3: read-only SQL and both migration states | PASS | [Three PGlite tests](n3-cutover-truth/checks/schema.log): all migrations 17/17 true; through Nov 2, 10 true and exactly seven newer objects false. One statement, catalog-only reads, no write keyword including comments. |
| T4: classifier with fake responses | PASS | [Eight Node tests](n3-cutover-truth/checks/classifier.log): strict 401, 503 hint, 500/network failures, CORS, strict 400/413, all nine routes without credentials, documentation consistency. No network in tests. |
| T5: execute unsigned live check | PASS execution; FAIL health | [Actual live output](n3-cutover-truth/checks/live-v2.log): 18 pass, 9 fail. Eight oversized requests returned 401; v2-boss-fight oversized timed out. |
| T6: no new broken links | PASS comparison | Main and this branch both have the same one broken path. The four edited operational docs pass all 41 path/link checks. The global checker is not falsely reported green. |
| T7: local install/drift/typecheck/lint/test/build | PASS | Fresh full run plus classic build all pass; output tails below. Existing expected failures/skips are inherited unchanged. |
| Additional Deno deployment import guard | FAIL, pre-existing | [80 unresolved edges](n3-cutover-truth/checks/deno-imports.log); current and untouched-main outputs compare byte-for-byte equal. Generated-map drift is a separate check and passes. |
| PR verification wrapper | NOT VERIFIED yet | Run with the draft PR number, without --comment, after delivery. |

## What changed

- Replaced the stale cut-over checklist and kept go-live/runbook consistent. deploy.md receives only the authorized link to the function deployment step.
- The 17-row catalog inventory covers six v2 tables, integrity table/RPCs, restrictive false nonce policy, budget table/RPCs, cancel/reissue RPC, cancelled status and CXN1's exact reissue-resolve signature. It does not execute application functions or claim to compare their bodies.
- All nine v2 routes get OPTIONS, unsigned empty POST and oversized POST probes. `--v2` avoids the legacy nonce-issuance check. The existing script had no anon key; no key-reading capability was added.
- Continued existing implementation commit `d5755ad` and report commit `139abbe`, both based on current main `1fb25ed`. Preserved the unfinished documentation corrections from the older worktree in a separate checkout: verify-pr now shows its required PR-number argument; obsolete Founder-gate prose is removed. The original worktree and its edits are untouched.

## Problems found and fixed

- Fixed stale operational instructions: a committed code change is not the v2 switch; Vercel's build-time environment value and the resulting deployment are. Historical owner confirmations are distinguished from current observations.
- Fixed incomplete function-health coverage with strict, credential-free v2 probes and offline classifier tests.
- Fixed the incomplete verify-pr invocation by documenting its required PR number.
- Found auth-before-body ordering in `supabase/functions/_shared/v2/http.ts`: unsigned oversized bodies are rejected with 401 before size parsing. An unsigned 401 also cannot prove that budget SQL exists because admission follows authentication. The requested 400/413 gate remains strict and fails visibly. No auth/server fix is attempted in this mission.
- Found the deployment import guard's 80 unresolved `./index` edges across five game-rules files and sixteen function maps, identical on main. This is outside this mission; the runbook tells the owner to stop if that guard fails.
- Found no manual Edge Function command in the original deploy.md, only contract commands. The checklist expands the existing workflow's public function list/options instead; a test compares all 18 functions and flags to that source. No workflow file was edited.
- The single live timeout's cause is NOT VERIFIED. No network retries or increased timeout were added.

## Tier 2 changes

None. All work remains in the explicit CXN3 docs/scripts/tests/report zone. No function, migration, auth, economy, dependency, art or workflow changes.

## Additional checks

```text
$ node --test scripts/check-live.test.mjs
8 tests; 8 pass; 0 fail; 0 skipped
$ pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/live-schema.test.ts --reporter verbose --silent=false
live-schema all migrations: 17/17 true
live-schema through 20261102: 10 true, 7 false
Test Files 1 passed; Tests 3 passed
$ node --check scripts/check-live.mjs
exit 0
$ rg -ni '\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|GRANT)\b' docs/proposals/sql/check-live-schema.sql
no output; rg exit 1 (the required no-match result)
$ node scripts/check-links.mjs docs/cutover-v2.md docs/go-live.md docs/runbook.md docs/deploy.md
Checked 4 markdown files and 41 links/paths. All exist.
$ cmp <current-import-guard-output> <untouched-main-import-guard-output>
exit 0; both contain 80 unresolved imports
$ env -u SITE_URL -u SUPABASE_URL -u FUJI_RPC_URL node scripts/check-live.mjs --v2
18 PASS; 9 FAIL; exit 1
```

The live invocation explicitly unsets optional URL overrides and uses only the public defaults. No .env file, JWT, API key or wallet was read or sent. SQL was applied only to disposable PGlite instances. The default checker (which issues an auth nonce) was not run.

## NOT verified and outside-scope findings

- Live catalog, migration application history, Vercel settings and signed-in gameplay need the owner's separate checks. No secrets/admin access was used.
- Successful-authentication oversized-body behavior and real budget enforcement are not proved by unsigned probes.
- The local file supabase-manual/v2-rollback.sql is absent from the repository and was not found under the project workspace; it was not executed. The committed rollback proposal remains a reference only.
- Release rehearsal and browser gameplay are not exercised by this docs/scripts-only continuation. There is no UI change requiring screenshots; the affected-area integration checks are PGlite and the HTTP probes above.
- Existing proposal text still contains historical Founder or not-yet-live descriptions; the operational checklist now distinguishes these from current owner confirmations.
- SECRET FOUND: docs/deploy.md:18, masked. The document identifies this as Anvil's public default local account example; no key bytes were copied into this report or tool output. The authorized deploy.md change is only a link.
- One broken path remains in docs/proposals/rune-skill-system/README.md, pointing at the unmerged tbh-index-research proposal.

## Delivery and reproduction

Delivery branch: `ai/codex-n3-cutover-truth`; baseline `1fb25ed` includes CXN2 #238. Current isolated checkout: `/Users/bao/.codex/worktrees/mega-cxn3/taskbar-hero` (detached continuation to preserve the older checked-out branch and its edits). Push targets the existing named remote branch without force.

Use Node 20+ and pnpm 10.28.0. Run frozen install, Deno drift, typecheck, lint, tests and build; then the explicit commands above. Every commit uses `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>` and ends with [skip ci]. Draft PR only; do not merge.

<!-- MEGA verification evidence -->

## Executed checks

| Check | Exit | Result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS |
| `pnpm gen:deno` | 0 | PASS |
| `git diff --exit-code -- supabase/functions` | 0 | PASS |
| `pnpm typecheck` | 0 | PASS |
| `pnpm lint` | 0 | PASS |
| `pnpm test` | 0 | PASS |
| `pnpm build` | 0 | PASS |
| `pnpm --filter @taskbar-hero/web build` | 0 | PASS |
| `node scripts/check-links.mjs --json` | 1 | BASELINE DEBT — compare count below |

```text
$ pnpm install --frozen-lockfile
# exit 0; 0.8 seconds
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
Done in 720ms using pnpm v10.28.0
```

```text
$ pnpm gen:deno
# exit 0; 0.4 seconds

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/mega-cxn3/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

```text
$ git diff --exit-code -- supabase/functions
# exit 0; 0.0 seconds
```

```text
$ pnpm typecheck
# exit 0; 14.9 seconds

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/mega-cxn3/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

```text
$ pnpm lint
# exit 0; 11.4 seconds

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/mega-cxn3/taskbar-hero
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

```text
$ pnpm test
# exit 0; 71.4 seconds
packages/chain test:  Test Files  3 passed (3)
packages/chain test:       Tests  32 passed (32)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  32 passed (32)
supabase/tests test:       Tests  544 passed | 1 expected fail (545)
packages/game-rules test:  Test Files  24 passed | 3 skipped (27)
packages/game-rules test:       Tests  366 passed | 2 expected fail | 11 skipped (379)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  111 passed (111)
apps/web test:       Tests  1303 passed (1303)
apps/web test:    Duration  25.03s (environment 48%, tests 38%, import 9%, transform 5%)
apps/web test: Environment  jsdom was created 111 times · 101.58s total, 48% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

```text
$ pnpm build
# exit 0; 9.8 seconds
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxn3/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1817 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.13 kB │ gzip:   0.77 kB
apps/web build: dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
apps/web build: dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/StageScene-EiK_cC7z.js           15.73 kB │ gzip:   5.79 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/index-Dg86klCB.js               239.71 kB │ gzip:  67.18 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 400ms
apps/web build: Done
```

```text
$ pnpm --filter @taskbar-hero/web build
# exit 0; 7.0 seconds
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxn3/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1817 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.13 kB │ gzip:   0.77 kB
dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/StageScene-EiK_cC7z.js           15.73 kB │ gzip:   5.79 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/index-Dg86klCB.js               239.71 kB │ gzip:  67.18 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 472ms
```

```text
$ node scripts/check-links.mjs --json
# exit 1; 0.1 seconds
Checked 67 files, 795 paths; broken count 1.
```

## Diff snapshot

Recorded from the complete worktree before the report-only commit.

```text
$ git diff --stat origin/main
 docs/cutover-v2.md                               | 486 ++++++-----------------
 docs/deploy.md                                   |   5 +
 docs/go-live.md                                  |  30 +-
 docs/proposals/sql/check-live-schema.sql         |  43 ++
 docs/runbook.md                                  |  22 +-
 reports/n3-cutover-truth.md                      |  79 ++++
 reports/n3-cutover-truth/checks/classifier.log   |  43 ++
 reports/n3-cutover-truth/checks/deno-imports.log |  80 ++++
 reports/n3-cutover-truth/checks/live-v2.log      |  33 ++
 reports/n3-cutover-truth/checks/schema.log       |  18 +
 scripts/check-live.mjs                           |  49 ++-
 scripts/check-live.test.mjs                      |  79 ++++
 supabase/tests/src/live-schema.test.ts           |  47 +++
 13 files changed, 627 insertions(+), 387 deletions(-)
$ git diff --name-only origin/main
docs/cutover-v2.md
docs/deploy.md
docs/go-live.md
docs/proposals/sql/check-live-schema.sql
docs/runbook.md
reports/n3-cutover-truth.md
reports/n3-cutover-truth/checks/classifier.log
reports/n3-cutover-truth/checks/deno-imports.log
reports/n3-cutover-truth/checks/live-v2.log
reports/n3-cutover-truth/checks/schema.log
scripts/check-live.mjs
scripts/check-live.test.mjs
supabase/tests/src/live-schema.test.ts
```
