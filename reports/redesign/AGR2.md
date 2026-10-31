# Mission AGR2 Report: P2 Bag Redesign

STATUS: DONE

- **Branch**: `ai/antigravity-redesign-agr2`
- **Base**: `origin/main` (commit `ea3da8c`)
- **Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
- **Date**: 2026-11-01

---

## 1. Executive Summary

Mission AGR2 implements the desktop redesign for the Cat RPG v2 Bag screen according to the approved design direction (`reports/ui-redesign/index.html`, `BRIEF.md`, `PLAN.md`):

1. **8-Column Slot Grid with Real Art**:
   - Replaced old inventory list with an 8-column slot grid (`repeat(8, 56px)` with 8px gap) using real game art via `ItemIcon` / `ItemPixelIcon`.
   - Grid renders filled items followed by visible empty slots up to bag capacity (`state.bagLimit > 0 ? state.bagLimit : 40`), rendered with dashed pixel borders and semi-transparent backgrounds.
2. **Filter Chips & Total Bag Count**:
   - Added filter chips (`All`, `Weapons`, `Armor`, `Materials`, `Relics`) allowing quick filtering of bag items.
   - Preserved `Bag ${bag.length} / ${state.bagLimit}` count display (`data-testid="bag-count"`), ensuring the count remains stable when filters are applied.
   - Maintained sort dropdown (`Rarity`, `Level`, `Slot`, `Newest`) for flexible item organization.
3. **Right Detail Panel & Comparison Block**:
   - Fixed-width 320px right detail panel showing the selected item's full details:
     - Real item icon preview, item name, level, slot, and gear type.
     - Accessible rarity pill (`.rarity-pill`) showing visible text (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`) alongside rarity color frames.
     - Detailed stats list: Level, Gear Power, Attack, Crit Chance, Crit Mult, and bonus roll modifiers.
     - Comparison block against the currently equipped item in that slot: calculates attack delta, crit chance delta, and power difference with colored indicators (+ in green, - in red, = in muted).
     - Action buttons: `Equip` (primary), `Forge` (crafting shortcut), `List` (marketplace shortcut), and `Lock` / `Unlock` toggle.
4. **Bulk Equip & Action Handlers**:
   - Bulk equip (`Equip best`) button with upgrade count indicator and explanatory disabled notice (`data-testid="block-reason-equip-best"`).
   - Preserves all existing handlers (`onEquip`, `onEquipBest`, `onForge`, `onList`, `onLock`).
5. **Empty State & Fallbacks**:
   - When the bag is empty, displays `data-testid="bag-empty"` with guidance copy ("Your bag is empty. Defeat monsters or visit the Forge to obtain gear.").
6. **Accessibility & Keyboard Navigation**:
   - Full keyboard navigation across the 8-column grid (`ArrowRight` +1, `ArrowLeft` -1, `ArrowDown` +8, `ArrowUp` -8) with edge wrapping, Tab navigation, and Enter/Space selection.
   - High-contrast visible focus rings (`outline: 2px solid var(--accent)`) on all interactive buttons and slots.
   - Rarity is distinguishable without color through explicit text pills.
   - `prefers-reduced-motion: reduce` removes transitions and hover animations.
7. **Desktop Viewport Guarantees**:
   - Validated at 1280x720 and 1600x900 viewports with zero document scroll (`documentScroll: false`), zero horizontal overflow, and zero element collisions.

---

## 2. Test Cases & Verification Matrix

| Test Case | Description | Status | Evidence |
|---|---|---|---|
| **T1** | Select item -> detail panel updates | **PASS** | Clicking any item slot in the grid updates `selectedId`, populating the right detail panel with item name, stats, actions, and compare block vs equipped. Verified in unit test `BagPanel.test.tsx` ("T1: Select item updates the right detail panel") and E2E `u4-character-bag.spec.ts`. |
| **T2** | Filters change the grid and keep the count | **PASS** | Selecting filter chips (`All`, `Weapons`, `Armor`, `Materials`, `Relics`) filters grid items while preserving total bag count in `data-testid="bag-count"`. Verified in unit test `BagPanel.test.tsx` ("T2: Filters change the grid and keep the count"). |
| **T3** | Equip, bulk equip, Forge and List buttons call the same handlers as before | **PASS** | Handlers `onEquip`, `onEquipBest`, `onForge`, `onList` are triggered with correct item IDs. Verified in unit test `BagPanel.test.tsx` ("T3: Equip, bulk equip, Forge and List buttons call handlers"). |
| **T4** | Empty bag shows the empty state | **PASS** | An empty bag correctly renders `[data-testid="bag-empty"]` with empty message and forge hint. Verified in unit test `BagPanel.test.tsx` ("T4: Empty bag shows the empty state"). |
| **T5** | Rarity visible without colour (pill text) | **PASS** | Every item header and detail card renders `.rarity-pill` containing visible text (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`) with 1px border and distinct background. Verified in unit test `BagPanel.test.tsx` ("T5: Rarity visible without colour (pill text)"). |
| **T6** | Keyboard: arrow/Tab through slots, Enter selects, focus ring visible | **PASS** | 2D roving arrow key navigation across 8 columns with wrapping; Tab through toolbar and controls; Enter/Space selects items; 2px solid accent focus rings. Verified in `BagPanel.test.tsx` ("T6: Keyboard navigation: arrow keys and Enter") and `bag.css`. |
| **T7** | Both sizes clean (ui-audit, effects-test) | **PASS** | `node tools/ui-audit.mjs ../../reports/redesign/AGR2/audit bossReadyStrong` reported `document-scroll=[]`, `horizontal-overflow=[]`, `element-overlap=[]`, `missing=[]`, `console-errors=[]` across 1280x720 and 1600x900. `node tools/effects-test.mjs` passed `9 checks, 0 FAIL`. |
| **T8** | Existing art unchanged | **PASS** | Reused existing `ItemIcon` and `ItemPixelIcon`. `git diff --name-status origin/main...HEAD -- apps/web/src/art` confirmed 0 deleted, renamed, or modified art files. |

