# V17b Specific Item Icons Wiring Report

## 1. Gate Check

- **Repository**: `ntbaoheyhey/taskbar-hero` (private)
- **Branch**: `ai/antigravity-v17b-icons-wiring` (branched from latest `origin/main` at commit `31689de289b578290a63a613b43f4b6ab19ba736`)
- **Git User Config**:
  - `git config user.name`: `ntbaoheyhey`
  - `git config user.email`: `108352255+ntbaoheyhey@users.noreply.github.com`
- **Gate Check Result**:
  - `git fetch origin +main:refs/remotes/origin/main` completed.
  - Checked `apps/web/src/art/itemIcons.tsx` on `origin/main`:
    ```text
    100644 blob c350d3fbcf4c54461df5ca109cb392662ca98916	apps/web/src/art/itemIcons.tsx
    ```
  - Gate passed: `apps/web/src/art/itemIcons.tsx` exists on `origin/main` (card A11 "V25c item icons", branch `ai/antigravity-v25c-item-icons`, merged).

---

## 2. Overview of Changes

Wired the specific pixel-art item icons (A11) into the Bag and Character panels for armor sets and accessories, while preserving weapon-type icons for weapons and empty frames for empty/locked slots.

1. **`apps/web/src/layout/itemView.ts`**:
   - Added `itemArtOf(item: Pick<ItemV2, 'itemKey' | 'slot' | 'weaponType'>): { kind: 'item'; key: ItemIconKey } | { kind: 'icon'; name: V2IconName }`.
   - Returns `{ kind: 'item', key }` when `itemIconKey(item.itemKey)` is non-null (armor sets and accessories).
   - Falls back to `{ kind: 'icon', name: itemIconName(item) }` when `itemIconKey` is null (weapons and unknown items).
   - Preserved `itemIconName` completely unchanged.

2. **`apps/web/src/layout/ItemIcon.tsx` (new)**:
   - Exported `ItemIcon({ item, size = 3, title }: ItemIconProps): JSX.Element | null`.
   - Calls `itemArtOf(item)` and renders `ItemPixelIcon` for `{ kind: 'item' }` or `V2PixelIcon` for `{ kind: 'icon' }`.

3. **`apps/web/src/layout/ItemIcon.test.tsx` (new)**:
   - Verified that armor item `arm.ranger.armor.rare` renders `data-icon="arm.ranger.armor"`.
   - Verified that accessory `acc.charm.star.epic` renders `data-icon="acc.star"`.
   - Verified that weapon `wpn.sword.twig` renders `data-icon="sword"`.
   - Verified props forwarding (`size`, `title`, accessibility attributes) and fallback behavior.

4. **`apps/web/src/layout/bag/BagPanel.tsx` & `BagPanel.test.tsx`**:
   - Replaced `<V2PixelIcon name={itemIconName(item)} size={2} />` with `<ItemIcon item={item} size={2} />` in both bag item grid cards and `ItemDetail`.
   - Added tests verifying that helmet items in the bag and when inspected in detail render their specific set icon (`arm.moon.helmet`, `arm.cozy.helmet`).

5. **`apps/web/src/layout/character/CharacterPanel.tsx` & `CharacterPanel.test.tsx`**:
   - Updated `SlotArt` to render equipped gear using `<ItemIcon item={item} size={2} />`.
   - Empty-slot frames (`EMPTY_FRAME[slot.id]`) and locked-slot frames (`LOCKED_FRAME`) stay as they are.
   - Added test verifying that an equipped helmet renders its set icon (`arm.cozy.helmet`).

---

## 3. Files Created or Edited

- `apps/web/src/layout/itemView.ts` (added `itemArtOf`, kept `itemIconName` unchanged)
- `apps/web/src/layout/ItemIcon.tsx` (new component)
- `apps/web/src/layout/ItemIcon.test.tsx` (new unit tests)
- `apps/web/src/layout/bag/BagPanel.tsx` (wired `ItemIcon` for bag items and detail)
- `apps/web/src/layout/bag/BagPanel.test.tsx` (added helmet icon test)
- `apps/web/src/layout/character/CharacterPanel.tsx` (wired `ItemIcon` for equipped items)
- `apps/web/src/layout/character/CharacterPanel.test.tsx` (added equipped helmet icon test)
- `reports/v17b-icons-wiring.md` (this report)
- `reports/v17b-icons-wiring/*.png` (screenshots)

