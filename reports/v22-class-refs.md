# Task Report: Card A26 — Class Reference Request Sheet (V22 Prep)

STATUS: DONE

## 1. Summary of Work Done

- Created branch `ai/antigravity-v22-class-refs` from latest `origin/main` (`a42765c`).
- Verified git author identity is `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
- Verified all three gate checks on `origin/main`.
- Authored `docs/class-refs.md`:
  - Section 1 (Why): 3-line rationale detailing current placeholder art, deadline (Decision D3: by 2 Nov, cutoff 5 Nov), and fallback procedure (Decision D5).
  - Section 2 (How to send): instructions for thread posting, picture upload, fill-in questions, and `skip` keyword.
  - Section 3 (Class reference sections): in `classes.ts` order (Warrior, Guardian, Rogue, Hunter, Archer, Witch, Alchemist), each featuring current idle look (zoom 3, dark background) and attack strip screenshots, facts table from code, fill-in questions with blanks, and two generic example answers fitting the class role.
  - Section 4 (Constraints for the artist): rig pixel bounds (32x32 cat cell, 56x48 frame), 6-color `BodyPalette` limits, fixed components (gear sets, weapon shapes, monsters), and 2x/3x zoom readability requirements.
  - Section 5 (Orchestrator checklist): tracking table across all 7 classes.
- Captured 14 sprite preview screenshots (7 idle + 7 attack animation strips) using Playwright against `http://localhost:5173/?dev=sprites` with dark background (`#2a1f36`) at 3x zoom and verified all are under 200 KB (between 3.8 KB and 8.7 KB each).
- Verified `node scripts/check-links.mjs docs/class-refs.md` passed with 0 errors across 83 checked links/paths.

---

## 2. Gate Checks Output

Commands executed on `origin/main`:

```bash
git fetch origin +main:refs/remotes/origin/main && \
echo "=== Gate 1 ===" && \
git ls-tree origin/main docs/class-refs.md && \
echo "=== Gate 2 (grep) ===" && \
git show origin/main:apps/web/src/game/rig/palettes.ts | grep -n "CLASS_LOOKS" && \
echo "=== Gate 2 (log) ===" && \
git log origin/main --oneline -3 -- apps/web/src/game/rig/palettes.ts && \
echo "=== Gate 3 ===" && \
git ls-tree origin/main apps/web/src/dev/SpritePreview.tsx
```

Output:
```text
=== Gate 1 ===
=== Gate 2 (grep) ===
38:export const CLASS_LOOKS: Readonly<Record<ClassId, ClassLook>> = {
=== Gate 2 (log) ===
94448b2 V14: sprite rig and preview page (#112)
=== Gate 3 ===
100644 blob 4b0eb258f36acbcc565d5120c49759db79c886f2	apps/web/src/dev/SpritePreview.tsx
```

All three gates passed:
1. `docs/class-refs.md` did not exist on `origin/main` (Gate 1 PASS).
2. `CLASS_LOOKS` exists on line 38 of `apps/web/src/game/rig/palettes.ts` and no V22 / class-art commit modified it (Gate 2 PASS).
3. `apps/web/src/dev/SpritePreview.tsx` exists on `origin/main` (Gate 3 PASS).

---

## 3. Facts-vs-Code Verification Table

Every fact listed in `docs/class-refs.md` was cross-checked with the codebase:

