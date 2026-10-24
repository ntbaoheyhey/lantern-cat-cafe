# V24D: Chapter 4 Monsters & Boss Pixel Art Report

## 1. Overview & Summary

This task implements the authentic pixel art for all five Chapter 4 (**Basement** theme, murky greens and browns) monsters and the chapter boss for **Cat Café Quest v2** according to the contract defined in `apps/web/src/art/monsters/types.ts` and the content registry in `packages/game-rules/src/v2/content/monsters.ts`.

The chapter roster includes:
1. **Mouse Trap** (`mon.mouse.trap`): Regular monster (Balanced archetype, 18×18 px). A wooden snap trap brought to mischievous life. It features a sturdy pine board with darker grain shadow, a steel spring coil mechanism, and a spring-loaded wire snapping bar that snaps open and shut like a menacing mouth around a delicious cheddar cheese wedge with red wax rind and funny cartoon googly eyes.
2. **Dust Moth** (`mon.dust.moth`): Regular monster (Swift archetype, 18×18 px). A fluffy basement moth with murky sage/moss green wings, dark olive wing shadows, dusty tan fur, glowing yellow compound eyes, feathery curled antennae, and dangling claw feet hovering over the floor.
3. **Wind-up Robot** (`mon.windup.robot`): Regular monster (Sturdy archetype, 18×18 px). An oxidized, slightly rusty tin toy robot abandoned in the basement. Features a tarnished olive-grey tin chassis with oxidized bronze shadow, glowing red visor eyes, a chest pressure gauge dial, swinging claw arms, and a large brass winding key that visibly rotates across walk animation frames.
4. **Box Fort Knight** (`mon.box.fort.knight`): Elite monster (26×26 px). A valiant armored knight constructed entirely from taped cardboard shipping boxes. Features a peaked box helmet with crenellated battlements and an olive-green duct-tape plume, cardboard visor cutout with determined knight eyes, a cardboard shipping box breastplate with taped seams and red "FRAGILE" crest, a cardboard tube lance pointed sharply forward, a box lid shield with taped cross, and sturdy box stompers.
5. **Vacuum Beast** (`mon.vacuum.beast`): Boss monster (48×48 px). The ultimate feline nightmare lurking in the murky basement — an ancient industrial upright canister vacuum cleaner transformed into a ferocious mechanical beast. Features a vintage olive-green metal motor casing with chrome cooling vent louvers, a clear dirt cyclone canister with swirling lint and debris, a flexible ribbed suction hose arching up and forward like a serpent neck, a menacing crimson cyclops eye that blazes with feline doom, a massive flared chrome intake snout lined with razor-sharp metal teeth, a spinning motorized bristle roller brush on the floor, heavy rubber drive wheels, and a coiled power cord tail with a three-pronged plug.

All monsters are drawn facing **LEFT** (the cat approaches from the left), have feet anchored cleanly on the bottom row (`h - 1`), feature dark outline character `'k'`, use between 3 and 6 colors each plus outline, and have clearly distinct silhouettes.

---

## 2. Monster Specifications & Palette Details

