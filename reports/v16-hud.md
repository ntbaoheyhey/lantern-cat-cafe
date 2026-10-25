STATUS: DONE

# Card A20 Report: Presentational HUD Pieces for v2 Stage

## Summary of Work Done
Created isolated, pure presentational HUD components for the Cat RPG v2 stage layout under `apps/web/src/layout/hud/`:
- `LevelXpBar.tsx`: Displays level badge ("Lv 12") and an accessible progressbar with `role="progressbar"`, `aria-label="Experience"`, clamped width 0–100%, and reduced-motion support.
- `ProgressChip.tsx`: Displays "Chapter 2 · Round 3 · 4/10" with chapter name from `v2.CHAPTERS` (e.g. "Kitchen") as title, and accessible name in words ("Chapter 2 Kitchen, round 3 of 10, 4 of 10 monsters").
- `StacksBar.tsx`: Currency stacks for Fish, Yarn, and Cat Keys (dynamic cap from `v2.MATERIALS` `maxStack: 5`) with decorative pixel icons (`aria-hidden`) and semantic list markup (`role="list"` and `role="listitem"`).
- `PowerChip.tsx`: Shows "Power 1,234" and conditionally announces the weapon upgrade hint with `role="status"` when `gated` is true ("Needs about {neededPower} power: upgrade your weapon"), removing the hint element from the DOM when `gated` is false.
- `HudBar.tsx`: Pure section container (`aria-label="Cat status"`, no headings) composing all four pieces from `state.cat`, `state.progress`, `state.currencies`, and parent-supplied `power`.
- `index.ts`: Exports all five components and their prop TypeScript interfaces.
- `hud.css`: Compact flex layout at >= 600px, responsive wrapping on mobile, zero horizontal overflow at 320px, light and dark mode variables matching `boss.css` and `loot.css`, text contrast >= 4.5:1.
- Unit and accessibility tests for each component and full HUD audit (`LevelXpBar.test.tsx`, `ProgressChip.test.tsx`, `StacksBar.test.tsx`, `PowerChip.test.tsx`, `HudBar.test.tsx`, `hud.a11y.test.tsx`).
- Responsive visual screenshots for gated=false and gated=true across mobile (390x844) and desktop (1280x720) in light and dark themes.

---

## Gate Check Output

```bash
$ git ls-tree origin/main apps/web/src/layout/hud
# (empty - no output)

$ git show origin/main:apps/web/src/api/GameApiV2.ts | grep -n "export interface ServerStateV2"
125:export interface ServerStateV2 {

$ git ls-remote origin 'refs/heads/ai/*hud*' 'refs/heads/task/V16*' 'refs/heads/claude/*v16*'
# (empty - no output)
```

Gate conditions all passed.

---

## Files Changed

```bash
$ git diff --stat origin/main...HEAD
 apps/web/src/layout/hud/HudBar.test.tsx       |  90 ++++++++++++++++++++++++++
 apps/web/src/layout/hud/HudBar.tsx            |  44 +++++++++++++
 apps/web/src/layout/hud/LevelXpBar.test.tsx   |  64 +++++++++++++++++++
 apps/web/src/layout/hud/LevelXpBar.tsx        |  42 ++++++++++++
 apps/web/src/layout/hud/PowerChip.test.tsx    |  33 ++++++++++
 apps/web/src/layout/hud/PowerChip.tsx         |  19 ++++++
 apps/web/src/layout/hud/ProgressChip.test.tsx |  44 +++++++++++++
 apps/web/src/layout/hud/ProgressChip.tsx      |  25 +++++++
 apps/web/src/layout/hud/StacksBar.test.tsx    |  41 ++++++++++++
 apps/web/src/layout/hud/StacksBar.tsx         |  34 ++++++++++
 apps/web/src/layout/hud/hud.a11y.test.tsx     |  64 +++++++++++++++++++
 apps/web/src/layout/hud/hud.css               | 197 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 apps/web/src/layout/hud/index.ts              |   5 ++
 reports/v16-hud/hud-gated-false-1280x720-dark.png  | Bin
 reports/v16-hud/hud-gated-false-1280x720-light.png | Bin
 reports/v16-hud/hud-gated-false-390x844-dark.png   | Bin
 reports/v16-hud/hud-gated-false-390x844-light.png  | Bin
 reports/v16-hud/hud-gated-true-1280x720-dark.png   | Bin
 reports/v16-hud/hud-gated-true-1280x720-light.png  | Bin
 reports/v16-hud/hud-gated-true-390x844-dark.png    | Bin
 reports/v16-hud/hud-gated-true-390x844-light.png   | Bin
 reports/v16-hud.md                                 |  ...
```

---

## Component & Props Table