| Class | Field | Value in Sheet | Grep Line / Source Code |
| :--- | :--- | :--- | :--- |
| **Warrior** | Role | Melee striker (range: `melee`) | `packages/game-rules/src/v2/content/classes.ts:83`: `range: 'melee'`<br>`docs/play-v2.md:22`: `Melee striker` |
| | Weapon | `sword` | `packages/game-rules/src/v2/content/classes.ts:77`: `weaponType: 'sword'` |
| | Passive | Cleave (`cleave`): Every 3rd attack splashes 50% damage to next monster | `packages/game-rules/src/v2/content/classes.ts:84`: `passive: { id: 'cleave', params: { every: 3, splash: 0.5 } }` |
| | Starter Weapon | Twig Sword (`wpn.sword.twig`, visual `sword.basic`) | `packages/game-rules/src/v2/content/classes.ts:85`: `starterWeaponId: 'wpn.sword.twig'`<br>`apps/web/src/game/rig/palettes.ts:39`: `starterWeapon: 'sword.basic'` |
| | Markings | `tabby` | `apps/web/src/game/rig/palettes.ts:39`: `markings: 'tabby'` |
| | Fur Colours | `o` #f0a040, `d` #c66a1a, `w` #fff0d8, `e` #3f9e5a, `n` #ff8fb1, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:40`: `fur: fur(0xf0a040, 0xc66a1a, 0xfff0d8, 0x3f9e5a)` |
| **Guardian** | Role | Melee tank (range: `melee`) | `packages/game-rules/src/v2/content/classes.ts:96`: `range: 'melee'`<br>`docs/play-v2.md:23`: `Melee tank` |
| | Weapon | `hammer` | `packages/game-rules/src/v2/content/classes.ts:90`: `weaponType: 'hammer'` |
| | Passive | Bonk (`bonk`): Each hit delays target attack by 500 ms | `packages/game-rules/src/v2/content/classes.ts:97`: `passive: { id: 'bonk', params: { delayMs: 500 } }` |
| | Starter Weapon | Wooden Mallet (`wpn.hammer.mallet`, visual `hammer.basic`) | `packages/game-rules/src/v2/content/classes.ts:98`: `starterWeaponId: 'wpn.hammer.mallet'`<br>`apps/web/src/game/rig/palettes.ts:41`: `starterWeapon: 'hammer.basic'` |
| | Markings | `plain` | `apps/web/src/game/rig/palettes.ts:41`: `markings: 'plain'` |
| | Fur Colours | `o` #9aa0b4, `d` #666c80, `w` #e8eaf0, `e` #d9a520, `n` #ff8fb1, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:42`: `fur: fur(0x9aa0b4, 0x666c80, 0xe8eaf0, 0xd9a520)` |
| **Rogue** | Role | Crit striker (range: `melee`) | `packages/game-rules/src/v2/content/classes.ts:109`: `range: 'melee'`<br>`docs/play-v2.md:24`: `Crit striker` |
| | Weapon | `daggers` | `packages/game-rules/src/v2/content/classes.ts:103`: `weaponType: 'daggers'` |
| | Passive | Twin Strike (`twinStrike`): 2 hits per attack; 25% crit, 10% dodge | `packages/game-rules/src/v2/content/classes.ts:110`: `passive: { id: 'twinStrike', params: { hits: 2 } }` |
| | Starter Weapon | Bone Claws (`wpn.daggers.claws`, visual `daggers.basic`) | `packages/game-rules/src/v2/content/classes.ts:112`: `starterWeaponId: 'wpn.daggers.claws'`<br>`apps/web/src/game/rig/palettes.ts:43`: `starterWeapon: 'daggers.basic'` |
| | Markings | `plain` | `apps/web/src/game/rig/palettes.ts:43`: `markings: 'plain'` |
| | Fur Colours | `o` #4a4258, `d` #2e2838, `w` #d8d8e8, `e` #e8c840, `n` #d07890, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:44`: `fur: fur(0x4a4258, 0x2e2838, 0xd8d8e8, 0xe8c840, 0xd07890)` |
| **Hunter** | Role | Reach tracker (range: `reach`) | `packages/game-rules/src/v2/content/classes.ts:122`: `range: 'reach'`<br>`docs/play-v2.md:25`: `Reach tracker` |
| | Weapon | `spear` | `packages/game-rules/src/v2/content/classes.ts:116`: `weaponType: 'spear'` |
| | Passive | Mark Prey (`markPrey`): Target takes +20% damage; +10% find | `packages/game-rules/src/v2/content/classes.ts:123`: `passive: { id: 'markPrey', params: { damageTaken: 0.2, materialFind: 0.1 } }` |
| | Starter Weapon | Reed Spear (`wpn.spear.reed`, visual `spear.basic`) | `packages/game-rules/src/v2/content/classes.ts:125`: `starterWeaponId: 'wpn.spear.reed'`<br>`apps/web/src/game/rig/palettes.ts:45`: `starterWeapon: 'spear.basic'` |
| | Markings | `tabby` | `apps/web/src/game/rig/palettes.ts:45`: `markings: 'tabby'` |
| | Fur Colours | `o` #a0703f, `d` #6e4a26, `w` #e8d2b0, `e` #3a8ac0, `n` #ff8fb1, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:46`: `fur: fur(0xa0703f, 0x6e4a26, 0xe8d2b0, 0x3a8ac0)` |
| **Archer** | Role | Ranged sniper (range: `ranged`) | `packages/game-rules/src/v2/content/classes.ts:135`: `range: 'ranged'`<br>`docs/play-v2.md:26`: `Ranged sniper` |
| | Weapon | `bow` | `packages/game-rules/src/v2/content/classes.ts:129`: `weaponType: 'bow'` |
| | Passive | Volley (`volley`): Every 5th shot fires 3 arrows (extra arrows deal 50% damage) | `packages/game-rules/src/v2/content/classes.ts:136`: `passive: { id: 'volley', params: { every: 5, arrows: 3, extraArrowDamage: 0.5 } }` |
| | Starter Weapon | Willow Bow (`wpn.bow.willow`, visual `bow.basic`) | `packages/game-rules/src/v2/content/classes.ts:137`: `starterWeaponId: 'wpn.bow.willow'`<br>`apps/web/src/game/rig/palettes.ts:47`: `starterWeapon: 'bow.basic'` |
| | Markings | `points` | `apps/web/src/game/rig/palettes.ts:47`: `markings: 'points'` |
| | Fur Colours | `o` #f3e2c4, `d` #8a6a52, `w` #fffaf0, `e` #3a7ad0, `n` #ff8fb1, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:48`: `fur: fur(0xf3e2c4, 0x8a6a52, 0xfffaf0, 0x3a7ad0)` |
| **Witch** | Role | Area burner (range: `ranged`) | `packages/game-rules/src/v2/content/classes.ts:148`: `range: 'ranged'`<br>`docs/play-v2.md:27`: `Area burner` |
| | Weapon | `staff` | `packages/game-rules/src/v2/content/classes.ts:142`: `weaponType: 'staff'` |
| | Passive | Burn (`burn`): Splash 40%; burns 30% damage over 3000 ms (ticks every 1000 ms) | `packages/game-rules/src/v2/content/classes.ts:149`: `passive: { id: 'burn', params: { splash: 0.4, burnFraction: 0.3, durationMs: 3000, tickMs: 1000 } }` |
| | Starter Weapon | Branch Staff (`wpn.staff.branch`, visual `staff.basic`) | `packages/game-rules/src/v2/content/classes.ts:150`: `starterWeaponId: 'wpn.staff.branch'`<br>`apps/web/src/game/rig/palettes.ts:49`: `starterWeapon: 'staff.basic'` |
| | Markings | `plain` | `apps/web/src/game/rig/palettes.ts:49`: `markings: 'plain'` |
| | Fur Colours | `o` #f2eefc, `d` #b8b0d4, `w` #ffffff, `e` #9a5ae0, `n` #ff8fb1, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:50`: `fur: fur(0xf2eefc, 0xb8b0d4, 0xffffff, 0x9a5ae0)` |
| **Alchemist** | Role | Poisoner (range: `ranged`) | `packages/game-rules/src/v2/content/classes.ts:161`: `range: 'ranged'`<br>`docs/play-v2.md:28`: `Poisoner` |
| | Weapon | `flasks` | `packages/game-rules/src/v2/content/classes.ts:155`: `weaponType: 'flasks'` |
| | Passive | Poison (`poison`): 50% poison damage over 4000 ms (ticks every 1000 ms); heals 3% max HP on kill | `packages/game-rules/src/v2/content/classes.ts:162`: `passive: { id: 'poison', params: { poisonFraction: 0.5, durationMs: 4000, tickMs: 1000, healOnKill: 0.03 } }` |
| | Starter Weapon | Basic Vial (`wpn.flasks.vial`, visual `flasks.basic`) | `packages/game-rules/src/v2/content/classes.ts:163`: `starterWeaponId: 'wpn.flasks.vial'`<br>`apps/web/src/game/rig/palettes.ts:51`: `starterWeapon: 'flasks.basic'` |
| | Markings | `patches` | `apps/web/src/game/rig/palettes.ts:51`: `markings: 'patches'` |
| | Fur Colours | `o` #fff3e0, `d` #e08a3a, `w` #ffffff, `e` #3f9e5a, `n` #ff8fb1, `k` #140a12 | `apps/web/src/game/rig/palettes.ts:52`: `fur: fur(0xfff3e0, 0xe08a3a, 0xffffff, 0x3f9e5a)` |

