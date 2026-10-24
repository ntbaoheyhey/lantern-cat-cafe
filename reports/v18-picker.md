# Cat RPG v2 Class Picker Report (V18)

**Task**: V18 Class Picker (Props-driven, not wired into the app yet)  
**Branch**: `ai/antigravity-v18-classpicker`  
**Date**: October 24, 2026  
**Author**: ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>

---

## 1. Summary of What Was Built

We created the prop-driven Cat RPG v2 Class Picker component (`ClassPicker`), complete with styles, comprehensive Vitest unit tests, and verified responsive screenshots at 320 px, 390 px, and 1280 px across dark and light themes.

### Component Architecture

- **Path**: `apps/web/src/layout/classpicker/ClassPicker.tsx`
- **Styles**: `apps/web/src/layout/classpicker/ClassPicker.css`
- **Tests**: `apps/web/src/layout/classpicker/ClassPicker.test.tsx`
- **Interface**:
  ```tsx
  export interface ClassPickerProps {
    /** The classes available to choose from. Defaults to v2.CLASSES. */
    classes?: readonly v2.ClassDef[];
    /** The currently selected class id, if any. */
    selected?: v2.ClassId | null;
    /** Whether changing class is locked (e.g. during a boss fight). */
    locked?: boolean;
    /** Callback fired with the chosen classId after confirmation. */
    onChoose?: (classId: v2.ClassId) => void;
  }
  ```

### The Seven Class Cards

Each card renders all seven required elements directly from content definitions:
1. **Weapon Icon**: Inline pixel-art SVG icon rendered via `V2PixelIcon` (`sword`, `hammer`, `daggers`, `spear`, `bow`, `staff`, `flasks`) with a dark pixel art border.
2. **Name**: Class name from registry (`Warrior`, `Guardian`, `Rogue`, `Hunter`, `Archer`, `Witch`, `Alchemist`).
3. **Role**: Capitalized range/role designation (`Melee`, `Reach`, `Ranged`) displayed as an uppercase role badge.
4. **Plain-Words Passive**: One-line plain-words explanation formatted dynamically via `formatClassPassive`:
   - **Warrior**: `"Cleave: every 3rd swing also hits the next monster for 50%"`
   - **Guardian**: `"Bonk: each hit delays target attack by 500 ms"`
   - **Rogue**: `"Twin Strike: strikes 2 times per attack"`
   - **Hunter**: `"Mark Prey: marks target (+20% damage taken) and +10% material find"`
   - **Archer**: `"Volley: every 5th shot fires 3 arrows for 50% extra damage"`
   - **Witch**: `"Burn: bolts splash 40% and burn for 30% damage over 3s"`
   - **Alchemist**: `"Poison: poisons for 50% damage over 4s and heals 3% max HP on kill"`
5. **Three Stat Leanings Bars**: Small bar tracks for HP, ATK, and DEF leanings (`c.stats`), visually proportioned with theme-coded fills (`--good` emerald for HP, `--accent` amber for ATK, `--shard` blue for DEF) and explicit multiplier labels (e.g. `1.3x`, `1.35x`, `0.3x`).
6. **Attack Speed**: Formatted attack interval in seconds (e.g., `1.00s`, `1.40s`, `0.80s`, `1.10s`, `0.90s`, `1.60s`, `1.30s`).
7. **Class Fur Swatch**: Stylized cat-fur swatch with cat-ear silhouette, displaying primary fur color (`look.fur.o`) and darker markings border/accent (`look.fur.d`) sourced from `CLASS_LOOKS` in `apps/web/src/game/rig/palettes.ts`.

### Interaction, Confirmation, and Locked State