No other files were modified. In particular, no v1 game files were modified.

---

## 4. Test Assertions Changed

- **Existing test assertions**: None changed. No existing tests in `BagPanel.test.tsx`, `CharacterPanel.test.tsx`, or `character-bag.spec.ts` pinned the old generic icon names (`slotHelmet`, `slotArmor`, etc.).
- **New test assertions added**:
  - `ItemIcon.test.tsx`:
    - `arm.ranger.armor.rare` -> renders `data-icon="arm.ranger.armor"`.
    - `acc.charm.star.epic` -> renders `data-icon="acc.star"`.
    - `wpn.sword.twig` -> renders `data-icon="sword"`.
  - `CharacterPanel.test.tsx`:
    - Equipped helmet (`arm.cozy.helmet.uncommon`) -> renders `data-icon="arm.cozy.helmet"`.
  - `BagPanel.test.tsx`:
    - Helmet in bag (`arm.moon.helmet.epic`) -> renders `data-icon="arm.moon.helmet"`.
    - Equipped helmet unequipped into bag (`arm.cozy.helmet.uncommon`) -> renders `data-icon="arm.cozy.helmet"`.

---

## 5. Visual Showcase & Screenshots

Screenshots captured from the `VITE_GAME_V2=1` preview build running at 390 px and 1280 px:

### Mobile Viewport (390 px)

#### Character Panel (Equipped Gear Icons)
Equipped Cozy Helmet shows the knit beanie icon, Cozy Armor shows the sweater, Ranger Gloves show the archer gloves, Cozy Boots show the fuzzy booties, Studded Collar shows the studded collar icon, Fishhook Earring shows the fishhook icon:

![Character Panel Mobile 390px](reports/v17b-icons-wiring/character-390px.png)

#### Bag Panel (Inventory Grid & Item Detail Compare)
Bag cards display specific armor pieces and accessories (e.g. Starforged Moon Helm, Bell Collar, Feather Earring, Paw Ring, Catnip Charm), while weapons display their weapon-type icons:

![Bag Panel Mobile 390px](reports/v17b-icons-wiring/bag-390px.png)

---

### Desktop Viewport (1280 px)

#### Full Stage Layout with Character Panel & Bag Panel
Side-by-side view of character equipment slots and bag inventory cards:

![Desktop Layout 1280px](reports/v17b-icons-wiring/desktop-1280px.png)

#### Character Panel (Desktop Detail)
![Character Panel Desktop 1280px](reports/v17b-icons-wiring/character-1280px.png)

#### Bag Panel (Desktop Detail)
![Bag Panel Desktop 1280px](reports/v17b-icons-wiring/bag-1280px.png)

---

## 6. Commands and Outputs

### Command 1: `pnpm install --frozen-lockfile`
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 396ms using pnpm v10.28.0
```

### Command 2: `pnpm --filter @taskbar-hero/web test -- layout`
```text
> @taskbar-hero/web@0.0.0 test /Users/bao/taskbar-hero/apps/web
> vitest run -- layout

 RUN  v5.0.5 /Users/bao/taskbar-hero/apps/web

 ✓ src/onboarding/HowToPlay.test.tsx (14 tests) 419ms
 ✓ src/layout/character/CharacterPanel.test.tsx (6 tests) 443ms
 ✓ src/layout/forge/ForgePanel.test.tsx (21 tests) 468ms
 ✓ src/layout/classpicker/ClassPicker.test.tsx (6 tests) 491ms
 ✓ src/map/ChapterMap.test.tsx (7 tests) 565ms
 ✓ src/forge/ForgeTab.test.tsx (18 tests) 603ms
 ✓ src/boss/BossTab.test.tsx (10 tests) 741ms
 ✓ src/layout/StageLayout.test.tsx (5 tests) 564ms
 ✓ src/App.test.tsx (3 tests) 605ms
 ✓ src/inventory/InventoryTab.test.tsx (12 tests) 678ms
 ✓ src/layout/bag/BagPanel.test.tsx (14 tests) 735ms
 ✓ src/game/rig/rig.test.ts (12 tests) 314ms
 ✓ src/game/errorStates.test.tsx (11 tests) 285ms
 ✓ src/market/MarketTab.test.tsx (17 tests) 304ms
 ✓ src/art/v2Icons.test.tsx (7 tests) 33ms
 ✓ src/layout/ItemIcon.test.tsx (9 tests) 32ms
 ...
 Test Files  62 passed (62)
      Tests  729 passed (729)
   Start at  10:32:31
   Duration  5.27s (environment 60%, tests 25%, import 13%, transform 2%, worker 1%)
