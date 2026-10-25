STATUS: DONE

# Task V27f / A25a Report: HUD + Boss Gate States Accessibility Prep

## 1. What Was Done
- Created `apps/web/src/layout/a11y/hudBossFixtures.ts` providing realistic, type-checked `ServerStateV2` and `BossGatePanelProps` fixtures for all HUD cases and boss gate states (`gated`, `no_key`, `cooldown`, `not_reached`, `rematch`, `ready`), along with customizable factory helpers `createHudServerState` and `createBossGateProps`.
- Created comprehensive accessibility test suite `apps/web/src/layout/a11y/v2-hud-boss.a11y.test.tsx` verifying:
  1. Combined tab order across `HudBar` + `BossGatePanel`, ensuring only real controls are focusable, no `tabIndex > 0`, decorative HUD icons are `aria-hidden="true"`, portrait has accessible name, and all buttons have accessible names.
  2. Per-gate-state `aria-describedby` linkage: disabled Fight button has non-empty refusal description in DOM; ready and rematch buttons are enabled without stale `aria-describedby`.
  3. Cooldown announcement at `nowMs = cooldownUntil*1000 - 61000` (1:01) and `- 1000` (0:01): verified polite live region `Catnap cooldown` with no duplicate live regions or status roles across HUD + panel.
  4. Gated state non-alarming roles: verified `PowerChip` uses `role="status"` and `BossGatePanel` uses polite `aria-live`, with zero instances of `role="alert"`.
  5. Reduced motion: verified `usePrefersReducedMotion` removes animated classes and applies `transition: none`.
  6. Label formats: verified `ProgressChip` name contains "Chapter", "round", "of", and `StacksBar` keys read "of 5" from dynamic `v2.MATERIALS` catKey `maxStack`.
  7. Fixture integrity: verified each fixture satisfies types and differs in defining fields and evaluates to expected `bossGateStatus.kind`.

---

## 2. Blockers
None.

---

## 3. Files Touched
```
apps/web/src/layout/a11y/hudBossFixtures.ts
apps/web/src/layout/a11y/v2-hud-boss.a11y.test.tsx
reports/v27f-a11y-hud.md
```

---

