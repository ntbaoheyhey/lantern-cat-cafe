# V24C: Chapter 3 Monsters & Boss Pixel Art Report

## 1. Overview & Summary

This task implements the authentic pixel art for all five Chapter 3 (**Bathroom** theme, cool blues and pinks) monsters and the chapter boss for **Cat Café Quest v2** according to the contract defined in `apps/web/src/art/monsters/types.ts` and the content registry in `packages/game-rules/src/v2/content/monsters.ts`.

The chapter roster includes:
1. **Soap Slime** (`mon.soap.slime`): Regular monster (Balanced archetype, 18×18 px). A slippery, pearlescent bar of translucent lavender-pink soap softened into a bouncy slime creature. Topped with a wobbling foam bubble crest, bright specular glints, warm blushing core, and sudsy lather along its sliding base.
2. **Rubber Duck** (`mon.rubber.duck`): Regular monster (Swift archetype, 18×18 px). The quintessential yellow bath toy with a cheeky personality, bright orange beak pointing boldly to the left, cartoon eye highlight, perky tail feathers jutting upward at the rear, swimming on frothy swirling bathwater and foam bubbles.
3. **Sponge Crab** (`mon.sponge.crab`): Regular monster (Sturdy archetype, 18×18 px). A boxy, porous bath sponge that sprouted two raised periscope eye stalks, large snappy coral-pink pincers, mottled sponge pores, and articulated skittering legs anchored firmly to the ground.
4. **Hair Dryer Wisp** (`mon.hair.dryer.wisp`): Elite monster (26×26 px). A retro pastel-pink salon hair dryer haunted by an electrical wind elemental. Blasts spiraling hot airflow and bright sparks out of its nozzle facing left, with a glowing internal ruby/yellow heating coil, vintage casing, coiled cord tail, and hovering atop a whipping cyclone vortex touching down to the bottom row.
5. **Bathtub Tyrant** (`mon.bathtub.tyrant`): Boss monster (48×48 px). A colossal porcelain clawfoot bathtub that has awakened as an arrogant aquatic leviathan. Features ornate antique brass eagle claw feet clutching the ground, an arched brass shower pipe rising high from the rear and curving forward into a menacing flared showerhead, a brass gargoyle faucet spout on the left rim, an interior swirling whirlpool of deep royal blue water with glowing predatory eyes, and a pink bath duck crest perched atop the rim foam.

All monsters are drawn facing **LEFT** (the cat approaches from the left), have feet anchored cleanly on the bottom row (`h - 1`), feature dark outline character `'k'`, use between 3 and 6 colors each plus outline, and maintain radically distinct silhouettes.

---

## 2. Monster Specifications & Palette Details

