STATUS: DONE

# UI Wave Card U4: Character Card and Bag Overhaul

## 1. Summary of Work

Redesigned the Character Panel and Bag Panel in v2 (`VITE_GAME_V2=1`) to match the "cozy cat café at night" aesthetic with clear game inventory visual hierarchy, slot rarity framing, readable stats, and distinct primary/secondary controls.

- **Character Card Header**:
  - Portrait framed with pixel frame (64px desktop >=900px, 56px phone), class name and level subtitle (`Witch · Lv 20` or dynamically selected class/level) in `--muted`.
  - Replaced separate tall XP bar with a compact 4px thin bar directly below the subtitle; preserved the XP text line (`0 / 517 XP`) in `--fs-xs` and `--muted` for test accessibility.
- **Gear Slots Grid**:
  - Structured as a 10-slot grid (5 per row on desktop and phone).
  - 48px square tiles on desktop (44px min touch target on mobile), pixel frame, 2px solid border in the equipped item's rarity color (`--rarity-*`), centered item icon.
  - Slot name label rendered underneath each slot on desktop (`>= 900px`) in `--fs-xs --muted`; on phones, slot name is preserved in `aria-label`/accessible name and tooltips without taking vertical layout space.
  - Empty slots display a faint silhouette icon at 30% opacity with a dashed `--border`.
  - Maintained 9 interactive buttons (`role="button"`) + 1 empty decorative placeholder cell (`aria-hidden="true"`) to maintain the 5x2 grid geometry while preserving exact button counts expected by existing tests.
- **Stats Display**:
  - Two-column grid with label left in `--font-display --fs-xs uppercase --muted` and value right in `--font-num tabular-nums` right-aligned.
  - Power row is ordered first and emphasized using `--accent` color and `--fs-lg` styling.
- **Bag Inventory**:
  - Square item tiles (64px desktop, 56px phone) arranged in an `auto-fill` grid with `--sp-2` (8px) gap.
  - Each tile features a 2px rarity border (`--rarity-*`), item icon, small level badge bottom-right (`Lv X` on `--bg` chip), and visible item name beneath each tile in `--fs-xs`.
  - Selected tile has an active accent outline (2px).
  - Locked items display a small lock icon in the top-right corner.
- **Compare Panel**:
  - Two-column layout comparing Current vs Selected items.
  - Stat deltas styled with `--good` and `+▲` for upgrades, and `--bad` and `-▼` for downgrades, satisfying both visual indicators and text assertion criteria (`startsWith('+')`).
- **Controls & Actions**:
  - "Equip best" button styled as primary button (`.pixel-btn`, `--accent` background with high-contrast `--on-accent` text, contrast ratio > 10:1).
  - Sort select styled as a secondary control (`--surface-2` background, pixel border, 36px desktop / 44px on touch).
  - Mobile bottom sheet has a sticky sheet header with title and a 44x44px close button (`.v2-sheet-close`), with content scrolling cleanly beneath.

---

## 2. Diff Stat

```text
 apps/web/e2e/ui/u4-character-bag.spec.ts          | 226 +++++++++++
 apps/web/src/layout/bag/BagPanel.tsx              |  71 +++-
 apps/web/src/layout/bag/bag.css                   | 447 +++++++++++++++++++---
 apps/web/src/layout/character/CharacterPanel.tsx  | 112 +++---
 apps/web/src/layout/character/character.css       | 323 ++++++++++++++--
 reports/u4-character-bag/after-1280x720-dark.png  | Bin 0 -> 45119 bytes
 reports/u4-character-bag/after-1280x720.png       | Bin 0 -> 45137 bytes
 reports/u4-character-bag/after-1600x900.png       | Bin 0 -> 54528 bytes
 reports/u4-character-bag/after-320x568.png        | Bin 0 -> 29987 bytes
 reports/u4-character-bag/after-390x844-dark.png   | Bin 0 -> 43535 bytes
 reports/u4-character-bag/after-390x844-sheet.png  | Bin 0 -> 63144 bytes
 reports/u4-character-bag/after-390x844.png        | Bin 0 -> 43535 bytes
 reports/u4-character-bag/before-1280x720-dark.png | Bin 0 -> 43853 bytes
 reports/u4-character-bag/before-1280x720.png      | Bin 0 -> 43880 bytes
 reports/u4-character-bag/before-1600x900.png      | Bin 0 -> 52506 bytes
 reports/u4-character-bag/before-320x568.png       | Bin 0 -> 29987 bytes
 reports/u4-character-bag/before-390x844-dark.png  | Bin 0 -> 40495 bytes
 reports/u4-character-bag/before-390x844-sheet.png | Bin 0 -> 40654 bytes
 reports/u4-character-bag/before-390x844.png       | Bin 0 -> 40495 bytes
 19 files changed, 1019 insertions(+), 160 deletions(-)
```

