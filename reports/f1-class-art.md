PARTIAL

# F1 — seven class looks and wave G leftovers

Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `ai/codex-f1-class-art`.
Base: `47f0893` (`origin/main` after G3 and G3 concealment follow-up merged).
Implementation/evidence commit: `60c7a1511e18f2f1d4b0dfefff3ec7a2abb7d702`.

## 1. Per-piece work and acceptance

### Piece 1 — class looks: PASS

Read all of `docs/class-looks/README.md` and inspected the preview references. No class is marked rejected.
Applied its five outstanding iris updates: Guardian/Rogue amber, Hunter blue, Witch violet,
Alchemist jade. Warrior and Archer already have their specified palettes.
All seven weapon types, starter weapon IDs and marking assignments remain as specified.

The old renderer selected every body/tail from one shared map, leaving the guide's silhouette
features unwired. Added a broad Guardian torso/thick tail, slender Rogue with fine trailing tail,
ringed Hunter tail, slender Siamese Archer with dark paws and tail, Witch ruff/plume, and Alchemist
bobtail. Warrior retains its ginger mackerel stripes, cream bib/paws and upright tail.
`HEAD` stays shared as the exact wiring guide requires; helmet fit, every equipment anchor,
56×48 frame size, cell offsets and foot contact stay intact.

`poses.ts` already has exactly the specified attack counts and hit/release times; no edit was
needed: sword 240ms, hammer 520ms, daggers 140/300ms, spear 300ms, bow 300ms, staff 500ms,
flasks 260ms. Six attack frames, eight for daggers, four idle frames, two hurt frames.
Full rig coverage renders every animation/loadout/rarity without clipping. New tests cover
approved palettes, seven different solid starter silhouettes, points, maps, and preserved anchors.
All combat timing tests pass in the full unit/browser suites.

Evidence: **12 PNGs**, largest **88,067 bytes**. [all-classes-1x.png](f1-class-art/all-classes-1x.png) and [all-classes-3x.png](f1-class-art/all-classes-3x.png)
show every idle, attack and hit/recoil frame of all seven classes. Guardian, Rogue and Witch
have live-stage screenshots at both 1280×720 and 390×844 light. Additional post-claim screenshots
cover 1600×900/320×568 light and 1280×720/390×844 dark. No remote assets, new fonts or dependencies.
Sprites are deliberately frozen under reduced motion for stage screenshots.

Acceptance: **PASS** distinct palettes/starter silhouettes; **PASS** anchors/frame counts;
**PASS** rig and combat timing; **PASS** required evidence.

### Piece 2 — wave G leftovers: PASS (every item fixed, already resolved, or explained)

Reviewed `g1-speed.md`, `g2-shell.md`, `g2-followup.md`, `g3-combat.md`, `g3-fix1.md`, and
`g4-art-pilot.md`, including their outside-zone and NOT-verified sections.