## 4. Gate Check Output
1. `layout/hud/` on origin/main:
   - `HudBar.tsx`, `LevelXpBar.tsx`, `ProgressChip.tsx`, `StacksBar.tsx`, `PowerChip.tsx`, `index.ts` all present (Card A20 #167). -> PASS
2. `git log origin/main --oneline -- apps/web/src/layout/boss`:
   - Commit `5faabb1` ("feat(web): boss gate gated/no_key/rematch states (A21 / V19d) (#168)") present.
   - `BossGatePanel.tsx` uses `nowS` (server time in seconds; mapping 1:1 to `nowMs / 1000`). -> PASS
3. `layout/a11y/v2-hud-boss.a11y.test.tsx`:
   - Absent prior to this card.
   - Remote branches: only `ai/antigravity-v27d-a11y` existed. -> PASS

---

## 5. Verification Commands Run & Real Output

- `pnpm install --frozen-lockfile`
  ```
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Already up to date
  Done in 363ms using pnpm v10.28.0
  ```
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`
  ```
  wrote 18 Edge Function import maps
  (exit code 0)
  ```
- `pnpm typecheck`
  ```
  Scope: 6 of 7 workspace projects
  packages/auth typecheck: Done in 347ms
  packages/chain typecheck: Done in 705ms
  packages/game-rules typecheck: Done in 806ms
  supabase/tests typecheck: Done in 1.2s
  packages/api-contract typecheck: Done in 401ms
  apps/web typecheck: Done in 3.2s
  (exit code 0)
  ```
- `pnpm lint`
  ```
  Scope: 6 of 7 workspace projects
  apps/web lint: Done in 3.1s
  (exit code 0)
  ```
- `pnpm --filter @taskbar-hero/web exec vitest run src/layout/a11y src/layout/hud src/layout/boss`
  ```
  Test Files  12 passed (12)
  Tests  96 passed (96)
  Duration  1.39s
  ```
- `pnpm test`
  ```
  Test Files  76 passed (76)
  Tests  1044 passed (1044)
  Duration  7.2s
  (exit code 0)
  ```
- `pnpm build`
  ```
  ✓ 1725 modules transformed.
  dist/assets/index-CR0-bjaD.js 135.95 kB
  dist/assets/phaser-CS_hOpYn.js 1,194.43 kB
  ✓ built in 318ms
  (exit code 0)
  ```
- `cd apps/web && pnpm test:e2e`
  ```
  47 passed (15.9s)
  (exit code 0)
  ```

---

## 6. Acceptance Checklist

| Requirement / Check | Component / Scope | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1. Tab order reaches only real controls | HudBar + BossGatePanel | PASS | Focusable elements are buttons; no inputs/links; no decorative elements in tab order |
| 1b. No element has tabIndex > 0 | HudBar + BossGatePanel | PASS | All tabIndex <= 0 |
| 1c. Decorative icons aria-hidden | HudBar | PASS | All 3 PixelIcon SVGs have aria-hidden="true" |
| 1d. Decorative icons aria-hidden | BossGatePanel | FINDING | In `BossGatePanel.tsx` line 186, `<PixelIcon name="key" size={2} title="Cat Key" />` passes `title`, rendering `role="img"` instead of `aria-hidden="true"` (see Findings below) |
| 1e. Boss portrait has accessible name | BossGatePanel | PASS | `BossPortrait` renders SVG with `role="img"` and `aria-label={bossName}` |
| 1f. Every button named | BossGatePanel | PASS | Fight / Rematch button and chapter selection buttons have non-empty accessible names |
| 2. Per-gate-state disabled reason via aria-describedby | BossGatePanel (gated, no_key, cooldown, not_reached) | PASS | Disabled Fight button has `aria-describedby` pointing to visible non-empty status text |
| 2b. Ready / Rematch button enabled and clean | BossGatePanel (ready, rematch) | PASS | Buttons enabled; no stale `aria-describedby` |
| 3. Cooldown announced via single polite live region | HudBar + BossGatePanel | PASS | At 61s and 1s remaining, exactly one polite announcement `Catnap cooldown`; visible text `Catnap: 1:01` and `Catnap: 0:01` |
| 4. Non-alarming roles (no role="alert") | PowerChip + BossGatePanel | PASS | Zero alert roles; PowerChip uses `role="status"`, BossGatePanel uses polite `aria-live` |
| 5. Reduced motion support | HudBar + BossGatePanel | PASS | When active, `.hud-xp-fill--animated` removed, `.hud-xp-fill--reduced-motion` applied, `style.transition = 'none'` |
| 6. Progress chip accessible name | ProgressChip | PASS | Accessible name contains "Chapter", "round", "of" |
| 6b. Keys read "of 5" dynamically | StacksBar | PASS | Uses `v2.MATERIALS` catKey `maxStack`, not hardcoded |
| 7. Fixtures type-check and differ in defining fields | `hudBossFixtures.ts` | PASS | Tested across all 4 HUD states and 6 gate states |

---

## 7. Findings

### Finding A25a-1: Key icon in BossGatePanel exposes redundant img role
- **Component**: `apps/web/src/layout/boss/BossGatePanel.tsx`
- **Element**: Line 186: `<PixelIcon name="key" size={2} title="Cat Key" />` inside `<div className="boss-gate-keys">`
- **Rule**: WCAG 2.1 SC 1.1.1 Non-text Content (Decorative images adjacent to visible text must be `aria-hidden="true"`).
- **Issue**: Passing `title="Cat Key"` causes `PixelIcon` to render `<svg role="img" aria-label="Cat Key">`. Since it is placed immediately adjacent to `<span>Keys: {state.currencies?.keys ?? 0}</span>`, assistive tech announces both "Cat Key" and "Keys: N", causing repetitive chatter.
- **Suggested Fix**: Remove `title="Cat Key"` from `<PixelIcon name="key" size={2} />` in `BossGatePanel.tsx`, allowing it to default to `aria-hidden="true"`.
- **Owner Card**: V16 / CL5 (or next UI fix batch).

---

## 8. Hand-off Note for A25 and V16
Import fixtures from `layout/a11y/hudBossFixtures`:
```typescript
import {
  hudNormalState,
  hudGatedState,
  hudMaxKeysState,
  hudZeroCurrenciesState,
  createHudServerState,
  bossGateGatedProps,
  bossGateNoKeyProps,
  bossGateCooldownProps,
  bossGateNotReachedProps,
  bossGateRematchProps,
  bossGateReadyProps,
  createBossGateProps,
} from '../a11y/hudBossFixtures';
```

---

## 9. NOT Verified
- Live browser screen reader speech synthesizer audio output (tested via DOM accessibility tree queries in JSDOM and Playwright headless Chromium e2e tests).

---

## 10. What Is Needed to Continue
- Merge card G1 (`ai/antigravity-v27f-a11y-hud`) into main or consume fixtures in downstream stage wiring cards (V16 / CL5).
- Proceed to G2 (Player Guide text refresh).
