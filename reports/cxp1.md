STATUS: PARTIAL

# CXP1 — local companion preview (living draft)

1 November 2026 (Asia/Ho_Chi_Minh). Continues draft PR #240 from main `1fb25ed`. Twelve original pets, progress and equip-two selection remain preview-only. No pet value affects power, rewards, drops, forge or server state. All 2,310 unit tests and six focused desktop browser cases pass. The strict overall status remains PARTIAL: the complete browser suite has the two excluded mobile HUD failures.

## Changes and acceptance

| Requirement | Result | Evidence |
| --- | --- | --- |
| Twelve typed original pets and unique IDs | PASS full suite | Registry and boundary tests under packages/game-rules/src/v2/meta/pets |
| Exact unlock, level steps, percentage, cap and equip-two/no duplicates | PASS full suite | Existing pure-rule tests retained unchanged |
| Corrupt storage and v0 migration | PASS focused | Ten store tests plus six browser cases across both desktop sizes |
| Read only client-tracked kills | PASS focused | Single adapter: apps/web/src/pets/state.ts; existing claimedKills helper; actual acknowledged claim events |
| No pet imports into power/combat/drop/forge/server runtime | PASS | Existing lint-style source guard passes unchanged |
| Desktop persistence | PASS | Six Playwright cases: claims/reload, corrupt storage and migration at 1280×720 and 1600×900 |
| Full shared suite | PARTIAL | Core checks pass; 256 e2e pass and two existing mobile HUD cases fail. The initial generated-map drift was corrected and rechecked clean. |

The registry uses a direct preview module import, not the shared v2 barrel. Bonus keys are preview.* labels. Every unlock threshold, level step, per-level display value and equip limit is marked DEMO_PREVIEW in code/docs. No demo design table or art is copied. The existing mount consists of one import and one observer call in storeV2.ts.

## Registry

| Id | Original name | DEMO_PREVIEW unlock count |
| --- | --- | ---: |
| pet.hemwhisk | Hemwhisk | 7 |
| pet.sillskip | Sillskip | 13 |
| pet.thimblepurr | Thimblepurr | 19 |
| pet.kettlepaw | Kettlepaw | 31 |
| pet.crumbcurl | Crumbcurl | 43 |
| pet.bristletoe | Bristletoe | 61 |
| pet.puddleplume | Puddleplume | 79 |
| pet.latchlynx | Latchlynx | 103 |
| pet.pocketmew | Pocketmew | 137 |
| pet.hushspool | Hushspool | 173 |
| pet.eavetuft | Eavetuft | 227 |
| pet.dawnknead | Dawnknead | 283 |

Per-level values are DEMO_PREVIEW display labels only. They have no units or gameplay effect. Counts target only claimed-idle-kills; there is no per-species/lifetime counter in the client, so no species or historical progress is inferred.

## Problems found and fixed

- Reproduced false credit after a same-round refresh: the old observer held a load delta until a later claimed event reused that snapshot, awarding four preview kills with no new progress. An overlapping refresh/claim had the same defect. The delta now expires at the microtask boundary unless the same synchronous adoption emits an acknowledged claim. Existing valid claims still count exactly once. [Before](cxp1/checks/observer-before.log), [after](cxp1/checks/observer-after.log).
- Reproduced retired cleanup invalidating a replacement binding: an old dispose call deleted the replacement's WeakMap guard. Cleanup is now idempotent, preserving the replacement and preventing duplicate observers.
- Fixed missing generated metadata: gen:deno indexes every public game-rules module, even without a barrel export. The initial run exposed one missing alias in each of sixteen game-function maps. Included exactly the generator's additions; the repeat generator/drift check is clean. No auth map or function source changed, and no Edge Function imports or consumes the preview registry.
- Browser harness setup initially imported browser API dependencies into Node (JSON import attributes), then a bundler-only directory import. The test now reads the storage-key constants and imports the pure registry through a relative file path. No product API or assertion was weakened.

## Tier 2 changes