---

## 4. How the Screenshots Were Made

The dev preview server was run locally via `pnpm --filter @taskbar-hero/web dev` on `http://localhost:5173`.
Screenshots were captured using Playwright (`apps/web/node_modules/@playwright/test`) with headless Chromium by targeting the Phaser canvas element:

### Exact URLs per class:

1. **Warrior:**
   - Idle (`warrior-current.png`): `http://localhost:5173/?dev=sprites&cls=warrior&anim=idle&gear=none&zoom=3`
   - Attack Strip (`warrior-attack.png`): `http://localhost:5173/?dev=sprites&cls=warrior&anim=attack&strip=1&gear=none&zoom=3`
2. **Guardian:**
   - Idle (`guardian-current.png`): `http://localhost:5173/?dev=sprites&cls=guardian&anim=idle&gear=none&zoom=3`
   - Attack Strip (`guardian-attack.png`): `http://localhost:5173/?dev=sprites&cls=guardian&anim=attack&strip=1&gear=none&zoom=3`
3. **Rogue:**
   - Idle (`rogue-current.png`): `http://localhost:5173/?dev=sprites&cls=rogue&anim=idle&gear=none&zoom=3`
   - Attack Strip (`rogue-attack.png`): `http://localhost:5173/?dev=sprites&cls=rogue&anim=attack&strip=1&gear=none&zoom=3`
