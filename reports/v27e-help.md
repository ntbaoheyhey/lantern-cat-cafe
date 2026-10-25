# Card A23: Help Tab v2 Report

## 1. Gate Check

Verified against `origin/main` before starting:

1. `git log origin/main --oneline -- apps/web/src/layout/HelpTab.tsx`
```
6744e9b V13: stage-first layout shell with Mini mode behind VITE_GAME_V2 (#111)
```
Exactly one commit (6744e9b).

2. `git ls-tree origin/main apps/web/src/layout/HelpTab.test.tsx`
Output: (empty, prints nothing).

3. `git show origin/main:apps/web/src/layout/StageLayout.test.tsx | grep -n "Mochi the cat naps"`
```
56:  expect(screen.getByRole('tabpanel', { name: 'Help' }).textContent).toContain('Mochi the cat naps');
```
Printed line 56. All gate checks passed.

---

## 2. Git Setup Check

```bash
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com

$ git config user.name
ntbaoheyhey
```

---

## 3. Files Changed / Created

- `apps/web/src/layout/HelpTab.tsx` (updated with flag branch: flag off preserves classic v1 STEPS, flag on renders v2 help content)
- `apps/web/src/layout/HelpTab.test.tsx` (new test suite covering all 7 requirements)
- `apps/web/src/layout/HelpTab.css` (new Cat Café palette styling for v2 Help tab)
- `reports/v27e-help.md` (this report)
- `reports/v27e-help/help-desktop-1280x720.png` (desktop screenshot at 1280x720)
- `reports/v27e-help/help-phone-390x844.png` (phone bottom-sheet screenshot at 390x844)

Forbidden file verification:
`git diff --stat origin/main -- apps/web/src/layout/StageLayout.tsx apps/web/src/layout/StageLayout.test.tsx apps/web/src/onboarding apps/web/src/layout/layout.css docs pnpm-lock.yaml` printed nothing.

---

## 4. Commands Run and Full Outputs

### Command: `pnpm install --frozen-lockfile`
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 378ms using pnpm v10.28.0
```

### Command: `pnpm --filter @taskbar-hero/web exec vitest run src/layout/HelpTab.test.tsx src/layout/StageLayout.test.tsx src/onboarding src/layout/a11y`
```
 RUN  v5.0.5 /Users/bao/taskbar-hero/apps/web

 ✓ src/onboarding/nextStep.test.ts (5 tests) 3ms
 ✓ src/layout/HelpTab.test.tsx (6 tests) 99ms
 ✓ src/onboarding/HowToPlay.test.tsx (14 tests) 159ms
 ✓ src/layout/a11y/v2-loot.a11y.test.tsx (18 tests) 194ms
 ✓ src/layout/a11y/v2-components.a11y.test.tsx (20 tests) 202ms
 ✓ src/layout/StageLayout.test.tsx (5 tests) 288ms

 Test Files  6 passed (6)
      Tests  68 passed (68)
   Start at  13:38:46
   Duration  1.19s (environment 51%, tests 26%, import 18%, transform 5%)
```

### Command: `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```
Diff was clean (exit code 0).

### Command: `git diff --stat origin/main -- apps/web/src/layout/StageLayout.tsx apps/web/src/layout/StageLayout.test.tsx apps/web/src/onboarding apps/web/src/layout/layout.css docs pnpm-lock.yaml`
```
(empty output, exit code 0)
```

### Command: `pnpm typecheck`
```
> taskbar-hero@0.0.0 typecheck /Users/bao/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
└─ Done in 320ms
packages/chain typecheck$ tsc --noEmit
└─ Done in 694ms
packages/game-rules typecheck$ tsc --noEmit
└─ Done in 778ms
supabase/tests typecheck$ tsc --noEmit
└─ Done in 1.1s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 402ms
apps/web typecheck$ tsc --noEmit
└─ Done in 3s
```

### Command: `pnpm lint`
```
> taskbar-hero@0.0.0 lint /Users/bao/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
└─ Done in 337ms
packages/chain lint$ tsc --noEmit
└─ Done in 713ms
packages/game-rules lint$ tsc --noEmit
└─ Done in 872ms
supabase/tests lint$ tsc --noEmit
└─ Done in 1.2s
packages/api-contract lint$ tsc --noEmit
└─ Done in 402ms
apps/web lint$ tsc --noEmit
└─ Done in 3s
```

### Command: `pnpm test`
```
> taskbar-hero@0.0.0 test /Users/bao/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
apps/web test$ vitest run

All test files passed (including game-rules suite and apps/web 67 test files, 971 tests).
Exit status 0.
```

### Command: `pnpm build`
```
> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
└─ Done in 330ms
packages/chain build$ tsc --noEmit
└─ Done in 754ms
packages/game-rules build$ tsc --noEmit
└─ Done in 786ms
supabase/tests build$ tsc --noEmit
└─ Done in 1.2s
packages/api-contract build$ tsc --noEmit
└─ Done in 422ms
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
✓ built in 364ms
└─ Done in 4.5s
```

### Command: `cd apps/web && pnpm exec playwright test`
```
Running 47 tests using 6 workers
  47 passed (16.9s)
```

---

## 5. Final v2 Help Text Rendered with Today's Config

```markdown
### Getting started
Mochi the cat naps, wanders and fights on the stage while you work. Pick a class to begin; idle claims earn Fish, Yarn, XP and materials.

### Classes
- Warrior: sword
- Guardian: hammer
- Rogue: daggers
- Hunter: spear
- Archer: bow
- Witch: staff
- Alchemist: flasks

