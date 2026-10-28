# MISSION F3: Chapters 2–5 Art Rollout Report

STATUS: DONE

## 1. Per Piece Acceptance & Summary

### Piece 1: Owner Verdict Line & Art Direction Confirmation
- **Verdict**: Repository owner `ntbaoheyhey` approved Decision D-G3 Option A by merging PR #197 (`ai/antigravity-g4-art-pilot`) into `origin/main`.
- **Action**: Recorded `PILOT APPROVED` at the very top of [`docs/art-direction.md`](file:///Users/bao/taskbar-hero/docs/art-direction.md).
- **Standards Maintained**: 24×24 regular monsters (balanced, swift, sturdy), 28×28 elite monsters, 40×40 boss monsters; 1 px dark outline (`'k'`); left facing (`x = 0`); grounded feet on bottom row (`height - 1`); 1x solid black silhouette distinction.
- **Acceptance**: PASS.

### Piece 2: Redraw the Five Chapter 2 Monsters (`CH2_PILOT_ART`)
- **Theme**: Kitchen Pantry (sage pantry greens & copper pantry wares).
- **Monsters Authored in [`apps/web/src/art/monsters/ch2.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch2.ts)**:
  - `mon.pickle.imp` (24×24 regular, balanced): 4 walk, 3 attack, 2 hit, 4 defeat frames. Crisp dark pickle outline, dill warts, brine drip trailing onto bottom row.
  - `mon.toast.mimic` (24×24 regular, swift): 4 walk, 3 attack, 2 hit, 4 defeat frames. Elongated wedge slice, butter pat tooth crest, forward crumb spray.
  - `mon.spoon.bug` (24×24 regular, sturdy): 4 walk, 3 attack, 2 hit, 4 defeat frames. Dense concave silver spoon carapace, broad stance, sturdy legs.
  - `mon.blender.brute` (28×28 elite): 4 walk, 3 attack, 2 hit, 4 defeat frames. Heavy die-cast motor pedestal, whirling vortex pitcher, high silhouette contrast.
  - `mon.cucumber.scare` (40×40 boss): 4 idle, 4 walk, 3 windup, 4 attack, 2 hit, 6 defeat frames. Towering arching gherkin leviathan, glowing lemon-lime shock eyes, sweeping vine appendages.
- **Validation**: Zero problems reported by `monsterPilotArtProblems` in [`ch2Pilot.test.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch2Pilot.test.ts).
- **Acceptance**: PASS.

### Piece 3: Redraw the Five Chapter 3 Monsters (`CH3_PILOT_ART`)
- **Theme**: Bubble Bath (pastel bath bubbles & porcelain tiles).
- **Monsters Authored in [`apps/web/src/art/monsters/ch3.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch3.ts)**:
  - `mon.soap.slime` (24×24 regular, balanced): 4 walk, 3 attack, 2 hit, 4 defeat frames. Translucent aqua gelatin bar, lather bubbles, sudsy wake grounded on floor.
  - `mon.rubber.duck` (24×24 regular, swift): 4 walk, 3 attack, 2 hit, 4 defeat frames. Low horizontal buoyant wedge, sharp orange bill facing left, water ripples.
  - `mon.sponge.crab` (24×24 regular, sturdy): 4 walk, 3 attack, 2 hit, 4 defeat frames. Porous yellow sponge block, heavy dual loofah claws, wide grounded legs.
  - `mon.hair.dryer.wisp` (28×28 elite): 4 walk, 3 attack, 2 hit, 4 defeat frames. Menacing chrome dryer chassis with swirling crimson heat-coil vortex.
  - `mon.bathtub.tyrant` (40×40 boss): 4 idle, 4 walk, 3 windup, 4 attack, 2 hit, 6 defeat frames. Heavy porcelain clawfoot tub behemoth, brass dragon faucet crest, roaring tidal surge.
- **Validation**: Zero problems reported by `monsterPilotArtProblems` in [`ch3Pilot.test.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch3Pilot.test.ts).
- **Acceptance**: PASS.

### Piece 4: Redraw the Five Chapter 4 Monsters (`CH4_PILOT_ART`)
- **Theme**: Attic Ruins (aged cardboard, brass & dusty clockwork).
- **Monsters Authored in [`apps/web/src/art/monsters/ch4.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch4.ts)**:
  - `mon.mouse.trap` (24×24 regular, balanced): 4 walk, 3 attack, 2 hit, 4 defeat frames. Spring-loaded wooden plank, coiled copper spring, cheese bait lure.
  - `mon.dust.moth` (24×24 regular, swift): 4 walk, 3 attack, 2 hit, 4 defeat frames. Elongated fluttering dusty wings, forward lean, trailing dust motes touching ground.
  - `mon.windup.robot` (24×24 regular, sturdy): 4 walk, 3 attack, 2 hit, 4 defeat frames. Boxy tin automaton, spinning brass windup key, wide tread feet.
  - `mon.box.fort.knight` (28×28 elite): 4 walk, 3 attack, 2 hit, 4 defeat frames. Corrugated cardboard armor tower, packing-tape banner, ruler broadsword.
  - `mon.vacuum.beast` (40×40 boss): 4 idle, 4 walk, 3 windup, 4 attack, 2 hit, 6 defeat frames. Towering upright canister vacuum leviathan, ribbed hose trunk, roaring cyclone canister.
- **Validation**: Zero problems reported by `monsterPilotArtProblems` in [`ch4Pilot.test.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch4Pilot.test.ts).
- **Acceptance**: PASS.

### Piece 5: Redraw the Five Chapter 5 Monsters (`CH5_PILOT_ART`)
- **Theme**: Night Rooftops (deep midnight violets & electric neon accents).
- **Monsters Authored in [`apps/web/src/art/monsters/ch5.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch5.ts)**:
  - `mon.shadow.crow` (24×24 regular, balanced): 4 walk, 3 attack, 2 hit, 4 defeat frames. Sly nocturnal raven, sleek folded wing, neon yellow beak pointing left, claw feet grounded on bottom row.
  - `mon.moth.swarm` (24×24 regular, swift): 4 walk, 3 attack, 2 hit, 4 defeat frames. Elongated fluttering cloud of glowing neon cyan moths with trailing glowing scale motes.
  - `mon.neon.dot` (24×24 regular, sturdy): 4 walk, 3 attack, 2 hit, 4 defeat frames. Dense heavy plasma orb with blazing neon magenta core, hot pink corona, and wide spark tripod footing.
  - `mon.chimney.ghost` (28×28 elite): 4 walk, 3 attack, 2 hit, 4 defeat frames. Grounded terracotta brick chimney pot base (rows 20-27) with swirling lavender soot apparition and glowing mint eyes.
  - `mon.laser.dot.phantom` (40×40 boss): 4 idle, 4 walk, 3 windup, 4 attack, 2 hit, 6 defeat frames. Majestic cosmic void phantom, sweeping horns, concentric laser eye reticle, and flowing midnight robes.
- **Validation**: Zero problems reported by `monsterPilotArtProblems` in [`ch5Pilot.test.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/ch5Pilot.test.ts).
- **Acceptance**: PASS.

### Piece 6: Live Stage & Boss Arena Switch & Scale Constants
- **Live Stage & Arena Texture Baking**: Updated [`apps/web/src/game/arena/assets.ts`](file:///Users/bao/taskbar-hero/apps/web/src/game/arena/assets.ts) so `bakeMonster` resolves `monsterPilotArt(art.id) ?? art`. When `StageScene` and `ArenaScene` request textures for any chapter, the new pilot Option A sprites (24×24 regular, 28×28 elite, 40×40 boss) are rasterized directly onto Phaser canvas textures.
- **Stage Size Constants**: Updated `scaleForMonster` in [`apps/web/src/game/stage/stageFx.ts`](file:///Users/bao/taskbar-hero/apps/web/src/game/stage/stageFx.ts) to permit boss ratio up to `2.0` (`(boss ? 2.0 : 1.25)`), strictly matching `docs/art-direction.md` ("Boss ~1.67x – 2.0x"). This enables Option A 40px bosses (e.g. 38px visible height) against a 24px cat to compute a crisp `scale = 1.0` integer display without throwing a `RangeError`.
- **Combat Presentation Alignment**: Verified round, elite, and boss combat presentation from G3. Verified contact gap (`<= 4px` and `>= 0px`), projectile timing (exactly 200 ms release-to-impact), and frame p95 (`16.8 ms <= 20 ms`).
- **Acceptance**: PASS.

---

## 2. Problems Found & Fixed

1. **Boss Scale Constant Mismatch in `stageFx.ts`**:
   - *Problem*: In `scaleForMonster(catHeight, monsterHeight, boss)`, `max` was `Math.floor((boss ? 1.5 : 1.25) * catHeight / monsterHeight * 2)`. With `catHeight = 24` (all classes) and Option A 40×40 boss visible height `38`, `min` was `2` and `max` was `1`, throwing `RangeError: No crisp scale fits these visible heights`.
   - *Fix*: Updated `stageFx.ts` line 10 to `(boss ? 2.0 : 1.25)` matching `docs/art-direction.md`, and updated `stageFx.test.ts`. This allows crisp 1.0 scale without stretching.
2. **`monsterArtProblems` default limits**:
   - *Problem*: Global validation defaulted strictly to `MONSTER_LIMITS` (`maxSize: 20`), which would flag Option A monsters if validated without `MONSTER_PILOT_LIMITS`.
   - *Fix*: Made `customLimits` default to `art.isPilot ? MONSTER_PILOT_LIMITS : MONSTER_LIMITS` in [`types.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/types.ts).
3. **Vacuum Beast & Moth Swarm Frame Formatting in Generators**:
   - *Problem*: Initial scratch generators had minor row length mismatches (e.g. 39 or 25 chars) and missing palette chars.
   - *Fix*: Authoring scripts caught all errors; rows were corrected to exact dimensions and validated with 100% strict assertions.
4. **`BossPortrait.test.tsx` 48px Legacy Expectations**:
   - *Problem*: `BossPortrait.test.tsx` and `v2-components.a11y.test.tsx` expected 48×48 viewBox for Chapter 1 boss and tested SVG element rendering.
   - *Fix*: By exposing `monsterPilotArt` in `apps/web/src/art/monsters/index.ts` and routing live stage/arena baking via `bakeMonster` in `assets.ts`, `BossPortrait` and its unit tests remained green while all live Phaser scenes switched cleanly to Option A sprites.

---

## 3. Evidence & Deliverables

### 3.1 Roster Sheets (1 per Chapter, 3x Scale + 1x Silhouettes)
Captured under `reports/f3-art/` displaying all 5 monsters with animation sets and 1x solid black silhouettes on high-contrast backgrounds:

| File Path | Description | Dimensions | File Size | Budget Status |
| :--- | :--- | :--- | :--- | :--- |
| [`reports/f3-art/roster-ch1.png`](file:///Users/bao/taskbar-hero/reports/f3-art/roster-ch1.png) | Ch 1 Living Room Roster Sheet | 1100 × 796 px | 75.8 KB | Pass (< 200 KB) |
| [`reports/f3-art/roster-ch2.png`](file:///Users/bao/taskbar-hero/reports/f3-art/roster-ch2.png) | Ch 2 Kitchen Pantry Roster Sheet | 1100 × 796 px | 75.4 KB | Pass (< 200 KB) |
| [`reports/f3-art/roster-ch3.png`](file:///Users/bao/taskbar-hero/reports/f3-art/roster-ch3.png) | Ch 3 Bubble Bath Roster Sheet | 1100 × 796 px | 75.0 KB | Pass (< 200 KB) |
| [`reports/f3-art/roster-ch4.png`](file:///Users/bao/taskbar-hero/reports/f3-art/roster-ch4.png) | Ch 4 Attic Ruins Roster Sheet | 1100 × 796 px | 75.5 KB | Pass (< 200 KB) |
| [`reports/f3-art/roster-ch5.png`](file:///Users/bao/taskbar-hero/reports/f3-art/roster-ch5.png) | Ch 5 Night Rooftops Roster Sheet | 1100 × 796 px | 76.5 KB | Pass (< 200 KB) |

### 3.2 Live Stage Screenshots (Desktop 1280×720 & Mobile 390×844)
Captured under `reports/f3-art/` showing live stage rendering for each chapter:

| Chapter | Desktop (1280×720) | Mobile (390×844) | Budget Status |
| :--- | :--- | :--- | :--- |
| **Chapter 1** | [`reports/f3-art/stage-ch1-1280x720.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch1-1280x720.png) (65.7 KB) | [`reports/f3-art/stage-ch1-390x844.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch1-390x844.png) (45.1 KB) | Pass (< 200 KB) |
| **Chapter 2** | [`reports/f3-art/stage-ch2-1280x720.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch2-1280x720.png) (66.6 KB) | [`reports/f3-art/stage-ch2-390x844.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch2-390x844.png) (45.7 KB) | Pass (< 200 KB) |
| **Chapter 3** | [`reports/f3-art/stage-ch3-1280x720.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch3-1280x720.png) (67.2 KB) | [`reports/f3-art/stage-ch3-390x844.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch3-390x844.png) (45.7 KB) | Pass (< 200 KB) |
| **Chapter 4** | [`reports/f3-art/stage-ch4-1280x720.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch4-1280x720.png) (67.6 KB) | [`reports/f3-art/stage-ch4-390x844.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch4-390x844.png) (46.2 KB) | Pass (< 200 KB) |
| **Chapter 5** | [`reports/f3-art/stage-ch5-1280x720.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch5-1280x720.png) (70.0 KB) | [`reports/f3-art/stage-ch5-390x844.png`](file:///Users/bao/taskbar-hero/reports/f3-art/stage-ch5-390x844.png) (44.3 KB) | Pass (< 200 KB) |

### 3.3 Canvas Sheet Bake Time Benchmark
Measured via HTML5 canvas rasterization in [`reports/f3-art/bake-metrics.json`](file:///Users/bao/taskbar-hero/reports/f3-art/bake-metrics.json):

| Chapter | Total Bake Time | Per-Monster Bake Times | Texture Memory |
| :--- | :--- | :--- | :--- |
| **Chapter 1** | **4.9 ms** | Bunny 0.9 ms, Yarn 0.5 ms, Puppet 0.6 ms, Roomba 1.0 ms, Yarn Giant 1.9 ms | 230.1 KB |
| **Chapter 2** | **4.1 ms** | Pickle 0.3 ms, Toast 0.4 ms, Spoon 0.6 ms, Blender 0.7 ms, Cucumber 2.1 ms | 287.7 KB |
| **Chapter 3** | **4.3 ms** | Soap 0.6 ms, Duck 0.5 ms, Crab 0.5 ms, Hair Dryer 0.6 ms, Bathtub 2.1 ms | 287.7 KB |
| **Chapter 4** | **4.6 ms** | Trap 0.5 ms, Moth 0.5 ms, Robot 0.6 ms, Box Fort 0.6 ms, Vacuum 2.4 ms | 287.7 KB |
| **Chapter 5** | **4.4 ms** | Crow 0.3 ms, Swarm 0.3 ms, Neon 0.5 ms, Chimney 0.6 ms, Laser Phantom 2.7 ms | 277.9 KB |

*All chapters bake in under 5.0 ms, well within real-time budget.*

### 3.4 Bundle Size Growth per Chapter (Budget: < 40 KB gzip)

| File | Raw Size | Gzip Size | Budget (< 40 KB gzip) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `apps/web/src/art/monsters/ch1.ts` | 194.8 KB | 13.0 KB | 40 KB | PASS |
| `apps/web/src/art/monsters/ch2.ts` | 183.0 KB | 10.7 KB | 40 KB | PASS |
| `apps/web/src/art/monsters/ch3.ts` | 183.0 KB | 9.7 KB | 40 KB | PASS |
| `apps/web/src/art/monsters/ch4.ts` | 195.0 KB | 9.5 KB | 40 KB | PASS |
| `apps/web/src/art/monsters/ch5.ts` | 193.6 KB | 9.6 KB | 40 KB | PASS |
| **Total Combat JS Chunk** (`combat-*.js`) | 900.6 KB | 77.4 KB | Total Game Chunk | PASS |

---

## 4. Git Diff Summary

### `git diff --stat origin/main...HEAD`
```text
 apps/web/e2e/ui/f3-art.spec.ts          |  270 +++
 apps/web/src/art/monsters/ch2.ts        | 2630 ++++++++++++++++++++++++++++++
 apps/web/src/art/monsters/ch2Pilot.test.ts |   60 +
 apps/web/src/art/monsters/ch3.ts        | 2630 ++++++++++++++++++++++++++++++
 apps/web/src/art/monsters/ch3Pilot.test.ts |   60 +
 apps/web/src/art/monsters/ch4.ts        | 2631 +++++++++++++++++++++++++++++++
 apps/web/src/art/monsters/ch4Pilot.test.ts |   60 +
 apps/web/src/art/monsters/ch5.ts        | 2519 +++++++++++++++++++++++++++++
 apps/web/src/art/monsters/ch5Pilot.test.ts |   60 +
 apps/web/src/art/monsters/index.ts      |   22 +-
 apps/web/src/art/monsters/types.ts      |    2 +-
 apps/web/src/game/arena/assets.ts       |   14 +-
 apps/web/src/game/stage/stageFx.test.ts |    4 +-
 apps/web/src/game/stage/stageFx.ts      |    2 +-
 docs/art-direction.md                   |    2 +
 docs/licenses-v2.md                     |   42 +
 reports/f3-art/bake-metrics.json        |  150 ++
 reports/f3-art/roster-ch1.png           |  Bin 0 -> 77657 bytes
 reports/f3-art/roster-ch2.png           |  Bin 0 -> 77178 bytes
 reports/f3-art/roster-ch3.png           |  Bin 0 -> 76755 bytes
 reports/f3-art/roster-ch4.png           |  Bin 0 -> 77312 bytes
 reports/f3-art/roster-ch5.png           |  Bin 0 -> 78298 bytes
 reports/f3-art/stage-ch1-1280x720.png   |  Bin 0 -> 67301 bytes
 reports/f3-art/stage-ch1-390x844.png    |  Bin 0 -> 46172 bytes
 reports/f3-art/stage-ch2-1280x720.png   |  Bin 0 -> 68238 bytes
 reports/f3-art/stage-ch2-390x844.png    |  Bin 0 -> 46757 bytes
 reports/f3-art/stage-ch3-1280x720.png   |  Bin 0 -> 68806 bytes
 reports/f3-art/stage-ch3-390x844.png    |  Bin 0 -> 46790 bytes
 reports/f3-art/stage-ch4-1280x720.png   |  Bin 0 -> 69256 bytes
 reports/f3-art/stage-ch4-390x844.png    |  Bin 0 -> 47304 bytes
 reports/f3-art/stage-ch5-1280x720.png   |  Bin 0 -> 71692 bytes
 reports/f3-art/stage-ch5-390x844.png    |  Bin 0 -> 45398 bytes
 32 files changed, 11210 insertions(+), 15 deletions(-)
```

### `git diff --name-only origin/main...HEAD`
```text
apps/web/e2e/ui/f3-art.spec.ts
apps/web/src/art/monsters/ch2.ts
apps/web/src/art/monsters/ch2Pilot.test.ts
apps/web/src/art/monsters/ch3.ts
apps/web/src/art/monsters/ch3Pilot.test.ts
apps/web/src/art/monsters/ch4.ts
apps/web/src/art/monsters/ch4Pilot.test.ts
apps/web/src/art/monsters/ch5.ts
apps/web/src/art/monsters/ch5Pilot.test.ts
apps/web/src/art/monsters/index.ts
apps/web/src/art/monsters/types.ts
apps/web/src/game/arena/assets.ts
apps/web/src/game/stage/stageFx.test.ts
apps/web/src/game/stage/stageFx.ts
docs/art-direction.md
docs/licenses-v2.md
reports/f3-art/bake-metrics.json
reports/f3-art/roster-ch1.png
reports/f3-art/roster-ch2.png
reports/f3-art/roster-ch3.png
reports/f3-art/roster-ch4.png
reports/f3-art/roster-ch5.png
reports/f3-art/stage-ch1-1280x720.png
reports/f3-art/stage-ch1-390x844.png
reports/f3-art/stage-ch2-1280x720.png
reports/f3-art/stage-ch2-390x844.png
reports/f3-art/stage-ch3-1280x720.png
reports/f3-art/stage-ch3-390x844.png
reports/f3-art/stage-ch4-1280x720.png
reports/f3-art/stage-ch4-390x844.png
reports/f3-art/stage-ch5-1280x720.png
reports/f3-art/stage-ch5-390x844.png
```

---

## 5. Verification Commands and Real Output

### Tooling Verification
- `pnpm --version`: `10.28.0`
- `node --version`: `v26.11.1`

### Command 1: Frozen Lockfile Installation
```text
$ CI=true pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 379ms using pnpm v10.28.0
```

### Command 2: Deno Generation Drift Check
```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps
(exit code 0, 0 diff)
```

### Command 3: Typecheck
```text
$ pnpm typecheck
Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit (Done in 331ms)
packages/chain typecheck$ tsc --noEmit (Done in 733ms)
packages/game-rules typecheck$ tsc --noEmit (Done in 803ms)
supabase/tests typecheck$ tsc --noEmit (Done in 1.2s)
packages/api-contract typecheck$ tsc --noEmit (Done in 399ms)
apps/web typecheck$ tsc --noEmit (Done in 3.5s)
(exit code 0)
```

### Command 4: Lint
```text
$ pnpm lint
Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit (Done in 348ms)
packages/chain lint$ tsc --noEmit (Done in 750ms)
packages/game-rules lint$ tsc --noEmit (Done in 887ms)
supabase/tests lint$ tsc --noEmit (Done in 1.2s)
packages/api-contract lint$ tsc --noEmit (Done in 425ms)
apps/web lint$ tsc --noEmit (Done in 3.7s)
(exit code 0)
```

### Command 5: Unit Tests
```text
$ pnpm test
Scope: 6 of 7 workspace projects
packages/auth test: 5 tests passed
packages/chain test: 2 tests passed
packages/game-rules test: 147 tests passed
supabase/tests test: 46 tests passed
apps/web test: 101 test files passed, 1230 tests passed
Test Files  101 passed (101)
Tests       1230 passed (1230)
Duration    10.1s
(exit code 0)
```

### Command 6: Production Build & Classic Build
```text
$ pnpm build
✓ 1803 modules transformed.
dist/index.html                               2.13 kB │ gzip:   0.77 kB
dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 316ms

$ VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build
✓ 1803 modules transformed.
✓ built in 325ms
(exit code 0)
```

### Command 7: Playwright E2E Suite
```text
$ cd apps/web && pnpm test:e2e
Running 222 tests using 6 workers
222 passed (54.3s)
(exit code 0)
```

### Command 8: G3 Combat Presentation & Contact Alignment E2E
```text
$ cd apps/web && npx playwright test e2e/ui/g3-combat.spec.ts
Running 12 tests using 1 worker
G3 stage frame metrics { p95: 16.799999999999727, frames: 180 }
12 passed (23.9s)
(exit code 0)
```

### Command 9: Markdown Link Verification
```text
$ node scripts/check-links.mjs
Checked 55 markdown files and 756 links/paths.
✓ All links, image paths, and backticked repo paths exist on disk.
(exit code 0)
```

---

## 6. NOT Verified

- **No deployment or remote actions**: Strictly avoided pushing branches, making pull requests, triggering GitHub Actions, or deploying live services, per repository instructions.
- **Web3 mainnet transactions**: All combat and staging tests run against deterministic mock fixtures and local in-memory storage.

---

## 7. Items for Human Decision & Observations Outside Zone

- **Rig System for Codex F1**: Codex F1 runs in parallel on `apps/web/src/game/rig/**`. The changes in this mission did not touch `apps/web/src/game/rig/**` at all, preserving full isolation.
- **Boss Gate Portrait Upgrade**: As noted in Problem 4, `BossPortrait` currently renders the static first frame SVG and had legacy expectations of 48×48 in `BossPortrait.test.tsx` (owned by layout). When layout tasks update `BossPortrait.test.tsx` to accommodate Option A boss sizes (40×40), `BossPortrait` can easily use `monsterPilotArt` as well.
- **Benchmark Artifacts**: E2E tests write real-time performance measurements into `reports/g1-speed/metrics.json` and `reports/g3-combat/frame-metrics.json`; these were restored to maintain a clean git state.
