STATUS: DONE

# G5 Polish Report

## 1. Summary of Changes

### Issue 1: 844x390 (Landscape Phone) Topbar Fit and Clipping
- **Root Cause**: On `origin/main`, topbar contents measured 949 px wide inside the 844 px bar, causing `.v2-hint` (Equip best chip) to collapse to `0x34` (completely invisible) and pushing the wallet button and sync status off-screen past 844 px with clipping.
- **Fix**:
  - In `apps/web/src/layout/layout.css`:
    - Collapsed `.v2-wallet` to a compact 44x44 icon button at `max-width: 1099px` and short landscape (freed ~96 px).
    - Reduced `.v2-sync-status-slot` text labels at `max-width: 1024px` (`span:not([aria-hidden]) { display: none; }`), displaying only the status indicator dot (freed ~100 px).
    - Refined short landscape topbar styles: topbar padding `0 6px`, gap `4px`, title font-size `var(--fs-xs, 0.75rem)` (12 px), HUD layout gap `3px`, stacks list gap `2px`, stack item padding `1px 3px`, progress chip padding `1px 4px`, power chip padding `1px 4px` with power value `12px`, and stack labels hidden (`display: none`).
  - **Result**:
    - Topbar content fits comfortably within 844 px (`scrollWidth == clientWidth == 844px`).
    - Wallet button right edge is at 820 px (<= 844 px, not clipped).
    - Sync status right edge is at 838 px (<= 844 px, not clipped).
    - Hint chip measures 75 px wide ("Equip best (+1)") / up to 220 px wide, fully visible and never collapsed.
    - Page height exactly equals viewport (`390 px == 390 px`) with 0 document scroll (`scrollWidth == 844 px`, `scrollHeight == 390 px`).

### Issue 2: 1024x600 Equip-Best Chip Clipping
- **Root Cause**: At 1024x600, full-length wallet button (140 px) and sync status (115 px) constricted the hint chip to 24x44, clipping "Equip best".
- **Fix**:
  - Collapsing wallet to 44x44 at `max-width: 1099px` and sync status text at `max-width: 1024px` frees ~196 px of topbar width.
  - Reduced topbar padding to `0 8px` and gap to `6px`.
  - **Result**: Hint chip at 1024x600 now measures 82 px (or up to 181 px for longer hints) with full 44 px height, giving ample room so the text reads completely without truncation.

### Issue 3: Stage Pips, Fight Preview, and Phone Wallet Label Raised to >= 12 px
- **Stage Pips & Fight Preview**:
  - In `apps/web/src/game/stage/stage.css`:
    - `.stage-pip`: font-size increased from 10 px to 12 px.
    - `.stage-preview`: font-size increased from 10 px to `12px/1.2`.
  - Retains visual layout without overlapping game canvas sprites or HUD.
- **Phone Wallet Label**:
  - In `apps/web/src/layout/layout.css`:
    - Updated phone portrait wallet button `.v2-wallet .wallet-btn` from `font-size: 0;` to `font-size: 12px; color: transparent; overflow: hidden;` (eliminates 0 px font size while maintaining accessible name and icon display).
  - Verified across all 6 viewports that 0 elements with text content render with font-size < 12 px.

### Issue 4: Touch Hit Areas (1440x900 Character Slots & 844x390 Wallet Button) Raised to >= 44 px
- **1440x900 Character Slots**:
  - In `apps/web/src/layout/layout.css`:
    - Added `::after` pseudo-element with `width: 44px; height: 44px; min-width: 44px; min-height: 44px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);` to `.v2-character-compact .slot-grid.compact .slot-btn`.
    - Visual size remains compact 28x28 without layout disruption to the 3-column equipment grid; effective hit target is 44x44.
- **844x390 Wallet Button**:
  - In `apps/web/src/layout/layout.css`:
    - Added `::after` pseudo-element with `min-width: 44px; min-height: 44px; width: 100%; height: 44px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);` to `.v2-wallet .wallet-btn`.
    - Effective hit target is >= 44x44 with 0 layout cost inside the 40 px short-landscape topbar.