```

### Command 3: `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
Git diff exited 0 with no changes in `supabase/functions`.

### Command 4: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
```text
> taskbar-hero@0.0.0 typecheck /Users/bao/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
└─ Done in 690ms
└─ Done in 1.1s
└─ Done in 1.2s
└─ Done in 1.7s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 461ms
apps/web typecheck$ tsc --noEmit
└─ Done in 3.7s

> taskbar-hero@0.0.0 lint /Users/bao/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
└─ Done in 379ms
└─ Done in 796ms
└─ Done in 873ms
└─ Done in 1.3s
packages/api-contract lint$ tsc --noEmit
└─ Done in 460ms
apps/web lint$ tsc --noEmit
└─ Done in 3.1s

> taskbar-hero@0.0.0 test /Users/bao/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth: 2 test files, 7 passed (7)
packages/chain: 2 test files, 18 passed (18)
packages/game-rules: 13 test files, 265 passed | 2 expected fail (267)
supabase/tests: 1 test file, 37 passed (37)
packages/api-contract: 2 test files, 7 passed (7)
apps/web: 62 test files, 729 passed (729)

All 6 projects passed!

> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
└─ Done in 345ms
└─ Done in 749ms
└─ Done in 768ms
└─ Done in 1.2s
packages/api-contract build$ tsc --noEmit
└─ Done in 416ms
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
✓ built in 315ms
└─ Done in 3.8s
```

### Command 5: `cd apps/web && pnpm exec playwright test --project stage-layout`
```text
Running 21 tests using 2 workers

  ✓   1 …er panel and bag are visible without horizontal scroll at 320px (631ms)
  ✓   2 …] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 320px (1.5s)
  ✓   3 …pdates the slot name and locked slots show their level at 320px (719ms)
  ✓   4 …er panel and bag are visible without horizontal scroll at 390px (448ms)
  ✓   5 …layout.spec.ts:58:5 › stage layout at 320px with reduced motion (383ms)
  ✓   6 …pdates the slot name and locked slots show their level at 390px (670ms)
  ✓   7 … › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 390px (400ms)
  ✓   8 …layout.spec.ts:58:5 › stage layout at 390px with reduced motion (366ms)
  ✓   9 …r panel and bag are visible without horizontal scroll at 1280px (340ms)
  ✓  10 …› e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 1280px (373ms)
  ✓  11 …dates the slot name and locked slots show their level at 1280px (521ms)
  ✓  12 …ayout.spec.ts:58:5 › stage layout at 1280px with reduced motion (378ms)
  ✓  13 …oss, Forge, Market and Help; every tab is reachable by keyboard (669ms)
  ✓  14 ….ts:132:3 › desktop tabs › arrow keys move focus along the tabs (446ms)
  ✓  15 …top tabs › buttons and links have accessible names on every tab (955ms)
  ✓  16 … › desktop tabs › the next-step chip opens the tab it points to (392ms)
  ✓  17 …e bottom nav, covers at most 60% of the screen and closes again (706ms)
  ✓  18 …3 › phone bottom sheet › every nav tab is reachable by keyboard (475ms)
  ✓  19 …:210:3 › phone bottom sheet › the sheet does not hide the stage (417ms)
  ✓  20 …es to the classic 96 px strip, is remembered, and switches back (569ms)
  ✓  21 …yout.spec.ts:244:3 › Mini mode › works when localStorage throws (412ms)

  21 passed (11.9s)
```

---

## 7. Anything Unsure

- **Author verification**: Git commit author verified as `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
- **Scope restriction**: Verified that only files listed in the task description were created/modified.
- **Weapon icon handling**: Verified that weapons keep their weapon-type icon (`wpn.*` returns `null` from `itemIconKey` and falls back to `itemIconName`).
- **Empty slot frames**: Verified that empty equipment slots continue rendering `EMPTY_FRAME[slot.id]` and locked slots render `LOCKED_FRAME` without any unexpected icons inside.
