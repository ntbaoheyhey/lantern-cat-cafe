# V20 Forge UI Implementation Report

## Summary

This report documents the implementation and verification of **Task V20: Forge UI** (`ForgePanel`), a props-driven equipment crafting, salvage, and daily Relic management panel for **Cat RPG v2** (`apps/web/src/layout/forge/ForgePanel.tsx`, `ForgePanel.css`, and `ForgePanel.test.tsx`).

The component provides three tabs:
1. **Craft**: Allows players to pick an equipment slot (5 main slots: Weapon, Helmet, Armor, Gloves, Boots) and a target gear rarity (`common` through `legendary`). The weapon slot dynamically resolves to the cat's active class weapon profile (`sword`, `hammer`, `daggers`, `spear`, `bow`, `staff`, or `flasks`). Recipe costs and user balances are clearly presented with pixel icons (e.g. `"Fluff Tuft 3 / 8"`). When materials are insufficient, the craft button is disabled with the exact shortage determined by `v2.craftBlock` (e.g. `"Needs 5 more Fluff Tuft"`).
2. **Salvage**: Lists owned equipment instances. Unequipped and unlocked items are selectable individually or via "Select All Eligible", displaying a live breakdown of recovered crafting materials (`v2.salvage()`). Equipped items and locked items are disabled with plain-text status tags (`"Equipped"`, `"Locked"`) and excluded from salvage actions.
3. **Relic**: Manages daily on-chain Relic forging with the v2 recipe cost of **30 Yarn + 1 Moon Pearl**. Evaluates blocked states in plain words (`"Daily limit reached: you already forged today's Relic. Come back tomorrow."`, `"Not enough Yarn (needs 30 Yarn, you have X)."`, and `"No Moon Pearl (needs 1 Moon Pearl, you have X)."`). Handles the existing pending voucher state (`forge.pending`) with relic art, rarity badge, and mint readiness.
4. **In-Page Confirmation**: Every spending action (Craft, Salvage, Relic) requires an inline confirmation step inside the page before invoking any parent callback (`onCraft`, `onSalvage`, `onRelic`). Canceling resets the state without spending.
5. **Responsive & Accessible**: Pixel-perfect presentation supporting dark theme and light theme, seamless responsiveness from 320 px to 1280 px with zero horizontal scrolling, visible focus indicators, semantic ARIA tab patterns, and screen reader friendliness.

---

## Files Created & Modified

Strictly adhering to the allowed file list:
- `apps/web/src/layout/forge/ForgePanel.tsx` (new)
- `apps/web/src/layout/forge/ForgePanel.css` (new)
- `apps/web/src/layout/forge/ForgePanel.test.tsx` (new)
- `reports/v20-forge.md` (this report)
- `reports/v20-forge/*.png` (15 visual evidence screenshots)

---

## Verification & Commands Run

### 1. Unit Tests (`ForgePanel.test.tsx`)
```bash
$ pnpm --filter @taskbar-hero/web exec vitest run src/layout/forge/ForgePanel.test.tsx

 RUN  v5.0.5 /Users/bao/taskbar-hero/apps/web

 ✓ src/layout/forge/ForgePanel.test.tsx (21 tests) 232ms
   ✓ ForgePanel (21)
     ✓ Craft Tab: disabled reasons for each missing material (6)
       ✓ shows exact missing amount for Yarn (rcp.common needs 10 Yarn) 39ms
       ✓ shows exact missing amount for Fluff Tuft (rcp.common needs 4 Fluff Tuft) 7ms
       ✓ shows exact missing amount for Fish (rcp.common needs 50 Fish) 6ms
       ✓ shows exact missing amount for Shiny Button on Uncommon recipe (needs 1) 16ms
       ✓ shows exact missing amount for Catnip Crystal on Epic recipe (needs 3) 7ms
       ✓ shows exact missing amount for Starlight Scale on Legendary recipe (needs 2) 7ms
     ✓ Craft Tab: slot selection and onCraft called with right ids (4)
       ✓ calls onCraft with right recipeId and slot after confirmation 10ms
       ✓ updates weapon type based on classWeaponType prop 4ms
       ✓ switches slot to boots and rarity to rare and calls onCraft with right ids 12ms
       ✓ resets craft confirmation if slot or rarity is changed 17ms
     ✓ Salvage Tab: excludes equipped and locked items (3)
       ✓ disables equipped and locked items with plain reason and excludes from selection 15ms
       ✓ toggles individual items and deselect all button clears selection 16ms
       ✓ shows empty message when no items are present 9ms
     ✓ Relic Tab: blocked reasons in plain words and pending voucher (5)
       ✓ shows daily limit blocked reason 7ms
       ✓ shows not enough yarn blocked reason 5ms
       ✓ shows no moon pearl blocked reason 8ms
       ✓ shows today relic card when today is present and not pending 8ms
       ✓ shows pending voucher state when unminted voucher exists 7ms
     ✓ Confirm step required before any callback (3)
       ✓ Craft tab requires confirm step; cancel does not invoke callback 7ms
       ✓ Salvage tab requires confirm step; cancel does not invoke callback 12ms
       ✓ Relic tab requires confirm step; cancel does not invoke callback 8ms

 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  20:42:51
   Duration  896ms (environment 47%, tests 33%, import 10%, transform 9%)
```

