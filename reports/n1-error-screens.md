STATUS: DONE

# MISSION AGN1 - Clear, calm error screens: rate limit wait, server busy, offline, wrong wallet

- **Branch**: `ai/antigravity-n1-error-screens`
- **Base**: `origin/main`
- **Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
- **Tooling**: pnpm version `10.28.0` (`corepack prepare pnpm@10.28.0 --activate`)

---

## 1. Executive Summary

Implemented clear, calm, accessible error states across Taskbar Hero v2:
1. **Piece 1 (Typed API Errors)**: `SupabaseGameApiV2.ts` parses HTTP 429 (`rate_limited` with clamped `retryAfterS` 1..300, defaulting to 5 s), HTTP 503 (`server_busy`), and `fetch TypeError` / offline state (`offline`).
2. **Piece 2 (ActionNotice Component)**: New `ActionNotice.tsx` and `ActionNotice.css` in `apps/web/src/layout/notice/`. Renders a calm plum status bar inside active panels with `role="status"` and `aria-live="polite"`. Implements live countdown for `rate_limited` disabling action buttons until 0, then re-enabling them without automatic re-submission. Displays friendly cafe copy for `server_busy` and `offline` (with auto-dismissal on window `'online'` event). Reduced motion disables animation; keyboard focus is never stolen.
3. **Piece 3 (Wrong Wallet Client Guard)**: In `MintPanel.tsx`, case-insensitive address comparison between connected wallet and `voucher.player`. Renders `data-testid="mint-wrong-wallet"` ("This Relic belongs to 0x1234...abcd. Switch to that wallet to mint it.") and suppresses the Mint button with zero contract calls.
4. **Piece 4 (Tests and Evidence)**: Full unit and end-to-end test coverage. 8 screenshots generated across viewports (1280x720 and 390x844) in both light and dark themes.

---

## 2. Test Cases (T1 - T12)

| Test Case | Description | Result | Verification Notes |
|:---|:---|:---:|:---|
| **T1** | 429 with body `retryAfter: 7` -> notice says 7 s and counts down | **PASS** | Unit: `SupabaseGameApiV2.test.ts`. E2E: `errors-notice.spec.ts` intercepts `/v2-claim` returning `{ error: 'rate_limited', retryAfter: 7 }`, verifies notice displays "Easy, hero! Try again in 7s." and counts down. |
| **T2** | 429 header only (`Retry-After: 12`) -> uses header value | **PASS** | Unit: `parseRetryAfter(undefined, '12')` returns `12`. Verified in `SupabaseGameApiV2.test.ts`. |
| **T3** | 429 with neither body nor header -> 5 s default | **PASS** | Unit: `parseRetryAfter(undefined, null)` returns default `5`. Verified in `SupabaseGameApiV2.test.ts`. |
| **T4** | 429 `retryAfter: 9999` -> clamped to 300 s | **PASS** | Unit: `parseRetryAfter(9999, null)` clamped to `300` (min 1, max 300). Verified in `SupabaseGameApiV2.test.ts`. |
| **T5** | Action button disabled during countdown, re-enabled at 0, no auto-resubmit | **PASS** | E2E: Craft button on Forge tab is disabled during 429 countdown and re-enabled once seconds reach 0 without re-triggering the craft call. |
| **T6** | 503 -> busy text, store state unchanged (snapshot equal) | **PASS** | E2E: Intercept `/v2-claim` with 503 -> displays "The cafe kitchen is busy. Nothing was spent. Try again in a minute." Authoritative store state snapshot strictly preserved before and after error. |
| **T7** | Offline -> offline text; online event clears it | **PASS** | E2E: Simulates offline -> displays "You are offline. Your cat keeps working; we will sync when you are back." Triggering `window.dispatchEvent(new Event('online'))` automatically clears the notice. |
| **T8** | Wrong wallet -> `mint-wrong-wallet` visible, Mint button absent/disabled, zero contract calls | **PASS** | Unit & E2E: Connected address differing from `voucher.player` renders `data-testid="mint-wrong-wallet"`, hides Mint button, and makes 0 contract calls. |
| **T9** | Same address different case -> normal Mint button | **PASS** | Unit & E2E: Lowercase voucher address compared against checksummed uppercase connected wallet renders the normal Mint button. |
| **T10** | Axe/a11y spec passes; notice has `role="status"` and `aria-live="polite"` | **PASS** | Unit: 38 a11y tests in `src/layout/a11y/` pass. `ActionNotice` does not autofocus or steal tab index. |
| **T11** | Classic build and classic Playwright project pass | **PASS** | Playwright classic project: 38 passed (`pnpm exec playwright test --project=classic`). |
| **T12** | Full shared-rules suite green | **PASS** | Full E2E suite: 240 passed (`cd apps/web && pnpm test:e2e`). Web unit tests: 106 test files, 1268 tests passed. All workspace unit tests, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm gen:deno` clean. |

---

## 3. Evidence Screenshots

Captured in `reports/n1-error-screens/` (8 PNG files, all under 100 KB, well within the 200 KB limit):

| File | Scenario | Viewport | Theme | Size |
|:---|:---|:---:|:---:|:---:|
| `429-1280x720-dark.png` | Rate limit countdown ("Easy, hero! Try again in 3s.") | 1280x720 | Dark | ~28 KB |
| `429-390x844-light.png` | Rate limit countdown on mobile | 390x844 | Light | ~58 KB |
| `503-1280x720-dark.png` | Server busy notice ("The cafe kitchen is busy...") | 1280x720 | Dark | ~92 KB |
| `503-390x844-light.png` | Server busy notice on mobile | 390x844 | Light | ~59 KB |
| `offline-1280x720-dark.png` | Offline notice ("You are offline...") | 1280x720 | Dark | ~94 KB |
| `offline-390x844-light.png` | Offline notice on mobile | 390x844 | Light | ~61 KB |
| `wrong-wallet-1280x720-dark.png` | Wrong wallet mint guard (`mint-wrong-wallet`) | 1280x720 | Dark | ~32 KB |
| `wrong-wallet-390x844-light.png` | Wrong wallet mint guard on mobile | 390x844 | Light | ~74 KB |

---

## 4. Verification Output Summary

### Playwright E2E Suite (`cd apps/web && pnpm test:e2e`)
```text
Running 240 tests using 6 workers
  240 passed (58.6s)
