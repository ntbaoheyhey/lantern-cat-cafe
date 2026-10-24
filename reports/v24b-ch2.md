# V24B: Chapter 2 Monsters & Boss Pixel Art Report

## 1. Overview & Summary

This task implements the authentic pixel art for all five Chapter 2 (**Kitchen** theme) monsters and the chapter boss for **Cat Café Quest v2** according to the contract defined in `apps/web/src/art/monsters/types.ts` and the content registry in `packages/game-rules/src/v2/content/monsters.ts`.

The chapter roster includes:
1. **Pickle Imp** (`mon.pickle.imp`): Regular monster (Balanced archetype, 18×18 px). A mischievous sour gherkin imp with curved devil horns, tiny imp tail, fang and tongue jutting left, warty cucumber rind, and nimble imp feet.
2. **Toast Mimic** (`mon.toast.mimic`): Regular monster (Swift archetype, 18×18 px). A golden toasted bread slice that opens its crust into a hungry mimic maw with sharp crumb fangs and strawberry jam tongue.
3. **Spoon Bug** (`mon.spoon.bug`): Regular monster (Sturdy archetype, 18×18 px). A low-profile metallic beetle whose armored carapace is a shiny soup-spoon bowl, with glowing amber eyes, antennae, and 6 articulated legs.
4. **Blender Brute** (`mon.blender.brute`): Elite monster (26×26 px). A hulking countertop appliance brute with a helmet-like lid, clear glass pitcher with swirling smoothie and spinning stainless steel blades, glowing yellow eyes peering through the jar, red motor housing, robotic arms, and industrial rubber feet.
5. **Cucumber Scare** (`mon.cucumber.scare`): Boss monster (48×48 px). The ultimate feline nightmare — a towering, monstrous cucumber titan with an arching textured rind, spiky leafy foliage crown, razor-sharp pale seed fangs, terrifying crimson eldritch eyes that strike dread into cats, massive thorny vine arms wielding a giant sliced cucumber disc club, and knotted root feet.

All monsters are drawn facing **LEFT** (the cat approaches from the left), have feet anchored cleanly on the bottom row (`h - 1`), feature dark outline character `'k'`, use between 3 and 6 colors each plus outline, and have clearly distinct silhouettes.

---

## 2. Monster Specifications & Palette Details