- **Selection & Highlighting**: Clicking or keyboard-navigating to any card highlights it with theme gold borders (`--gold`), accent outline, and raised surface styling.
- **In-Page Confirmation**: Clicking the `Choose {ClassName}` button renders an in-page confirmation banner:
  > `"Switch to Rogue? You can switch back any time outside boss fights."`
  - Clicking **Cancel** closes the prompt without calling `onChoose`.
  - Clicking **Confirm** invokes `onChoose(classId)` and clears the confirmation state.
- **Locked State**: When `locked={true}` (e.g., during active boss fights):
  - A prominent status banner displays: `"Class switching is locked during a boss fight. You can switch back any time outside boss fights."`
  - All cards have `aria-disabled="true"` and are styled with opacity dimming and grayscale.
  - Clicking or keyboard actions do not change selection.
  - The Choose button is disabled (`aria-disabled="true"`).

### Accessibility & Semantics

- Radio group container has `role="radiogroup"` and `aria-label="Cat classes"`.
- Each card has `role="radio"`, `aria-checked`, `aria-disabled`, and full descriptive `aria-label`.
- Roving `tabIndex`: only the active/highlighted card has `tabIndex={0}`, others `-1`.
- Full arrow-key navigation (ArrowRight/ArrowDown to advance, ArrowLeft/ArrowUp to go back, Home/End to jump to ends, Space/Enter to select) with wrapping.
- Distinct focus-visible outlines (`:focus-visible`).

### Responsive & Theme Adaptability

- Strict adherence to 0 horizontal scroll (`scrollWidth <= clientWidth`) across 320 px, 390 px, and 1280 px viewports.
- Responsive grid adapts from single-column on mobile viewports to multi-column grid on desktop.
- Dual theme support: default dark theme using Cat Café Quest tokens, with light mode adaptation supporting both `@media (prefers-color-scheme: light)` and `[data-theme='light']`.

---

## 2. Test Suite

Unit tests in `apps/web/src/layout/classpicker/ClassPicker.test.tsx` cover all required criteria:
- **Seven cards from registry**: Verifies 7 radio cards, weapon icons, names, roles, speed, stat bars, and fur swatches.
- **Plain-words passives**: Verifies non-empty descriptive text for all 7 classes, including exact match for Cleave.
- **Confirmation flow**: Verifies `onChoose` is called only after user clicks "Confirm", and not called if "Cancel" is clicked.
- **Locked disables everything**: Verifies visible locked notice, disabled cards, disabled choose button, and rejection of clicks/keyboard moves.
- **Arrow keys move selection**: Verifies ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Home, End navigation with wrapping.
- **Enter & Space keys**: Verifies keyboard activation.

All 6 test cases pass.

---

## 3. Visual Verification & Screenshots

Screenshots captured using Playwright headless Chromium verifying zero horizontal scroll across all target viewports and themes:

| Scenario | Viewport | Theme | Screenshot File | Status |
| --- | --- | --- | --- | --- |
| Desktop Default | 1280 × 850 | Dark | `reports/v18-picker/classpicker-1280-dark.png` | Verified (No horizontal scroll) |
| Desktop Light | 1280 × 850 | Light | `reports/v18-picker/classpicker-1280-light.png` | Verified (No horizontal scroll) |
| Mobile Standard | 390 × 844 | Dark | `reports/v18-picker/classpicker-390-dark.png` | Verified (No horizontal scroll) |
| Mobile Standard Light | 390 × 844 | Light | `reports/v18-picker/classpicker-390-light.png` | Verified (No horizontal scroll) |
| Mobile Narrow | 320 × 800 | Dark | `reports/v18-picker/classpicker-320-dark.png` | Verified (No horizontal scroll) |
| Mobile Narrow Light | 320 × 800 | Light | `reports/v18-picker/classpicker-320-light.png` | Verified (No horizontal scroll) |
| Locked (Boss Fight) | 1280 × 850 | Dark | `reports/v18-picker/classpicker-locked-dark.png` | Verified (No horizontal scroll) |
| Confirmation Dialog | 1280 × 850 | Dark | `reports/v18-picker/classpicker-confirm-dark.png` | Verified (No horizontal scroll) |