---

## 3. Tooling and Test Results

### Tooling Version
- **pnpm version**: `10.28.0` (`corepack prepare pnpm@10.28.0 --activate`)
- **Node.js**: `v24.22.2`

### Verification Summary
```text
CI=true pnpm install --frozen-lockfile   # Exit 0, lockfile up to date
pnpm gen:deno && git diff --exit-code -- supabase/functions # Exit 0, 18 Edge Function import maps clean
pnpm typecheck                          # Exit 0, all 6 workspace packages pass
pnpm lint                               # Exit 0, all 6 workspace packages pass
pnpm test                               # Exit 0, 110 passed (1292 tests)
pnpm build                              # Exit 0, built in 367ms
VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build # Exit 0, classic build intact
pnpm playwright test --project=classic  # Exit 0, 38 passed
node tools/ui-audit.mjs ../../reports/redesign/AGR2/audit bossReadyStrong # Exit 0, 18 screens audited, 0 findings
node tools/effects-test.mjs ../../reports/redesign/AGR2/effects # Exit 0, 9 checks, 0 FAIL
```

### Detailed Unit Test Results (`apps/web/src/layout/bag/BagPanel.test.tsx`)
```text
 ✓ src/layout/bag/BagPanel.test.tsx (21 tests) 203ms
   ✓ BagPanel: rendering and selection (5)
     ✓ renders the bag title and count
     ✓ renders item cards
     ✓ selects an item on click
     ✓ sorts by level descending
     ✓ sorts by slot alphabetically
   ✓ BagPanel: Equip action (3)
     ✓ calls onEquip when Equip clicked
     ✓ shows block reason when equip is blocked
     ✓ equips when item matches slot
   ✓ BagPanel: Equip best (3)
     ✓ calls onEquipBest when clicked
     ✓ is disabled when nothing in the bag is better
     ✓ displays upgrade count badge
   ✓ BagPanel: keyboard navigation (1)
     ✓ focuses interactive controls
   ✓ BagPanel: empty state (1)
     ✓ renders empty state when bag has no items
   ✓ Mission AGR2 Acceptance Criteria (8)
     ✓ T1: Select item updates the right detail panel
     ✓ T2: Filters change the grid and keep the count
     ✓ T3: Equip, bulk equip, Forge and List buttons call handlers
     ✓ T4: Empty bag shows the empty state
     ✓ T5: Rarity visible without colour (pill text)
     ✓ T6: Keyboard navigation: arrow keys and Enter
     ✓ T7: 8-column grid slots with empty slots up to capacity
     ✓ T8: Detail comparison block renders delta stats against equipped gear
```

---

## 4. Problems Found and Fixed

1. **Equip Best Notice on Empty Bag**:
   - *Problem*: `BagPanel: Equip best > is disabled when nothing in the bag is better` test failed looking for `[data-testid="block-reason-equip-best"]`.
   - *Root Cause*: The component guarded rendering `block-reason-equip-best` behind `bag.length > 0`, but empty bags also have 0 upgrades and expect the explanatory note.
   - *Fix*: Removed `bag.length > 0` condition, displaying the notice whenever `upgrades.length === 0`.

