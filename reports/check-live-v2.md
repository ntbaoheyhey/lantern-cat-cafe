STATUS: DONE

## Fix round 3 (2026-10-25)

Merged latest origin/main (3379777) into the existing branch; ran gen:deno with no drift. Corrected only the authorized missing local contracts/.env prose at runbook line 47. Existing implementation is retained; v1 checks and output are byte-identical to main (offline regression test passes). PASS: all seven helper categories, link check, install, generated maps, typecheck, lint, full suite (game-rules 326; Supabase 385; web 1037; other packages green), root build. idle timing test passed in the full suite; no retry needed. PASS: runbook says CHECK_LIVE_V2=post after the flag flip. No product, auth, contract, workflow, SQL or environment file edits.

NOT VERIFIED: production health. One CHECK_LIVE_V2=off invocation completed: 21 failures caused by ECONNREFUSED / ETIMEDOUT in this environment, not deployment or v2-marker evidence. No second live invocation made. The off mode deliberately runs no v2 lines; no claim is made about deployed v2 functions or flag state. Continue by running CHECK_LIVE_V2=pre from a network-capable environment; post after cut-over. No blocker to implementation review.

### q1-helpers.txt

```text
$ node --test scripts/check-live-v2.test.mjs
✔ discovers only v2 directories, sorted, including a future boss function (2.477721ms)
✔ anonymous POST requires exactly 401 and distinguishes function from gateway (0.295857ms)
✔ CORS requires a 2xx and the matching or wildcard origin (25.671125ms)
✔ HTML modules resolve against SITE and ignore external, classic and non-asset scripts (1.263288ms)
✔ real API detection looks for the configured Supabase host (0.173291ms)
✔ marker verdict covers pre/post with present/absent markers, and skip (0.13272ms)
✔ fresh import makes no network request (0.855862ms)
✔ real repository has v2-state and valid v2 directory names (0.567086ms)
✔ live runner preserves v1 lines in off mode and counts v2 failures in its exit status (63.980402ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 158.939904

EXIT 0; runtime 0.19s

```

### q1-links.txt

```text
$ node scripts/check-links.mjs docs/runbook.md
Checked 1 markdown files and 7 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.

EXIT 0; runtime 0.03s

```

### q1-install.txt

```text
$ pnpm install --frozen-lockfile
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
Done in 659ms using pnpm v10.28.0

EXIT 0; runtime 0.72s

```

### q1-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.30s

```

### q1-typecheck.txt

```text
$ pnpm typecheck

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

EXIT 0; runtime 13.46s

```

### q1-lint.txt

```text
$ pnpm lint

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

EXIT 0; runtime 13.61s

