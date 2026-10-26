STATUS: BLOCKED

# U3 layout — round 1

## What was done

Created `ai/codex-ui-u3-layout` from freshly fetched `origin/main`, ignoring the old report branch. Implemented DESIGN 1–8 within the U3 allowlist:

- Header uses one row at >=1400px, then brand/actions and a full HUD row below at narrower widths. Removed inherited shell overrides of HUD internals so U2 owns its responsive behavior.
- Wallet remains the original WalletButton, inside a `pixel-btn--secondary` wrapper with local fallback styling. Its no-wallet link becomes a 44x44 decorative bag icon on phones while retaining the accessible name `Get a browser wallet`, href, and logic.
- Hint is a left-aligned surface-2 pill above the stage. It remains between Mini mode and wallet in DOM/tab order; absolute placement below the header and reserved main spacing preserve that order without counting the hint as header height. No underline, truncation or ellipsis; existing text wraps at 320px.
- Demo notice is a small badge in header actions. Full original sentence remains accessible and in its title; shorter visible text is `Demo · saved in this browser`.
- Desktop stage container is `clamp(200px, 40vh, 360px)`, centered with max-width 1440px. Existing phone stage sizing and whole-number canvas zoom are retained. Neither metrics.ts nor StageCanvas.tsx changed.
- Tabs have 16px pixel icons, 40px desktop height, hover surface, accent active text and a 3px bar. Four icons reuse existing art; Help has an original decorative 16x16 crisp-edge SVG. Existing tab handlers, roles, IDs, names and selection behavior remain intact.
- Phone navigation uses 56px plus safe-area padding, icons above labels, 44px minimum targets, inset labels and extra page-bottom space. Reduced-motion disables the sheet animation.
- Added the exact production `data-game-v2` marker on the existing root and a unit assertion with the flag enabled.
- Added `apps/web/e2e/ui/u3-layout.spec.ts` and committed 12 before/after screenshots using the existing sampleStateV2 fixture and its existing save conversion pattern from character-bag.spec.ts.

No existing assertion, timeout, snapshot/golden, logic, content, dependency, lock/workspace file, HUD/panel file or forbidden file was changed. No PR, merge, Actions, deploy, sharing change or live database write was performed.

## Exact blocker / stop rule

The full e2e suite fails an unchanged existing desktop stage assertion. `apps/web/e2e/layout/stage-layout.spec.ts:83` still requires 60% viewport height. U3 DESIGN 5 requires 40%, capped at 360px. At its 1280x800 viewport, the requested container is 320px; the old assertion requires 480px. Both normal and reduced-motion variants report a 160px discrepancy. Satisfying the old assertion would violate DESIGN 5.

Needed file permission: `apps/web/e2e/layout/stage-layout.spec.ts`, to align its desktop geometry assertions with the requested stage size and deliberate cropping of the unchanged whole-number canvas. Its later canvas/container difference assertion at line 91 also encodes the old layout; it was not reached in the two failing tests. This is an identified further conflict, not a claimed additional observed failure. The file is outside U3's allowlist and existing tests must remain unchanged, so product edits stopped after the full run. No assertion was weakened or edited.

The run also has three infrastructure failures: inherited `e2e/ui/u2-hud.spec.ts` explicitly uses `http://localhost:4174`; that port had no responding server. Its URL does not follow the temporary alternate-port configuration. These are reported separately from the two actual layout assertion failures. U3's own five tests pass.

One product fix round was used: the first U3 run measured a 145.796875px header at 390x844. Reduced the badge's reserved HUD margin from 20px to 14px; the unchanged <=140 assertion then passed. An intervening rerun still used the previous build after an edit command used the wrong directory; after correcting that path, the final run passed. No second product fix round was attempted because the remaining test conflict needs an out-of-allowlist edit.

Needed to continue: authorize updating the old desktop stage assertions to the new design, and run the full suite with its original 4173/4174 servers available (or make existing hard-coded test URLs configurable in a separate authorized card).

## Gate and tooling

PASS — `git fetch origin +main:refs/remotes/origin/main` (exit 0); latest main at checkout and final fetch:
```text
c87012d32c04cabe81b5d2cd1461e97cb9bbe569
c87012d Merge pull request #176 from ntbaoheyhey/ai/codex-ui-u2-hud
```