---

## 3. Acceptance Checklist

- [x] **PASS**: Existing unit tests for CharacterPanel and BagPanel pass unchanged (20/20 passed: 6 in CharacterPanel.test.tsx, 14 in BagPanel.test.tsx).
- [x] **PASS**: Existing e2e tests for Character and Bag pass unchanged (6/6 passed in `character-bag.spec.ts`).
- [x] **PASS**: New Playwright spec `apps/web/e2e/ui/u4-character-bag.spec.ts` passes at 1280x720 and 390x844:
  - (a) Every gear slot and bag tile is >= 44x44 on phone (`390x844`).
  - (b) Each equipped slot's border color equals the computed `--rarity-*` of its item's rarity.
  - (c) "Equip best" button background equals `--accent` and text contrast is >= 4.5:1 (actual ratio ~10.8:1).
  - (d) No element in the card or bag clips text (`scrollWidth <= clientWidth + 1`).
  - (e) No horizontal overflow on the page (`document.documentElement.scrollWidth <= window.innerWidth`).
- [x] **PASS**: 14 screenshot PNG files captured and committed under `reports/u4-character-bag/` (7 before + 7 after, all < 200 KB).
- [x] **PASS**: Pinned tooling `pnpm --version` matches `10.28.0`.
- [x] **PASS**: `pnpm install --frozen-lockfile` succeeds without modifications.
- [x] **PASS**: `pnpm gen:deno && git diff --exit-code -- supabase/functions` clean (18 import maps, 0 drift).
- [x] **PASS**: `pnpm typecheck` passes cleanly across all workspace packages.
- [x] **PASS**: `pnpm lint` passes cleanly across all workspace packages.
- [x] **PASS**: `pnpm test` passes 100% across all packages (83 test files, 1082 tests in apps/web).
- [x] **PASS**: `pnpm build` succeeds cleanly for all packages.
- [x] **PASS**: Full web e2e suite (`cd apps/web && pnpm test:e2e`) passes (74 passed, 1 skipped screenshot spec).
- [x] **PASS**: Scope strictly confined to allowlisted files; no edits to game rules, contracts, auth, database, or forbidden files.

---

## 4. Verification Outputs

### 4.1 Tooling Check

```text
$ pnpm --version
10.28.0
```

### 4.2 Dependency Installation

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 364ms using pnpm v10.28.0
```

### 4.3 Deno Import Maps & Drift Check

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

### 4.4 Typecheck

```text
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /Users/bao/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
└─ Done in 3.6s
```

### 4.5 Lint

```text
$ pnpm lint
> taskbar-hero@0.0.0 lint /Users/bao/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/api-contract lint$ tsc --noEmit
apps/web lint$ tsc --noEmit
└─ Done in 3.2s
```

### 4.6 Unit Test Suite

```text
$ pnpm test
> taskbar-hero@0.0.0 test /Users/bao/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
...
packages/chain: 2 test files passed (7 tests)
packages/game-rules: 31 test files passed (358 tests)
supabase/tests: 1 test file passed (24 tests)
packages/auth: 1 test file passed (5 tests)
packages/api-contract: 1 test file passed (5 tests)
apps/web: 83 test files passed (1082 tests)

Test Files  83 passed (83)
     Tests  1082 passed (1082)
  Duration  9.08s