```

### New E2E Tests (`apps/web/e2e/v2/errors-notice.spec.ts`)
```text
Running 5 tests using 1 worker
  ✓  1 [v2-server] › e2e/v2/errors-notice.spec.ts:32:7 › 429 rate limit displays notice with countdown and disables action button (2.5s)
  ✓  2 [v2-server] › e2e/v2/errors-notice.spec.ts:70:7 › 503 server busy displays cafe kitchen message without altering store state (2.2s)
  ✓  3 [v2-server] › e2e/v2/errors-notice.spec.ts:98:7 › offline notice appears when offline and clears on online event (2.2s)
  ✓  4 [v2-server] › e2e/v2/errors-notice.spec.ts:121:7 › wrong wallet shows warning and suppresses mint button (2.1s)
  ✓  5 [v2-server] › e2e/v2/errors-notice.spec.ts:167:7 › case-insensitive wallet match shows normal mint button (2.2s)
  5 passed (11.8s)
```

### Classic Playwright Suite (`pnpm exec playwright test --project=classic`)
```text
Running 38 tests using 6 workers
  38 passed (14.2s)
```

### Unit Tests (`pnpm --filter @taskbar-hero/web exec vitest run`)
```text
Test Files  106 passed (106)
     Tests  1268 passed (1268)
```

### Workspace Unit Tests (`pnpm test`)
```text
@taskbar-hero/game-rules test: 7 passed
@taskbar-hero/auth test: 6 passed
@taskbar-hero/chain test: 8 passed
@taskbar-hero/supabase test: 1 passed
@taskbar-hero/web test: 1268 passed
```

### Quality & Drift Checks
- `pnpm typecheck`: 6 workspace packages passed with 0 errors.
- `pnpm lint`: clean, no lint errors.
- `pnpm build`: clean build across all workspace packages and apps.
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`: clean (0 diff).
- `node scripts/check-links.mjs`: verified 1 pre-existing broken link from main (`docs/security-test-matrix.md:15`), 0 new broken links introduced.

---

## 5. Scope & Tier Classifications