| Monster Name | Registry ID | Kind | Size (W×H) | Outline & Palette Codes | Animations (Frames) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pickle Imp** | `mon.pickle.imp` | regular | 18×18 px | `'k'` (#121810), `'g'` (#4a923c), `'d'` (#245422), `'l'` (#8ee04a), `'y'` (#ffd13b), `'r'` (#ff6688), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Toast Mimic** | `mon.toast.mimic` | regular | 18×18 px | `'k'` (#1f1008), `'c'` (#7a3a14), `'t'` (#d88c38), `'b'` (#fde49e), `'j'` (#d8204c), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Spoon Bug** | `mon.spoon.bug` | regular | 18×18 px | `'k'` (#121620), `'s'` (#c8d4e4), `'m'` (#75849c), `'d'` (#3c4659), `'w'` (#ffffff), `'a'` (#ffab2e) | `walk` (4), `hit` (1), `defeat` (3) |
| **Blender Brute** | `mon.blender.brute` | elite | 26×26 px | `'k'` (#14141c), `'r'` (#d33030), `'d'` (#7a1818), `'g'` (#9ee5ff), `'b'` (#467290), `'m'` (#d0d8e2), `'y'` (#ffd633) | `walk` (4), `hit` (1), `defeat` (3) |
| **Cucumber Scare** | `mon.cucumber.scare` | boss | 48×48 px | `'k'` (#0e180d), `'c'` (#1b4e24), `'g'` (#3a9344), `'l'` (#8ae052), `'f'` (#dcf5b2), `'r'` (#ff2864), `'w'` (#ffffff) | `idle` (4), `windup` (3), `attack` (4), `hit` (1), `defeat` (6) |

---

## 3. Visual Silhouette & Style Differentiation

The 5 monsters have radically contrasting silhouettes ensuring immediate readability during gameplay:
- **Pickle Imp**: Pear-shaped upright gherkin with curved devil horns and an arched imp tail.
- **Toast Mimic**: Square bread slice with rounded twin top lobes (bread crust shoulders) and a wide horizontal chomping mouth.
- **Spoon Bug**: Low, wide horizontal beetle carapace dome with front-pointing antennae and 6 crawling legs.
- **Blender Brute**: Tapered industrial appliance with broad flat lid visor, trapezoidal glass pitcher jar, and wide blocky motor base with mechanical fists.
- **Cucumber Scare**: Massive 48×48 towering curved titan with a jagged leafy crown, arched body, giant thorny vine tentacles with a sliced cucumber shield club, and wide root base.

---

## 4. Screenshot Sheets & Visual Verification

Screenshot preview sheets were rendered at 3x scale against both dark (`--bg: #1a1220`) and light (`#fff3e0`) backgrounds and saved under `reports/v24b-ch2/`:

- **Complete Dual-Theme Comparison Sheet**:
  `reports/v24b-ch2/ch2-monsters-all.png`
- **Dark Theme Sheet (Standard In-Game)**:
  `reports/v24b-ch2/ch2-monsters-dark.png`
- **Light Theme Sheet (Contrast & Legibility Check)**:
  `reports/v24b-ch2/ch2-monsters-light.png`
- **Individual Monster Sheets (Dark & Light Panels)**:
  - `reports/v24b-ch2/mon-pickle-imp.png`
  - `reports/v24b-ch2/mon-toast-mimic.png`
  - `reports/v24b-ch2/mon-spoon-bug.png`
  - `reports/v24b-ch2/mon-blender-brute.png`
  - `reports/v24b-ch2/mon-cucumber-scare.png`

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
Done in 7s using pnpm v10.28.0
```

### 5.3 Deno Import Map Generator Drift Check
```bash
$ pnpm gen:deno
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v24b
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
No git diff produced.

### 5.4 TypeScript Typecheck
```bash
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v24b
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
└─ Done in 836ms
└─ Done in 1.1s
└─ Done in 1.3s
└─ Done in 1.8s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 558ms
apps/web typecheck$ tsc --noEmit
└─ Done in 3.7s
```

### 5.5 Workspace Lint
```bash
$ pnpm lint
> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v24b
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
└─ Done in 384ms
└─ Done in 724ms
└─ Done in 819ms
└─ Done in 1.3s
packages/api-contract lint$ tsc --noEmit
└─ Done in 386ms
apps/web lint$ tsc --noEmit
└─ Done in 2.9s
```

### 5.6 Vitest Test Suite Execution
```bash
$ pnpm --filter web test src/art/monsters/ch2.test.ts
> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-v24b/apps/web
> vitest run src/art/monsters/ch2.test.ts

 RUN  v5.0.5 /private/tmp/taskbar-hero-v24b/apps/web

 ✓ src/art/monsters/ch2.test.ts (7 tests) 4ms
   ✓ CH2_ART (7)
     ✓ has exactly the 5 monster ids registered for chapter 2 in game-rules v2 1ms
     ✓ matches registry kinds for all chapter 2 monsters 0ms
     ✓ returns [] from monsterArtProblems for every chapter 2 monster 1ms
     ✓ ensures each monster palette has dark outline k plus 3 to 6 colors 0ms
     ✓ ensures no two monsters share identical walk frame 0 0ms
     ✓ ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56 0ms
     ✓ ensures boss has the required boss animations with correct frame counts 0ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  1.45s
```

Full workspace test run (`pnpm test`) across all packages:
```bash
$ pnpm -r test
Scope: 6 of 7 workspace projects
packages/auth: 2 tests passed
packages/chain: 7 tests passed
packages/game-rules: 190 tests passed
supabase/tests: 37 tests passed
packages/api-contract: 16 tests passed
apps/web: 33 test files passed, 365 tests passed
```

### 5.7 Full Workspace Build
```bash
$ pnpm build
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v24b
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
└─ Done in 423ms
└─ Done in 721ms
└─ Done in 876ms
└─ Done in 1.3s
packages/api-contract build$ tsc --noEmit
└─ Done in 377ms
apps/web build$ tsc --noEmit && vite build
vite v8.3.5 building client environment for production...
✓ 1691 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-djZZZ0we.css               34.77 kB │ gzip:   7.28 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/index-C3CDpvmL.js                97.97 kB │ gzip:  28.58 kB
✓ built in 537ms
└─ Done in 4.1s
```

---

## 6. Files Created

- `apps/web/src/art/monsters/ch2.ts`: Exports `CH2_ART: Record<string, MonsterArt>` containing complete pixel art definitions for the 5 chapter 2 monsters.
- `apps/web/src/art/monsters/ch2.test.ts`: Vitest suite asserting `monsterArtProblems` returns `[]` for each monster, all 5 IDs match the content registry, all kinds match, palette colors are valid, no two walk frames 0 are identical, dimensions obey bounds, and boss animations are present with correct frame counts.
- `reports/v24b-ch2.md`: This comprehensive verification report.
- `reports/v24b-ch2/*.png`: 3x screenshot sheets verifying legibility against both dark and light backgrounds.

---

## 7. Items Unsure About & Clarifications

1. **Boss Animation Set**: The specification specifies that bosses use `idle: 4, windup: 3, attack: 4, hit: 1, defeat: 6` rather than `walk`. The test verifies that all monsters with `walk` have unique walk frame 0s, and that the boss has the full 5-animation set required by the engine contract.
2. **Worktree Usage**: Due to concurrent automated agent activity in the root workspace during the hackathon/contest sprint, git worktree isolation was used at `/private/tmp/taskbar-hero-v24b` for branch `ai/antigravity-v24b-ch2` to guarantee zero interference and deterministic verification runs.