```

### q1-test.txt

```text
$ pnpm test

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  11:20:25
packages/chain test:    Duration  283ms (import 57%, transform 20%, tests 12%, worker 11%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  11:20:25
packages/auth test:    Duration  576ms (import 70%, tests 26%, transform 3%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Start at  11:20:26
supabase/tests test:    Duration  41.98s (tests 89%, import 10%, transform 1%)
supabase/tests test:     Isolate  18 workers spawned · ~127ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.16s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  11:20:26
packages/game-rules test:    Duration  80.05s (tests 98%, import 1%, transform 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  11:21:46
packages/api-contract test:    Duration  258ms (transform 67%, import 26%, tests 4%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test:    Start at  11:21:47
apps/web test:    Duration  70.46s (environment 56%, tests 30%, import 11%, transform 2%)
apps/web test: Environment  jsdom was created 75 times · 35.65s total, 56% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 153.10s

```

### q1-build.txt

```text
$ pnpm build

> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build$ tsc --noEmit
packages/auth build: Done
supabase/tests build$ tsc --noEmit
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1725 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-DMK2UL2Q.css               39.42 kB │ gzip:   8.06 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-CR0-bjaD.js               135.95 kB │ gzip:  39.92 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 819ms
apps/web build: Done

EXIT 0; runtime 14.27s

```

### q1-live.txt

```text
$ CHECK_LIVE_V2=off node scripts/check-live.mjs
Site https://web-zeta-tan-13.vercel.app
Supabase https://qoalewtxflagoprrxrgh.supabase.co
Fuji RPC https://api.avax-test.network/ext/bc/C/rpc

FAIL  site loads - fetch failed (ECONNREFUSED)
FAIL  function auth-nonce refuses anonymous POST - fetch failed (ECONNREFUSED)
FAIL  function auth-verify refuses anonymous POST - fetch failed (ECONNREFUSED)
FAIL  function game-state refuses anonymous POST - fetch failed (ECONNREFUSED)
FAIL  function idle-claim refuses anonymous POST - fetch failed (ECONNREFUSED)
FAIL  function equip refuses anonymous POST - fetch failed (ECONNREFUSED)
FAIL  function boss-fight refuses anonymous POST - fetch failed (ETIMEDOUT)
FAIL  function upgrade refuses anonymous POST - fetch failed (ETIMEDOUT)
FAIL  function relic-forge refuses anonymous POST - fetch failed (ETIMEDOUT)
FAIL  function relic-mint-report refuses anonymous POST - fetch failed (ETIMEDOUT)
FAIL  relic 1 metadata and image - fetch failed (ETIMEDOUT)
FAIL  relic 2 metadata and image - fetch failed (ETIMEDOUT)
FAIL  relic 3 metadata and image - fetch failed (ETIMEDOUT)
FAIL  relic 4 metadata and image - fetch failed (ETIMEDOUT)
FAIL  relic 64-hex metadata path (what wallets request) - fetch failed (ETIMEDOUT)
PASS  README has both contract addresses - 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D, 0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93
FAIL  Fuji RPC reports chain 43113 - fetch failed (ETIMEDOUT)
FAIL  RelicNFT has code - fetch failed (ECONNREFUSED)
FAIL  RelicNFT signer() is set - fetch failed (ETIMEDOUT)
FAIL  RelicNFT owner() is set - fetch failed (ETIMEDOUT)
FAIL  RelicNFT uri(1) points at the site - fetch failed (ETIMEDOUT)
FAIL  RelicMarket relicNFT() is the RelicNFT - fetch failed (ETIMEDOUT)

21 CHECK(S) FAILED

EXIT 1; runtime 32.80s

```

## Files touched and reasons

```text
docs/runbook.md                |   4 +-
 reports/check-live-v2.md       | 586 +++++++++++++++++++++++++++++++++++++++++
 scripts/check-live-v2.mjs      |  57 ++++
 scripts/check-live-v2.test.mjs | 106 ++++++++
 scripts/check-live.mjs         |  66 ++++-
 5 files changed, 817 insertions(+), 2 deletions(-)
```

Report file records evidence and review gates.

## Prior report (historical; superseded by round 3)

STATUS: BLOCKED

## Fix round 2 (2026-10-25)

Implemented C16 after rebasing the existing task branch onto origin/main (cdcb0cf). Corepack pnpm 10.28.0 with a temporary PATH wrapper and CI=true resolved the original installation blocker. No workspace policy, lockfile, app, package, function, or workflow change is included. The old report is retained verbatim below as historical context; its old acceptance/status statements do not describe this fix round.

### Current blocker and what is needed

`node scripts/check-links.mjs docs/runbook.md` fails on the pre-existing reference to missing `contracts/.env` in **docs/runbook.md:47**, under **Set the metadata URI** (origin/main line 45). C16 permits edits to the **Live check** section only. Fixing the prose requires permission to edit this additional section of docs/runbook.md; creating contracts/.env or changing scripts/check-links.mjs is also outside the allowlist and was not attempted. No secret file, placeholder, checker exception, or workaround was created. Work stopped at this out-of-scope blocker; commands already running were allowed to finish.

The unit suite also reported a performance failure in packages/game-rules/src/v2/idle/idle.test.ts:207: `expect(elapsed).toBeLessThan(150)`, in “handles an eight-hour claim under 50 ms with a generous 150 ms CI ceiling”. This ran concurrently with typecheck/lint/build, so CPU contention may have contributed; it is not proven. No serial retry was run because the independent link-check failure then required stopping. Any persistent algorithm fix would require permission for packages/game-rules/src/v2/idle/claim.ts and/or drops.ts after diagnosis; the test and its threshold must remain unchanged.

### Delivered behavior and marker evidence

- scripts/check-live.mjs appends v2 checks after the unchanged v1 sections and feeds failures through check()/report() into the existing summary and exit code. Invalid modes fail visibly. SKIP is supported without increasing the failure count.
- scripts/check-live-v2.mjs exports folder discovery, POST/CORS classifiers, module extraction, real-API detection and marker verdicts. Import performs no network or filesystem operations. Discovery is sorted and includes future v2-boss-fight automatically.
- scripts/check-live-v2.test.mjs covers all seven requested categories plus future-folder discovery and an offline runner test for unchanged v1 output, off mode, failure counting, and nonzero exit status. No network is used in these tests.
- docs/runbook.md changes only the Live check section: v2 behavior, CHECK_LIVE_V2 modes and the cut-over instruction.

Marker: **`SpritePreview-`**. Compared two production builds using the same dummy VITE_SUPABASE_URL, one with VITE_GAME_V2 unset and one with VITE_GAME_V2=1. The v2-shell UI class remains in both builds and was rejected. SpritePreview- is absent from all flag-off JavaScript and occurs three times in the flag-on entry module. It is the stable chunk prefix from main.tsx's dynamic import guarded by DEV || VITE_GAME_V2 === '1'; DEV is false in production. The script scans entry module contents, so the marker works without downloading the lazy chunk. The comment in the helper records this evidence. A future bundler/import rename requires revalidating this marker; it detects the build flag, not runtime UI correctness.

| Mode | Lines run | PASS means |
| --- | --- | --- |
| pre (default) | Original v1 checks; sorted v2 POST/CORS checks; live bundle API and flag checks | Exact 401 (function or gateway), CORS 2xx with SITE or wildcard, Supabase host in JS, SpritePreview- absent |
| post | Same lines | Same requirements but SpritePreview- present |
| off | Original v1 lines only | Original v1 behavior and exit status |

An empty marker yields `SKIP live bundle v2 flag - no v2-only marker (see reports/check-live-v2.md)` without increasing failures; the validated marker means that fallback is unused here. Module candidates are same-origin /assets/*.js only, deduplicated, capped at ten, with 15-second request/body timeouts via fetchT; module redirects are rejected.

Cut-over note for docs/cutover-v2.md / card A22: **run with CHECK_LIVE_V2=post after the flag flip**. That file was not edited.

### Gate recheck

```text
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
   a42765c..cdcb0cf  main       -> origin/main
$ git rebase origin/main
Rebasing (1/1)
Successfully rebased and updated refs/heads/ai/codex-check-live-v2.
$ git show origin/main:scripts/check-live.mjs | grep -n 'const FUNCTIONS'
14:const FUNCTIONS = ['auth-nonce', 'auth-verify', 'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge', 'relic-mint-report'];
$ git ls-tree --name-only origin/main supabase/functions/ | grep '^supabase/functions/v2-'
supabase/functions/v2-choose-class
supabase/functions/v2-claim
supabase/functions/v2-craft
supabase/functions/v2-equip
supabase/functions/v2-lock
supabase/functions/v2-relic-forge
supabase/functions/v2-salvage
supabase/functions/v2-state
$ git ls-remote origin 'refs/heads/ai/*check-live*' | awk '{print $2}' | sed 's#^refs/heads/##' | grep -vxF -e ai/codex-check-live-v2
(no output; grep exit 1)
```

PASS all gates. v2-boss-fight remains absent. The task-card path tasks/v2/wave-e/C16-check-live-v2-codex.txt is not in this checkout; implementation follows the original pasted C16 card and this fix note.

### Commands and real output

Every pnpm command below used PATH=/tmp/c16-bin:$PATH and CI=true, with /tmp/c16-bin/pnpm executing `corepack pnpm@10.28.0 "$@"`. No repository file was needed to select the version.

```text
$ pnpm --version
10.28.0
```

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 1m 13.2s using pnpm v10.28.0
```

Exit 0. The ignored-build warning is pnpm 10 policy, not an installation failure; no builds were approved or policy changed.

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```

Exit 0; no generated drift.

```text
$ pnpm typecheck

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

Exit 0.

```text
$ pnpm lint

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

Exit 0.

```text
$ node --test scripts/check-live-v2.test.mjs
✔ discovers only v2 directories, sorted, including a future boss function (47.000828ms)
✔ anonymous POST requires exactly 401 and distinguishes function from gateway (0.776704ms)
✔ CORS requires a 2xx and the matching or wildcard origin (102.698683ms)
✔ HTML modules resolve against SITE and ignore external, classic and non-asset scripts (3.838667ms)
✔ real API detection looks for the configured Supabase host (0.936423ms)
✔ marker verdict covers pre/post with present/absent markers, and skip (1.361429ms)
✔ fresh import makes no network request (2.262099ms)
✔ real repository has v2-state and valid v2 directory names (4.130269ms)
✔ live runner preserves v1 lines in off mode and counts v2 failures in its exit status (437.017603ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 958.366113
```

Exit 0; 9 tests passed.

```text
$ env -u VITE_GAME_V2 VITE_SUPABASE_URL=https://c16-marker.supabase.co pnpm --filter @taskbar-hero/web build

> @taskbar-hero/web@0.0.0 build /workspace/taskbar-hero/apps/web
> tsc --noEmit && vite build

vite v8.3.5 building client environment for production...
transforming...
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1724 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/index-nZ9oHIZe.js               132.40 kB │ gzip:  38.76 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 10.27s
```

Exit 0.

```text
$ VITE_GAME_V2=1 VITE_SUPABASE_URL=https://c16-marker.supabase.co pnpm --filter @taskbar-hero/web build

> @taskbar-hero/web@0.0.0 build /workspace/taskbar-hero/apps/web
> tsc --noEmit && vite build

vite v8.3.5 building client environment for production...
transforming...
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1737 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/SpritePreview-DrGwRUam.css        0.69 kB │ gzip:   0.34 kB
dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/SpritePreview-3p1eMsUi.js        22.86 kB │ gzip:   8.51 kB
dist/assets/index-CsRDfL4K.js               132.80 kB │ gzip:  38.94 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 5.68s
```

Exit 0.

The following comparison used a Python pathlib scan over the two saved dist/assets folders and literal occurrence counts (the grep-equivalent result is shown in full):

```text
$ compare saved flag-off/on dist JS sizes and literal marker matches
pre: JS files=6, JS bytes=1918603, entry=index-nZ9oHIZe.js, entry bytes=132405
pre: grep -oF 'v2-shell': entry occurrences=1, all JS occurrences=1
pre: grep -oF 'SpritePreview-': entry occurrences=0, all JS occurrences=0
pre: grep -oF 'c16-marker.supabase.co': entry occurrences=3, all JS occurrences=3
post: JS files=7, JS bytes=1941865, entry=index-CsRDfL4K.js, entry bytes=132801
post: grep -oF 'v2-shell': entry occurrences=1, all JS occurrences=1
post: grep -oF 'SpritePreview-': entry occurrences=3, all JS occurrences=3
post: grep -oF 'c16-marker.supabase.co': entry occurrences=3, all JS occurrences=3
```

```text
$ NODE_USE_ENV_PROXY=1 node scripts/check-live.mjs
Site https://web-zeta-tan-13.vercel.app
Supabase https://qoalewtxflagoprrxrgh.supabase.co
Fuji RPC https://api.avax-test.network/ext/bc/C/rpc

PASS  site loads - HTTP 200
PASS  function auth-nonce refuses anonymous POST - HTTP 200
PASS  function auth-verify refuses anonymous POST - HTTP 400
PASS  function game-state refuses anonymous POST - HTTP 401
PASS  function idle-claim refuses anonymous POST - HTTP 401
PASS  function equip refuses anonymous POST - HTTP 401
PASS  function boss-fight refuses anonymous POST - HTTP 401
PASS  function upgrade refuses anonymous POST - HTTP 401
PASS  function relic-forge refuses anonymous POST - HTTP 401
PASS  function relic-mint-report refuses anonymous POST - HTTP 401
PASS  relic 1 metadata and image - Paw Charm, image/svg+xml
PASS  relic 2 metadata and image - Silver Bell, image/svg+xml
PASS  relic 3 metadata and image - Moon Collar, image/svg+xml
PASS  relic 4 metadata and image - Golden Maneki, image/svg+xml
PASS  relic 64-hex metadata path (what wallets request) - HTTP 200
PASS  README has both contract addresses - 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D, 0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93
PASS  Fuji RPC reports chain 43113
PASS  RelicNFT has code
PASS  RelicNFT signer() is set - 0x5ec838eccc4ec6b6707b6479394e9e6ceea0b000
PASS  RelicNFT owner() is set - 0x2bba9a48f7f79d99154108a28d32f1a21d17055c
PASS  RelicNFT uri(1) points at the site - https://web-zeta-tan-13.vercel.app/relics/{id}.json
PASS  RelicMarket relicNFT() is the RelicNFT
PASS  v2 function folders - 8 folders
PASS  function v2-choose-class refuses anonymous POST - function
PASS  function v2-choose-class CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-claim refuses anonymous POST - function
PASS  function v2-claim CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-craft refuses anonymous POST - function
PASS  function v2-craft CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-equip refuses anonymous POST - function
PASS  function v2-equip CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-lock refuses anonymous POST - function
PASS  function v2-lock CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-relic-forge refuses anonymous POST - function
PASS  function v2-relic-forge CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-salvage refuses anonymous POST - function
PASS  function v2-salvage CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  function v2-state refuses anonymous POST - function
PASS  function v2-state CORS preflight - HTTP 204, access-control-allow-origin: https://web-zeta-tan-13.vercel.app
PASS  live bundle uses the real API - 1 module script(s)
PASS  live bundle v2 flag - pre: marker SpritePreview- absent

ALL CHECKS PASSED
```

Exit 0. One production invocation total; proxy environment support was enabled for this cloud environment.

All eight discovered v2 functions were deployed: v2-choose-class, v2-claim, v2-craft, v2-equip, v2-lock, v2-relic-forge, v2-salvage, v2-state. Each returned function-level 401 and CORS HTTP 204 with SITE reflected. Not deployed: none among discovered folders. v2-boss-fight was not probed because its folder was absent. The live bundle uses the real API and passed pre mode.

```text
$ node scripts/check-links.mjs docs/runbook.md
Checked 1 markdown files and 8 links/paths.

Found 1 broken link(s) or path(s) on disk:

  docs/runbook.md:47 [backticked repo path]
    Target: `contracts/.env`
    Not found: contracts/.env

```

Exit 1; stop required by the section-limited allowlist.

```text
$ pnpm test

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  07:23:54
packages/chain test:    Duration  4.66s (import 42%, transform 38%, tests 14%, worker 6%)
packages/chain test:     Isolate  2 workers spawned · ~1.81s startup each (spawn + environment, per file)
packages/chain test:              at least ~1.81s faster with isolate: false — reuses workers across files instead of one per file
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  07:23:53
packages/auth test:    Duration  9.90s (import 67%, tests 29%, transform 4%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
packages/game-rules test:  ❯ src/v2/idle/idle.test.ts (19 tests | 1 failed) 7373ms
packages/game-rules test:    ❯ computeClaimV2 (16)
packages/game-rules test:      × handles an eight-hour claim under 50 ms with a generous 150 ms CI ceiling 970ms
supabase/tests test:  Test Files  17 passed (17)
supabase/tests test:       Tests  372 passed (372)
supabase/tests test:    Start at  07:24:08
supabase/tests test:    Duration  260.63s (tests 88%, import 9%, transform 3%)
supabase/tests test:     Isolate  17 workers spawned · ~627ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~10.03s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test: ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
packages/game-rules test:  FAIL  src/v2/idle/idle.test.ts > computeClaimV2 > handles an eight-hour claim under 50 ms with a generous 150 ms CI ceiling
packages/game-rules test: AssertionError: expected 476 to be less than 150
packages/game-rules test:  ❯ src/v2/idle/idle.test.ts:207:21
packages/game-rules test:     205|     const result = computeClaimV2(input, 8 * 3600, 2);
packages/game-rules test:     206|     const elapsed = Date.now() - start;
packages/game-rules test:     207|     expect(elapsed).toBeLessThan(150);
packages/game-rules test:        |                     ^
packages/game-rules test:     208|     expect(result.stackDeltas.fish).toBeGreaterThan(0);
packages/game-rules test:     209|   });
packages/game-rules test: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
packages/game-rules test:  Test Files  1 failed | 18 passed | 2 skipped (21)
packages/game-rules test:       Tests  1 failed | 324 passed | 2 expected fail | 4 skipped (331)
packages/game-rules test:    Start at  07:24:01
packages/game-rules test:    Duration  365.38s (tests 95%, import 3%, transform 2%)
packages/game-rules test:     Isolate  21 workers spawned · ~1.99s startup each (spawn + environment, per file)
packages/game-rules test:              at least ~39.84s faster with isolate: false — reuses workers across files instead of one per file
packages/game-rules test: Failed
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/game-rules@0.0.0 test: `vitest run`
Exit status 1
 ELIFECYCLE  Test failed. See above for more details.
```

Exit 1. The measured assertion was **476 ms**, required <150 ms; 970 ms in the progress line is the whole test duration. Auth (24), chain (7), and Supabase (372) tests passed. Game-rules reported 1 failed, 324 passed, 2 expected failures and 4 pre-existing skips. This task did not introduce or alter any skip/expected-failure setting. The recursive command stopped before the web tests.

### Current acceptance self-check

- PASS: all three gates rechecked against current main; absent v2-boss-fight recorded; future-folder discovery tested.
- PASS: original v1 sections and output format retained; offline off/pre output comparison passes.
- PASS: sorted filesystem v2 discovery, exact 401 function/gateway classification, 404 “not deployed”, rejection of other statuses, and matching/wildcard 2xx CORS; unit tests pass.
- PASS: anonymous POST and Origin-bearing OPTIONS lines integrated through check()/report(); live run passed for all eight functions.
- PASS: same-origin assets module discovery, external/non-module exclusion, deduplication, ten-file cap, request timeout, real-API host detection; unit tests and live API check pass. Redirects are rejected for module requests.
- PASS: two required production builds completed, sizes and marker matches recorded; validated marker and selection rationale documented in code and report.
- PASS: pre/post marker verdict matrix and empty-marker SKIP tested; live pre verdict passed; invalid mode visibly fails; off suppresses all v2 lines in offline runner test.
- PASS: all seven requested helper categories covered, plus runner failure counting and future boss discovery; 9 tests passed without network.
- PASS: only the Live check section of docs/runbook.md changed, with CHECK_LIVE_V2 and cut-over guidance.
- PASS: pnpm 10.28.0 frozen installation, deno drift, typecheck, lint, both marker builds, helper tests and first live run.
- FAIL: pnpm test; existing performance assertion measured 476 ms against <150 ms, outside task allowlist.
- FAIL: node scripts/check-links.mjs docs/runbook.md; pre-existing contracts/.env reference outside permitted section.
- NOT VERIFIED: root pnpm build; not run after the stop. Both scoped web marker builds passed, but they do not substitute for the root command.
- NOT VERIFIED: second production invocation CHECK_LIVE_V2=off node scripts/check-live.mjs; not run after the stop. One production invocation total (within the two-run maximum); off behavior tested offline.
- NOT VERIFIED: live post mode after a real flag flip; not attempted.
- NOT VERIFIED: a serial unit-suite retry; no further commands launched after the section-scope blocker.
- PASS: e2e not required by diff scope (no apps/web, packages, package.json, pnpm-lock.yaml edits). No e2e run is claimed.
- PASS: no dependencies added, no secrets printed, no forbidden final file changes, no test weakened/disabled/deleted, no snapshots or timeouts changed.
- PASS: required report updated with old content preserved; final allowlist, authors and stat recorded below. No PR, Actions, merge or deployment.

### NOT verified and continuation

The root build, web unit suite, serial retry and second live invocation remain unverified because the card requires stopping at an out-of-scope failure. The delivered implementation has passed its helper tests and all live pre checks, but the task cannot be marked DONE while the mandatory repository checks fail. To continue, authorize a narrow prose fix in **docs/runbook.md, Set the metadata URI, line 47** so the link checker does not require a private local file; then rerun the unchanged full unit suite without concurrent build/typecheck/lint commands. If the performance failure persists, investigation and optimization in **packages/game-rules/src/v2/idle/claim.ts** (and possibly **drops.ts**, used by that claim computation) need a separate allowed scope. Do not raise the assertion threshold or alter the test.

### Final files, authors and push

Final verification output is appended at the commit checkpoint below. The same task branch is pushed with force-with-lease because the original report commit was rebased onto current main.

Actual output at the implementation/report commit checkpoint, before inserting this output (the report line count increases with this insertion):

```text
$ git fetch origin +main:refs/remotes/origin/main
(no output; exit 0)
$ git diff --name-only origin/main...HEAD
docs/runbook.md
reports/check-live-v2.md
scripts/check-live-v2.mjs
scripts/check-live-v2.test.mjs
scripts/check-live.mjs
$ git diff --stat origin/main...HEAD
 docs/runbook.md                |   2 +
 reports/check-live-v2.md       | 559 +++++++++++++++++++++++++++++++++++++++++
 scripts/check-live-v2.mjs      |  57 +++++
 scripts/check-live-v2.test.mjs | 106 ++++++++
 scripts/check-live.mjs         |  66 ++++-
 5 files changed, 789 insertions(+), 1 deletion(-)
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
$ git status --short
(no output)
```

PASS: every changed path is allowlisted and both task commits have the required author. No outside-scope changes were retained.

---

## Original report (preserved historical content)


Card C16 stopped at the installation check. No implementation is delivered. The unfinished scripts were removed and the original live check was restored. Only this report is committed. No production health check, GitHub Actions, pull request, deployment, or merge was run.

## Exact blocker and continuation

`pnpm install --frozen-lockfile` failed with `ERR_PNPM_IGNORED_BUILDS` after downloading the dependencies. The container resolves `pnpm` to 11.25.0, whereas package.json:5 specifies pnpm@10.28.0; Node is v24.19.0. The install generated an unapproved `allowBuilds` section in pnpm-workspace.yaml. That file is outside the card allowlist and was restored to origin/main. No dependency build was approved, disabled, or bypassed.

Under the card's stop rule, no further implementation or verification was attempted after this failure. To continue, provide an environment using the repository's pinned pnpm@10.28.0 and restart the checks. If installation still requires an explicit build policy, pnpm-workspace.yaml (after line 4) would need authorization to declare build decisions for bufferutil, keccak, and utf-8-validate. No test or assertion failed: the blocker is the package manager's installation policy. No test was skipped, disabled, weakened, or deleted from the repository.

## Gate output

Git identity initially differed and was set locally before creating the branch. Final identity:

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
```

```text
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
$ git show origin/main:scripts/check-live.mjs | grep -n "const FUNCTIONS"
14:const FUNCTIONS = ['auth-nonce', 'auth-verify', 'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge', 'relic-mint-report'];
$ git ls-tree --name-only origin/main supabase/functions/ | grep '^supabase/functions/v2-'
supabase/functions/v2-choose-class
supabase/functions/v2-claim
supabase/functions/v2-craft
supabase/functions/v2-equip
supabase/functions/v2-lock
supabase/functions/v2-relic-forge
supabase/functions/v2-salvage
supabase/functions/v2-state
$ git ls-remote origin 'refs/heads/ai/*check-live*' | awk '{print $2}' | sed 's#^refs/heads/##' | grep -vxF -e ai/codex-check-live-v2
(no output; grep exit 1)
```

PASS: all three gates. v2-boss-fight was absent on main. There was no competing branch and no existing v2 live-check implementation. A later fetch also completed successfully.

## Checks actually run

First installation attempt, without a terminal (exit 1):

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

Repeated the same command with a terminal and answered yes to recreating the existing modules directory. Relevant actual output (exit 1; repetitive progress and terminal controls omitted):

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
? The modules directories will be removed and reinstalled from scratch. Proceed? (Y/n) y
✔ The modules directories will be removed and reinstalled from scratch. Proceed? Yes
Recreating /workspace/taskbar-hero/node_modules
✓ Lockfile passes supply-chain policies (520 entries in 32.6s)
Lockfile is up to date, resolution step is skipped
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Downloading @electric-sql/pglite@0.5.11: 8.81 MB/8.81 MB, done
Downloading phaser@3.90.0: 22.61 MB/22.61 MB, done
Downloading @rolldown/binding-linux-x64-gnu@1.2.15: 8.30 MB/8.30 MB, done
Progress: resolved 504, reused 0, downloaded 495, added 504, done
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

During the installation, initial helper code and tests were drafted. This command passed before the installation failure was observed; both new files were subsequently removed so this is historical evidence only, not a test of the final report-only branch:

```text
$ node --test scripts/check-live-v2.test.mjs
✔ discovers only v2 directories, sorted (7.046465ms)
✔ anonymous POST must be exactly 401, identifying function versus gateway (0.716931ms)
✔ CORS needs both a 2xx and the matching or wildcard origin (73.711325ms)
✔ HTML module scripts are same-origin assets only, unique and capped at ten (1.797765ms)
✔ real API detection uses the configured Supabase host (0.33199ms)
✔ v2 marker verdict covers pre/post, present/absent and skip (0.671221ms)
✔ fresh import performs no network request (2.295613ms)
✔ real repository contains v2-state and valid v2 folder names (1.02678ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 298.40817
```

## Marker and intended mode table

No marker was validated: neither comparison build ran. `v2-shell` was an initial candidate from StageLayout.tsx, but uniqueness is NOT VERIFIED and no marker is shipped. The final branch does not add either a flag verdict or the specified SKIP fallback; the existing script remains unchanged.

The requested behavior for a future implementation is:

| Mode | Lines to run | PASS meaning |
| --- | --- | --- |
| pre (default) | v1, discovered v2 anonymous POST and CORS checks, bundle API and flag checks | v2 POST is 401 (function or gateway), CORS is 2xx with matching or wildcard origin, Supabase host present, validated v2 marker absent |
| post | Same checks | Same requirements, but validated v2 marker present |
| off | Existing v1 lines only | Existing v1 behavior |

A missing validated marker should produce the card's SKIP line without increasing the failure count. This fallback has NOT been implemented or tested in the delivered branch.

Cut-over note for docs/cutover-v2.md / card A22: **run with CHECK_LIVE_V2=post after the flag flip**. That document was not edited.

## Acceptance self-check

- PASS: fetch latest main, confirm v1-only FUNCTIONS, eight required v2 directories, no competing branch; record missing v2-boss-fight.
- PASS: required local Git identity configured; final author and allowlist checks are recorded below.
- PASS: dependency-free constraint, no dependencies added, no keys printed, no application or forbidden files retained in diff.
- PASS: existing v1 script behavior and output preserved by restoring the file unchanged.
- NOT VERIFIED: automatic discovery including future v2-boss-fight in a delivered implementation.
- NOT VERIFIED: exact 401 function/gateway classification, 404 not deployed, and OPTIONS CORS integrated into the live check. Draft helper tests passed but are not delivered.
- NOT VERIFIED: same-origin module retrieval, ten-file limit, timeout, real API host and pre/post marker checks in the delivered script.
- NOT VERIFIED: CHECK_LIVE_V2 default/pre/post/off modes and non-counting SKIP behavior in a delivered implementation.
- NOT VERIFIED: all seven requested helper test categories in the final branch (temporary draft passed eight tests).
- NOT VERIFIED: both local builds, bundle sizes and marker grep comparison.
- NOT VERIFIED: short v2 paragraph/env var in docs/runbook.md (not changed because implementation stopped).
- NOT VERIFIED: live v2 deployed/not-deployed list. No production requests were made, so every v2 deployment state is unknown; this is not evidence of missing deployments.
- FAIL: required pnpm install --frozen-lockfile, as shown above.
- NOT VERIFIED: pnpm gen:deno && git diff --exit-code -- supabase/functions.
- NOT VERIFIED: pnpm typecheck, pnpm lint, pnpm test, pnpm build.
- NOT VERIFIED: node scripts/check-live.mjs and CHECK_LIVE_V2=off node scripts/check-live.mjs.
- NOT VERIFIED: node scripts/check-links.mjs docs/runbook.md.
- PASS: e2e not required by the final file scope (no apps/web, packages, package.json or pnpm-lock.yaml changes).
- PASS: blocker report written; branch push result and commit are provided in the final response. No PR or Actions run.

## NOT verified

All checks listed as NOT VERIFIED above were not run because the card requires stopping after an installation failure requiring work outside the allowlist. The plan path tasks/v2/plan-to-finish.md is absent from this checkout; the pasted card supplied the operative scope and acceptance requirements. No full-suite success or live deployment readiness is claimed. The final diff is report-only; full suite skipped: docs only, and installation blocked before the remaining docs-only checks.

## Final files and author checks

The final stat and author verification follow below. The stat was generated after committing the report, then inserted into it; its line count changes with this insertion.

Actual verification output at the report checkpoint (before appending this output):

```text
$ git fetch origin +main:refs/remotes/origin/main
(no output; exit 0)
$ git diff --name-only origin/main...HEAD
reports/check-live-v2.md
$ git diff --stat origin/main...HEAD
 reports/check-live-v2.md | 142 +++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 142 insertions(+)
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

PASS: the only changed path is allowlisted. PASS: every task commit has the required author. This report-only task branch is used because implementation work had begun before the installation blocker, rather than stopping at the gate.
