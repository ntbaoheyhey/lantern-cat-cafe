STATUS: DONE

# Task V27g / A24a Report: Player Guide Text Refresh

## 1. What Was Done
- Refreshed `docs/play-v2.md` to accurately document the current state of origin/main (3379777) text-only:
  - Documented server-side boss combat powered by the `v2-boss-fight` Edge Function (`supabase/functions/v2-boss-fight/index.ts`), including the combat replay timeline with `big` and `dodged` event telemetry flags (Decision D2).
  - Documented boss fight outcomes: winning spends a Cat Key (`V2_CONFIG.boss.keyCost`) and awards first-clear or rematch chest; losing keeps the key (spends 0 keys) and triggers the player-wide Catnap loss cooldown (`V2_CONFIG.boss.lossCooldownSeconds`, currently 60 s).
  - Documented all 5 visual states of `BossGatePanel` (`apps/web/src/layout/boss/BossGatePanel.tsx`): `gated` ("Needs about N power..."), `no_key` ("You need a Cat Key..."), `cooldown` ("Catnap: m:ss"), `not_reached` ("Clear N more rounds..."), and `ready` / `rematch` ("Rematch: the chest is smaller than the first clear.").
  - Added documentation for the stage HUD pieces (`apps/web/src/layout/hud/HudBar.tsx`): `LevelXpBar`, `ProgressChip`, `StacksBar`, and `PowerChip` (including inline power deficit warnings).
  - Added documentation for the in-game Help tab (`apps/web/src/layout/HelpTab.tsx`, Card A23).
  - Replaced hardcoded numbers with explicit `V2_CONFIG.*` and `CONFIG.*` leaf names, explicitly marking progression and pacing numbers as: *(current values, not signed yet: numbers sign-off D4 pending)*.
  - Added a dedicated "Coming with the numbers sign-off" callout box explaining Decision D1 (1 Cat Key in each first-clear boss chest, none on rematch; `firstClearKeys` currently 0 on main).
  - Preserved the full section hierarchy (Sections 1–9 + Sources & References) and updated FAQ answers to reflect server-side boss fights and gate states.

---

## 2. Blockers
None.

---

## 3. Files Touched
```
docs/play-v2.md
reports/v27g-guide-text.md
```

---

## 4. Gate Check Output
- `docs/play-v2.md` exists on `origin/main` -> PASS
- `git ls-remote --heads origin '*guide*'`:
  ```
  f77acd2961acb3b803f3be4d24d9c891f1c78562	refs/heads/ai/antigravity-v27c-guide
  ```
  Only merged branch `ai/antigravity-v27c-guide` present on origin. -> PASS

---

## 5. Verification Commands Run & Real Output

- `pnpm install --frozen-lockfile`
  ```
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Already up to date
  Done in 354ms using pnpm v10.28.0
  ```
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`
  ```
  wrote 18 Edge Function import maps
  (exit code 0)
  ```
- `node scripts/check-links.mjs docs/play-v2.md`
  ```
  Checked 1 markdown files and 36 links/paths.
  ✓ All links, image paths, and backticked repo paths exist on disk.
  ```
- Full suite skipped: docs only.

---

## 6. Changed Claims and Source File Evidence on main

| Claim in `docs/play-v2.md` | Source File on `origin/main` | Evidence |
| :--- | :--- | :--- |
| Server-side boss combat via `v2-boss-fight` Edge Function | `supabase/functions/v2-boss-fight/index.ts` | Edge Function verifies class, keys, cooldown, and simulates battle server-side (Commit c95f0ce / #165) |
| Replay timeline event flags (`big` attacks, `dodged`) | `packages/game-rules/src/v2/combat/types.ts` | `TimelineEventV2` defines optional `big?: boolean` and `dodged?: boolean` (Commit c95f0ce / Decision D2) |
| Boss win spends key; loss refunds key and starts Catnap cooldown | `supabase/functions/v2-boss-fight/index.ts`, `packages/game-rules/src/v2/config.ts` | `V2_CONFIG.boss.keyCost = 1`, `V2_CONFIG.boss.lossCooldownSeconds = 60`, `store.bossDefeatCooldown` sets cooldown without deducting keys |
| Boss gate states: `gated`, `no_key`, `cooldown`, `not_reached`, `ready`/`rematch` | `apps/web/src/layout/boss/BossGatePanel.tsx` | Status text formatting and aria announcements for all 5 states (Commit 5faabb1 / #168) |
| Stage HUD components: `LevelXpBar`, `ProgressChip`, `StacksBar`, `PowerChip` | `apps/web/src/layout/hud/` | Layout and rendering of XP progress, chapter/round chips, currency stacks, and power hints (Commit 665cab4 / #167) |
| In-game Help tab accessible in navigation | `apps/web/src/layout/HelpTab.tsx` | Game mechanics, gear, boss gate, and Fuji wallet setup guide (Commit 3379777 / #169) |
| Decision D1: First-clear boss chest Cat Key (`firstClearKeys`) | `packages/game-rules/src/v2/config.ts` | `V2_CONFIG.boss.firstClearKeys: 0` lever exists on main; pending user sign-off (Commit cdcb0cf / #164) |
| Numbers named by config leaves and marked unsigned pending D4 | `packages/game-rules/src/v2/config.ts`, `docs/proposals/numbers-v2.md` | All pacing/economy variables derived from `V2_CONFIG` / `CONFIG` |

---

## 7. Acceptance Checklist
- [x] Bring `docs/play-v2.md` in line with main (text-only, no screenshots).
- [x] Bosses documented as server-side (`v2-boss-fight`, win spends key, loss keeps key and starts Catnap cooldown; big and dodged replay flags).
- [x] Boss gate states documented as `BossGatePanel` displays them.
- [x] HUD pieces documented (`LevelXpBar`, `ProgressChip`, `StacksBar`, `PowerChip`).
- [x] Help tab documented (`apps/web/src/layout/HelpTab.tsx`).
- [x] Numbers cited by config leaf names and marked "current values, not signed yet (numbers sign-off D4 pending)".
- [x] "Coming with the numbers sign-off" box added for Decision D1 (first-clear keys).
- [x] Section structure preserved, FAQ answers updated.
- [x] `node scripts/check-links.mjs docs/play-v2.md` passed (36 links verified).

---

## 8. What Is Needed to Continue
- Merge card G2 (`ai/antigravity-v27g-guide-text`) into main.
- Proceed to G3 (Written-look fallback sheet for 7 classes).
