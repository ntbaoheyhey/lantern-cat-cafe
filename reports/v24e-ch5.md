# V24E: Chapter 5 Monsters & Boss Pixel Art Report

## 1. Overview & Summary

This task implements the pixel art for all five Chapter 5 (**Night Rooftops** theme: deep purples with neon accents) monsters and the chapter boss for **Cat RPG v2** (`taskbar-hero`), strictly adhering to the specification in `apps/web/src/art/monsters/types.ts` and the content registry in `packages/game-rules/src/v2/content/monsters.ts`.

The chapter roster includes:
1. **Shadow Crow** (`mon.shadow.crow`): Regular monster (Balanced archetype, 20×20 px). A sleek, sly rooftop raven perched atop terracotta shingles, rendered in deep purples, shadow feather folds, a beady neon yellow eye with white glint, a sharp yellow beak facing left, and spindly claw feet anchored cleanly on the bottom row.
2. **Moth Swarm** (`mon.moth.swarm`): Regular monster (Swift archetype, 20×20 px). A fluttering trio of nocturnal rooftop moths drawn toward neon city glow, featuring dusty purple bodies, feathery antennae, vivid neon cyan wing glow (`#3bf0ff`), pale cyan veins, and trailing glowing dust scales that touch the bottom row.
3. **Neon Dot** (`mon.neon.dot`): Regular monster (Sturdy archetype, 18×18 px). The legendary laser pointer dot brought to life! A bouncy, electric neon magenta and hot-pink plasma orb with huge curious cartoon eyes, electric antenna sparks, neon yellow spark whiskers, and playful spark feet tapping the bottom row.
4. **Chimney Ghost** (`mon.chimney.ghost`): Elite monster (26×26 px). A charmingly spooky rooftop spirit billowing out of a brick chimney pot (terracotta masonry and mortar at the base on rows 18–25). The ghostly body swirls upward into glowing neon mint-green eyes and a wide spectral smile, wispy phantom arms, and ethereal lavender curls.
5. **Laser Dot Phantom** (`mon.laser.dot.phantom`): Boss monster (48×48 px). The ultimate mythical manifestation of the unreachable laser dot that cats chase across rooftops. Features sweeping cosmic horns with violet energy tips, a dark void cowl concealing a concentric targeting laser eye (crimson ring, hot-pink corona, blinding white core), clawed spectral hands channeling laser sparks, flowing midnight robes grounded firmly on the bottom row, and a full set of boss animations including a devastating laser beam sweep attack.

All monsters face **LEFT**, have feet/base anchored on the bottom row (`size.h - 1`), feature the dark outline character `'k'`, use between 5 and 6 distinct non-`'k'` colors (satisfying the 3 to 6 colors rule), and have completely distinct silhouettes.

---

## 2. Monster Specifications & Palette Details