### 2. Workspace Lint
```bash
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
└─ Done in 5.6s
```

### 3. Full Workspace Test Suite
```bash
$ pnpm test

> taskbar-hero@0.0.0 test /Users/bao/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/api-contract test$ vitest run
apps/web test$ vitest run

 Test Files  35 passed (35)
      Tests  393 passed (393)
   Duration  5.27s
```

### 4. Workspace Build
```bash
$ pnpm build

> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/api-contract build$ tsc --noEmit
apps/web build$ tsc --noEmit && vite build
✓ 1691 modules transformed.
dist/index.html                               2.05 kB
dist/assets/index-djZZZ0we.css               34.77 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB
dist/assets/index-C3CDpvmL.js                97.97 kB
dist/assets/react-KPuNr9iS.js               218.74 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB
✓ built in 325ms
```

### 5. Deno Drift Check
```bash
$ pnpm gen:deno

> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
No leftover diff.

---

## Visual Evidence & Screenshots

All 15 screenshots were generated and saved to `reports/v20-forge/`:

| File | Resolution / Mode | Description |
| :--- | :--- | :--- |
| `01-craft-1280px-dark.png` | 1280 × 720 (Dark) | Desktop Craft tab: slot selector (Bow weapon), rarity selector, recipe costs, balance ratios, Craft button |
| `02-craft-320px-dark.png` | 320 × 950 (Dark) | Mobile 320px Craft tab: single-column responsive layout without horizontal scroll |
| `03-craft-missing-materials.png` | 1280 × 720 (Dark) | Disabled Craft state: exact shortage notice (`"Needs 1 more Fluff Tuft"`) |
| `04-craft-confirm.png` | 1280 × 720 (Dark) | In-page confirmation box: `"Confirm crafting Rare Weapon (Sword)?"` with Confirm and Cancel buttons |
| `05-salvage-1280px-dark.png` | 1280 × 720 (Dark) | Desktop Salvage tab: equipped/locked disabled badges, selected items, projected material yield |
| `06-salvage-320px-dark.png` | 320 × 800 (Dark) | Mobile 320px Salvage tab: responsive item rows, checkboxes, and yield toolbar |
| `07-salvage-confirm.png` | 1280 × 720 (Dark) | In-page confirmation box: permanent dismantling prompt with exact return summary |
| `08-relic-1280px-dark.png` | 1280 × 720 (Dark) | Desktop Relic tab: 30 Yarn + 1 Moon Pearl cost, odds table, enabled Forge Relic button |
| `09-relic-320px-dark.png` | 320 × 800 (Dark) | Mobile 320px Relic tab: compact responsive layout |
| `10-relic-blocked-daily.png` | 1280 × 720 (Dark) | Blocked reason: daily limit reached notice and disabled button |
| `11-relic-blocked-yarn.png` | 1280 × 720 (Dark) | Blocked reason: `"Not enough Yarn (needs 30 Yarn, you have 14)."` |
| `12-relic-blocked-pearl.png` | 1280 × 720 (Dark) | Blocked reason: `"No Moon Pearl (needs 1 Moon Pearl, you have 0)."` |
| `13-relic-pending-voucher.png` | 1280 × 720 (Dark) | Pending voucher state: unminted Relic card with image, rarity tag, and wallet mint note |
| `14-craft-1280px-light.png` | 1280 × 720 (Light) | Desktop Craft tab in light mode (`data-theme="light"`) |
| `15-relic-1280px-light.png` | 1280 × 720 (Light) | Desktop Relic tab in light mode (`data-theme="light"`) |

---

## Design Decisions & Implementation Highlights

1. **Strict Content Registry Compliance**:
   - Costs, rarities, slots, and salvage yields are computed entirely from `packages/game-rules` v2 data structures (`v2.RECIPES`, `v2.SALVAGE`, `v2.RELIC_RECIPE`, `v2.MATERIALS`, `v2.GEAR_RARITIES`, `v2.GEAR_SLOTS`) without hard-coded numbers.
   - `v2.craftBlock` determines craft eligibility and orders missing material checks.
2. **In-Page Confirmations**:
   - Adhering to the prompt constraint, native `window.confirm` dialogs are never used. Every destructive or spending action presents a dedicated in-page prompt with explicit Confirm and Cancel buttons.
3. **A11y and Screen Readers**:
   - Uses semantic HTML with `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, and `aria-labelledby`.
   - Disabled states use both `disabled` and `aria-disabled="true"`.
   - Dynamic alerts use `role="alert"` and `aria-live="polite"`.
4. **Strict Scope Control**:
   - Zero modifications to v1 components (`apps/web/src/forge/*` untouched).
   - Only created the explicitly permitted files.