| Source / item | Disposition and evidence |
| --- | --- |
| G1: Phaser visibility closure survives full game unmount | **FIXED**. A narrowly scoped managed-game boundary records the engine's synchronous start registrations and removes its own closures on game destroy. Prior/later window focus owners and overlapping stage/arena destruction are handled. Unit regressions cover repeated mounts, failed startup and overlapping owners; a real Chromium/CDP test replays/remounts the arena four times with a flat visibility-listener count. |
| G1 lifecycle follow-through: scene-owned visibility closures | **FIXED** additional root cause found by the new browser regression: Phaser full game destruction emits scene DESTROY, while stage/arena only listened for SHUTDOWN. Both scenes now dispose on either event, idempotently. Stage unit regression explicitly emits DESTROY without SHUTDOWN; arena regression uses real Phaser. |
| G1: pending labels / SyncStatus slot | **ALREADY RESOLVED** on fetched main by G2/G-wire; full suite verifies current wiring. No duplicate implementation. |
| G1: duplicate raw baseline Event Timing records | Historical evidence limitation, already corrected by G1's isolated observer in the current spec. Original measurements remain unmodified. |
| G1: hidden-tab claim/economy policy | **EXPLAINED / NO CHANGE**. Economic policy decision and hard-stop config numbers; adding hidden claims would change rewards. Existing behavior remains. |
| G1: CORS caching, equip-many, mutation-row snapshots, sequential RPC atomicity | **EXPLAINED / NO CHANGE**. Backend/API/deployment or database-contract decisions, not a remaining apps/web/src bug. No live writes, migration or deploy permitted. |
| G1: native OS tab switching, long-duration memory, real-server latency | **NOT VERIFIED**, separate environment/soak coverage. Synthetic visibility transitions, resize and repeated real game remounts are verified. |
| G2 follow-up: small hint target / phone fonts / eight desktop targets | **ALREADY RESOLVED** by merged follow-up. G2's unchanged 15-test shell suite passes before and after. |
| G2 follow-up: nine compact-strip 28px slots | **EXPLAINED / NO CHANGE**. Report explicitly retains these for the 380–460px panel width; enlarging nine horizontal slots requires a separate layout design. Not silently reported as 44px. |
| G2 follow-up: modal choose button reported 36px | **ALREADY 44px IN CURRENT SOURCE**: ClassPicker.css uses min-height var(--tap, 44px), and theme.css defines --tap: 44px. No stale 36px value changed. |
| G3: app-wide boss outcome concealment | **ALREADY RESOLVED** by merged G3 fix1. All five natural/skip/hidden/reduced-motion concealment cases pass in the final full browser suite. |
| G3: phone Recent finds covers lower stage | **FIXED**. Move the unchanged summary into the management panel, cap its own scroll area, and remove absolute stage positioning. Four real post-claim regression scenarios prove zero overlap with the visible stage, no document scroll, and a visible summary. |
| G3 fix1: CSP spec assumes 4173/4174 | **FIXED (Tier 2)**. Use the existing shared server URLs. Final full suite runs on 4273/4274, with all CSP cases passing. |
| G3: historical per-kill authoritative stats | **EXPLAINED / NO CHANGE**. The API does not supply historical hit logs; inventing them or extending the backend is outside this task. |
| G3: real wallets, DB/server integration, physical phones/other browsers | **NOT VERIFIED**, demo/headless verification only; prohibited live changes were not attempted. |
| G4: owner art-pilot approval / higher-resolution standalone Warrior rig | **EXPLAINED / NO CHANGE**. Art decision and a separate asset integration; the standalone pilot lives in F3-owned monsters files. This mission wires the seven specified procedural class looks. No monsters or docs/art-direction.md edits. |
| G4: G1 metrics file changes on full e2e | **EXPLAINED / CLEANED**. This is a documented benchmark artifact side effect, not an apps/web/src bug. Copied this mission's results into F1, then restored G1 and G3 generated metrics. Only F1 reports remain changed. |

### Piece 3 — G1/G2 remeasurement: PASS existing budgets; strict every-number non-increase NOT VERIFIED

Before/after G1 + G2 focused runs: **16 passed** each. Every original threshold is unchanged.
Because initial sub-millisecond differences were noisy, ran the unchanged G1 spec **five times on
main sources and five times on F1 sources**, serially with one browser worker and no simultaneous
workspace tests. Raw samples and medians: `perf-comparison.json`; reproduction: `measure.py`.
The script restores every F1 source in a finally block before the after run. Existing G1 raw
sample objects retain their own phase='after' field; the comparison groups explicitly identify
which checkout sources produced them.

| Median measurement | Main | F1 |
| --- | ---: | ---: |
| Equip best click → API pending | 5.1ms | 4.9ms |
| Craft click → API pending | 0.9ms | 0.8ms |
| Fight click → API pending | 1.0ms | 0.9ms |
| Equip next-frame scheduling | 194.9ms | 188.0ms |
| Craft next-frame scheduling | 17.9ms | 18.2ms |
| Fight next-frame scheduling | 28.5ms | 28.3ms |
| Visibility listeners before → after resize cycles | 5 → 5 | 5 → 5 |
| CDP event listeners before → after | 247 → 247 | 247 → 247 |
| CDP nodes before → after | 17,352 → 17,352 | 17,352 → 17,352 |
| Actor rebuilds in three plain claims | 0 | 0 |
| Heap used after cycles (bytes) | 15,078,528 | 15,091,328 |