- apps/web/src/game/v2/storeV2.ts: existing two-line read-only mount is necessary to observe the already-tracked client loop.
- apps/web/e2e/v2/pets-preview.spec.ts: verifies the built application's mounting, local persistence and migration at both requested desktop sizes.
- Sixteen generated supabase/functions game deno.json files: one directory alias each, required by the mandated generator; metadata only, no server behavior or deployment. Auth manifests are untouched.

## Browser and visual evidence

Opened the proposal demo's Pets screen in Chromium at 1280×720 and 1600×900 and visually inspected both. Used its structural progress/equip-two intent only. No Pets screen is introduced here; AGP1 owns that later UI.

[Focused browser output](cxp1/checks/desktop-e2e.log): 6 passed (14.2s), one worker, no retries. The browser uses the real existing 30-second local claim timer with Playwright's controlled clock; no test-only gameplay endpoint was added. Reload retains the credited local aggregate. Corrupt preview storage recovers; legacy data migrates with two selections and retains the old recovery key.

Current Home captures (existing art, unchanged UI):

- [1280×720 PNG](cxp1/home-1280x720.png), 90,717 bytes.
- [1600×900 PNG](cxp1/home-1600x900.png), 99,427 bytes.

Both were opened for visual QA. Earlier JPEG evidence remains preserved. No UI layout/token changes are made by this logic item, so there is no new Pets layout to compare against the redesign mockup. The visible 1280px HUD next-action text is clipped; this existing cosmetic finding belongs in CXR1/CXR2.

## NOT verified and boundaries

- Signed balance and gameplay effects are intentionally absent. No economy, odds, config.ts, auth, contract, migration, deployment, live DB or chain write was changed or performed.
- No Pets screen, art, cross-tab synchronization, cloud sync or per-species/history backfill is claimed. Local preview progress is browser/device-local and shared across demo/account switches.
- The untouched main branch's known narrow HUD failures are outside this desktop mission. Any actual full-suite failures will be listed, not relabelled PASS.
- No existing test is removed, skipped, quarantined, weakened or given retries. Existing upstream expected failures/skips remain unchanged.

## Delivery