| Monster Name | Registry ID | Kind | Size (W×H) | Outline & Palette Codes | Animations (Frames) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Shadow Crow** | `mon.shadow.crow` | regular | 20×20 px | `'k'` (#120a1f), `'b'` (#25153a), `'p'` (#4e2d78), `'m'` (#854cc8), `'y'` (#ffd43f), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Moth Swarm** | `mon.moth.swarm` | regular | 20×20 px | `'k'` (#140e22), `'d'` (#382856), `'v'` (#68429b), `'c'` (#3bf0ff), `'l'` (#bbffff), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Neon Dot** | `mon.neon.dot` | regular | 18×18 px | `'k'` (#180820), `'p'` (#600f48), `'r'` (#ff1d8e), `'o'` (#ff70ba), `'y'` (#ffdf50), `'w'` (#ffffff) | `walk` (4), `hit` (1), `defeat` (3) |
| **Chimney Ghost** | `mon.chimney.ghost` | elite | 26×26 px | `'k'` (#140e1e), `'r'` (#8a3838), `'d'` (#481e26), `'p'` (#3b245e), `'v'` (#7a4ebd), `'g'` (#39ffb4), `'w'` (#e8d8ff) | `walk` (4), `hit` (1), `defeat` (4) |
| **Laser Dot Phantom** | `mon.laser.dot.phantom` | boss | 48×48 px | `'k'` (#11081c), `'d'` (#2a1445), `'p'` (#5e2794), `'v'` (#a452f0), `'r'` (#ff0055), `'y'` (#ff4db8), `'w'` (#ffffff) | `idle` (4), `windup` (3), `attack` (4), `hit` (1), `defeat` (6), `walk` (4) |

---

## 3. Visual Silhouette & Style Differentiation

The 5 monsters have radically contrasting silhouettes ensuring immediate readability against both dark (`#1a1220`) and light (`#fff3e0`) backgrounds:
- **Shadow Crow**: Avian silhouette with sharp yellow beak pointing left, arched feathered head, sleek folded wing, trailing tail feathers, and spindly claw feet on bottom row.
- **Moth Swarm**: Wide fluttering triangular formation of 3 moths with feathery antennae, glowing neon-cyan wing spots, and trailing glowing dust motes anchoring the bottom row.
- **Neon Dot**: Spherical, bouncy plasma orb with large curious cartoon eyes facing left, spark antennae, neon yellow spark whiskers, and tap-dancing spark feet.
- **Chimney Ghost**: Grounded brick masonry chimney pot at the base, with a billowing, asymmetrical ghostly apparition swirling upward and left with glowing neon mint eyes and smile.
- **Laser Dot Phantom**: Massive 48×48 spectral boss entity with twin curved cosmic horns, glowing concentric laser eye reticle, spectral clawed hands reaching forward, billowing midnight robe hem spanning columns 14–38 on the bottom row, and concentrated laser beams.

---

## 4. Screenshot Sheets & Visual Verification

Screenshot preview sheets were rendered at 3x scale against both dark (`#1a1220`) and light (`#fff3e0`) backgrounds and saved under `reports/v24e-ch5/`:

- `reports/v24e-ch5/mon-shadow-crow.png`: Shadow Crow all animations (`walk`, `hit`, `defeat`) at 3x on dark and light.
- `reports/v24e-ch5/mon-moth-swarm.png`: Moth Swarm all animations (`walk`, `hit`, `defeat`) at 3x on dark and light.
- `reports/v24e-ch5/mon-neon-dot.png`: Neon Dot all animations (`walk`, `hit`, `defeat`) at 3x on dark and light.
- `reports/v24e-ch5/mon-chimney-ghost.png`: Chimney Ghost all animations (`walk`, `hit`, `defeat`) at 3x on dark and light.
- `reports/v24e-ch5/mon-laser-dot-phantom.png`: Laser Dot Phantom all animations (`idle`, `windup`, `attack`, `hit`, `defeat`, `walk`) at 3x on dark and light.
- `reports/v24e-ch5/ch5-monsters-dark.png`: Complete Chapter 5 lineup rendered at 3x on dark background (`#1a1220`).
- `reports/v24e-ch5/ch5-monsters-light.png`: Complete Chapter 5 lineup rendered at 3x on light background (`#fff3e0`).
- `reports/v24e-ch5/ch5-monsters-all.png`: Side-by-side full comparison sheet at 3x scale.

---

## 5. Verification Commands and Pasted Output

### 5.1 Git Setup and Gate Check
```bash
$ git config user.email && git config user.name
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey

$ git fetch origin
$ git ls-tree origin/main -- apps/web/src/art/monsters/ch1.ts
100644 blob b0b151521a56b140f7097271969e0dd2fa601f34	apps/web/src/art/monsters/ch1.ts
```
Gate passed: Chapter 1 art exists on `origin/main`.

### 5.2 Dependency Integrity Check
```bash
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 449ms using pnpm v10.28.0
```

### 5.3 Deno Drift Check
```bash
$ pnpm gen:deno
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps

$ git diff
# No diff produced
```

### 5.4 TypeScript Typecheck
```bash
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /Users/bao/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
└─ Done in 706ms
└─ Done in 1s
└─ Done in 1.6s
└─ Done in 2.1s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 477ms
apps/web typecheck$ tsc --noEmit
└─ Done in 3.6s
```

### 5.5 Workspace Lint
```bash
$ pnpm lint
> taskbar-hero@0.0.0 lint /Users/bao/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
└─ Done in 424ms
└─ Done in 854ms
└─ Done in 914ms
└─ Done in 1.4s
packages/api-contract lint$ tsc --noEmit
└─ Done in 405ms
apps/web lint$ tsc --noEmit
└─ Done in 3.1s
```

### 5.6 Vitest Unit Tests
#### Chapter 5 Specific Tests
```bash
$ pnpm --filter @taskbar-hero/web test src/art/monsters/ch5.test.ts

> @taskbar-hero/web@0.0.0 test /Users/bao/taskbar-hero/apps/web
> vitest run src/art/monsters/ch5.test.ts

 RUN  v5.0.5 /Users/bao/taskbar-hero/apps/web

 ✓ src/art/monsters/ch5.test.ts (7 tests) 4ms
   ✓ CH5 Monster Art (7)
     ✓ contains exactly the registry ids for chapter 5 1ms
     ✓ matches monster kind with the game-rules roster 0ms
     ✓ follows the monsterArt format with zero problems for each monster 1ms
     ✓ ensures each monster palette has dark outline k plus 3 to 6 colors 0ms
     ✓ ensures no two monsters share identical walk frame 0 0ms
     ✓ ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56 0ms
     ✓ ensures boss has the required boss animations with correct frame counts 0ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  00:22:30
   Duration  552ms
```

#### Full Workspace Test Run
```bash
$ pnpm test
Scope: 6 of 7 workspace projects
packages/auth: 2 tests passed
packages/chain: 7 tests passed
packages/game-rules: 205 passed | 2 expected fail (207)
supabase/tests: 37 tests passed
packages/api-contract: 16 tests passed
apps/web: 44 test files passed (466 tests passed)
```

### 5.7 Full Workspace Build
```bash
$ pnpm build
> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
└─ Done in 387ms
└─ Done in 754ms
└─ Done in 864ms
└─ Done in 1.3s
packages/api-contract build$ tsc --noEmit
└─ Done in 396ms
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
✓ built in 354ms
└─ Done in 4.2s
```

---

## 6. Files Created

- `apps/web/src/art/monsters/ch5.ts`: Exports `CH5_ART: Record<string, MonsterArt>` with all 5 Chapter 5 monsters.
- `apps/web/src/art/monsters/ch5.test.ts`: Vitest test suite ensuring zero problems from `monsterArtProblems`, exact registry ID match, kind match, palette colors in [3, 6] non-`k` range, no identical walk frame 0, correct dimensions, and boss animation frame counts.
- `reports/v24e-ch5.md`: This report.
- `reports/v24e-ch5/*.png`: 3x scale PNG screenshot sheets for all monsters against dark and light backgrounds.

---

## 7. Items Unsure About & Clarifications

1. **Boss Walk Frames**: In accordance with the prompt's request that "no two monsters share identical walk frame 0", `mon.laser.dot.phantom` includes 4 `walk` frames matching its hovering movement pattern (in addition to the required `idle: 4, windup: 3, attack: 4, hit: 1, defeat: 6`), which is permitted by `monsterArtProblems` and ensures all 5 monsters have distinct walk frame 0s.
2. **Elite Defeat Frames**: `MONSTER_LIMITS['elite'].anims.defeat` allows between 3 and 4 frames. Chimney Ghost uses 4 defeat frames (squash, suction tilt, smoke burst, resting embers), which provides smooth visual feedback and passes all checks.