2. **Keyboard Focus Assertion Alignment**:
   - *Problem*: Legacy keyboard test asserted `focusable[0]` was the sort dropdown, which changed with the addition of filter chips.
   - *Root Cause*: Adding filter chips before the sort combobox changed the first focusable control in the toolbar.
   - *Fix*: Updated test to assert focus traversal through toolbar controls (filter chips, sort combobox, bulk equip button) into item cards and detail panel actions.

3. **Comparison Subtitle Collision**:
   - *Problem*: Unit test searching for `/Lv 7/` matched multiple elements (`.detail-meta` and `.compare-sub`).
   - *Root Cause*: Both the detail header and the comparison card subtitle displayed the item's level.
   - *Fix*: Updated test query to use `getAllByText(/Lv 7/)`.

---

## 5. Scope & Tier Classification

### Tier 1 (Zone Changes)
- [apps/web/src/layout/bag/BagPanel.tsx](file:///Users/bao/taskbar-hero/apps/web/src/layout/bag/BagPanel.tsx): Redesigned Bag screen with 8-column grid, visible empty slots, filter chips, right detail sidebar, comparison block, and roving keyboard navigation.
- [apps/web/src/layout/bag/bag.css](file:///Users/bao/taskbar-hero/apps/web/src/layout/bag/bag.css): Desktop styling for the redesigned Bag layout, 8-column slot grid, empty slot tiles, detail sidebar, comparison blocks, rarity border/text pills, focus outlines, and reduced motion.
- [apps/web/src/layout/bag/BagPanel.test.tsx](file:///Users/bao/taskbar-hero/apps/web/src/layout/bag/BagPanel.test.tsx): Expanded unit tests covering T1–T8 acceptance criteria (21 tests total).
- [apps/web/src/layout/itemView.ts](file:///Users/bao/taskbar-hero/apps/web/src/layout/itemView.ts): Exported `rarityColor(rarity)` helper for consistent CSS custom property resolution.

### Tier 2 Changes
- [apps/web/src/layout/StageLayout.tsx](file:///Users/bao/taskbar-hero/apps/web/src/layout/StageLayout.tsx): Passed `onForge={() => setActiveTab('forge')}`, `onList={() => setActiveTab('market')}`, and `onNavigate={setActiveTab}` props to `<BagPanel />` so detail panel action buttons navigate to respective tabs seamlessly.

### Tier 3 Hard Stops (Intact)
- No changes to `contracts/`, `supabase/migrations/`, `auth/` / SIWE, packages/game-rules economy/numbers, dependencies in `package.json`, or `.github/`.
- Classic build and tests remain fully functional.

---

## 6. Visual Evidence (Screenshots)

Screenshots captured at 1280x720 and 1600x900 viewports are stored under `reports/redesign/AGR2/`:

- **Bag Selected (1280x720)**: `reports/redesign/AGR2/bag-selected-1280x720.png`  
  Shows the 8-column slot grid, selected rare dagger, right detail panel with item icon, rarity pill, stats, action buttons (`Equip`, `Forge`, `List`, `Lock`), and compare block against equipped weapon.
- **Bag Selected (1600x900)**: `reports/redesign/AGR2/bag-selected-1600x900.png`  
  Shows clean desktop layout at 1600x900 with zero scroll and proportional spacing.
- **Empty Bag State (1280x720)**: `reports/redesign/AGR2/bag-empty-1280x720.png`  
  Shows the empty state card (`data-testid="bag-empty"`) with helpful copy.
- **Filtered State (Weapons)**: `reports/redesign/AGR2/bag-filtered-weapons-1280x720.png`  
  Shows the `Weapons` filter chip active, filtering the grid while maintaining the total bag count in the header.
- **Automated Audit Screenshots**: Full audit output in `reports/redesign/AGR2/audit/` (`findings.json` confirms 0 findings).

---

## 7. What is NOT Verified

1. **Live Blockchain Signing**: Relic NFT minting and on-chain contract interactions on Avalanche Fuji testnet are not verified live; tested via existing mocks and loopback harnesses.
2. **Live Database Mutations**: Supabase production DB is untouched; verified with local fixture state and PGlite/mock harnesses.
3. **Mobile Viewport Optimization**: Explicitly scoped out per mission instructions ("DESKTOP ONLY: design and test at 1280x720 and 1600x900. No mobile work now"). Existing responsive styles were preserved.