| Component | Exported Props Interface | Required Props | Description |
|---|---|---|---|
| `LevelXpBar` | `LevelXpBarProps` | `level: number`, `xp: number`, `xpToNext: number` | Level badge and role="progressbar" experience track with clamped percentage fill and reduced-motion fallback. |
| `ProgressChip` | `ProgressChipProps` | `chapter: number`, `round: number`, `kills: number`, `killsPerRound: number` | Chapter, round, and kill count badge with chapter name from `v2.CHAPTERS` and descriptive words accessible name. |
| `StacksBar` | `StacksBarProps` | `fish: number`, `yarn: number`, `keys: number` | Three currency items with decorative `PixelIcon` SVGs, dynamic maxStack from `v2.MATERIALS` for keys (`2/5`), and role="list"/"listitem". |
| `PowerChip` | `PowerChipProps` | `power: number`, `gated: boolean`, `neededPower: number` | Power value display with conditional `role="status"` hint when `gated` is true; omitted from DOM when `false`. |
| `HudBar` | `HudBarProps` | `state: ServerStateV2`, `power: number` | Section wrapper (`aria-label="Cat status"`, no heading) composing the four subcomponents. |

---

## Contrast Ratios

Measured between text and background surfaces from screenshots:

1. **Dark Theme - Primary Text (`#fff3e0`) on Surface (`#2a1f36`)**:
   - Luminance text: 0.9066
   - Luminance bg: 0.0181
   - Contrast ratio: **14.05:1** (exceeds WCAG AAA requirement of 7.0:1)

2. **Dark Theme - Primary Text (`#fff3e0`) on Chip Surface (`#3a2c4a`)**:
   - Luminance text: 0.9066
   - Luminance bg: 0.0331
   - Contrast ratio: **11.51:1** (exceeds WCAG AAA requirement of 7.0:1)

3. **Dark Theme - Gated Hint Text (`#ff8fb1`) on Chip Surface (`#3a2c4a`)**:
   - Luminance hint: 0.4430
   - Luminance bg: 0.0331
   - Contrast ratio: **5.93:1** (exceeds WCAG AA requirement of 4.5:1)

4. **Light Theme - Primary Text (`#2a1a08`) on Surface (`#fdfbf7`)**:
   - Luminance text: 0.0129
   - Luminance bg: 0.9587
   - Contrast ratio: **16.04:1** (exceeds WCAG AAA requirement of 7.0:1)

5. **Light Theme - Muted Text (`#6e5c4e`) on Chip Surface (`#f0e9df`)**:
   - Luminance muted: 0.1150
   - Luminance bg: 0.8186
   - Contrast ratio: **5.26:1** (exceeds WCAG AA requirement of 4.5:1)

6. **Light Theme - Gated Hint Text (`#b01a4a`) on Chip Surface (`#f0e9df`)**:
   - Luminance hint: 0.0840
   - Luminance bg: 0.8186
   - Contrast ratio: **6.48:1** (exceeds WCAG AA requirement of 4.5:1)

---

## Embedded Screenshots

### Desktop (1280 x 720) - Gated False
#### Dark Theme
![HUD Gated False 1280x720 Dark](reports/v16-hud/hud-gated-false-1280x720-dark.png)
#### Light Theme
![HUD Gated False 1280x720 Light](reports/v16-hud/hud-gated-false-1280x720-light.png)

### Desktop (1280 x 720) - Gated True (Needs Power Hint)
#### Dark Theme
![HUD Gated True 1280x720 Dark](reports/v16-hud/hud-gated-true-1280x720-dark.png)
#### Light Theme
![HUD Gated True 1280x720 Light](reports/v16-hud/hud-gated-true-1280x720-light.png)

### Mobile (390 x 844) - Gated False
#### Dark Theme
![HUD Gated False 390x844 Dark](reports/v16-hud/hud-gated-false-390x844-dark.png)
#### Light Theme
![HUD Gated False 390x844 Light](reports/v16-hud/hud-gated-false-390x844-light.png)

### Mobile (390 x 844) - Gated True (Needs Power Hint)
#### Dark Theme
![HUD Gated True 390x844 Dark](reports/v16-hud/hud-gated-true-390x844-dark.png)
#### Light Theme
![HUD Gated True 390x844 Light](reports/v16-hud/hud-gated-true-390x844-light.png)

---

## Acceptance Checklist