| Monster Name | Registry ID | Kind | Size (W×H) | Outline & Palette Codes | Animations (Frames) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mouse Trap** | `mon.mouse.trap` | regular | 18×18 px | `'k'` (#181008), `'b'` (#bf803b), `'m'` (#724218), `'s'` (#96a0b2), `'y'` (#ffbe28), `'r'` (#dd3838), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Dust Moth** | `mon.dust.moth` | regular | 18×18 px | `'k'` (#161c14), `'g'` (#6e8450), `'d'` (#3d4c28), `'t'` (#d8caa0), `'y'` (#ffd83c), `'b'` (#785630), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Wind-up Robot** | `mon.windup.robot` | regular | 18×18 px | `'k'` (#141618), `'m'` (#828e78), `'d'` (#444e3e), `'b'` (#c49436), `'y'` (#ffd254), `'r'` (#ff3838), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Box Fort Knight** | `mon.box.fort.knight` | elite | 26×26 px | `'k'` (#18120a), `'c'` (#a67440), `'b'` (#66441c), `'l'` (#daa468), `'t'` (#627a52), `'r'` (#de3030), `'w'` (#fff6ea) | `walk` (4), `hit` (1), `defeat` (3) |
| **Vacuum Beast** | `mon.vacuum.beast` | boss | 48×48 px | `'k'` (#101412), `'g'` (#3e5e40), `'d'` (#223624), `'m'` (#6e5438), `'s'` (#b4bec8), `'r'` (#ff283c), `'w'` (#ffffff) | `idle` (4), `windup` (3), `attack` (4), `hit` (1), `defeat` (6), `walk` (4) |

---

## 3. Visual Silhouette & Style Differentiation

The 5 monsters have radically contrasting silhouettes ensuring immediate readability during gameplay:
- **Mouse Trap**: Low, wide horizontal wooden slab with an angled snapping wire bar that opens wide and snaps shut like jaws, with a cheese wedge bait and googly eyes.
- **Dust Moth**: Vertical airborne silhouette with large triangular murky green wings fanning up and back, feathery curled antennae, and a fluffy tan body with tiny dangling claw feet.
- **Wind-up Robot**: Boxy, rigid mechanical chassis with square head, antenna with brass sphere, rectangular stompers, and a distinct T-shaped brass winding key spinning on its back.
- **Box Fort Knight**: Imposing armored cardboard knight with castle-crenellated box helmet and tape plume, horizontal mailing-tube lance leveled forward, box lid shield, and blocky cardboard greaves.
- **Vacuum Beast**: Massive 48×48 titan with an arching ribbed hose neck, roaring flared chrome intake snout with razor teeth, cycloptic glowing crimson eye, dirt canister with swirling dust vortex, heavy drive wheels, and a coiled power cord tail.

---

## 4. Screenshot Sheets & Visual Verification

Screenshot preview sheets were rendered at 3x scale against both dark (`--bg: #1a1220`) and light (`#fff3e0`) backgrounds and saved under `reports/v24d-ch4/`:

- **Complete Dual-Theme Comparison Sheet**:
  `reports/v24d-ch4/ch4-monsters-all.png` (3536×1104 px)
- **Dark Theme Sheet (Standard In-Game)**:
  `reports/v24d-ch4/ch4-monsters-dark.png` (3536×536 px)
- **Light Theme Sheet (Contrast & Legibility Check)**:
  `reports/v24d-ch4/ch4-monsters-light.png` (3536×536 px)
- **Individual Monster Frame Strips (Dark + Light)**:
  - `reports/v24d-ch4/mon-mouse-trap.png` (540×152 px)
  - `reports/v24d-ch4/mon-dust-moth.png` (540×152 px)
  - `reports/v24d-ch4/mon-windup-robot.png` (540×152 px)
  - `reports/v24d-ch4/mon-box-fort-knight.png` (732×200 px)
  - `reports/v24d-ch4/mon-vacuum-beast.png` (3444×332 px)

---

## 5. Commands Run & Verification Output

### 5.1 Git Setup & Gate Verification
```bash
$ git config user.name && git config user.email
ntbaoheyhey
108352255+ntbaoheyhey@users.noreply.github.com

$ git fetch origin
# Gate confirmation on origin/main:
$ git show origin/main:apps/web/src/art/monsters/ch1.ts | head -n 5
import type { MonsterArt } from './types';

/**
 * Pixel art for Chapter 1: Living Room monsters and boss.
 * Cute, slightly silly household monsters in the cat café pixel style.
```
Gate satisfied: `apps/web/src/art/monsters/ch1.ts` exists on `origin/main`.

### 5.2 Dependency Installation & Workspace Cleanliness
```bash
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Done in 6.2s using pnpm v10.28.0
```

### 5.3 Deno Code Generation Drift Check
```bash
$ pnpm gen:deno
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v24d
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
No git diff produced.

### 5.4 TypeScript Typecheck
```bash
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v24d
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
└─ Done in 803ms
└─ Done in 1.1s
└─ Done in 1.2s
└─ Done in 1.8s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 511ms
apps/web typecheck$ tsc --noEmit
└─ Done in 4.1s
```

### 5.5 Workspace Lint
```bash
$ pnpm lint
> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v24d
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
└─ Done in 1.1s
└─ Done in 2.3s
└─ Done in 2.4s
└─ Done in 3.5s
packages/api-contract lint$ tsc --noEmit
└─ Done in 2.1s
apps/web lint$ tsc --noEmit
└─ Done in 6.3s
```

### 5.6 Vitest Test Suite Execution
```bash
$ pnpm --filter web test src/art/monsters/ch4.test.ts
> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-v24d/apps/web
> vitest run src/art/monsters/ch4.test.ts

 RUN  v5.0.5 /private/tmp/taskbar-hero-v24d/apps/web

 ✓ src/art/monsters/ch4.test.ts (7 tests) 4ms
   ✓ CH4_ART (7)
     ✓ has exactly the 5 monster ids registered for chapter 4 in game-rules v2 1ms
     ✓ matches registry kinds for all chapter 4 monsters 0ms
     ✓ returns [] from monsterArtProblems for every chapter 4 monster 1ms
     ✓ ensures each monster palette has dark outline k plus 3 to 6 colors 0ms
     ✓ ensures no two monsters share identical walk frame 0 0ms
     ✓ ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56 0ms
     ✓ ensures boss has the required boss animations with correct frame counts 0ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  00:25:53
   Duration  595ms
```

Full workspace test run (`pnpm test`):
```bash
$ pnpm -r test
Scope: 6 of 7 workspace projects
packages/auth test: 2 tests passed
packages/chain test: 7 tests passed
packages/game-rules test: 190 tests passed
supabase/tests test: 37 tests passed
packages/api-contract test: 16 tests passed
apps/web test: 43 test files passed, 459 tests passed
```

### 5.7 Full Workspace Build
```bash
$ pnpm build
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v24d
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
└─ Done in 365ms
└─ Done in 694ms
└─ Done in 813ms
└─ Done in 1.3s
packages/api-contract build$ tsc --noEmit
└─ Done in 382ms
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
✓ built in 557ms
└─ Done in 4.4s
```

---

## 6. Files Created

- `apps/web/src/art/monsters/ch4.ts`: Exports `CH4_ART: Record<string, MonsterArt>` containing complete pixel art definitions for the 5 chapter 4 monsters.
- `apps/web/src/art/monsters/ch4.test.ts`: Vitest suite asserting `monsterArtProblems` returns `[]` for each monster, all 5 IDs match the content registry, all kinds match, palette colors are valid, no two walk frames 0 are identical, dimensions obey bounds, and boss animations are present with correct frame counts.
- `reports/v24d-ch4.md`: This comprehensive verification report.
- `reports/v24d-ch4/*.png`: 3x screenshot sheets verifying legibility against both dark and light backgrounds.

---

## 7. Items Unsure About & Clarifications

1. **Boss Animation Set & Walk Animation**: The specification specifies that bosses use `idle: 4, windup: 3, attack: 4, hit: 1, defeat: 6`. As in Chapter 1 (`mon.yarn.giant`), a 4-frame `walk` animation is also provided for Vacuum Beast for complete visual consistency, allowing it to rumble across the basement floor. The test verifies that all required boss animations have the exact expected frame counts, and that all monsters have distinct walk frame 0s.
2. **Worktree Isolation**: Because parallel automated agent activity was active in the root workspace during the hackathon/contest sprint (e.g. concurrent tasks on other chapters), git worktree isolation was used at `/private/tmp/taskbar-hero-v24d` on branch `ai/antigravity-v24d-ch4` to guarantee clean, deterministic, and isolated verification without collisions.