All three primary pending medians improve and remain far below 100ms. Shell geometry, window
fit, reachability, targets, keyboard behavior and reduced motion pass unchanged. Final G3 RAF
frame budget also passes (see frame-metrics.json and full e2e output).

**Reason for overall PARTIAL:** the instruction says numbers must not get worse. It would be
false to claim every diagnostic decreased: Craft next-frame median rose **0.3ms** and measured
post-cycle heap rose **12,800 bytes (~0.085%)**. Craft next-frame ranges overlap (main 16.5–24.1ms,
F1 15.0–19.5ms), so these samples do not establish a material slowdown, but neither do they prove
strict non-increase. No timeout, golden, assertion, budget or snapshot was raised to hide this.
All implementation and verification work is complete; this narrow performance interpretation
is left explicitly open for the reviewer.

## 2. Problems found and fixed

- Class silhouettes stayed uniform because composeFrame always selected the shared body/tail;
  class-specific maps now feed the same anchors and gear layers.
- Archer points ended at face/ear overlays because feet/paws/tail always used light/base fur;
  the exposed four paws and whole tail now use the specified mocha.
- Phaser core visibility closures survived destroy because upstream runDestroy never removes
  them; managed starts now retain cleanup ownership.
- Scene closures additionally survived full destruction because SHUTDOWN and DESTROY differ;
  both lifecycle paths now dispose once.
- Recent finds covered the cat because its summary was absolutely positioned over the stage;
  it now occupies a bounded management-panel area.
- CSP alternate-port verification failed because its URL ignored the shared server config;
  it now follows the configured URLs.
- Initial full e2e lost preview listeners partway through (later failures ERR_CONNECTION_REFUSED,
  36 passed / 170 failed). CLI server processes were vulnerable to other-checkout global preview
  cleanup. The launcher now calls Vite's same preview API with an isolated process name and
  explicit signal cleanup. The cause of the external termination is inferred, not observed;
  the final same-port full run passed 206/206. Original failure log is retained.
- Initial new claim fixture installed fake time after MockGameApi captured Date.now, producing
  no gains; install time before loading the app now exercises the real claim path.
- Initial 320px overlap measurement included the canvas overscan outside its clipped stage;
  measure the visible Game stage region so zero-overlap still tests what players can see.
- Initial point-toe assertion sampled a pixel covered by the carried bow; exposed front toes
  and back toes remain checked. No existing product test was weakened/deleted/skipped.
- Initial typecheck caught missing explicit event-listener parameter types and optional indexed
  palette lookup; both fixed before final checks. Logs retain the initial failures.

## 3. Tier 2 changes

- `apps/web/src/game/managedGame.ts` and its test: small shared engine-boundary util needed to
  close the named full-unmount lifecycle bug in both stage and arena.
- `apps/web/src/game/arena/ArenaScene.ts`: adjacent scene cleanup found by the real lifecycle
  regression while closing G1's full-game listener leak.
- `apps/web/e2e/security.spec.ts`: existing URL now uses shared port config, fixing G3's reported
  verification gap without changing CSP assertions.
- `apps/web/playwright.config.ts` and `e2e/support/serve.mjs`: isolated Vite API preview process
  avoids accidental termination of an active alternate-port suite; still builds both sites,
  uses strict ports, refuses server reuse, and keeps demo Supabase values empty.
- `apps/web/e2e/ui/f1-class-art.spec.ts`: class evidence and regression coverage beside the
  mission's G1/G2 browser specs. No new public dev route or production instrumentation.

The other changes are in class rig files or source/test files directly identified by the wave G
leftovers. No existing behavior assertion changed except the CSP URL's shared configuration;
no user-visible strings, IDs, accessible names, roles or tab order changed.

## 4. Git diff from origin/main