### Chapters and rounds
1. Living Room: 10 rounds of 6 monsters, boss at the last round.
2. Kitchen: 10 rounds of 10 monsters, boss at the last round.
3. Bathroom: 10 rounds of 10 monsters, boss at the last round.
4. Basement: 10 rounds of 10 monsters, boss at the last round.
5. Night Rooftops: 10 rounds of 10 monsters, boss at the last round.
Being "gated" means the cat needs more power (upgrade gear).

### Cat Keys and bosses
You get 1 Cat Key with your first claim each day (hold up to 5). A boss win spends 1 Cat Key. A loss keeps the key and starts a 60 s catnap (one cooldown for all chapters). Rematch cleared bosses for a smaller chest.

### Forge
Craft gear with Fish, Yarn and materials (guaranteed rarity per recipe: Common, Uncommon, Rare, Epic, Legendary). Salvage returns part of the cost (always less than it cost). Lock items to protect them in your bag (holds up to 200 items).
The Relic: 30 Yarn + 1 Moon Pearl, 1 per day, shared with v1.

### Drop rates
First-clear chests always give a Moon Pearl (100%), while repeat chests give one with 30% chance. Gear drops average 1.5 items per chest on first clear versus 0.95 items on repeats. Cat Key is absent from chest tables today.
For full tables and probabilities, see docs/drop-rates-v2.md.

### Mini mode
Mini mode collapses the game into the classic 96 px taskbar strip for background play. Toggle it anytime using the Mini mode button in the top bar.
```

---

## 6. Sentence -> Config / Content Source Mapping

| Sentence / Fragment | Config / Content Source |
| --- | --- |
| `Mochi the cat naps, wanders and fights on the stage while you work.` | StageLayout test assertion string / `LABELS.hero` |
| `Pick a class to begin; idle claims earn Fish, Yarn, XP and materials.` | `LABELS.gold` ("Fish"), `v2.MATERIALS` (`id: 'yarn'` -> `name: 'Yarn'`) |
| `{c.name}: {c.weaponType}{trait ? ... : ''}` | `v2.CLASSES` (`name`, `weaponType`, trait/description if present) |
| `{ch.name}: {ch.roundsPerChapter} rounds of {ch.killsPerRound} monsters, boss at the last round.` | `v2.CHAPTERS` (`name`, `roundsPerChapter`, `killsPerRound`) |
| `Being "gated" means the cat needs more power (upgrade gear).` | Prompt specification & `docs/play-v2.md` section 3 |
| `You get {dailyKeys} {catKeyName} with your first claim each day (hold up to {keyMaxStack}).` | `v2.V2_CONFIG.idle.dailyKeys`, `v2.MATERIALS` (`id: 'catKey'` -> `name`, `maxStack`) |
| `A boss win spends {keyCost} {catKeyName}.` | `v2.V2_CONFIG.boss.keyCost`, `v2.MATERIALS` (`id: 'catKey'`) |
| `A loss keeps the key and starts a {lossCooldownSeconds} s catnap (one cooldown for all chapters).` | `v2.V2_CONFIG.boss.lossCooldownSeconds` |
| `Rematch cleared bosses for a smaller chest.` | Prompt specification & `docs/play-v2.md` section 5 |
| `First-clear boss chests also award {firstClearKeys} {catKeyName}.` (only when `firstClearKeys > 0`) | `((v2.V2_CONFIG.boss as { firstClearKeys?: number }).firstClearKeys ?? 0)` |
| `Craft gear with Fish, Yarn and materials (guaranteed rarity per recipe: {recipeRarities}).` | `v2.RECIPES` (`rarity`), `v2.MATERIALS` |
| `Salvage returns part of the cost (always less than it cost).` | `v2.SALVAGE` / `docs/play-v2.md` section 6 |
| `Lock items to protect them in your bag (holds up to {bagLimit} items).` | `v2.V2_CONFIG.bag.limit` |
| `The Relic: {relicYarn} {yarnName} + {relicMoonPearl} {moonPearlName}, {relicPerDay} per day, shared with v1.` | `v2.RELIC_RECIPE.materials.yarn`, `v2.RELIC_RECIPE.materials.moonPearl`, `v2.RELIC_RECIPE.perDay` |
| `First-clear chests always give a Moon Pearl (100%), while repeat chests give one with 30% chance. Gear drops average 1.5 items per chest on first clear versus 0.95 items on repeats. Cat Key is absent from chest tables today.` | `docs/drop-rates-v2.md` summary & chest tables |
| `For full tables and probabilities, see docs/drop-rates-v2.md.` | Plain text documentation path `docs/drop-rates-v2.md` |
| `Mini mode collapses the game into the classic 96 px taskbar strip for background play. Toggle it anytime using the Mini mode button in the top bar.` | `useMiniMode.ts` (classic 96 px strip) & `StageLayout.tsx` topbar button label ("Mini mode") |

---

## 7. Note for CL8

> **Note for CL8**: When `((v2.V2_CONFIG.boss as { firstClearKeys?: number }).firstClearKeys)` becomes `1` (or any value `> 0`), the first-clear sentence appears automatically in the "Cat Keys and bosses" section with no code change required in `HelpTab.tsx`. Verified in `HelpTab.test.tsx` test case 3.

---

## 8. Embedded Screenshots

### Desktop (1280 x 720)
![Help tab desktop at 1280x720](reports/v27e-help/help-desktop-1280x720.png)

### Phone Bottom Sheet (390 x 844)
![Help tab phone at 390x844](reports/v27e-help/help-phone-390x844.png)

---

## 9. Anything Unsure

- No regressions or ambiguities found. All numbers dynamically derive from the runtime config/content objects (`V2_CONFIG`, `RELIC_RECIPE`, `CLASSES`, `CHAPTERS`, `MATERIALS`, `RECIPES`).
- When `isGameV2()` is false, the existing v1 `STEPS` list is rendered without any v2 headings or content, ensuring safe rollback or dual-mode support.