### Tier 1 (Your Zone)
- `apps/web/src/api/SupabaseGameApiV2.ts`: 429/503/offline error handling and `parseRetryAfter`.
- `apps/web/src/api/GameApiV2.ts`: `GameApiErrorCodeV2` union extension and `retryAfter` on `GameApiErrorBodyV2`.
- `apps/web/src/api/GameApiErrorV2.ts`: `retryAfterS` property and error code checks.
- `apps/web/src/game/v2/storeV2.ts`: `ActionNoticeState` store, online/offline listeners, `withNoticeGuardV2`.
- `apps/web/src/layout/notice/ActionNotice.tsx` & `ActionNotice.css`: New notice bar component and styles.
- `apps/web/src/v2text/errorNotices.ts` & `apps/web/src/v2text/errorNotices.test.ts`: Centralized copy text and helper functions.
- `apps/web/src/v2text/blockReasons.ts`: Extended error reason mappings.
- `apps/web/src/forge/MintPanel.tsx` & `apps/web/src/forge/MintPanel.test.tsx`: Case-insensitive wrong-wallet check and tests.
- Panels rendering notice: `BossGatePanel.tsx`, `ForgePanel.tsx`, `BagPanel.tsx`, `CharacterPanel.tsx`.
- `apps/web/e2e/v2/errors-notice.spec.ts`: E2E test suite.
- `reports/n1-error-screens.md` & `reports/n1-error-screens/*.png`: Mission report and screenshots.

### Tier 2 (Adjacent Files / Test Infrastructure)
- `apps/web/e2e/support/test.ts`: Routing guard update to run `errors-notice.spec.ts` under `v2-server` (where real HTTP network interception occurs).
- `apps/web/playwright.config.ts`: Excluded `errors-notice.spec.ts` from mock `v2-loop` project and assigned to `v2-server`.
- `apps/web/src/layout/StageLayout.tsx` & `StageLayout.test.tsx`: Suppressed duplicate notice toast when errors are handled by `ActionNotice`; updated test mock store for `useActionNoticeState`.
- `apps/web/src/api/SupabaseGameApiV2.test.ts`: Updated unit tests for typed 503 (`server_busy`) and TypeError (`offline`) responses and added 429 parsing test suite.
- `apps/web/src/forge/ForgeTab.test.tsx`: Mock store stub for `useActionNoticeState`.
- `apps/web/src/game/stage/storeV2.test.ts`: Added unit tests verifying `ActionNoticeState` dispatch, online/offline auto-dismissal, and state preservation.

### Tier 3 (Hard Stops - Strictly Untouched)
- No changes to `contracts/**`.
- No changes to `packages/api-contract` (Codex CXN1 zone).
- No changes to SIWE / auth (`WalletButton.tsx`, `authApi.ts`, `siwe.ts`).
- No changes to `.github/**`.
- No live database writes or on-chain transactions.

---

## 6. Git Diff Stat

```text
 apps/web/e2e/support/test.ts                     |   5 +-
 apps/web/e2e/v2/errors-notice.spec.ts            | 213 +++++++++++++++++++++++
 apps/web/playwright.config.ts                    |   3 +-
 apps/web/src/api/GameApiErrorV2.ts               |  13 ++-
 apps/web/src/api/GameApiV2.ts                    |   7 +-
 apps/web/src/api/SupabaseGameApiV2.test.ts       |  65 ++++++-
 apps/web/src/api/SupabaseGameApiV2.ts            |  33 ++++
 apps/web/src/forge/ForgeTab.test.tsx             |   4 +-
 apps/web/src/forge/MintPanel.test.tsx            | 136 +++++++++++++++
 apps/web/src/forge/MintPanel.tsx                 |   5 +-
 apps/web/src/game/stage/storeV2.test.ts          |  71 +++++++-
 apps/web/src/game/v2/storeV2.ts                  | 107 +++++++++++-
 apps/web/src/layout/StageLayout.test.tsx         |   3 +-
 apps/web/src/layout/StageLayout.tsx              |  12 +-
 apps/web/src/layout/bag/BagPanel.tsx             |   2 +
 apps/web/src/layout/boss/BossGatePanel.tsx       |   2 +
 apps/web/src/layout/character/CharacterPanel.tsx |   2 +
 apps/web/src/layout/forge/ForgePanel.tsx         |   2 +
 apps/web/src/layout/notice/ActionNotice.css      |  48 +++++
 apps/web/src/layout/notice/ActionNotice.tsx      |  69 ++++++++
 apps/web/src/v2text/blockReasons.ts              |   3 +
 apps/web/src/v2text/errorNotices.test.ts         |  37 ++++
 apps/web/src/v2text/errorNotices.ts              |  39 +++++
 23 files changed, 867 insertions(+), 24 deletions(-)
```
