STATUS: DONE
STACKED ON ai/codex-v29-founder-grant @ 235298d29595ee5c1851ff80cdb687a5fdcdb172: merge that first

CL9 / Q11 DATABASE REHEARSAL ONLY. Actual cut-over execution is a hard stop for the user/orchestrator. No live migration, SQL, merge, deployment, flag flip, transaction or announcement was performed. Contents fish 100/catKey 2/moonPearl 1 and a synthetic 2030 cutoff are EXAMPLES only; D8/D6 remain open.

PASS: start with v1 migrations and six v1 players/idle rows, apply every additive v2 migration including Founder batch, grant five eligible players in batches of two (remaining 3,1,0), exclude the later player, cap an initial four keys at five after credit, verify Founder snapshots and stacks, rerun granted=0/already=5/remaining=0, rollback all v2 objects, compare v1 table/routine/privilege listing and player/idle data unchanged. Focused test passed in 4.32s. PGlite fixture timings below are measured, not production estimates.

| runbook section 4 step | rehearsal evidence / remaining action |
|---|---|
| 1 freeze/check readiness | Read-only code gates only; USER assembles/reviews the release and freezes merges. Q9 remains blocked. |
| 2 approve/apply Founder migration | PGlite applies V8 + new migration; USER must approve D8 and apply_migration to the real project before merging C15. |
| 3 run Founder grant | PGlite batches to zero with EXAMPLE contents, caps and idempotency verified; USER runs approved live parameters. |
| 4 merge C17 | USER ONLY on the D6-approved day; no merge rehearsed or executed. |
| 5 Vercel deploy | USER ONLY; no deployment started. |
| 6 live health | USER ONLY: CHECK_LIVE_V2=post node scripts/check-live.mjs after C16 is merged/deployed; no production call here. |
| 7 smoke | USER/browser QA after deploy; real JWT/gateway/Fuji still manual. C8 has a recorded bulk-equip failure. |
| 8 announce | USER ONLY; no external messages sent. |
| section 5 rollback | PGlite restores v1 exactly for the tested listing/data; production backup, flag revert and rollback remain USER-only. |

Runbook gaps — proposed text for Antigravity/orchestrator, docs/cutover-v2.md unchanged:
- Section 4 step 2 should name supabase/migrations/20261110000000_v2_founder_batch.sql, not the tentative 20261113000000_founder.sql.
- Eligibility in sections 4/6 currently uses <=; the requested batch implements strict created_at < p_cutoff. D8 must settle the boundary consistently.
- Step 3 should call v2_grant_founder_batch with approved cutoff/contents/caps/limit repeatedly until remaining=0; already counts previously granted qualifying players. Always pass the existing cap object.
- Step 6 should specify CHECK_LIVE_V2=post and require C16 merged first. Rollback health uses pre.
- Any optional deletion of pre-cut-over v2 test records is a separate user-only approval; no wipe was rehearsed or performed.

A preliminary branch switch was blocked by a generated stage screenshot; the first test therefore ran on the Relic base and failed with function public.v2_grant_founder_batch(timestamp with time zone, jsonb, jsonb, unknown) does not exist. That verification was stopped, the incidental screenshot restored, and this test plus all real checks rerun on the correct Founder stack. No wrong-base result is counted as evidence.

PASS: install/gen:deno drift/typecheck/lint/full root test/build on the correct stack. Playwright not applicable: own/new inherited changes are database/tests/reports only. Files: supabase/tests/v2/cutover-rehearsal.test.ts and this report. NOT VERIFIED: all live user-only steps, production duration/row counts, D4 approval/application, D8 approval/application, D6 date/go-no-go, real Fuji mint, or resolution of Q9. STACKED ON ai/codex-v29-founder-grant @ 235298d29595ee5c1851ff80cdb687a5fdcdb172: merge that first only after D8/apply_migration.

### q11-gate.txt

```text
$ git show ai/codex-v29-founder-grant:reports/v29-founder.md | head -3
STATUS: DONE

C15 DRAFT ONLY. MERGE GATE: D8 user OK + apply_migration before merge. Nothing was applied to Supabase, deployed, or merged.
EXIT 0

$ git show ai/codex-v29-flag-flip:reports/v29-flag-flip.md | head -2
STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first
EXIT 0

$ git diff --exit-code ai/codex-v29-founder-grant -- docs/cutover-v2.md
EXIT 0

```

### q11-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  13:13:37
   Duration  4.32s (tests 95%, import 3%, transform 2%)


```

### q11-timings.json

```text
{
  "v1 bootstrap migrations (ms)": 1919.42,
  "create v1 fixtures (ms)": 12.39,
  "apply V8 and additive Founder migration (ms)": 21.33,
  "Founder batch 1 (ms)": 11.1,
  "Founder batch 2 (ms)": 3.39,
  "Founder batch 3 (ms)": 2.92,
  "verify Founder snapshots and caps (ms)": 25.68,
  "rerun is idempotent (ms)": 7.76,
  "rollback v2 and verify v1 intact (ms)": 21.09
}
```

### q11-install.txt

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
Done in 761ms using pnpm v10.28.0

EXIT 0; runtime 0.82s

```

### q11-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.30s

```

### q11-typecheck.txt

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

EXIT 0; runtime 14.76s

```

### q11-lint.txt

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

EXIT 0; runtime 14.68s

```

### q11-test.txt

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
packages/chain test:    Start at  13:14:12
packages/chain test:    Duration  306ms (import 46%, transform 25%, tests 14%, worker 14%, environment 1%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  13:14:12
packages/auth test:    Duration  636ms (import 65%, tests 27%, transform 8%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  20 passed (20)
supabase/tests test:       Tests  395 passed (395)
supabase/tests test:    Start at  13:14:13
supabase/tests test:    Duration  51.60s (tests 91%, import 9%)
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  13:14:13
packages/game-rules test:    Duration  86.01s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  13:15:40
packages/api-contract test:    Duration  196ms (transform 48%, import 38%, tests 10%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test:    Start at  13:15:40
apps/web test:    Duration  72.00s (environment 57%, tests 31%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 75 times · 36.94s total, 57% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 160.72s

```

### q11-build.txt

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
apps/web build: ✓ built in 794ms
apps/web build: Done

EXIT 0; runtime 14.65s

```

## Files touched and reasons

```text
reports/v29-founder.md                             | 286 +++++++++++++++++++++
 .../migrations/20261110000000_v2_founder_batch.sql |  58 +++++
 supabase/tests/v2/cutover-rehearsal.test.ts        |  65 +++++
 supabase/tests/v2/founder.test.ts                  |  95 +++++++
 supabase/tests/v2/helpers.ts                       |   7 +-
 supabase/tests/v2/schema.test.ts                   |   2 +-
 6 files changed, 509 insertions(+), 4 deletions(-)
```

Report file records evidence and review gates.