---

## 4. Exact Commands Run and Pasted Outputs

### Git Setup
```bash
$ git config user.email && git config user.name
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

### Deno Generation Check
```bash
$ pnpm gen:deno && git status --porcelain
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v18
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
*(No drift or leftover changes)*

### Typecheck
```bash
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v18
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
Done in 4s
```

### Lint
```bash
$ pnpm lint
> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v18
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/api-contract lint$ tsc --noEmit
apps/web lint$ tsc --noEmit
Done in 3.1s
```

### Tests
```bash
$ pnpm test
> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-v18
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/api-contract test$ vitest run
apps/web test$ vitest run

Test Files  33 passed (33)
     Tests  364 passed (364)
```

Component test specific execution:
```bash
$ pnpm --filter @taskbar-hero/web test ClassPicker.test.tsx
 ✓ src/layout/classpicker/ClassPicker.test.tsx (6 tests) 250ms
   ✓ ClassPicker (6)
     ✓ renders seven cards from the registry 111ms
     ✓ passives text is non-empty for every class 10ms
     ✓ choosing calls onChoose only after confirm 41ms
     ✓ locked disables everything 17ms
     ✓ arrow keys move selection 41ms
     ✓ supports Enter and Space keys to select a card 29ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### Production Build
```bash
$ pnpm build
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v18
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/api-contract build$ tsc --noEmit
apps/web build$ tsc --noEmit && vite build
✓ 1691 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-djZZZ0we.css               34.77 kB │ gzip:   7.28 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/index-C3CDpvmL.js                97.97 kB │ gzip:  28.58 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 562ms
```

### Screenshot Verification Run
```bash
$ cd apps/web && node run-screenshots.mjs
Building preview bundle with Vite...
Bundle built successfully!
HTTP preview server running at http://127.0.0.1:50300/
OK: No horizontal scroll on classpicker-1280-dark (1280px). doc: 1280/1280
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-1280-dark.png
OK: No horizontal scroll on classpicker-1280-light (1280px). doc: 1280/1280
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-1280-light.png
OK: No horizontal scroll on classpicker-390-dark (390px). doc: 390/390
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-390-dark.png
OK: No horizontal scroll on classpicker-390-light (390px). doc: 390/390
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-390-light.png
OK: No horizontal scroll on classpicker-320-dark (320px). doc: 320/320
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-320-dark.png
OK: No horizontal scroll on classpicker-320-light (320px). doc: 320/320
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-320-light.png
OK: No horizontal scroll on classpicker-locked-dark (1280px). doc: 1280/1280
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-locked-dark.png
OK: No horizontal scroll on classpicker-confirm-dark (1280px). doc: 1280/1280
Saved screenshot: /tmp/taskbar-hero-v18/reports/v18-picker/classpicker-confirm-dark.png
All screenshots completed and verified successfully!
```

---

## 5. Files Touched

Only the authorized files were created:
- `apps/web/src/layout/classpicker/ClassPicker.tsx` (Component implementation)
- `apps/web/src/layout/classpicker/ClassPicker.css` (Styles, responsiveness, dark & light themes)
- `apps/web/src/layout/classpicker/ClassPicker.test.tsx` (Comprehensive unit test suite)
- `reports/v18-picker.md` (This report)
- `reports/v18-picker/*.png` (Visual screenshots)

No other files were created or modified.

---

## 6. Anything Unsure

- The component is deliberately prop-driven and standalone as specified in Task V18 ("props-driven, not wired into the app yet"). Wiring into `App.tsx` / `v2-choose-class` backend endpoint will occur in subsequent integration tasks.
- For class colors, `CLASS_LOOKS` provides the fur colors (`look.fur.o`, `look.fur.d`). We render an aesthetic feline ear-and-fur swatch rather than running Phaser texture baking frames, keeping DOM rendering fast and responsive.