<!-- DIFF_START -->
`git diff --stat origin/main...HEAD` (final staged tree):
```text
 apps/web/e2e/security.spec.ts                     |    3 +-
 apps/web/e2e/support/serve.mjs                    |   15 +
 apps/web/e2e/ui/f1-class-art.spec.ts              |  131 +
 apps/web/playwright.config.ts                     |    4 +-
 apps/web/src/game/arena/ArenaScene.ts             |   10 +-
 apps/web/src/game/arena/playBossFight.ts          |    3 +-
 apps/web/src/game/managedGame.test.ts             |   67 +
 apps/web/src/game/managedGame.ts                  |   50 +
 apps/web/src/game/rig/classLooks.test.ts          |   71 +
 apps/web/src/game/rig/compose.ts                  |   19 +-
 apps/web/src/game/rig/palettes.ts                 |   13 +-
 apps/web/src/game/rig/parts.ts                    |   55 +-
 apps/web/src/game/stage/StageCanvas.tsx           |    3 +-
 apps/web/src/game/stage/StageScene.test.ts        |   16 +-
 apps/web/src/game/stage/StageScene.ts             |    9 +-
 apps/web/src/layout/StageLayout.tsx               |   10 +-
 apps/web/src/layout/layout.css                    |   11 +-
 reports/f1-class-art.md                           |  447 ++
 reports/f1-class-art/all-classes-1x.png           |  Bin 0 -> 33408 bytes
 reports/f1-class-art/all-classes-3x.png           |  Bin 0 -> 46966 bytes
 reports/f1-class-art/build.log                    |   36 +
 reports/f1-class-art/checks.json                  |   18 +
 reports/f1-class-art/classic-build.log            |   24 +
 reports/f1-class-art/deno-drift.log               |    0
 reports/f1-class-art/e2e-server-loss.log          | 4520 +++++++++++++++++++++
 reports/f1-class-art/e2e.log                      |  290 ++
 reports/f1-class-art/evidence-cleanup-initial.log |  112 +
 reports/f1-class-art/evidence-initial.log         |  195 +
 reports/f1-class-art/evidence.log                 |   66 +
 reports/f1-class-art/finds-1280x720-dark.png      |  Bin 0 -> 70268 bytes
 reports/f1-class-art/finds-1600x900-light.png     |  Bin 0 -> 88067 bytes
 reports/f1-class-art/finds-320x568-light.png      |  Bin 0 -> 31996 bytes
 reports/f1-class-art/finds-390x844-dark.png       |  Bin 0 -> 41222 bytes
 reports/f1-class-art/focused-initial.log          |   17 +
 reports/f1-class-art/focused.log                  |    9 +
 reports/f1-class-art/frame-metrics.json           |    4 +
 reports/f1-class-art/full-suite-metrics.json      |  139 +
 reports/f1-class-art/gen-deno.log                 |    5 +
 reports/f1-class-art/guardian-1280x720-light.png  |  Bin 0 -> 65674 bytes
 reports/f1-class-art/guardian-390x844-light.png   |  Bin 0 -> 46067 bytes
 reports/f1-class-art/install.log                  |   21 +
 reports/f1-class-art/links-after.log              |    3 +
 reports/f1-class-art/links-before.log             |    3 +
 reports/f1-class-art/lint.log                     |   17 +
 reports/f1-class-art/measure.py                   |   53 +
 reports/f1-class-art/metrics-after.json           |  139 +
 reports/f1-class-art/metrics-before.json          |  139 +
 reports/f1-class-art/perf-after-5.log             |   71 +
 reports/f1-class-art/perf-after.log               |   70 +
 reports/f1-class-art/perf-before-5.log            |   71 +
 reports/f1-class-art/perf-before.log              |   70 +
 reports/f1-class-art/perf-comparison.json         |  564 +++
 reports/f1-class-art/pnpm-version.log             |    1 +
 reports/f1-class-art/rogue-1280x720-light.png     |  Bin 0 -> 65884 bytes
 reports/f1-class-art/rogue-390x844-light.png      |  Bin 0 -> 46300 bytes
 reports/f1-class-art/test.log                     |   50 +
 reports/f1-class-art/typecheck-initial.log        |   15 +
 reports/f1-class-art/typecheck.log                |   17 +
 reports/f1-class-art/witch-1280x720-light.png     |  Bin 0 -> 65195 bytes
 reports/f1-class-art/witch-390x844-light.png      |  Bin 0 -> 45755 bytes
 60 files changed, 7639 insertions(+), 37 deletions(-)
```