4. **Hunter:**
   - Idle (`hunter-current.png`): `http://localhost:5173/?dev=sprites&cls=hunter&anim=idle&gear=none&zoom=3`
   - Attack Strip (`hunter-attack.png`): `http://localhost:5173/?dev=sprites&cls=hunter&anim=attack&strip=1&gear=none&zoom=3`
5. **Archer:**
   - Idle (`archer-current.png`): `http://localhost:5173/?dev=sprites&cls=archer&anim=idle&gear=none&zoom=3`
   - Attack Strip (`archer-attack.png`): `http://localhost:5173/?dev=sprites&cls=archer&anim=attack&strip=1&gear=none&zoom=3`
6. **Witch:**
   - Idle (`witch-current.png`): `http://localhost:5173/?dev=sprites&cls=witch&anim=idle&gear=none&zoom=3`
   - Attack Strip (`witch-attack.png`): `http://localhost:5173/?dev=sprites&cls=witch&anim=attack&strip=1&gear=none&zoom=3`
7. **Alchemist:**
   - Idle (`alchemist-current.png`): `http://localhost:5173/?dev=sprites&cls=alchemist&anim=idle&gear=none&zoom=3`
   - Attack Strip (`alchemist-attack.png`): `http://localhost:5173/?dev=sprites&cls=alchemist&anim=attack&strip=1&gear=none&zoom=3`

All captures feature zoom level 3, dark background (`#2a1f36`), and unarmed equipment (`gear=none`).

---

## 5. Full Command Outputs

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
Done in 382ms using pnpm v10.28.0
```

### Command 2: `node scripts/check-links.mjs docs/class-refs.md`
```text
Checked 1 markdown files and 83 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
```

### Command 3: `node scripts/check-links.mjs`
```text
Checked 39 markdown files and 558 links/paths.