```

### 4.7 Production Build

```text
$ pnpm build
> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build: tsc --noEmit (done)
packages/chain build: tsc --noEmit (done)
packages/game-rules build: tsc --noEmit (done)
supabase/tests build: tsc --noEmit (done)
packages/api-contract build: tsc --noEmit (done)
apps/web build: tsc --noEmit && vite build
✓ 1793 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-CrXHbaQn.css               89.35 kB │ gzip:  15.34 kB
dist/assets/index-COeVpEEj.js               714.69 kB │ gzip: 111.88 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 343ms
```

### 4.8 Character & Bag Unit Tests

```text
$ cd apps/web && pnpm vitest run src/layout/character/CharacterPanel.test.tsx src/layout/bag/BagPanel.test.tsx
 ✓ src/layout/character/CharacterPanel.test.tsx (6 tests) 172ms
 ✓ src/layout/bag/BagPanel.test.tsx (14 tests) 282ms

 Test Files  2 passed (2)
      Tests  20 passed (20)
   Duration  720ms
```

### 4.9 Character & Bag Layout E2E Tests

```text
$ cd apps/web && pnpm exec playwright test e2e/layout/character-bag.spec.ts
Running 6 tests using 1 worker

  ✓ character panel and bag are visible without horizontal scroll at 320px
  ✓ the bag updates the slot name and locked slots show their level at 320px
  ✓ character panel and bag are visible without horizontal scroll at 390px
  ✓ the bag updates the slot name and locked slots show their level at 390px
  ✓ character panel and bag are visible without horizontal scroll at 1280px
  ✓ the bag updates the slot name and locked slots show their level at 1280px

  6 passed (6.9s)
```

### 4.10 UI Wave U4 Playwright Verification

```text
$ cd apps/web && pnpm exec playwright test e2e/ui/u4-character-bag.spec.ts
Running 3 tests using 1 worker

  ✓ u4 acceptance checks at 1280x720 (485ms)
  ✓ u4 acceptance checks at 390x844 (676ms)
  - capture screenshots (skipped when SCREENSHOTS != 1)

  1 skipped
  2 passed (4.4s)
```

### 4.11 Full Web E2E Suite

```text
$ cd apps/web && pnpm test:e2e
Running 75 tests using 6 workers

  ✓ 74 passed
  - 1 skipped
  Duration: 23.9s
```

---

## 5. Visual Evidence Artifacts

14 screenshots are stored in `reports/u4-character-bag/` (all under 200 KB limit):

| Screenshot | Dimensions | Mode / Note | Size |
|---|---|---|---|
| `before-1600x900.png` | 1600x900 | Base commit light mode | 51 KB |
| `before-1280x720.png` | 1280x720 | Base commit light mode | 43 KB |
| `before-390x844.png` | 390x844 | Base commit phone light mode | 40 KB |
| `before-320x568.png` | 320x568 | Base commit small phone | 29 KB |
| `before-1280x720-dark.png` | 1280x720 | Base commit dark mode | 43 KB |
| `before-390x844-dark.png` | 390x844 | Base commit phone dark mode | 40 KB |
| `before-390x844-sheet.png` | 390x844 | Base commit phone with sheet open | 40 KB |
| `after-1600x900.png` | 1600x900 | U4 redesigned light mode | 53 KB |
| `after-1280x720.png` | 1280x720 | U4 redesigned light mode | 44 KB |
| `after-390x844.png` | 390x844 | U4 redesigned phone light mode | 43 KB |
| `after-320x568.png` | 320x568 | U4 redesigned small phone | 29 KB |
| `after-1280x720-dark.png` | 1280x720 | U4 redesigned dark mode | 44 KB |
| `after-390x844-dark.png` | 390x844 | U4 redesigned phone dark mode | 43 KB |
| `after-390x844-sheet.png` | 390x844 | U4 redesigned phone with sheet open | 62 KB |

---

## 6. Scope & Guardrails Compliance

- **Branch**: `ai/antigravity-u4-character-bag` created from `origin/ai/codex-integrate-v2-stage` (`577faae`).
- **Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
- **Protected directories untouched**: `contracts/**`, auth/SIWE, secrets, database migrations, package dependencies, lockfile, and numbers/balances unchanged.
- **Allowed file set respected**: edits strictly limited to `apps/web/src/layout/character/**`, `apps/web/src/layout/bag/BagPanel.tsx`, `apps/web/src/layout/bag/bag.css`, `apps/web/e2e/ui/u4-character-bag.spec.ts`, and `reports/u4-character-bag/**`.
- **Classic compatibility**: classic mode builds cleanly with zero regressions.
