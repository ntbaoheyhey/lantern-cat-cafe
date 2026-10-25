STATUS: DONE

# Task V28 / A29 Report: QA Checklist & Testing Specification

## 1. What Was Done
- Created `docs/qa-v2-checklist.md` providing a comprehensive, scripted QA testing specification for:
  - **QA1 (Local Milestone M3 Pass):** Executed on local preview build (`VITE_GAME_V2=1`) in demo mode once V16 (Stage + HUD wiring) and V19 (Phaser Boss Arena) are integrated.
  - **V28 (Live Cut-Over Pass):** Executed on live production site (`https://taskbar-hero.vercel.app`) immediately following the V29 cut-over flag flip.
- Formulated explicit setup instructions for both local demo preview builds and live production testing.
- Defined testing matrix covering devices/viewports (390 × 844 px phone, 1280 × 720 px laptop, 320 px narrow), color themes (dark/light), motion preferences (normal/reduced), and auth states (demo/signed-in).
- Documented complete 13-step gameplay loop with step-by-step actions and expected results:
  1. Class Picker & Starter Weapon
  2. Stage Layout & HUD Elements (`LevelXpBar`, `ProgressChip`, `StacksBar`, `PowerChip`)
  3. Ambient Progress & Idle Claims (10s minimum interval, 8h cap)
  4. Bag Management & Equip Best (9 slots, lock/unlock toggle, auto-salvage warning)
  5. Boss Gate Statuses (5 states: `not_reached`, `gated`, `no_key`, `cooldown`, `ready`/`rematch`)
  6. Boss Battle Victory & Chest Reveal (server verification, key deduction, chapter unlocking)
  7. Boss Battle Defeat & Catnap Cooldown (0 keys lost, 60s cooldown timer)
  8. The Forge: Crafting (50–5000 Fish recipes), Salvage (~25% return), and Lock protection
  9. Daily Relic Forge & EIP-712 Voucher (1/day account limit)
  10. Persistence & Hard Refresh (localStorage in demo / Supabase in signed-in)
  11. Mini Mode 96px ambient strip toggle & persistence
  12. In-Game Help Tab (`apps/web/src/layout/HelpTab.tsx`)
  13. Classic v1 Verification (live site remaining v1 prior to cut-over)
- Explicitly marked readiness per step: highlighted which steps require V16, V19, or V29 and cannot be tested yet.
- Specified accessibility checks (keyboard-only navigation, focus visibility with `--focus` `#ffd75e`, screen reader names, `aria-hidden="true"` icons) and robustness checks (0 console errors, 0 px horizontal overflow).
- Documented live health check commands (`node scripts/check-live.mjs`, `CHECK_LIVE_V2=post node scripts/check-live.mjs`).
- Defined bug severity classification (Blocker, Major, Minor) and standard report templates with screenshot conventions (`qa1-*.png`, `v28-live-*.png`).

---

## 2. Blockers
None.

---

## 3. Files Touched
```
docs/qa-v2-checklist.md
reports/v28-qa-checklist.md
```

---

## 4. Gate Check Output
- `docs/qa-v2-checklist.md` absent on origin/main: Confirmed absent -> PASS
- `docs/cutover-v2.md` on origin/main: Present (Card A22 #161) -> PASS

---

## 5. Verification Commands Run & Real Output

- `pnpm install --frozen-lockfile`
  ```
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Already up to date
  Done in 355ms using pnpm v10.28.0
  ```
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`
  ```
  wrote 18 Edge Function import maps
  (exit code 0)
  ```
- `node scripts/check-links.mjs docs/qa-v2-checklist.md`
  ```
  Checked 1 markdown files and 7 links/paths.
  ✓ All links, image paths, and backticked repo paths exist on disk.
  ```
- Full suite skipped: docs only.

---

## 6. Acceptance Checklist
- [x] Scripted procedure for QA1 (local `VITE_GAME_V2=1` demo build) and V28 (live cut-over site).
- [x] Setup commands documented for both environments.
- [x] Device matrix defined (phone 390x844, laptop 1280x720, light/dark, reduced motion).
- [x] Full loop numbered steps 1–13 with explicit expected results.
- [x] Milestone readiness table stating which steps need V16/V19/V29 and are not testable yet.
- [x] Accessibility spot checks (keyboard only, screen reader names, focus ring).
- [x] Console-error and horizontal-scroll (`scrollWidth <= innerWidth`) checks included.
- [x] Live health check commands documented (`check-live.mjs`).
- [x] Severity scale (blocker / major / minor) specified.
- [x] Report templates for QA1 and V28 included with screenshot naming standards.
- [x] `node scripts/check-links.mjs docs/qa-v2-checklist.md` passed with 0 errors.

---

## 7. What Is Needed to Continue
- Proceed to G5 (A27b submission kit drafts).
