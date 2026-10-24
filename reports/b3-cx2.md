# B3-CX2 — Keyboard and accessibility specs

Branch: `ai/codex-b3-cx2`. Base: `origin/main` at `fde8909`, including theme PR #42 (`6802dc5`).

## Changes

Added only `apps/web/e2e/a11y.spec.ts` plus this report, with ten specs covering 390px and 1280px viewports:

- Onboarding traps forward and backward Tab across both boundaries twice; Escape closes it and returns focus to Menu.
- All five tabs are reached through actual Tab navigation and activated with both Enter and Space. Assertions verify the selected tab and associated visible panel.
- Every visible button and link has a nonempty browser-computed accessible name on onboarding, the closed shell, and every tab, including disabled controls.
- The primary Forge button's computed text/background sRGB colors satisfy the WCAG relative-luminance contrast formula at 4.5:1 or higher.
- Reduced-motion emulation leaves no running CSS animations anywhere in the document on the settled Forge tab, including pseudo-elements. Screenshots at both widths are saved and attached to Playwright results.

No dependencies, application changes, labels, class names, test IDs, rules, contracts, or database changes.

## Commands and results

All commands ran locally from the repository root unless otherwise noted.

| Exact command | Result / output |
| --- | --- |
| `git config user.email` | PASS: `108352255+ntbaoheyhey@users.noreply.github.com` |
| `git config user.name` | PASS: `ntbaoheyhey` |
| `git fetch origin main ai/codex-b3-cx2` | FAIL: `fatal: couldn't find remote ref ai/codex-b3-cx2`; the task branch did not exist yet. |
| `git fetch origin main` | PASS: updated `origin/main` to `fde8909`. |
| `git switch -c ai/codex-b3-cx2 origin/main` | PASS: created the requested branch. |
| `pnpm install` | PASS (exit 0): lockfile up to date, already up to date; warning about ignored optional dependency build scripts (`bufferutil`, `keccak`, `utf-8-validate`). |
| `pnpm typecheck` | PASS (exit 0): all workspace typechecks completed with `Done`. |
| `pnpm lint` | PASS (exit 0): all workspace lint commands completed with `Done`. |
| `pnpm test` | PASS (exit 0): chain 7, game-rules 63, auth 24, Supabase 301, api-contract 16, web 188 tests passed (599 total). |
| `pnpm build` | PASS (exit 0): workspace builds completed; Vite `built in 463ms`. |
| `pnpm --filter @taskbar-hero/web test:e2e` (first run) | FAIL (exit 1): `2 failed, 24 passed (20.5s)`. New keyboard specs sent Escape before onboarding's focus effect completed. Fixed by waiting for Start playing to receive focus before Escape. |
| `pnpm --filter @taskbar-hero/web test:e2e` (second run) | PASS (exit 0): `26 passed (8.9s)`, including all ten new specs. |
| `pnpm --filter @taskbar-hero/web test` | PASS (exit 0): `Test Files 23 passed (23)`, `Tests 188 passed (188)`. |
| `pnpm --filter @taskbar-hero/web build` | PASS (exit 0): TypeScript passed; Vite `built in 353ms`. |
| `pnpm --filter @taskbar-hero/web test:e2e` (final run after latest production build) | PASS (exit 0): `26 passed (8.8s)`. |
| `git diff --check` | PASS (exit 0): no output. |

## Scope and open questions

- The contrast check compares computed CSS text/background colors. Demo's Forge button is disabled; this is a color-pair regression check, not an audit of the composited appearance of disabled opacity.
- The reduced-motion check permits the existing brief entrance fade to settle using Playwright polling; it rejects running animations on the settled tab. It does not trigger the Forge reveal, which existing `polish.spec.ts` tests separately.
- Wallet-only, signed-in, and minted-Relic controls are outside the demo-state accessible-name checks.
- Screenshots are generated under ignored `apps/web/test-results/` and attached to Playwright results, rather than committed outside the allowed file list.
- No PR or merge: followed the explicit no-PR rule despite the later generic redesign instruction requesting a draft PR. No contract changes, so `forge test` was not applicable.