PASS — `git merge-base --is-ancestor 5f19f9b HEAD` (exit 0, no output). The requested integrated v2/CX2r base is included.

FAIL with required fallback used — `corepack enable && corepack prepare pnpm@10.28.0 --activate` (exit 127):
```text
zsh:1: command not found: corepack
```

PASS — `npx -y pnpm@10.28.0 --version`:
```text
10.28.0
```

Every direct pnpm invocation used `npx -y pnpm@10.28.0`; existing package scripts invoke pnpm through that process's PATH.

## Actual check output

PASS — `npx -y pnpm@10.28.0 install --frozen-lockfile` (initial and final runs exited 0). Final output:
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
Done in 310ms using pnpm v10.28.0
```

PASS — `npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` (exit 0; drift diff had no output):
```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/u3-layout
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

PASS — `npx -y pnpm@10.28.0 typecheck` (exit 0; final rerun):
```text
> taskbar-hero@0.0.0 typecheck /Users/bao/Documents/ChatGPT/u3-layout
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

PASS — `npx -y pnpm@10.28.0 lint` (exit 0; final rerun):
```text
> taskbar-hero@0.0.0 lint /Users/bao/Documents/ChatGPT/u3-layout
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

PASS — `npx -y pnpm@10.28.0 test` (initial run exit 0) and `VITE_GAME_V2=0 npx -y pnpm@10.28.0 test` (final run exit 0). Final real summary lines:
```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test: Done
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test: Done
packages/game-rules test:  Test Files  20 passed | 3 skipped (23)
packages/game-rules test:       Tests  330 passed | 2 expected fail | 11 skipped (343)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test: Done
apps/web test:  Test Files  83 passed (83)
apps/web test:       Tests  1083 passed (1083)
apps/web test: Done
```

The existing 3 skipped files, 11 skipped tests and 2 expected failures in game-rules were already configured in the repository; this card did not add or change skips.

PASS — `VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 build` (initial and final runs exited 0). Final summary:
```text
packages/auth build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: ✓ built in 340ms
apps/web build: Done
```

PASS — `npx -y pnpm@10.28.0 --filter @taskbar-hero/web exec vitest run src/layout/StageLayout.test.tsx` (exit 0):
```text
RUN  v5.0.5 /Users/bao/Documents/ChatGPT/u3-layout/apps/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  20:18:54
   Duration  2.60s (tests 51%, transform 19%, import 16%, environment 13%)
```

PASS — before evidence captured on the unmodified product base (only the new U3 spec had been added):
`SCREENSHOTS=1 U3_SCREENSHOT_PHASE=before U3_V2_BASE_URL=http://localhost:4274 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 exec playwright test e2e/ui/u3-layout.spec.ts --config=/tmp/u3-playwright.config.ts --project=classic --grep evidence --workers=1`
```text
(node:44971) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [classic] › e2e/ui/u3-layout.spec.ts:61:1 › evidence at all requested sizes and color schemes (3.2s)

  1 passed (6.8s)
```

FAIL, then PASS after the single CSS fix — U3 acceptance + after evidence (cwd apps/web):
`SCREENSHOTS=1 U3_V2_BASE_URL=http://localhost:4274 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 exec playwright test e2e/ui/u3-layout.spec.ts --config=/tmp/u3-playwright.config.ts --project=classic --workers=1`
Initial failure excerpt:
```text
Expected: <= 140
Received:    145.796875
1 failed
4 passed (8.0s)
```

Final real output:
```text
(node:49378) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [classic] › e2e/ui/u3-layout.spec.ts:27:3 › layout acceptance 1600x900 (495ms)
  ✓  2 [classic] › e2e/ui/u3-layout.spec.ts:27:3 › layout acceptance 1280x720 (548ms)
  ✓  3 [classic] › e2e/ui/u3-layout.spec.ts:27:3 › layout acceptance 390x844 (483ms)
  ✓  4 [classic] › e2e/ui/u3-layout.spec.ts:27:3 › layout acceptance 320x568 (542ms)
  ✓  5 [classic] › e2e/ui/u3-layout.spec.ts:61:1 › evidence at all requested sizes and color schemes (1.7s)

  5 passed (9.3s)
```

