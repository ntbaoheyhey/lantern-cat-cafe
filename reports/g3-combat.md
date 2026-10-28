PARTIAL

## 1. Pieces and acceptance

Base: freshly fetched origin/main at `96873ab`. G1 merge `1df3abd` (PR #193) and G2 merge
`ef9b5d1` (PR #194) are ancestors. Used an isolated clean worktree; the original forge
checkout and its uncommitted changes were left alone.

1. **Melee — PASS.** Monster approach from the right edge, profile-timed attack, opaque-frame
   contact, flash, 2 px knockback, numbers, recovery and defeat/fade. Impact forces the
   authored contact frame, with 2 logical px gap before knockback (4 afterward). Browser
   assertions at desktop/phone and asymmetric bounds/scale unit coverage pass.
2. **Ranged — PASS.** Bow/staff/flasks release from rig grip anchors and use the existing
   projectile renderer. Endpoints follow lunging targets; number/HP change at arrival.
   All seven weapon schedules have unit coverage; ranged arrival error <= one 60 Hz frame.
   Bow browser fixture verifies release→impact = 200 ms. Monster lunges use its interval,
   including the Guardian approximation. Optional swift projectile was not added: no new mechanic.
3. **Rounds — PASS.** Overlay reads chapter/round/kills directly from progress. Elite pip,
   round-start/cleared, boss-ready, kill-index regular rotation and final elite are present.
   Gates show the actual unbeatable profile member and stop attacks/defeats. The current
   authoritative label remains visible during playback of older acknowledged kills.
4. **Cat HP — PASS.** Expected HP starts at derived max per monster and falls by precisely
   monsterFight.damageTaken over its fight duration. Net loss already includes regen;
   it is not applied twice. No idle cat death animation. Expected per-monster HP is documented.
5. **Boss replay — PARTIAL.** Same event order/final HP; timestamps, projectile travel and
   animation speed scale to <=12 seconds. A 60,000 ms unit fixture finishes at 12,000 ms.
   Skip is focused/reachable, accepts early requests and reveals the confirmed banner once.
   Hidden replay pauses; return jumps to final state without consuming remaining cues.
   **Remaining:** StageLayout uses snapshot.state immediately after loop.fightBoss, so
   global chapter/key/progress UI can hint at the outcome during replay. Arena outcome text
   and the existing chest gate stay concealed until completion, but complete app-wide
   outcome concealment is not achieved. Layout edits are explicitly excluded by this mission.
6. **Sync/cost — PASS within presentation scope.** Only acknowledged frontier deltas enter
   a montage, capped at the latest eight kills. Long-hidden montage is discarded. Repeating
   combat is labelled “Fight preview · rewards on claim”; it cannot award kills or change pips.
   Stage pools are prewarmed/capped at 12 numbers/silhouettes and 8 shots; arena live numbers
   and shots are bounded too. Cached plans/bounds and resettable playback avoid app-level
   per-frame object/array churn. Phaser internals and impact text rasterization still allocate.
   Reduced motion freezes poses and removes movement, retaining fades. Demo p95 = **16.7 ms**
   across **180 real RAF frames**, under the unchanged 20 ms threshold.

Evidence: 14 PNGs in reports/g3-combat/, largest 80,548 bytes. Five scenarios at 1280×720
and 390×844 light, plus 1600×900/320×568 light and 1280×720/390×844 dark. Screenshot clocks
are controlled; frame measurement deliberately uses the real browser clock.

## 2. Problems found and fixed

- Across-space hits came from fixed percentage homes: replaced with visible frame edges/origins/scale.
- Wrong regular/absent elite came from round-modulo selection: replaced with kill-index rotation.
- Missing ranged arrival/HP came from ignored release cues and no cat HP presentation: both added.
- Gates cover the whole profile, not just the next regular: now select its actual unbeatable member.
- Immediate defeat pose overwrote contact: retain contact flash before playing defeat.
- A lunge can move the target during projectile flight: endpoints now follow it.
- Intermediate claims could cancel round banner timers: cleared/start sequence now survives them.
- Hidden replay could burst remaining events; hidden canvas disposal could remain pending: fixed both.
- Reduced-motion sprite animations/projectiles still moved: both stage and arena now freeze them.
- Initial browser run: **8 passed, 4 failed**. Test fixture used the wrong chapter-one elite ID
  and claimed before the demo's 10-second minimum. Fixed the ID and advanced system time before
  a real demo claim. Subsequent screenshot run: **12 passed**. No timeout/threshold raised.
- Updated existing scene mocks for pools/geometry. Intentional old→new assertions: cat walking
  in place→idle stance; monster at 70%→approach/contact; boss-ready idle attacks→no attacks;
  reduced-motion animation calls→none; per-hit creation→prewarmed reusable effects. Miss color,
  flash, preservation, lifecycle and cleanup checks remain. No test deleted/disabled/skipped.

## 3. Tier 2 changes

None. All edits are in the allowed stage/combat/arena/test/doc/report zone.
No layout, store, rules/content, authentication, database, dependency or workflow edits.

## 4. Diff from origin/main

<!-- DIFF_START -->
`git diff --stat origin/main...HEAD`:

```text
apps/web/e2e/ui/g3-combat.spec.ts            |  97 ++++++
 apps/web/src/game/arena/ArenaScene.test.ts   |  12 +-
 apps/web/src/game/arena/ArenaScene.ts        |  46 ++-
 apps/web/src/game/arena/BossArena.test.tsx   |   8 +-
 apps/web/src/game/arena/BossArena.tsx        |   9 +-
 apps/web/src/game/arena/playBossFight.ts     |   8 +-
 apps/web/src/game/arena/playback.test.ts     |  26 +-
 apps/web/src/game/arena/playback.ts          |  17 +-
 apps/web/src/game/combat/effects.ts          |  15 +-
 apps/web/src/game/combat/pool.ts             |   6 +-
 apps/web/src/game/combat/timeline.ts         |   7 +-
 apps/web/src/game/stage/StageCanvas.test.tsx |  27 ++
 apps/web/src/game/stage/StageCanvas.tsx      |  31 ++
 apps/web/src/game/stage/StageScene.test.ts   |  71 +++--
 apps/web/src/game/stage/StageScene.ts        | 435 +++++++++++++++++----------
 apps/web/src/game/stage/choreography.test.ts |  58 ++++
 apps/web/src/game/stage/choreography.ts      |  59 ++++
 apps/web/src/game/stage/stage.css            |   9 +
 apps/web/src/game/stage/stageFx.ts           |   9 +
 docs/combat-presentation.md                  |  75 +++++
 reports/g3-combat.md                         | 337 +++++++++++++++++++++
 reports/g3-combat/elite-1280x720.png         | Bin 0 -> 66078 bytes
 reports/g3-combat/elite-390x844.png          | Bin 0 -> 46080 bytes
 reports/g3-combat/frame-metrics.json         |   4 +
 reports/g3-combat/gated-1280x720.png         | Bin 0 -> 68633 bytes
 reports/g3-combat/gated-390x844.png          | Bin 0 -> 43415 bytes
 reports/g3-combat/melee-1280x720.png         | Bin 0 -> 65918 bytes
 reports/g3-combat/melee-390x844.png          | Bin 0 -> 45835 bytes
 reports/g3-combat/ranged-1280x720.png        | Bin 0 -> 65583 bytes
 reports/g3-combat/ranged-390x844.png         | Bin 0 -> 45452 bytes
 reports/g3-combat/reduced-1280x720-dark.png  | Bin 0 -> 65456 bytes
 reports/g3-combat/reduced-1600x900-light.png | Bin 0 -> 80548 bytes
 reports/g3-combat/reduced-320x568-light.png  | Bin 0 -> 30678 bytes
 reports/g3-combat/reduced-390x844-dark.png   | Bin 0 -> 45179 bytes
 reports/g3-combat/round-cleared-1280x720.png | Bin 0 -> 74401 bytes
 reports/g3-combat/round-cleared-390x844.png  | Bin 0 -> 47779 bytes
 36 files changed, 1152 insertions(+), 214 deletions(-)
```

`git diff --name-only origin/main...HEAD`:

```text
apps/web/e2e/ui/g3-combat.spec.ts
apps/web/src/game/arena/ArenaScene.test.ts
apps/web/src/game/arena/ArenaScene.ts
apps/web/src/game/arena/BossArena.test.tsx
apps/web/src/game/arena/BossArena.tsx
apps/web/src/game/arena/playBossFight.ts
apps/web/src/game/arena/playback.test.ts
apps/web/src/game/arena/playback.ts
apps/web/src/game/combat/effects.ts
apps/web/src/game/combat/pool.ts
apps/web/src/game/combat/timeline.ts
apps/web/src/game/stage/StageCanvas.test.tsx
apps/web/src/game/stage/StageCanvas.tsx
apps/web/src/game/stage/StageScene.test.ts
apps/web/src/game/stage/StageScene.ts
apps/web/src/game/stage/choreography.test.ts
apps/web/src/game/stage/choreography.ts
apps/web/src/game/stage/stage.css
apps/web/src/game/stage/stageFx.ts
docs/combat-presentation.md
reports/g3-combat.md
reports/g3-combat/elite-1280x720.png
reports/g3-combat/elite-390x844.png
reports/g3-combat/frame-metrics.json
reports/g3-combat/gated-1280x720.png
reports/g3-combat/gated-390x844.png
reports/g3-combat/melee-1280x720.png
reports/g3-combat/melee-390x844.png
reports/g3-combat/ranged-1280x720.png
reports/g3-combat/ranged-390x844.png
reports/g3-combat/reduced-1280x720-dark.png
reports/g3-combat/reduced-1600x900-light.png
reports/g3-combat/reduced-320x568-light.png
reports/g3-combat/reduced-390x844-dark.png
reports/g3-combat/round-cleared-1280x720.png
reports/g3-combat/round-cleared-390x844.png
```
<!-- DIFF_END -->

## 5. Actual verification

Corepack was unavailable. Every explicit pnpm command used npx -y pnpm@10.28.0.
Node version: v26.11.1. pnpm version output: **10.28.0**.

`CI=true npx -y pnpm@10.28.0 install --frozen-lockfile` — PASS:

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
Done in 321ms using pnpm v10.28.0
```

`npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` — PASS:

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/g3-combat/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
Drift diff: no output, exit 0.
```

`npx -y pnpm@10.28.0 typecheck` — PASS:

```text
> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/g3-combat/taskbar hero
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

`npx -y pnpm@10.28.0 lint` — PASS:

```text
> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/g3-combat/taskbar hero
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

`npx -y pnpm@10.28.0 test` — PASS:

```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test: Done
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  442 passed (442)
supabase/tests test: Done
packages/game-rules test:  Test Files  22 passed | 3 skipped (25)
packages/game-rules test:       Tests  339 passed | 2 expected fail | 11 skipped (352)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test: Done
apps/web test:  Test Files  93 passed (93)
apps/web test:       Tests  1178 passed (1178)
apps/web test: Done
```

`npx -y pnpm@10.28.0 build` — PASS:

```text
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 340ms
apps/web build: Done
```

`VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build` — PASS:

```text
> @taskbar-hero/web@0.0.0 build /Users/bao/.codex/worktrees/g3-combat/taskbar hero/apps/web
> tsc --noEmit && vite build
✓ built in 312ms
```

`cd apps/web && npx -y pnpm@10.28.0 test:e2e` — PASS:

```text
Running 185 tests using 6 workers
G3 stage frame metrics { p95: 16.700000000000273, frames: 180 }
  185 passed (52.9s)
```

`cd apps/web && SCREENSHOTS=1 npx -y pnpm@10.28.0 test:e2e ui/g3-combat.spec.ts --workers=1` — PASS:

```text
Running 12 tests using 1 worker
G3 stage frame metrics { p95: 16.700000000000728, frames: 180 }
  12 passed (32.9s)
```

The initial frozen install added 505 packages in 5.7 seconds, using pnpm v10.28.0;
the quoted final install reused them. Ignored build-script warnings did not modify
pnpm-workspace.yaml or pnpm-lock.yaml, so no approval/revert was needed.
Game-rules' existing expected failures/skips are unchanged; none was introduced here.
Preview leftovers were killed before each browser suite. Both builds use empty Supabase
URL/key; V2 config sets VITE_GAME_V2=1. G1's generated metrics were restored after full runs.
`git status --short reports/` was checked to contain only G3 changes before committing.

Additional real checks:

- git diff --check: no output, exit 0.
- git diff --exit-code -- packages/game-rules pnpm-lock.yaml pnpm-workspace.yaml: no output, exit 0.
- node scripts/check-links.mjs --json: 54 files / 746 paths / **0 broken**.
- Same checker on origin/main's 53 tracked documentation files: **0 broken**; none added.
  The brief's older ~58-link baseline is already resolved at this base.
- New document alone: 1 file / 2 paths / all exist.
- PNG validation: 14 files, largest 80,548 bytes; every file <200,000 bytes.

## 6. NOT verified

- Full app-wide boss outcome concealment: known remaining global HUD adoption issue above.
- Live wallet/SIWE, Supabase, database/server integration and mainnet transactions were not
  exercised or changed. Browser coverage uses demo saves. No deploy was performed.
- Low-end physical phones, other browsers and every loadout: frame timing covers this host's
  headless Chromium demo build only.
- Historical idle per-kill stats: the API does not provide them. Montage interpolation uses
  the latest authoritative gear/level; it does not invent a historical server hit log.

## 7. Human decisions and observations outside the zone

- The layout/store owner should decide whether to defer displayed boss chapter/key/progress
  until replay completion. Complete outcome concealment needs this; server mutation remains immediate.
- Phone Recent Finds overlaps the lower stage after claims (visible in round-cleared phone
  evidence). This inherited layout behavior was left unchanged.
- No PR, merge, Actions run or deployment was created.

## 8. Branch, commits and reproduction

Branch: ai/codex-g3-combat.
Implementation/evidence commit: `72159b9f56c7591cad173640dbb90be5c0329c7f`.
Report-only commit: branch tip (`git log -1 --format=%H`); exact hash is in the final handoff.
All commits use ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.

Run the frozen install and section 5 commands on this branch. SCREENSHOTS=1 writes
reports/g3-combat/*.png and frame metrics. Screenshots pause at cue frames; round-cleared
uses a real demo claim after advancing system time beyond its minimum. For manual inspection,
start the V2 demo with empty Supabase URL/key. Strong fixtures are test data, not balance edits.