- [x] **Gate 1**: `git ls-tree origin/main apps/web/src/layout/hud` prints nothing: **PASS**
- [x] **Gate 2**: `git show origin/main:apps/web/src/api/GameApiV2.ts | grep -n "export interface ServerStateV2"` prints 1 line: **PASS**
- [x] **Corrected Gate 3**: `git ls-remote origin 'refs/heads/ai/*hud*' 'refs/heads/task/V16*' 'refs/heads/claude/*v16*'` prints nothing: **PASS**
- [x] **Allowlist**: Only files under `apps/web/src/layout/hud/` and `reports/v16-hud*` touched: **PASS**
- [x] **Forbidden files**: `StageLayout.tsx`, `layout.css`, `game/**`, `package.json`, `pnpm-lock.yaml` untouched: **PASS**
- [x] **Component 1 (LevelXpBar)**: Level text, progressbar aria attributes, clamped width, reduced-motion fallback: **PASS**
- [x] **Component 2 (ProgressChip)**: Chapter/round/kills, chapter name from `v2.CHAPTERS`, descriptive accessible name: **PASS**
- [x] **Component 3 (StacksBar)**: Fish, yarn, keys with `catKey` cap from content, decorative icons, list/listitem accessible names: **PASS**
- [x] **Component 4 (PowerChip)**: Power display, conditional `role="status"` hint on `gated: true`, omitted when `false`: **PASS**
- [x] **Component 5 (HudBar)**: Section `aria-label="Cat status"`, no heading, composes 4 components: **PASS**
- [x] **Component 6 (index.ts)**: Exports 5 components and prop types: **PASS**
- [x] **Stylesheet (hud.css)**: Compact single row >= 600px, wraps cleanly at 390px/320px, Cat Café palette, contrast >= 4.5:1: **PASS**
- [x] **Test 1**: HudBar renders all distinct numbers from fixture: **PASS**
- [x] **Test 2**: PowerChip gated true/false hint presence: **PASS**
- [x] **Test 3**: StacksBar keys cap from `v2.MATERIALS`: **PASS**
- [x] **Test 4**: LevelXpBar progressbar roles and reduced motion: **PASS**
- [x] **Test 5**: hud.a11y.test.tsx icon aria-hidden, tabIndex <= 0, accessible name, no skipped headings: **PASS**
- [x] **Test 6**: 320px width rendering and CSS wrapping rules check: **PASS**
- [x] **Local Suite Verification**: install, gen:deno drift, typecheck, lint, full test, build, playwright: **PASS**

---

## Real Commands Output

### 1. `pnpm install --frozen-lockfile`
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 393ms using pnpm v10.28.0
```

### 2. `pnpm --filter @taskbar-hero/web exec vitest run src/layout/hud src/layout/a11y`
```
 RUN  v5.0.5 /Users/bao/taskbar-hero/apps/web

 ✓ src/layout/hud/ProgressChip.test.tsx (3 tests) 123ms
 ✓ src/layout/hud/PowerChip.test.tsx (3 tests) 151ms
 ✓ src/layout/hud/LevelXpBar.test.tsx (5 tests) 178ms
 ✓ src/layout/hud/StacksBar.test.tsx (3 tests) 203ms
 ✓ src/layout/hud/hud.a11y.test.tsx (2 tests) 224ms
 ✓ src/layout/hud/HudBar.test.tsx (2 tests) 223ms
 ✓ src/layout/a11y/v2-loot.a11y.test.tsx (18 tests) 349ms
 ✓ src/layout/a11y/v2-components.a11y.test.tsx (20 tests) 378ms

 Test Files  8 passed (8)
      Tests  56 passed (56)
   Start at  13:57:38
   Duration  1.68s
```

### 3. `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
# git diff printed nothing (clean)
```

### 4. `git diff --stat origin/main -- apps/web/src/layout/StageLayout.tsx apps/web/src/layout/layout.css apps/web/src/game apps/web/package.json pnpm-lock.yaml`
```
# (empty - no output)
```

### 5. `pnpm typecheck`
```
> taskbar-hero@0.0.0 typecheck /Users/bao/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
└─ Done in 3.5s
```

### 6. `pnpm lint`
```
> taskbar-hero@0.0.0 lint /Users/bao/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/api-contract lint$ tsc --noEmit
apps/web lint$ tsc --noEmit
└─ Done in 8.2s
```

### 7. `pnpm test`
```
> taskbar-hero@0.0.0 test /Users/bao/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test: 5 passed (5)
packages/chain test: 2 passed (2)
supabase/tests test: 7 passed (7)
packages/game-rules test: 30 test files passed (30), 450 tests passed
apps/web test: 72 test files passed (72), 983 tests passed
```

### 8. `pnpm build`
```
> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/api-contract build$ tsc --noEmit
apps/web build$ tsc --noEmit && vite build
✓ 1724 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/index-unBFXH2h.js               132.03 kB │ gzip:  38.56 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 344ms
```

### 9. `cd apps/web && pnpm exec playwright test`
```
Running 47 tests using 6 workers
47 passed (16.6s)
```

---

## Hand-off Note for V16 Lane

> **Hand-off for V16:**
> import { HudBar } from './hud'; pass state and power (computed as CharacterPanel does); show PowerChip's hint only from state.progress.gated.

Example integration:
```tsx
import { HudBar } from './hud';
import { v2 } from '@taskbar-hero/game-rules';

// Derive power as CharacterPanel does:
const worn = state.inventory
  .filter((i) => i.equipped)
  .map((i) => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }));
const power = Math.round(v2.powerRating(v2.deriveStats({ classId: state.cat.classId ?? 'warrior', level: state.cat.level }, worn)));

<HudBar state={state} power={power} />
```

---

## NOT Verified / Blockers

- **Blockers**: None.
- **NOT verified**: Live server runtime cut-over to V2 (card scope was explicitly isolated presentational components without wiring into stage layout, gated behind `VITE_GAME_V2=1` for subsequent V16 card CL5).