| Monster Name | Registry ID | Kind | Size (W×H) | Outline & Palette Codes | Animations (Frames) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Soap Slime** | `mon.soap.slime` | regular | 18×18 px | `'k'` (#161224), `'p'` (#ff9ec7), `'d'` (#c94d7d), `'b'` (#aae7ff), `'w'` (#ffffff), `'y'` (#ffdf6d) | `walk` (4), `hit` (1), `defeat` (3) |
| **Rubber Duck** | `mon.rubber.duck` | regular | 18×18 px | `'k'` (#141824), `'y'` (#ffd738), `'s'` (#d99518), `'o'` (#ff6619), `'b'` (#58cbf2), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Sponge Crab** | `mon.sponge.crab` | regular | 18×18 px | `'k'` (#141822), `'c'` (#ff5e7e), `'d'` (#b8284c), `'s'` (#fad652), `'p'` (#b89228), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Hair Dryer Wisp** | `mon.hair.dryer.wisp` | elite | 26×26 px | `'k'` (#181224), `'p'` (#ff8db2), `'m'` (#ab2b5a), `'c'` (#6de4ff), `'h'` (#ff3b6f), `'y'` (#ffea6c), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Bathtub Tyrant** | `mon.bathtub.tyrant` | boss | 48×48 px | `'k'` (#101522), `'w'` (#f4f8fc), `'s'` (#93b0cc), `'b'` (#2462a6), `'c'` (#5ee2ee), `'g'` (#f5b838), `'p'` (#ff709c) | `idle` (4), `windup` (3), `attack` (4), `hit` (1), `defeat` (6) |

---

## 3. Visual Silhouette & Style Differentiation

The 5 monsters of Chapter 3 provide contrasting visual silhouettes for instant identification during fast-paced gameplay:
- **Soap Slime**: Round, bouncy blob silhouette with an organic crown bubble and bubbly suds sliding across the bottom row.
- **Rubber Duck**: Classic bird/duck silhouette with horizontal orange bill jutting to column 0, raised jaunty tail, and rippling water wake.
- **Sponge Crab**: Boxy rectangular sponge carapace crowned with dual vertical periscope eye stalks, large flanking snapping pincers, and multilegged crab stance.
- **Hair Dryer Wisp**: Tapered aerodynamic appliance body facing left with horizontal exhaust nozzle, arched handle and coiled cord tail, supported by a spinning cyclone vortex.
- **Bathtub Tyrant**: Grand architectural clawfoot bathtub vessel anchored by ornate lion/eagle brass talons, curved porcelain roll-top hull, and a towering serpentine arched shower pipe.

---

## 4. Screenshot Sheets & Visual Verification

Screenshot preview sheets were rendered at 3x scale against both dark (`--bg: #1a1220`) and light (`#fff3e0`) backgrounds and saved under `reports/v24c-ch3/`:

- **Complete Dual-Theme Comparison Sheet**:
  `reports/v24c-ch3/ch3-monsters-all.png`
- **Dark Theme Sheet (Standard In-Game)**:
  `reports/v24c-ch3/ch3-monsters-dark.png`
- **Light Theme Sheet (Contrast & Legibility Check)**:
  `reports/v24c-ch3/ch3-monsters-light.png`
- **Individual Monster Sheets (Dark & Light Panels)**:
  - `reports/v24c-ch3/mon-soap-slime.png`
  - `reports/v24c-ch3/mon-rubber-duck.png`
  - `reports/v24c-ch3/mon-sponge-crab.png`
  - `reports/v24c-ch3/mon-hair-dryer-wisp.png`
  - `reports/v24c-ch3/mon-bathtub-tyrant.png`

---

## 5. Verification Commands Run & Outputs

### 5.1 Git Author Configuration
```bash
$ git config user.email && git config user.name
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

### 5.2 Dependency Install
```bash
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Done in 6.9s using pnpm v10.28.0
```

### 5.3 Deno Import Map Generator Drift Check
```bash
$ pnpm gen:deno
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v24c
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
No git diff produced.

### 5.4 TypeScript Typecheck
```bash
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v24c
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
└─ Done in 746ms
└─ Done in 1s
└─ Done in 1.2s
└─ Done in 1.7s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 471ms
apps/web typecheck$ tsc --noEmit
└─ Done in 3.8s
```

### 5.5 Workspace Lint
```bash
$ pnpm lint
> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v24c
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
└─ Done in 381ms
└─ Done in 807ms
└─ Done in 862ms
└─ Done in 1.3s
packages/api-contract lint$ tsc --noEmit
└─ Done in 380ms
apps/web lint$ tsc --noEmit
└─ Done in 3s
```

### 5.6 Vitest Test Suite Execution
```bash
$ pnpm --filter web test src/art/monsters/ch3.test.ts
> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-v24c/apps/web
> vitest run src/art/monsters/ch3.test.ts

 RUN  v5.0.5 /private/tmp/taskbar-hero-v24c/apps/web

 ✓ src/art/monsters/ch3.test.ts (7 tests) 4ms
   ✓ CH3_ART (7)
     ✓ has exactly the 5 monster ids registered for chapter 3 in game-rules v2 1ms
     ✓ matches registry kinds for all chapter 3 monsters 0ms
     ✓ returns [] from monsterArtProblems for every chapter 3 monster 1ms
     ✓ ensures each monster palette has dark outline k plus 3 to 6 colors 0ms
     ✓ ensures no two monsters share identical walk frame 0 0ms
     ✓ ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56 0ms
     ✓ ensures boss has the required boss animations with correct frame counts 0ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  00:25:00
   Duration  701ms
```

Full workspace test run (`pnpm test`):
```bash
$ pnpm -r test
Scope: 6 of 7 workspace projects
packages/auth: 2 tests passed
packages/chain: 7 tests passed
packages/game-rules: 205 tests passed
supabase/tests: 37 tests passed
packages/api-contract: 16 tests passed
apps/web: 43 test files passed, 459 tests passed
```

### 5.7 Full Workspace Build
```bash
$ pnpm build
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v24c
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
└─ Done in 366ms
└─ Done in 673ms
└─ Done in 818ms
└─ Done in 1.3s
packages/api-contract build$ tsc --noEmit
└─ Done in 385ms
apps/web build$ tsc --noEmit && vite build
vite v8.3.5 building client environment for production...
✓ 1706 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/index-CL1W11oQ.js               126.11 kB │ gzip:  36.71 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 511ms
└─ Done in 7.9s
```

---

## 6. Files Created

- `apps/web/src/art/monsters/ch3.ts`: Exports `CH3_ART: Record<string, MonsterArt>` containing complete pixel art definitions for all 5 chapter 3 monsters.
- `apps/web/src/art/monsters/ch3.test.ts`: Vitest test suite verifying schema compliance via `monsterArtProblems`, registry ID and kind matching, palette sizes, distinct walk frame 0s, size limits, and boss animation sets.
- `reports/v24c-ch3.md`: This comprehensive report.
- `reports/v24c-ch3/*.png`: 3x scale screenshot sheets verifying readability on dark and light backgrounds.

---

## 7. Items Unsure About & Clarifications

1. **Boss Animation Set**: The specification specifies that bosses use `idle: 4, windup: 3, attack: 4, hit: 1, defeat: 6` rather than `walk`. The test verifies that all 4 walking monsters have unique walk frame 0s, and that the boss has the full 5-animation set required by the engine contract.
2. **Worktree Isolation**: To prevent interference from concurrent automated agent operations in the repository root, git worktree isolation was used at `/private/tmp/taskbar-hero-v24c` on branch `ai/antigravity-v24c-ch3`.