Branch: ai/codex-cxp1; draft PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/240. Existing implementation commit: 6b06574. Worktree: /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero (detached continuation preserves the older worktree's unfinished regression).

Use Node 20+ and pnpm 10.28.0; run the shared suite from the root and the focused browser test from apps/web. SCREENSHOTS=1 opts into evidence. All commits use the requested author and end with [skip ci]. No merge or workflow invocation.

## Verification findings

All 28 pet tests pass (17 registry, 10 store, one isolation). Full browser result: 256 passed, two known narrow HUD height failures (138/214px versus 88px). The six new cases pass in that full run too. [Full e2e output](cxp1/checks/round1-e2e.log). Main and branch retain exactly one broken proposal link; no new debt.

The first full run correctly exposed unstaged generated-map additions. After including those additions, `pnpm gen:deno && git diff --exit-code -- supabase/functions` passes with no unstaged drift. The following table preserves the initial failure rather than rewriting history; the clean committed PR checkout will verify the corrected maps again.

<!-- MEGA verification evidence -->

## Executed checks

| Check | Exit | Result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS |
| `pnpm gen:deno` | 0 | PASS |
| `git diff --exit-code -- supabase/functions` | 1 | FAIL |
| `pnpm typecheck` | 0 | PASS |
| `pnpm lint` | 0 | PASS |
| `pnpm test` | 0 | PASS |
| `pnpm build` | 0 | PASS |
| `pnpm test:e2e` | 1 | FAIL |
| `pnpm --filter @taskbar-hero/web build` | 0 | PASS |
| `node scripts/check-links.mjs --json` | 1 | BASELINE DEBT — compare count below |

```text
$ pnpm install --frozen-lockfile
# exit 0; 0.5 seconds
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
Done in 445ms using pnpm v10.28.0
```

```text
$ pnpm gen:deno
# exit 0; 0.3 seconds

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

```text
$ git diff --exit-code -- supabase/functions
# exit 1; 0.0 seconds
     "../../../packages/game-rules/src/v2/idle/types": "../../../packages/game-rules/src/v2/idle/types.ts",
     "../../../packages/game-rules/src/v2/lootcheck": "../../../packages/game-rules/src/v2/lootcheck/index.ts",
+    "../../../packages/game-rules/src/v2/meta/pets": "../../../packages/game-rules/src/v2/meta/pets/index.ts",
     "../../../packages/game-rules/src/v2/sim": "../../../packages/game-rules/src/v2/sim/index.ts",
     "../../../packages/game-rules/src/v2/sim/config": "../../../packages/game-rules/src/v2/sim/config.ts",
     "../../../packages/game-rules/src/v2/sim/player": "../../../packages/game-rules/src/v2/sim/player.ts",
diff --git a/supabase/functions/v2-state/deno.json b/supabase/functions/v2-state/deno.json
index b42daac..d013b34 100644
--- a/supabase/functions/v2-state/deno.json
+++ b/supabase/functions/v2-state/deno.json
@@ -54,6 +54,7 @@
     "../../../packages/game-rules/src/v2/idle/drops": "../../../packages/game-rules/src/v2/idle/drops.ts",
     "../../../packages/game-rules/src/v2/idle/types": "../../../packages/game-rules/src/v2/idle/types.ts",
     "../../../packages/game-rules/src/v2/lootcheck": "../../../packages/game-rules/src/v2/lootcheck/index.ts",
+    "../../../packages/game-rules/src/v2/meta/pets": "../../../packages/game-rules/src/v2/meta/pets/index.ts",
     "../../../packages/game-rules/src/v2/sim": "../../../packages/game-rules/src/v2/sim/index.ts",
     "../../../packages/game-rules/src/v2/sim/config": "../../../packages/game-rules/src/v2/sim/config.ts",
     "../../../packages/game-rules/src/v2/sim/player": "../../../packages/game-rules/src/v2/sim/player.ts",
```

```text
$ pnpm typecheck
# exit 0; 10.9 seconds

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
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
# exit 0; 9.0 seconds

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero
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
# exit 0; 60.9 seconds
packages/chain test:  Test Files  3 passed (3)
packages/chain test:       Tests  32 passed (32)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  31 passed (31)
supabase/tests test:       Tests  541 passed | 1 expected fail (542)
packages/game-rules test:  Test Files  25 passed | 3 skipped (28)
packages/game-rules test:       Tests  383 passed | 2 expected fail | 11 skipped (396)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  113 passed (113)
apps/web test:       Tests  1314 passed (1314)
apps/web test:    Duration  20.70s (environment 47%, tests 38%, import 10%, transform 4%)
apps/web test: Environment  jsdom was created 113 times · 81.32s total, 47% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

```text
$ pnpm build
# exit 0; 10.5 seconds
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1819 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.13 kB │ gzip:   0.77 kB
apps/web build: dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
apps/web build: dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/StageScene-DGbwNpHc.js           15.73 kB │ gzip:   5.79 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/index-D4O8tvuP.js               244.21 kB │ gzip:  68.94 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 394ms
apps/web build: Done
```

```text
$ pnpm test:e2e
# exit 1; 81.4 seconds
    Received:    214

      62 |     expect(measures.intersections).toBe(0);
      63 |     expect(measures.luminance).toBeLessThan(.2);
    > 64 |     if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
         |                                                    ^
      65 |     if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
      66 |   });
      67 | }
        at /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero/apps/web/e2e/ui/u2-hud.spec.ts:64:52

    Error Context: test-results/4173-4174/ui-u2-hud-HUD-readable-at-320x568-stage-layout/error-context.md

  2 failed
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 390x844 ──────────────────────────
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 320x568 ──────────────────────────
  256 passed (1.3m)
 ELIFECYCLE  Command failed with exit code 1.
```

```text
$ pnpm --filter @taskbar-hero/web build
# exit 0; 5.6 seconds
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1819 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.13 kB │ gzip:   0.77 kB
dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/StageScene-DGbwNpHc.js           15.73 kB │ gzip:   5.79 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/index-D4O8tvuP.js               244.21 kB │ gzip:  68.94 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 359ms
```

```text
$ node scripts/check-links.mjs --json
# exit 1; 0.1 seconds
Checked 67 files, 807 paths; broken count 1.
```

## Diff snapshot

Recorded from the complete worktree before the report-only commit.

```text
$ git diff --stat origin/main
 apps/web/e2e/v2/pets-preview.spec.ts              |  81 +++++
 apps/web/src/game/v2/storeV2.ts                   |   2 +
 apps/web/src/pets/isolation.test.ts               |  24 ++
 apps/web/src/pets/state.test.ts                   | 162 ++++++++++
 apps/web/src/pets/state.ts                        | 126 ++++++++
 packages/game-rules/src/v2/meta/pets/README.md    |  44 +++
 packages/game-rules/src/v2/meta/pets/index.ts     |  83 +++++
 packages/game-rules/src/v2/meta/pets/pets.test.ts |  58 ++++
 reports/cxp1.md                                   |  83 +++++
 reports/cxp1/checks/desktop-e2e.log               |  38 +++
 reports/cxp1/checks/observer-after.log            |   8 +
 reports/cxp1/checks/observer-before.log           |  72 +++++
 reports/cxp1/checks/round1-e2e.log                | 369 ++++++++++++++++++++++
 reports/cxp1/desktop-1280x720.jpg                 | Bin 0 -> 80884 bytes
 reports/cxp1/desktop-1600x900.jpg                 | Bin 0 -> 103800 bytes
 reports/cxp1/home-1280x720.png                    | Bin 0 -> 90717 bytes
 reports/cxp1/home-1600x900.png                    | Bin 0 -> 99427 bytes
 supabase/functions/boss-fight/deno.json           |   1 +
 supabase/functions/equip/deno.json                |   1 +
 supabase/functions/game-state/deno.json           |   1 +
 supabase/functions/idle-claim/deno.json           |   1 +
 supabase/functions/relic-forge/deno.json          |   1 +
 supabase/functions/relic-mint-report/deno.json    |   1 +
 supabase/functions/upgrade/deno.json              |   1 +
 supabase/functions/v2-boss-fight/deno.json        |   1 +
 supabase/functions/v2-choose-class/deno.json      |   1 +
 supabase/functions/v2-claim/deno.json             |   1 +
 supabase/functions/v2-craft/deno.json             |   1 +
 supabase/functions/v2-equip/deno.json             |   1 +
 supabase/functions/v2-lock/deno.json              |   1 +
 supabase/functions/v2-relic-forge/deno.json       |   1 +
 supabase/functions/v2-salvage/deno.json           |   1 +
 supabase/functions/v2-state/deno.json             |   1 +
 33 files changed, 1166 insertions(+)
$ git diff --name-only origin/main
apps/web/e2e/v2/pets-preview.spec.ts
apps/web/src/game/v2/storeV2.ts
apps/web/src/pets/isolation.test.ts
apps/web/src/pets/state.test.ts
apps/web/src/pets/state.ts
packages/game-rules/src/v2/meta/pets/README.md
packages/game-rules/src/v2/meta/pets/index.ts
packages/game-rules/src/v2/meta/pets/pets.test.ts
reports/cxp1.md
reports/cxp1/checks/desktop-e2e.log
reports/cxp1/checks/observer-after.log
reports/cxp1/checks/observer-before.log
reports/cxp1/checks/round1-e2e.log
reports/cxp1/desktop-1280x720.jpg
reports/cxp1/desktop-1600x900.jpg
reports/cxp1/home-1280x720.png
reports/cxp1/home-1600x900.png
supabase/functions/boss-fight/deno.json
supabase/functions/equip/deno.json
supabase/functions/game-state/deno.json
supabase/functions/idle-claim/deno.json
supabase/functions/relic-forge/deno.json
supabase/functions/relic-mint-report/deno.json
supabase/functions/upgrade/deno.json
supabase/functions/v2-boss-fight/deno.json
supabase/functions/v2-choose-class/deno.json
supabase/functions/v2-claim/deno.json
supabase/functions/v2-craft/deno.json
supabase/functions/v2-equip/deno.json
supabase/functions/v2-lock/deno.json
supabase/functions/v2-relic-forge/deno.json
supabase/functions/v2-salvage/deno.json
supabase/functions/v2-state/deno.json
```
