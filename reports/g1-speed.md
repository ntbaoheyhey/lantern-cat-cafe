STATUS: DONE

# G1 — instant action feedback and stable stage

Implementation/evidence commit: `511d5d07f1203f5e7a6b6c4ad917460be43f2b54`. Base: origin/main `21fec3e` (fetched at start;
newer than the supplied audit's `3b82d52`). Date: 2026-10-27, Asia/Ho_Chi_Minh.
Used a clean managed worktree because the original checkout had unrelated forge work;
that checkout was left intact. No PR, merge, manual Actions run, deploy, live database
write, authentication edit, config-number change or dependency change was performed.

## 1. Mission pieces and acceptance

### Piece 0 — baseline: PASS (with visibility methodology limitation)

Added `apps/web/e2e/ui/g1-perf.spec.ts`, assigned to stage-layout, and ran the baseline
before implementation, with only measurement hooks and the spec installed on main.
The original baseline output is `reports/g1-speed/baseline.log`; JSON retains baseline
and final after samples. A replayable baseline instrumentation patch is included.
Normal production output contains neither the global loop hook nor the scene counter.
Only DEV and the dedicated Playwright `g1-perf` build mode expose them.

The fixture uses actual demo APIs, actual Phaser and actual button clicks. The CDP
measurement collects garbage before each sample. It exercises twelve alternating
1000/1360px resizes, three hidden/visible cycles and three extra resizes while hidden.
**Native OS/browser tab switches are NOT VERIFIED**: headless Chromium keeps tabs
visible on bringToFront, so the test explicitly synthesizes document visibility
transitions and exercises the real registered handlers. This limitation is also
stored in metrics.json; no claim of a native-tab measurement is made.

| Measurement | Main baseline | Final implementation |
| --- | ---: | ---: |
| Document visibility listeners, initial → after cycles | 4 → 19 | 3 → 3 |
| CDP JSEventListeners, initial → after | 220 → 250 | 219 → 219 |
| CDP Nodes, initial → after | 4,481 → 4,490 | 4,480 → 4,483 (+0.07%) |
| JSHeapUsedSize, initial → after, bytes | 9,877,064 → 11,301,228 | 9,964,572 → 10,683,748 |
| Canvas count in stage | 1 | 1 |
| Actor rebuilds in three plain claims | 3 | 0 |

| Click → observable API pending | Main baseline | Final | <100ms |
| --- | ---: | ---: | --- |
| Equip best | 6.9ms | 2.7ms | PASS |
| Fight | 1.5ms | 1.0ms | PASS |
| Craft (Confirm Craft click) | 1.6ms | 1.0ms | PASS |

Final next-frame scheduling times were 54.6ms / 46.5ms / 14.9ms respectively.
PerformanceObserver `event` click durations were 56ms / 56ms / 32ms, with input delays
1.4ms / 0.9ms / 0.9ms. The API pending timestamps are measured inside the click's
loop subscription. They are **not** server completion latency or evidence that G2's
pending labels have been placed. The baseline observer initially duplicated some
raw event entries because observer lifetimes overlapped; after measurement uses
isolated records and filters by click timestamp. This did not affect baseline
click-to-pending timestamps; raw original records are retained unmodified.

### Piece 1 — stable Phaser lifetime: PASS for specified resize lifecycle

One game per mounted StageCanvas; `scale.resize` and scene relayout replace width-based
recreation. Removed StageCanvas's extra visibility listener; Phaser already pauses
its own render loop. Cleanup calls destroy then the public step that consumes
pendingDestroy, including when the tab is paused. Unit tests cover twelve updates,
a hidden unmount and cancellation before lazy imports finish. CDP results above meet
listener +/-1, nodes within 10%, and one-canvas thresholds.

### Piece 2 — persistent actors/cue director: PASS

Only class, visible equipment descriptors, chapter or round change the actor key.
Plain claims and lock changes keep the actors and director. A claim with kills swaps
only the compressed cue player. Subsequent idle cycles derive current stats.
Reduced motion immediately stops animation without rebuilding; resize moves homes
and redraws existing graphics. Deferred scene startup, impacts, Miss feedback,
shutdown cleanup, reduced motion and existing stage browser tests all pass.
Unit acceptance: zero rebuilds for a plain claim and lock toggle; one rebuilt actor
pair for an equip with changed visuals. Three browser claims: 3 → 0 rebuilds.

### Piece 3 — ordered, deduplicated, observable actions: PASS

Queue keeps running and queued intents in the same deduplication map, skips already
confirmed equips/empty slots, rechecks latest state before dispatch, waits behind
other actions and resets its generation/tail on account switch. Two upgrades send
exactly two calls; an immediate second Equip best submission still sends exactly
two. Tests also cover disposal, account switching, refusal recovery and unequipping.

Wrote the race regression first and observed failure: 25 passed / 1 failed, with
expected `new-weapon` but received null. `race-before.log` preserves that output.
It now passes, including the same-second case, equip finishing first, equip still
running when claim resolves, shared claimFlight and exactly one credited-gains event.
Public snapshots do not include progressRev; serverTime is request-start Unix seconds
and cannot order same-second changes. Action/adoption epochs trigger a fresh state
read after an overtaking action before any stale claim can be shown. Reads overtaken
by another adoption also repeat. Strictly older serverTime snapshots are rejected.

Snapshot API adds synchronous `pending` (action, slot, itemId, recipeId, chapter),
`queued` (including running equip), `claimInFlight`, and `lastError`, preserving all
existing exports/StageCanvas props. `docs/performance.md` documents exact semantics
and G2 integration. Conflicting direct actions emit one `refused`/busy event instead
of disappearing. A stale boss refusal is now reported once; failed stale recovery
does not add a second action notice. Confirmed state stays visible on failures.
No optimistic equip or optimistic forge/chest/boss/reward success was added.

### Piece 4 — honest visibility/connectivity status: PASS; placement intentionally deferred

Pure deriveSyncStatusV2, browser subscription hook, and standalone SyncStatus component
are implemented and tested for all five states, network events, cleanup and polite
status announcements. The component has static icons, theme tokens and no motion.
It is deliberately not placed in G2's layout. Return-to-visible preserves cached
state immediately, publishes syncing, shares one claim, and clears on success/error.
No hidden claim timer was added. WelcomeBack now says “While you were away” and
renders “The first 5 minutes count in full; after that the cat earns at half speed,
up to 8 hours.” All numbers are read from CONFIG; none were changed.

### Piece 5 — server proposals only: PASS

`docs/proposals/g1-server-speed.md` covers CORS Max-Age 7200 (~860ms/cache hit using
the supplied audit), ordered equip-many (~one saved round trip for two upgrades,
about 800ms at the supplied rejection-path median, plus illustrative DB savings),
returning the mutation RPC row (not a complete snapshot today; illustrative 20–100ms
saved per eliminated snapshot), and D-G1 hidden-claim gains/costs. All estimates are
labelled; no authenticated server benchmark was invented or endpoint deployed.

### Piece 6 — local authenticated HTTP feasibility: PASS as a note; optional harness not built

Feasible without a new dependency, using Node's HTTP server plus the existing PGlite,
routesV2, handlerV2 and pgliteV2Store harnesses. Current supabase tests passed all 442
cases, including route behavior and the injectable HTTP authentication boundary.
A support-only fixture can bind 127.0.0.1, convert Node requests to Request/Response,
serve `/functions/v1/v2-*`, issue a local test-only token mapped to a seeded player,
and retain the existing per-connection RPC serialization. CORS would be emitted only
by that local fixture; no protected auth file needs editing. No live credentials,
wallet signature, remote DB or external project would be involved.

Important integration details: game-db.ts imports Vitest inject at module scope,
PGlite resolves from supabase/tests, and function code uses the aliases in that
package's Vitest config. A plain Node import is therefore not a verified standalone
server command. The cleanest next experiment is to run the HTTP fixture inside a
Vitest worker using those existing aliases, with files under apps/web/e2e/support.
The browser would also need a separate local server-mode build plus a local session
fixture: the current Playwright builds intentionally clear Supabase env and run demo.
An optional support-only Playwright config could select that build without changing
production auth. This report establishes feasibility, not end-to-end local HTTP or
real SIWE coverage. The optional HTTP harness was not built in G1.

## 2. Problems found and fixed

- FIXED: width was an effect dependency for Phaser construction, causing one game and
  uncollected visibility closure per resize; resizing the existing game stops growth.
- FIXED: paused loops could leave destroy pending forever; cleanup explicitly consumes it.
- FIXED: StageScene destroyed actors on all state changes; a visual identity key preserves them.
- FIXED: claim responses could arrive after equip and undo the shown slot; epoch-checked reconciliation preserves ordering.
- FIXED: duplicate Equip best callbacks queued another complete batch; in-flight intent deduplication keeps two upgrades at two calls.
- FIXED: busy refusals and stale boss refusals were silent; both now report one existing event.
- FIXED: stale recovery failure could add a second notice; it now retains the original refusal and records sync error separately.
- FOUND/FIXED during verification: an old a11y string and a relic UI mock needed the new API; final full suite is green.
- FOUND: raw baseline Event Timing entries could duplicate across observer windows; final measurement isolates each record (baseline raw evidence retained).
- FOUND, remaining risk: Phaser 3.90 upstream VisibilityHandler does not unregister
  its document listener in Game.runDestroy. Resize no longer recreates games, but
  repeated full Mini-mode/layout unmount/remount cycles may still accumulate one
  upstream listener per game. That separate lifecycle is not claimed fixed or measured.

## 3. Tier 2 changes

- apps/web/playwright.config.ts: v2 demo test build uses `--mode g1-perf` so the browser
  can read measurement hooks; normal production builds eliminate those branches.
- apps/web/src/layout/a11y/v2-loot.a11y.test.tsx: mandated heading assertion changed
  from “Offline gains” → “While you were away”; the h2/h3 hierarchy remains tested.

All other modified source/tests are within G1's named zone. In-zone fixture updates:
relic mock learns queue methods/new snapshot fields; empty-slot unequip test first
equips a weapon; claim snapshot identity checks account for observable syncing
transitions; busy and stale boss tests assert the newly required refusal event.
No G2-owned layout, panel, CSS, map, market or existing HUD file was edited.

## 4. Diff inventory

The following real commands were captured at implementation/evidence commit
`511d5d0`. The next reporting commit adds only this report.

`git diff --stat origin/main...HEAD`

```text
 apps/web/e2e/ui/g1-perf.spec.ts                 | 111 ++++++++++
 apps/web/e2e/ui/g1-visual.spec.ts               |  28 +++
 apps/web/playwright.config.ts                   |   2 +-
 apps/web/src/game/stage/StageCanvas.test.tsx    |  41 ++++
 apps/web/src/game/stage/StageCanvas.tsx         |  34 +--
 apps/web/src/game/stage/StageScene.test.ts      |  40 +++-
 apps/web/src/game/stage/StageScene.ts           |  62 ++++--
 apps/web/src/game/stage/bulkEquip.test.ts       |  51 +++++
 apps/web/src/game/stage/relicWiring.test.ts     |   2 +-
 apps/web/src/game/stage/relicWiring.ui.test.tsx |   2 +-
 apps/web/src/game/v2/index.ts                   |   5 +-
 apps/web/src/game/v2/loopV2.test.ts             |  84 +++++++-
 apps/web/src/game/v2/loopV2.ts                  |  88 ++++++--
 apps/web/src/game/v2/storeV2.ts                 |  39 +++-
 apps/web/src/game/v2/syncStatus.test.ts         |  15 ++
 apps/web/src/game/v2/syncStatus.ts              |  16 ++
 apps/web/src/game/v2/useSyncStatus.ts           |  24 +++
 apps/web/src/layout/a11y/v2-loot.a11y.test.tsx  |   2 +-
 apps/web/src/layout/hud/SyncStatus.test.tsx     |  41 ++++
 apps/web/src/layout/hud/SyncStatus.tsx          |  17 ++
 apps/web/src/layout/loot/WelcomeBack.test.tsx   |   8 +
 apps/web/src/layout/loot/WelcomeBack.tsx        |   7 +-
 docs/performance.md                             | 129 ++++++++++++
 docs/proposals/g1-server-speed.md               | 104 ++++++++++
 reports/g1-speed/1280x720-dark.png              | Bin 0 -> 51928 bytes
 reports/g1-speed/1280x720-light.png             | Bin 0 -> 51928 bytes
 reports/g1-speed/1600x900-light.png             | Bin 0 -> 76940 bytes
 reports/g1-speed/320x568-light.png              | Bin 0 -> 32193 bytes
 reports/g1-speed/390x844-dark.png               | Bin 0 -> 46501 bytes
 reports/g1-speed/390x844-light.png              | Bin 0 -> 46501 bytes
 reports/g1-speed/baseline-instrumentation.patch | 155 ++++++++++++++
 reports/g1-speed/baseline.log                   |  59 ++++++
 reports/g1-speed/build.log                      |  35 ++++
 reports/g1-speed/checks.json                    |  34 +++
 reports/g1-speed/classic-build.log              |  23 ++
 reports/g1-speed/deno-drift.log                 |   0
 reports/g1-speed/e2e.log                        | 265 ++++++++++++++++++++++++
 reports/g1-speed/focused.log                    |  12 ++
 reports/g1-speed/gen-deno.log                   |   5 +
 reports/g1-speed/install.log                    |  13 ++
 reports/g1-speed/links-after.json               |   6 +
 reports/g1-speed/links-baseline.json            |   6 +
 reports/g1-speed/lint.log                       |  17 ++
 reports/g1-speed/metrics.json                   | 139 +++++++++++++
 reports/g1-speed/perf-after.log                 |  59 ++++++
 reports/g1-speed/pnpm-version.log               |   1 +
 reports/g1-speed/production-hooks.log           |   2 +
 reports/g1-speed/race-before.log                |  38 ++++
 reports/g1-speed/test-initial.log               | 106 ++++++++++
 reports/g1-speed/test.log                       |  50 +++++
 reports/g1-speed/typecheck.log                  |  17 ++
 reports/g1-speed/v2-production-build.log        |  23 ++
 reports/g1-speed/visual.log                     |  58 ++++++
 53 files changed, 2011 insertions(+), 64 deletions(-)
```

`git diff --name-only origin/main...HEAD`

```text
apps/web/e2e/ui/g1-perf.spec.ts
apps/web/e2e/ui/g1-visual.spec.ts
apps/web/playwright.config.ts
apps/web/src/game/stage/StageCanvas.test.tsx
apps/web/src/game/stage/StageCanvas.tsx
apps/web/src/game/stage/StageScene.test.ts
apps/web/src/game/stage/StageScene.ts
apps/web/src/game/stage/bulkEquip.test.ts
apps/web/src/game/stage/relicWiring.test.ts
apps/web/src/game/stage/relicWiring.ui.test.tsx
apps/web/src/game/v2/index.ts
apps/web/src/game/v2/loopV2.test.ts
apps/web/src/game/v2/loopV2.ts
apps/web/src/game/v2/storeV2.ts
apps/web/src/game/v2/syncStatus.test.ts
apps/web/src/game/v2/syncStatus.ts
apps/web/src/game/v2/useSyncStatus.ts
apps/web/src/layout/a11y/v2-loot.a11y.test.tsx
apps/web/src/layout/hud/SyncStatus.test.tsx
apps/web/src/layout/hud/SyncStatus.tsx
apps/web/src/layout/loot/WelcomeBack.test.tsx
apps/web/src/layout/loot/WelcomeBack.tsx
docs/performance.md
docs/proposals/g1-server-speed.md
reports/g1-speed/1280x720-dark.png
reports/g1-speed/1280x720-light.png
reports/g1-speed/1600x900-light.png
reports/g1-speed/320x568-light.png
reports/g1-speed/390x844-dark.png
reports/g1-speed/390x844-light.png
reports/g1-speed/baseline-instrumentation.patch
reports/g1-speed/baseline.log
reports/g1-speed/build.log
reports/g1-speed/checks.json
reports/g1-speed/classic-build.log
reports/g1-speed/deno-drift.log
reports/g1-speed/e2e.log
reports/g1-speed/focused.log
reports/g1-speed/gen-deno.log
reports/g1-speed/install.log
reports/g1-speed/links-after.json
reports/g1-speed/links-baseline.json
reports/g1-speed/lint.log
reports/g1-speed/metrics.json
reports/g1-speed/perf-after.log
reports/g1-speed/pnpm-version.log
reports/g1-speed/production-hooks.log
reports/g1-speed/race-before.log
reports/g1-speed/test-initial.log
reports/g1-speed/test.log
reports/g1-speed/typecheck.log
reports/g1-speed/v2-production-build.log
reports/g1-speed/visual.log
```

## 5. Checks actually run

Corepack is unavailable; every invoked pnpm command used `npx -y pnpm@10.28.0`.
Node: v26.11.1. Chromium used the installed macOS Playwright cache.

```text
$ npx -y pnpm@10.28.0 --version
10.28.0
$ CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 305ms using pnpm v10.28.0
```

Installer warned that bufferutil/keccak/utf-8-validate build scripts were ignored.
No approval was requested; no workspace/lockfile side effect needed reverting.

```text
$ npx -y pnpm@10.28.0 gen:deno
wrote 18 Edge Function import maps
$ git diff --exit-code -- supabase/functions
[no output; exit 0]
$ npx -y pnpm@10.28.0 typecheck
packages/chain, auth, game-rules, api-contract, supabase/tests: Done
apps/web typecheck: Done
$ npx -y pnpm@10.28.0 lint
packages/chain, auth, game-rules, api-contract, supabase/tests: Done
apps/web lint: Done
$ npx -y pnpm@10.28.0 test
packages/chain: 2 files / 7 passed
packages/auth: 1 file / 24 passed
packages/game-rules: 22 passed | 3 skipped files;
  339 passed | 2 expected fail | 11 skipped tests (existing main tests, unchanged)
supabase/tests: 21 files / 442 passed
packages/api-contract: 1 file / 16 passed
apps/web: 92 files / 1161 passed
[exit 0; 1989 passed total, plus existing expected-fail/skipped cases]
$ npx -y pnpm@10.28.0 build
apps/web build: ✓ built in 322ms
apps/web build: Done
[all workspace builds Done; exit 0]
$ VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
✓ built in 320ms
[exit 0]
$ cd apps/web && npx -y pnpm@10.28.0 test:e2e
160 passed (43.1s)
[exit 0; classic, v2-loop, stage-layout projects all included]
```

Additional real checks:

```text
G1_BASELINE=1 ... test:e2e --project=stage-layout g1-perf.spec.ts: 1 passed (12.7s)
... test src/game/v2/loopV2.test.ts [race written first]: 25 passed / 1 failed (expected regression)
Focused loop/stage/queue/sync/WelcomeBack tests: 6 files / 61 passed
... test:e2e --project=stage-layout g1-perf.spec.ts: 1 passed (12.5s)
SCREENSHOTS=1 ... test:e2e --project=stage-layout g1-visual.spec.ts: 1 passed (7.6s)
VITE_GAME_V2=1 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' ... exec vite build --mode production --outDir dist-v2/production-g1:
  ✓ built in 332ms
Classic production hooks: rg exit 1; 0 files matched
V2 production hooks: rg exit 1; 0 files matched
node scripts/check-links.mjs --json, clean origin/main archive: 0 broken / 740 links
node scripts/check-links.mjs --json, G1: 0 broken / 743 links
```

The initial full test attempt failed 9 tests due to the old a11y assertion and missing
queue mock method; `test-initial.log` records it. Those failures were fixed and the
complete required suite rerun, not skipped. No tests were disabled, removed, `.only`'d,
or given longer timeouts. No lockfile/dependency/golden-number change was made.
The common `ox`/node:worker_threads externalization warning remains in Vite output.
Before browser runs, stale previews were checked/removed; only one browser suite
ran at once. After each run, reports status contained only G1-owned files.
Six PNGs (all under 200 KB; approximately 30–75 KB) were captured and visually inspected
at 1600x900, 1280x720, 390x844 and 320x568 light, and 1280x720/390x844 dark.
Complete logs and machine-readable check exit codes are under reports/g1-speed.

## 6. NOT verified

- Native OS tab switching, long-duration heap stability, repeated full Mini-mode
  unmount/remount cleanup and authenticated real-server request latencies.
- Wallet signing/minting, live DB writes, CORS deployment, batch endpoint and proposed
  RPC-return contracts. They were not authorized implementation targets.
- G2's actual Equip best/Craft pending labels and SyncStatus placement; the API is
  ready and documented, but G1 intentionally does not edit those owned files.
- A full browser session against the optional PGlite HTTP server or real SIWE; feasibility
  was assessed from existing passing harness tests and source, not a new HTTP server.

## 7. Human decisions and suspicious findings

Owner decision D-G1: keep the current hidden-tab claim policy or explicitly approve
an economic change. At constant rate within the cap, one hour away weights 1950s
under today's rule versus 3600s with 30s hidden claims (+84.6%); G1 keeps today's policy.
CORS caching and equip-many require owner approval and function deploys; mutation-row
snapshots may require an approved RPC contract change. Sequential batch RPCs are not
atomic, so partial-failure behavior needs a decision.

Remaining Phaser listener risk on full unmount is described above and in performance.md.
The old bundle-performance documentation is preserved; G1 guidance is appended.
Current main's link-check baseline is zero broken links, rather than the historical
~58 in the mission. G1 added none. G2 should wire the documented snapshot props and
standalone status component when its owned layout/panels are ready.

## 8. Branch, commits and reproduction

Branch: `ai/codex-g1-speed`.
Base: `21fec3e`; implementation/evidence: `511d5d07f1203f5e7a6b6c4ad917460be43f2b54`.
This report is added in a subsequent reporting-only commit; use `git log -2 --oneline`
to see its final hash. Required Git author for implementation:
`ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

```sh
# Current implementation, from apps/web:
npx -y pnpm@10.28.0 test:e2e --project=stage-layout g1-perf.spec.ts
SCREENSHOTS=1 npx -y pnpm@10.28.0 test:e2e --project=stage-layout g1-visual.spec.ts
# Entire suite, from repo root:
npx -y pnpm@10.28.0 test
```

To replay the baseline, make a clean checkout of `21fec3e`, apply
`reports/g1-speed/baseline-instrumentation.patch` from this branch, install frozen
with pnpm 10.28.0 and run the same g1-perf test with `G1_BASELINE=1`.
Do not set G1_BASELINE when testing the implementation acceptance thresholds.
JSON evidence: `reports/g1-speed/metrics.json`. API handoff: `docs/performance.md`.
No PR, merge, Actions dispatch, deploy or live data mutation is part of reproduction.