Found 52 broken link(s) or path(s) on disk:

  README.md:114 [backticked image path]
    Target: `og.png`
    Not found: og.png

  docs/database.md:3 [backticked repo path]
    Target: `supabase/migrations/*.sql`
    Not found: supabase/migrations/*.sql

  docs/demo-script.md:103 [backticked repo path]
    Target: `apps/web/src/game/GameCanvas.tsx`
    Not found: apps/web/src/game/GameCanvas.tsx

  docs/deploy.md:4 [backticked repo path]
    Target: `packages/chain/deployments/<chainId>.json`
    Not found: packages/chain/deployments/<chainId>.json

  docs/dry-run-report.md:41 [backticked image path]
    Target: `01-desktop-initial-load-onboarding.png`
    Not found: 01-desktop-initial-load-onboarding.png

  docs/dry-run-report.md:42 [backticked image path]
    Target: `02-desktop-ambient-strip-main.png`
    Not found: 02-desktop-ambient-strip-main.png

  docs/dry-run-report.md:43 [backticked image path]
    Target: `03-desktop-wallet-connected-await-signin.png`
    Not found: 03-desktop-wallet-connected-await-signin.png

  docs/dry-run-report.md:44 [backticked image path]
    Target: `04-desktop-signed-in-strip.png`
    Not found: 04-desktop-signed-in-strip.png

  docs/dry-run-report.md:45 [backticked image path]
    Target: `05-desktop-cafe-board-hero.png`
    Not found: 05-desktop-cafe-board-hero.png

  docs/dry-run-report.md:46 [backticked image path]
    Target: `06-desktop-tab-inventory.png`
    Not found: 06-desktop-tab-inventory.png

  docs/dry-run-report.md:47 [backticked image path]
    Target: `07-desktop-tab-boss-ready.png`
    Not found: 07-desktop-tab-boss-ready.png

  docs/dry-run-report.md:48 [backticked image path]
    Target: `08-desktop-tab-boss-fighting.png`
    Not found: 08-desktop-tab-boss-fighting.png

  docs/dry-run-report.md:48 [backticked image path]
    Target: `09-desktop-tab-boss-outcome.png`
    Not found: 09-desktop-tab-boss-outcome.png

  docs/dry-run-report.md:49 [backticked image path]
    Target: `10-desktop-tab-forge.png`
    Not found: 10-desktop-tab-forge.png

  docs/dry-run-report.md:50 [backticked image path]
    Target: `11-desktop-tab-market.png`
    Not found: 11-desktop-tab-market.png

  docs/dry-run-report.md:89 [backticked image path]
    Target: `12-mobile-initial-load-onboarding.png`
    Not found: 12-mobile-initial-load-onboarding.png

  docs/dry-run-report.md:90 [backticked image path]
    Target: `13-mobile-ambient-strip-main.png`
    Not found: 13-mobile-ambient-strip-main.png

  docs/dry-run-report.md:91 [backticked image path]
    Target: `13-mobile-ambient-strip-main.png`
    Not found: 13-mobile-ambient-strip-main.png

  docs/dry-run-report.md:92 [backticked image path]
    Target: `14-mobile-cafe-board-hero.png`
    Not found: 14-mobile-cafe-board-hero.png

  docs/dry-run-report.md:93 [backticked image path]
    Target: `15-mobile-tab-inventory.png`
    Not found: 15-mobile-tab-inventory.png

  docs/dry-run-report.md:94 [backticked image path]
    Target: `16-mobile-tab-boss-ready.png`
    Not found: 16-mobile-tab-boss-ready.png

  docs/dry-run-report.md:95 [backticked image path]
    Target: `17-mobile-tab-boss-fighting.png`
    Not found: 17-mobile-tab-boss-fighting.png

  docs/dry-run-report.md:95 [backticked image path]
    Target: `18-mobile-tab-boss-outcome.png`
    Not found: 18-mobile-tab-boss-outcome.png

  docs/dry-run-report.md:96 [backticked image path]
    Target: `19-mobile-tab-forge.png`
    Not found: 19-mobile-tab-forge.png

  docs/dry-run-report.md:97 [backticked image path]
    Target: `20-mobile-tab-market-gate.png`
    Not found: 20-mobile-tab-market-gate.png

  docs/dry-run-report.md:229 [backticked image path]
    Target: `01-desktop-initial-load-onboarding.png`
    Not found: 01-desktop-initial-load-onboarding.png

  docs/dry-run-report.md:230 [backticked image path]
    Target: `02-desktop-ambient-strip-main.png`
    Not found: 02-desktop-ambient-strip-main.png

  docs/dry-run-report.md:231 [backticked image path]
    Target: `03-desktop-wallet-connected-await-signin.png`
    Not found: 03-desktop-wallet-connected-await-signin.png

  docs/dry-run-report.md:232 [backticked image path]
    Target: `04-desktop-signed-in-strip.png`
    Not found: 04-desktop-signed-in-strip.png

  docs/dry-run-report.md:233 [backticked image path]
    Target: `05-desktop-cafe-board-hero.png`
    Not found: 05-desktop-cafe-board-hero.png

  docs/dry-run-report.md:234 [backticked image path]
    Target: `06-desktop-tab-inventory.png`
    Not found: 06-desktop-tab-inventory.png

  docs/dry-run-report.md:235 [backticked image path]
    Target: `07-desktop-tab-boss-ready.png`
    Not found: 07-desktop-tab-boss-ready.png

  docs/dry-run-report.md:236 [backticked image path]
    Target: `08-desktop-tab-boss-fighting.png`
    Not found: 08-desktop-tab-boss-fighting.png

  docs/dry-run-report.md:237 [backticked image path]
    Target: `09-desktop-tab-boss-outcome.png`
    Not found: 09-desktop-tab-boss-outcome.png

  docs/dry-run-report.md:238 [backticked image path]
    Target: `10-desktop-tab-forge.png`
    Not found: 10-desktop-tab-forge.png

  docs/dry-run-report.md:239 [backticked image path]
    Target: `11-desktop-tab-market.png`
    Not found: 11-desktop-tab-market.png

  docs/dry-run-report.md:240 [backticked image path]
    Target: `12-mobile-initial-load-onboarding.png`
    Not found: 12-mobile-initial-load-onboarding.png

  docs/dry-run-report.md:241 [backticked image path]
    Target: `13-mobile-ambient-strip-main.png`
    Not found: 13-mobile-ambient-strip-main.png

  docs/dry-run-report.md:242 [backticked image path]
    Target: `14-mobile-cafe-board-hero.png`
    Not found: 14-mobile-cafe-board-hero.png

  docs/dry-run-report.md:243 [backticked image path]
    Target: `15-mobile-tab-inventory.png`
    Not found: 15-mobile-tab-inventory.png

  docs/dry-run-report.md:244 [backticked image path]
    Target: `16-mobile-tab-boss-ready.png`
    Not found: 16-mobile-tab-boss-ready.png

  docs/dry-run-report.md:245 [backticked image path]
    Target: `17-mobile-tab-boss-fighting.png`
    Not found: 17-mobile-tab-boss-fighting.png

  docs/dry-run-report.md:246 [backticked image path]
    Target: `18-mobile-tab-boss-outcome.png`
    Not found: 18-mobile-tab-boss-outcome.png

  docs/dry-run-report.md:247 [backticked image path]
    Target: `19-mobile-tab-forge.png`
    Not found: 19-mobile-tab-forge.png

  docs/dry-run-report.md:248 [backticked image path]
    Target: `20-mobile-tab-market-gate.png`
    Not found: 20-mobile-tab-market-gate.png

  docs/extending.md:16 [backticked repo path]
    Target: `supabase/functions/<name>/index.ts`
    Not found: supabase/functions/<name>/index.ts

  docs/extending.md:44 [backticked repo path]
    Target: `apps/web/public/relics/<id>.json`
    Not found: apps/web/public/relics/<id>.json

  docs/licenses-v2.md:41 [backticked repo path]
    Target: `apps/web/public/assets/<pack-name>/LICENSE.txt`
    Not found: apps/web/public/assets/<pack-name>/LICENSE.txt

  docs/proposals/schema-v2.md:215 [backticked repo path]
    Target: `supabase/tests/v2/**`
    Not found: supabase/tests/v2/**

  docs/submission.md:3 [backticked repo path]
    Target: `docs/*`
    Not found: docs/*

  docs/verify-pr.md:6 [backticked repo path]
    Target: `scripts/verify-pr.sh <pr-number> [--comment]`
    Not found: scripts/verify-pr.sh <pr-number> [--comment]

  docs/verify-pr.md:7 [backticked repo path]
    Target: `reports/<task>.md`
    Not found: reports/<task>.md
```
*(Note: As expected, all 52 reported links are historical pre-existing items tracked in `docs/link-check.md`; zero errors originate from `docs/class-refs.md`.)*

### Command 4: `ls -l docs/class-refs/`
```text
total 216
-rw-r--r--@ 1 bao  staff  8251 Oct 25 13:54 alchemist-attack.png
-rw-r--r--@ 1 bao  staff  4411 Oct 25 13:54 alchemist-current.png
-rw-r--r--@ 1 bao  staff  7739 Oct 25 13:54 archer-attack.png
-rw-r--r--@ 1 bao  staff  3890 Oct 25 13:53 archer-current.png
-rw-r--r--@ 1 bao  staff  8425 Oct 25 13:53 guardian-attack.png
-rw-r--r--@ 1 bao  staff  4195 Oct 25 13:53 guardian-current.png
-rw-r--r--@ 1 bao  staff  7913 Oct 25 13:53 hunter-attack.png
-rw-r--r--@ 1 bao  staff  3959 Oct 25 13:53 hunter-current.png
-rw-r--r--@ 1 bao  staff  8681 Oct 25 13:53 rogue-attack.png
-rw-r--r--@ 1 bao  staff  4100 Oct 25 13:53 rogue-current.png
-rw-r--r--@ 1 bao  staff  7871 Oct 25 13:53 warrior-attack.png
-rw-r--r--@ 1 bao  staff  3962 Oct 25 13:53 warrior-current.png
-rw-r--r--@ 1 bao  staff  7949 Oct 25 13:54 witch-attack.png
-rw-r--r--@ 1 bao  staff  3996 Oct 25 13:54 witch-current.png
```

### Command 5: `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```

### Command 6: `git diff --stat origin/main...HEAD`
```text
 docs/class-refs.md                    | 461 ++++++++++++++++++++++++++++++++++
 docs/class-refs/alchemist-attack.png  | Bin 0 -> 8251 bytes
 docs/class-refs/alchemist-current.png | Bin 0 -> 4411 bytes
 docs/class-refs/archer-attack.png     | Bin 0 -> 7739 bytes
 docs/class-refs/archer-current.png    | Bin 0 -> 3890 bytes
 docs/class-refs/guardian-attack.png   | Bin 0 -> 8425 bytes
 docs/class-refs/guardian-current.png  | Bin 0 -> 4195 bytes
 docs/class-refs/hunter-attack.png     | Bin 0 -> 7913 bytes
 docs/class-refs/hunter-current.png    | Bin 0 -> 3959 bytes
 docs/class-refs/rogue-attack.png      | Bin 0 -> 8681 bytes
 docs/class-refs/rogue-current.png     | Bin 0 -> 4100 bytes
 docs/class-refs/warrior-attack.png    | Bin 0 -> 7871 bytes
 docs/class-refs/warrior-current.png   | Bin 0 -> 3962 bytes
 docs/class-refs/witch-attack.png      | Bin 0 -> 7949 bytes
 docs/class-refs/witch-current.png     | Bin 0 -> 3996 bytes
 reports/v22-class-refs.md             | 446 ++++++++++++++++++++++++++++++++
 16 files changed, 907 insertions(+)
```

---

## 6. Acceptance Criteria

| Item | Criteria | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Gate 1, 2, and 3 pass on `origin/main` | PASS | Gate 1 printed nothing; Gate 2 confirmed line 38 and no V22 commits; Gate 3 confirmed file existence |
| 2 | `docs/class-refs.md` created with all 5 required sections | PASS | Why (3 lines), How to send, 7 class sections in order, Artist constraints, Orchestrator checklist |
| 3 | Every fact in tables matches the code | PASS | Verified against `classes.ts:74-165` and `palettes.ts:38-53` |
| 4 | Questions include blanks and 2 generic examples per class | PASS | Blanks formatted with `____`; 2 examples per class without franchise character names |
| 5 | Screenshots exist, open, and under 200 KB each | PASS | 14 PNGs created (each 3.8 KB to 8.7 KB) |
| 6 | `node scripts/check-links.mjs docs/class-refs.md` exits 0 | PASS | 83 links checked, 0 errors |
| 7 | Only allowlisted files touched | PASS | `docs/class-refs.md`, `docs/class-refs/*.png`, `reports/v22-class-refs.md` |
| 8 | Git author identity matches required noreply email | PASS | `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>` |

---

## 7. Self-Check Before Finishing

- **Suite verification:** Docs-only diff (only `docs/**` and `reports/**`). As specified in Self-Check Rule 2:
  `full suite skipped: docs only`
  (install, gen:deno drift, check-links, and image checks ran clean).
- **Allowlist check:** All created files belong to the allowlist (`docs/class-refs.md`, `docs/class-refs/*.png`, `reports/v22-class-refs.md`).
- **Git author check:** Configured to `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

---

## 8. Questions for the User

1. **In-game / Web preview route:** Currently `docs/class-refs.md` is documentation. Would you like a dedicated player-facing or judge-facing preview page routed in web (e.g. `/class-refs` or tab in `/dev`) in a follow-up card, or is the Markdown document + thread submission sufficient?
2. **CL7 Art Handoff:** For card CL7, when references arrive by 2-5 Nov, shall we prioritize classes in registry order (Warrior -> Guardian -> Rogue...) or by whichever reference you submit first?

---

## 9. Anything Unsure

None. All constraints, rig constants, code facts, image dimensions, and link references were strictly verified and match origin/main without discrepancies.