`git diff --name-only origin/main...HEAD`:
```text
apps/web/e2e/security.spec.ts
apps/web/e2e/support/serve.mjs
apps/web/e2e/ui/f1-class-art.spec.ts
apps/web/playwright.config.ts
apps/web/src/game/arena/ArenaScene.ts
apps/web/src/game/arena/playBossFight.ts
apps/web/src/game/managedGame.test.ts
apps/web/src/game/managedGame.ts
apps/web/src/game/rig/classLooks.test.ts
apps/web/src/game/rig/compose.ts
apps/web/src/game/rig/palettes.ts
apps/web/src/game/rig/parts.ts
apps/web/src/game/stage/StageCanvas.tsx
apps/web/src/game/stage/StageScene.test.ts
apps/web/src/game/stage/StageScene.ts
apps/web/src/layout/StageLayout.tsx
apps/web/src/layout/layout.css
reports/f1-class-art.md
reports/f1-class-art/all-classes-1x.png
reports/f1-class-art/all-classes-3x.png
reports/f1-class-art/build.log
reports/f1-class-art/checks.json
reports/f1-class-art/classic-build.log
reports/f1-class-art/deno-drift.log
reports/f1-class-art/e2e-server-loss.log
reports/f1-class-art/e2e.log
reports/f1-class-art/evidence-cleanup-initial.log
reports/f1-class-art/evidence-initial.log
reports/f1-class-art/evidence.log
reports/f1-class-art/finds-1280x720-dark.png
reports/f1-class-art/finds-1600x900-light.png
reports/f1-class-art/finds-320x568-light.png
reports/f1-class-art/finds-390x844-dark.png
reports/f1-class-art/focused-initial.log
reports/f1-class-art/focused.log
reports/f1-class-art/frame-metrics.json
reports/f1-class-art/full-suite-metrics.json
reports/f1-class-art/gen-deno.log
reports/f1-class-art/guardian-1280x720-light.png
reports/f1-class-art/guardian-390x844-light.png
reports/f1-class-art/install.log
reports/f1-class-art/links-after.log
reports/f1-class-art/links-before.log
reports/f1-class-art/lint.log
reports/f1-class-art/measure.py
reports/f1-class-art/metrics-after.json
reports/f1-class-art/metrics-before.json
reports/f1-class-art/perf-after-5.log
reports/f1-class-art/perf-after.log
reports/f1-class-art/perf-before-5.log
reports/f1-class-art/perf-before.log
reports/f1-class-art/perf-comparison.json
reports/f1-class-art/pnpm-version.log
reports/f1-class-art/rogue-1280x720-light.png
reports/f1-class-art/rogue-390x844-light.png
reports/f1-class-art/test.log
reports/f1-class-art/typecheck-initial.log
reports/f1-class-art/typecheck.log
reports/f1-class-art/witch-1280x720-light.png
reports/f1-class-art/witch-390x844-light.png
```
<!-- DIFF_END -->

## 5. Checks actually run (real output excerpts)

All pnpm commands use `npx -y pnpm@10.28.0` because corepack is unavailable.
`pnpm --version`: **10.28.0**. Node: **v26.11.1**.

`CI=true npx -y pnpm@10.28.0 install --frozen-lockfile` — PASS:
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Done in 5.7s using pnpm v10.28.0
```
Ignored native build-script warnings were reported; no approval was requested and no lock/workspace
file was changed. No new dependencies. Chromium was already installed.

`npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` — PASS:
```text
wrote 18 Edge Function import maps
exit 0; deno-drift.log is empty (0 bytes)
```

`npx -y pnpm@10.28.0 typecheck` — PASS:
```text
Scope: 6 of 7 workspace projects
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done
```

`npx -y pnpm@10.28.0 lint` — PASS:
```text
Scope: 6 of 7 workspace projects
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done
```

`npx -y pnpm@10.28.0 test` — PASS:
```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  442 passed (442)
packages/game-rules test:  Test Files  22 passed | 3 skipped (25)
packages/game-rules test:       Tests  339 passed | 2 expected fail | 11 skipped (352)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  97 passed (97)
apps/web test:       Tests  1206 passed (1206)
```
Game-rules' pre-existing expected failures/skips remain unchanged. None added by F1.

`npx -y pnpm@10.28.0 build` — PASS:
```text
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 332ms
apps/web build: Done
```

`VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build` — PASS:
```text
✓ built in 336ms
```

From apps/web, `E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 npx -y pnpm@10.28.0 test:e2e` — PASS:
```text
Running 206 tests using 6 workers
G3 stage frame metrics { p95: 16.700000000000728, frames: 180 }
  206 passed (54.0s)