---

## 2. Acceptance Criteria Checklist

- [x] **1. 844x390 Topbar Fit**: Topbar content fits inside 844 px without clipping, Equip-best chip is visible (75x34, not collapsed to 0x34), wallet button (right=820 px) and sync status (right=838 px) not clipped, page height == viewport (390 px) and no page scroll: **PASS**
- [x] **2. 1024x600 Equip-Best Chip**: Hint chip has ample room (82x44, not 24x44) and text reads fully: **PASS**
- [x] **3. Font Sizes >= 12 px**: Stage pips (12 px), Fight preview (12 px), and phone wallet label (12 px, no 0 px text): **PASS**
- [x] **4. Hit Area >= 44 px**: 1440x900 character slots (44x44 via `::after`) and 844x390 wallet button (44x44 via `::after`): **PASS**
- [x] **Six-Size Viewport Check**:
  - `1440x900`: page height == 900 px, no horizontal overflow, Equip best / Fight / Craft in view: **PASS**
  - `1280x720`: page height == 720 px, no horizontal overflow, Equip best / Fight / Craft in view: **PASS**
  - `1024x600`: page height == 600 px, no horizontal overflow, Equip best / Fight / Craft in view: **PASS**
  - `390x844`: page height == 844 px, no horizontal overflow, Equip best / Fight / Craft in view: **PASS**
  - `320x568`: page height == 568 px, no horizontal overflow, Equip best / Fight / Craft in view: **PASS**
  - `844x390`: page height == 390 px, no horizontal overflow, Equip best / Fight / Craft in view: **PASS**
- [x] **Game / Replay Logic & Colours**: Untouched: **PASS**
- [x] **Every Existing Test Passing**: 1,197 unit tests pass, 193 Playwright e2e tests pass: **PASS**

---

## 3. Files Touched

```
 apps/web/src/game/stage/stage.css |   4 +-
 apps/web/src/layout/layout.css    | 131 +++++++++++++++++++++++++++-
 reports/g5-polish.md              | 175 ++++++++++++++++++++++++++++++++++++++
 3 files changed, 306 insertions(+), 4 deletions(-)
```

---

## 4. Verification Suite Outputs

### 1. `pnpm install --frozen-lockfile`
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 425ms using pnpm v10.28.0
```

### 2. `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

### 3. `pnpm typecheck`
```
> taskbar-hero@0.0.0 typecheck /Users/bao/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
└─ Done in 3.8s
```

### 4. `pnpm lint`
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
└─ Done in 3.7s
```

### 5. `pnpm test`
```
> taskbar-hero@0.0.0 test /Users/bao/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test: 2 passed (2)
packages/chain test: 2 passed (2)
packages/game-rules test: 17 passed (17)
supabase/tests test: 2 passed (2)
packages/api-contract test: 2 passed (2)
apps/web test: 95 passed (95)
Test Files  95 passed (95)
     Tests  1197 passed (1197)
  Duration  10.76s
```

### 6. `pnpm build`
```
> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build: tsc --noEmit (done in 365ms)
packages/chain build: tsc --noEmit (done in 862ms)
packages/game-rules build: tsc --noEmit (done in 945ms)
supabase/tests build: tsc --noEmit (done in 1.3s)
packages/api-contract build: tsc --noEmit (done in 427ms)
apps/web build: tsc --noEmit && vite build (done in 4.9s)
```

### 7. `cd apps/web && pnpm test:e2e`
```
> @taskbar-hero/web@0.0.0 test:e2e /Users/bao/taskbar-hero/apps/web
> playwright test

Running 193 tests using 6 workers
  193 passed (52.2s)
```

---

## 5. NOT Verified
- None. All 6 viewports, all 4 polish issues, unit tests (1,197), and e2e tests (193) were verified.

---

## 6. What Is Needed to Continue
- Nothing. The task is fully complete and ready for review.