FAIL — full suite (cwd apps/web):
`U3_V2_BASE_URL=http://localhost:4274 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 test:e2e --config=/tmp/u3-playwright.config.ts --workers=2`

Infrastructure note: the first screenshot attempt using the unchanged checked-in config could not start:
```text
Error: http://localhost:4173 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
```

No other process was stopped. `/tmp/u3-playwright.config.ts` imports the unchanged repo config and only remaps servers/project base URLs 4173/4174 to 4273/4274, sets the correct absolute testDir/server cwd, and puts results in /tmp. An initial temporary-config startup attempt needed its cwd corrected. No repository config changed. The existing `classic` project discovers ui/**; U3's spec explicitly selects the v2 server because stage-layout only matches layout/**. The inherited U2 spec's explicit 4174 override is not affected by project remapping. The v2 server's original command builds with `VITE_GAME_V2=1`; Supabase URL/key were empty for every browser run.

Full-suite failure evidence and summary:
```text
1) [classic] › e2e/ui/u2-hud.spec.ts:38:3 › HUD readable at 1600x900 ─────────────────────────────

    Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/
    Call log:
      - navigating to "http://localhost:4174/", waiting until "load"


      30 |     localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      31 |   }, { key, save });
    > 32 |   await page.goto('/');
         |              ^
      33 |   await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
      34 |   await page.evaluate(() => document.fonts.ready);
      35 | }
        at openHud (/Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/ui/u2-hud.spec.ts:32:14)
        at /Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/ui/u2-hud.spec.ts:40:5

    Error Context: ../../../../../../../tmp/u3-playwright-results/ui-u2-hud-HUD-readable-at-1600x900-classic/error-context.md

  2) [classic] › e2e/ui/u2-hud.spec.ts:38:3 › HUD readable at 1280x720 ─────────────────────────────

    Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/
    Call log:
      - navigating to "http://localhost:4174/", waiting until "load"


      30 |     localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      31 |   }, { key, save });
    > 32 |   await page.goto('/');
         |              ^
      33 |   await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
      34 |   await page.evaluate(() => document.fonts.ready);
      35 | }
        at openHud (/Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/ui/u2-hud.spec.ts:32:14)
        at /Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/ui/u2-hud.spec.ts:40:5

    Error Context: ../../../../../../../tmp/u3-playwright-results/ui-u2-hud-HUD-readable-at-1280x720-classic/error-context.md

  3) [classic] › e2e/ui/u2-hud.spec.ts:38:3 › HUD readable at 390x844 ──────────────────────────────

    Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/
    Call log:
      - navigating to "http://localhost:4174/", waiting until "load"


      30 |     localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      31 |   }, { key, save });
    > 32 |   await page.goto('/');
         |              ^
      33 |   await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
      34 |   await page.evaluate(() => document.fonts.ready);
      35 | }
        at openHud (/Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/ui/u2-hud.spec.ts:32:14)
        at /Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/ui/u2-hud.spec.ts:40:5

    Error Context: ../../../../../../../tmp/u3-playwright-results/ui-u2-hud-HUD-readable-at-390x844-classic/error-context.md

  4) [stage-layout] › e2e/layout/stage-layout.spec.ts:64:5 › stage layout at 1280px ────────────────

    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 2
    Received:    160

      81 |         // Desktop: about 60% of the viewport height, never under 320 px.
      82 |         expect(s.height).toBeGreaterThanOrEqual(320);
    > 83 |         expect(Math.abs(s.height - vp.height * 0.6)).toBeLessThanOrEqual(2);
         |                                                      ^
      84 |       } else {
      85 |         // Phone: 16:9.
      86 |         expect(Math.abs(s.height / s.width - 9 / 16)).toBeLessThan(0.01);
        at /Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/layout/stage-layout.spec.ts:83:54

    Error Context: ../../../../../../../tmp/u3-playwright-results/layout-stage-layout-stage-layout-at-1280px-stage-layout/error-context.md

  5) [stage-layout] › e2e/layout/stage-layout.spec.ts:64:5 › stage layout at 1280px with reduced motion 

    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 2
    Received:    160

      81 |         // Desktop: about 60% of the viewport height, never under 320 px.
      82 |         expect(s.height).toBeGreaterThanOrEqual(320);
    > 83 |         expect(Math.abs(s.height - vp.height * 0.6)).toBeLessThanOrEqual(2);
         |                                                      ^
      84 |       } else {
      85 |         // Phone: 16:9.
      86 |         expect(Math.abs(s.height / s.width - 9 / 16)).toBeLessThan(0.01);
        at /Users/bao/Documents/ChatGPT/u3-layout/apps/web/e2e/layout/stage-layout.spec.ts:83:54

    Error Context: ../../../../../../../tmp/u3-playwright-results/layout-stage-layout-stage--2eb46--1280px-with-reduced-motion-stage-layout/error-context.md

  5 failed
    [classic] › e2e/ui/u2-hud.spec.ts:38:3 › HUD readable at 1600x900 ──────────────────────────────
    [classic] › e2e/ui/u2-hud.spec.ts:38:3 › HUD readable at 1280x720 ──────────────────────────────
    [classic] › e2e/ui/u2-hud.spec.ts:38:3 › HUD readable at 390x844 ───────────────────────────────
    [stage-layout] › e2e/layout/stage-layout.spec.ts:64:5 › stage layout at 1280px ─────────────────
    [stage-layout] › e2e/layout/stage-layout.spec.ts:64:5 › stage layout at 1280px with reduced motion 
  1 skipped
  96 passed (1.1m)
 ELIFECYCLE  Command failed with exit code 1.
```

PASS — the same full run completed existing resize.spec, stage-redraw.spec, character-bag.spec and a11y.spec checks:
```text
✓    1 [classic] › e2e/a11y.spec.ts:32:5 › Accessibility at 390px › How to play traps Tab in both directions and Escape returns focus to Menu (474ms)
  ✓    3 [classic] › e2e/a11y.spec.ts:57:5 › Accessibility at 390px › every tab is reachable with Tab and activates with Enter and Space (597ms)
  ✓    5 [classic] › e2e/a11y.spec.ts:80:5 › Accessibility at 390px › buttons and links have accessible names on onboarding and every tab (867ms)
  ✓    8 [classic] › e2e/a11y.spec.ts:94:5 › Accessibility at 390px › primary Forge text and background have at least 4.5:1 contrast (697ms)
  ✓    9 [classic] › e2e/a11y.spec.ts:121:5 › Accessibility at 390px › reduced motion leaves no running CSS animations on the Forge tab (907ms)
  ✓   10 [classic] › e2e/a11y.spec.ts:32:5 › Accessibility at 1280px › How to play traps Tab in both directions and Escape returns focus to Menu (472ms)
  ✓   12 [classic] › e2e/a11y.spec.ts:57:5 › Accessibility at 1280px › every tab is reachable with Tab and activates with Enter and Space (706ms)
  ✓   14 [classic] › e2e/a11y.spec.ts:80:5 › Accessibility at 1280px › buttons and links have accessible names on onboarding and every tab (911ms)
  ✓   16 [classic] › e2e/a11y.spec.ts:94:5 › Accessibility at 1280px › primary Forge text and background have at least 4.5:1 contrast (531ms)
  ✓   18 [classic] › e2e/a11y.spec.ts:121:5 › Accessibility at 1280px › reduced motion leaves no running CSS animations on the Forge tab (873ms)
  ✓   73 [stage-layout] › e2e/layout/character-bag.spec.ts:47:3 › character panel and bag are visible without horizontal scroll at 320px (437ms)
  ✓   75 [stage-layout] › e2e/layout/character-bag.spec.ts:65:3 › equipping from the bag updates the slot name and locked slots show their level at 320px (1.5s)
  ✓   77 [stage-layout] › e2e/layout/character-bag.spec.ts:47:3 › character panel and bag are visible without horizontal scroll at 390px (482ms)
  ✓   78 [stage-layout] › e2e/layout/character-bag.spec.ts:65:3 › equipping from the bag updates the slot name and locked slots show their level at 390px (837ms)
  ✓   80 [stage-layout] › e2e/layout/character-bag.spec.ts:47:3 › character panel and bag are visible without horizontal scroll at 1280px (423ms)
  ✓   81 [stage-layout] › e2e/layout/character-bag.spec.ts:65:3 › equipping from the bag updates the slot name and locked slots show their level at 1280px (531ms)
  ✓   82 [stage-layout] › e2e/layout/resize.spec.ts:22:40 › continuous resize preserves state and readable HUD (dark) (5.8s)
  ✓   91 [stage-layout] › e2e/layout/resize.spec.ts:22:40 › continuous resize preserves state and readable HUD (light) (5.8s)
  ✓  101 [stage-layout] › e2e/layout/stage-redraw.spec.ts:11:67 › both actors survive scene recreation (no-preference) (4.9s)
  ✓  102 [stage-layout] › e2e/layout/stage-redraw.spec.ts:11:67 › both actors survive scene recreation (reduce) (4.6s)
```

PASS — `git status --short reports/` checked after every browser run. The full run rewrote ten inherited U8 PNGs even without SCREENSHOTS=1; each was restored with `git checkout -- <file>` as instructed. No other card's report changes remain.

PASS — `git diff --check` and `git diff --exit-code -- supabase/functions pnpm-lock.yaml pnpm-workspace.yaml package.json` (both exited 0, no output).

## Acceptance

- PASS — DESIGN 1 responsive header rows; automated 390x844 header block <=140px. Visual review at 1600, 1280, 390 and 320 completed.
- PASS — DESIGN 2 original wallet behavior/name, secondary wrapper and 44x44 phone control. Automated name checks at all four sizes.
- PASS — DESIGN 3 hint pill, unchanged hint action/text, no underline (automated); two-line wrapping at 320 and no ellipsis (visual).
- PASS — DESIGN 4 compact demo badge with original full accessible sentence/title (source and screenshot review).
- PASS — DESIGN 5 40vh desktop container with 200/360 clamp and centered 1440 max width; 1280x720 tablist bottom <=720 and Inventory heading entirely in viewport; 390 stage >=200 and 320 stage >=170. Container CSS leaves canvas ownership intact.
- PASS — DESIGN 6 icons, 40px tabs, active/hover style; existing desktop tab names, keyboard reachability and arrow behavior tests pass in full run.
- PASS — DESIGN 7 phone 56px navigation plus safe area, >=44x44 items, labels >=4px inside viewport, content-bottom padding. Existing sheet/phone keyboard tests pass.
- PASS — DESIGN 8 four reused icons plus new decorative Help SVG; no dependencies or remote assets.
- PASS — no horizontal overflow at all four required viewports (U3 automated).
- PASS — production marker present with flag on (new unit and U3 browser assertions).
- PASS — existing StageLayout unit tests unchanged plus new assertion; 10 tests pass.
- FAIL — existing stage-layout.spec all-pass requirement: two desktop geometry assertions conflict with new design. All other stage-layout cases passed.
- PASS — existing resize, stage-redraw, character-bag and a11y specs pass unchanged.
- PASS — new U3 spec: 5 passed.
- PASS — classic build, full unit suite with VITE_GAME_V2=0, and classic a11y tests pass.
- PASS — reduced-motion sheet rule retained; reduced-motion stage-redraw passes.
- PASS — 12 screenshots, correct six light/dark sizes per phase, each <200,000 bytes; written only in SCREENSHOTS=1 runs for this card.
- FAIL — full e2e suite overall: 5 failed, 1 existing skipped, 96 passed.

## Screenshot evidence

```text
after-1280x720-dark.png: 1280x720, 56024 bytes
after-1280x720.png: 1280x720, 56024 bytes
after-1600x900.png: 1600x900, 90928 bytes
after-320x568.png: 320x568, 31934 bytes
after-390x844-dark.png: 390x844, 44829 bytes
after-390x844.png: 390x844, 44829 bytes
before-1280x720-dark.png: 1280x720, 47257 bytes
before-1280x720.png: 1280x720, 47257 bytes
before-1600x900.png: 1600x900, 57827 bytes
before-320x568.png: 320x568, 33788 bytes
before-390x844-dark.png: 390x844, 48452 bytes
before-390x844.png: 390x844, 48452 bytes
```

Before and after use the same existing sample fixture/save conversion. ColorScheme dark captures are intentionally visually identical because the theme stays dark plum in both OS schemes. Screenshots are viewport captures, not full-page captures.

## NOT verified

- Complete green e2e status: blocked by the exact failures above.
- Three U2 direct-4174 geometry tests under the temporary-port run; they failed to connect rather than asserting geometry.
- Later assertions in each of the two failing old desktop stage cases, including line 91, were not reached.
- Live hosted CX5 check, signed-in wallet flow and live backend were not exercised; no live service writes were attempted.

## Files touched / final delivery checks

The actual committed scope/stat, author and push output are recorded after the implementation commit below. Only U3 allowlisted files and evidence are included.

PASS — `git fetch origin +main:refs/remotes/origin/main && git diff --name-only origin/main...HEAD` after implementation commit `589e087`; automated allowlist validation passed:

```text
apps/web/e2e/ui/u3-layout.spec.ts
apps/web/src/layout/HintChip.tsx
apps/web/src/layout/StageLayout.test.tsx
apps/web/src/layout/StageLayout.tsx
apps/web/src/layout/layout.css
apps/web/src/layout/tabIcons.tsx
reports/u3-layout.md
reports/u3-layout/after-1280x720-dark.png
reports/u3-layout/after-1280x720.png
reports/u3-layout/after-1600x900.png
reports/u3-layout/after-320x568.png
reports/u3-layout/after-390x844-dark.png
reports/u3-layout/after-390x844.png
reports/u3-layout/before-1280x720-dark.png
reports/u3-layout/before-1280x720.png
reports/u3-layout/before-1600x900.png
reports/u3-layout/before-320x568.png
reports/u3-layout/before-390x844-dark.png
reports/u3-layout/before-390x844.png
```

PASS — `git diff --stat origin/main...HEAD` at `589e087` (before adding this delivery evidence):

```text
 apps/web/e2e/ui/u3-layout.spec.ts          |  76 ++++++
 apps/web/src/layout/HintChip.tsx           |   4 +-
 apps/web/src/layout/StageLayout.test.tsx   |   5 +
 apps/web/src/layout/StageLayout.tsx        |  29 ++-
 apps/web/src/layout/layout.css             | 282 ++++++++++++--------
 apps/web/src/layout/tabIcons.tsx           |   7 +
 reports/u3-layout.md                       | 400 +++++++++++++++++++++++++++++
 reports/u3-layout/after-1280x720-dark.png  | Bin 0 -> 56024 bytes
 reports/u3-layout/after-1280x720.png       | Bin 0 -> 56024 bytes
 reports/u3-layout/after-1600x900.png       | Bin 0 -> 90928 bytes
 reports/u3-layout/after-320x568.png        | Bin 0 -> 31934 bytes
 reports/u3-layout/after-390x844-dark.png   | Bin 0 -> 44829 bytes
 reports/u3-layout/after-390x844.png        | Bin 0 -> 44829 bytes
 reports/u3-layout/before-1280x720-dark.png | Bin 0 -> 47257 bytes
 reports/u3-layout/before-1280x720.png      | Bin 0 -> 47257 bytes
 reports/u3-layout/before-1600x900.png      | Bin 0 -> 57827 bytes
 reports/u3-layout/before-320x568.png       | Bin 0 -> 33788 bytes
 reports/u3-layout/before-390x844-dark.png  | Bin 0 -> 48452 bytes
 reports/u3-layout/before-390x844.png       | Bin 0 -> 48452 bytes
 19 files changed, 683 insertions(+), 120 deletions(-)
```

PASS — `git log --format='%an <%ae>' origin/main..HEAD` at `589e087`:

```text
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

PASS — `git push -u origin ai/codex-ui-u3-layout` after implementation commit `589e087` (exit 0):

```text
To https://github.com/ntbaoheyhey/taskbar-hero.git
 * [new branch]      ai/codex-ui-u3-layout -> ai/codex-ui-u3-layout
branch 'ai/codex-ui-u3-layout' set up to track 'origin/ai/codex-ui-u3-layout'.
```

This final delivery evidence is committed and pushed as a report-only follow-up on the same branch. STATUS remains BLOCKED; no green full-suite claim is made.