```
Both builds use empty Supabase URL/key; V2 uses VITE_GAME_V2=1. Classic project passed as part
of all-project verification, including CSP on the actual configured ports. Servers were absent
before serial runs; no stale server reused. A default-port conflict attempt is noted above;
final server wrapper shuts down its own children via signals. Unrelated checkout processes
are not intentionally killed after the conflict was identified.

`SCREENSHOTS=1` with the same alternate ports and `test:e2e ui/f1-class-art.spec.ts --workers=1` — PASS:
```text
Running 13 tests using 1 worker
  13 passed (21.5s)
```

`test:e2e ui/g1-perf.spec.ts ui/g2-shell.spec.ts --workers=1` — PASS before and after:
```text
  16 passed (27.4s)
  16 passed (24.8s)
```

`python3 reports/f1-class-art/measure.py` — PASS; unchanged G1 spec, five serial samples per version:
```text
before exit 0 samples 5
  5 passed (41.6s)
after exit 0 samples 5
  5 passed (38.5s)
```

`npx -y pnpm@10.28.0 --filter @taskbar-hero/web exec vitest run src/game/rig src/game/managedGame.test.ts src/game/stage/StageScene.test.ts src/game/stage/StageCanvas.test.tsx src/game/combat src/game/arena` — PASS:
```text
 Test Files  14 passed (14)
      Tests  130 passed (130)
```
That focused run preceded one extra map-validation test; the final full unit run includes it.

`node scripts/check-links.mjs` — PASS on archived untouched base and final working tree:
```text
Checked 55 markdown files and 751 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
Checked 55 markdown files and 751 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
```
Baseline is **zero** broken links on this fetched main, not the historical ~58. No added failures.
`git diff --check` — PASS. After e2e, restored G1/G3 metrics; report changes are F1-only.

## 6. NOT verified

- Strict non-increase of every noisy performance diagnostic (see Piece 3); primary feedback
  medians and all unchanged automated budgets pass.
- Native OS tab switching, long-duration memory soak, physical phones, non-Chromium browsers,
  and every possible player loadout visually. Rig all-frame/all-rarity/loadout combinations are unit-tested.
- Live Supabase/database writes, wallet/SIWE signing, on-chain transactions, deployments and
  authenticated server latency. None attempted or modified.
- Human owner approval of visual taste beyond the supplied implementation-ready class guide.

## 7. Human decisions and observations outside the zone

- Decide whether the 0.3ms scheduling / ~0.085% heap diagnostic variation is acceptable under
  the mission's literal no-worse wording. Raw overlapping samples are preserved, with no assertion changes.
- Existing hidden-tab economic policy and backend atomicity/API proposals remain owner decisions.
- Existing 28px compact gear strip targets remain as G2 explicitly documented; evidence also
  shows crowded compact-strip labels at 1600px and clipped phone topbar detail. These are separate
  layout audit observations; no broad shell redesign performed here.
- G4 standalone Warrior/monster art ownership and docs/art-direction.md remain untouched for F3.

## 8. Branch, commits and reproduction

Branch: `ai/codex-f1-class-art`.
Implementation/evidence: `60c7a1511e18f2f1d4b0dfefff3ec7a2abb7d702`. A subsequent report-only commit is the branch tip;
its exact hash is in the final handoff (`git log -2 --oneline`).
Author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
Clean managed worktree: `/Users/bao/.codex/worktrees/f1-class-art/taskbar hero`.
Original dirty forge checkout was preserved. No PR, merge, manual Actions run or deploy created.

```sh
# From repo root:
CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
# From apps/web (one browser suite at a time):
E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 SCREENSHOTS=1 npx -y pnpm@10.28.0 test:e2e ui/f1-class-art.spec.ts --workers=1
E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 npx -y pnpm@10.28.0 test:e2e
# From root, optional paired performance reproduction; no other source edits/builds simultaneously:
python3 reports/f1-class-art/measure.py
# Restore other missions' generated metrics after browser runs:
git restore reports/g1-speed/metrics.json reports/g3-combat/frame-metrics.json
```
