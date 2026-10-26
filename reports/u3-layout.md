STATUS: BLOCKED

# U3 layout

## What was done

Read the complete card and repository verification script; fetched the required base and main; verified pnpm 10.28.0 using the mandated fallback; ran the report-only checks. No product implementation was started. Created isolated branch `codex/u3-layout-report` from `origin/main` as required for a stop before work. Existing unrelated edits in the original checkout were preserved.

## Exact blocker

FAIL — The required implementation base and final scope gate conflict. `origin/ai/codex-integrate-v2-stage` is exactly `577faae`, but `git diff --name-only origin/main...577faae` already includes files outside the card allowlist. Self-check 3 requires every line of `origin/main...HEAD` to be allowlisted and directs reverting other files to main. Doing that would modify expressly forbidden `apps/web/src/game/stage/StageCanvas.tsx`, HUD-adjacent/panel code, Playwright configuration, game logic and other cards' evidence. The hard stop on files outside the allowlist takes precedence over attempting such changes. No fix rounds or workarounds were attempted.

Needed to continue: clarify that inherited integration changes are exempt and apply the scope gate to `577faae...HEAD`, or provide a base/main combination where inherited changes pass the existing gate. No expanded product-file access is otherwise requested.

## Gate output

PASS — `git fetch origin ai/codex-integrate-v2-stage`
```text
From https://github.com/ntbaoheyhey/taskbar-hero
 * branch            ai/codex-integrate-v2-stage -> FETCH_HEAD
```

PASS — `git merge-base --is-ancestor 577faae origin/ai/codex-integrate-v2-stage` exited 0 (no output).

PASS — `git fetch origin +main:refs/remotes/origin/main` exited 0.

PASS — `git rev-parse origin/main origin/ai/codex-integrate-v2-stage`
```text
337977751204b5ea59d8f0cabfb91fb4cd4a391f
577faaeef7868bb5c013d54f17f8ea761c53d4b2
```

FAIL — implementation scope gate: actual output of `git diff --name-only origin/main...577faae`:
```text
apps/web/e2e/layout/arena.spec.ts
apps/web/e2e/layout/character-bag.spec.ts
apps/web/e2e/layout/resize.spec.ts
apps/web/e2e/layout/stage-layout.spec.ts
apps/web/e2e/layout/stage-redraw.spec.ts
apps/web/e2e/v2/loop.spec.ts
apps/web/playwright.config.ts
apps/web/src/dev/ArenaPreview.tsx
apps/web/src/game/arena/ArenaScene.test.ts
apps/web/src/game/arena/ArenaScene.ts
apps/web/src/game/arena/BossArena.test.tsx
apps/web/src/game/arena/BossArena.tsx
apps/web/src/game/arena/arena.css
apps/web/src/game/arena/assets.ts
apps/web/src/game/arena/index.ts
apps/web/src/game/arena/playBossFight.ts
apps/web/src/game/arena/playback.test.ts
apps/web/src/game/arena/playback.ts
apps/web/src/game/stage/StageCanvas.tsx
apps/web/src/game/stage/StageScene.test.ts
apps/web/src/game/stage/StageScene.ts
apps/web/src/game/stage/bulkEquip.test.ts
apps/web/src/game/stage/progress.ts
apps/web/src/game/stage/relicWiring.test.ts
apps/web/src/game/stage/relicWiring.ui.test.tsx
apps/web/src/game/stage/storeV2.test.ts
apps/web/src/game/v2/storeV2.ts
apps/web/src/layout/StageLayout.test.tsx
apps/web/src/layout/StageLayout.tsx
apps/web/src/layout/a11y/v2-components.a11y.test.tsx
apps/web/src/layout/boss/BossGatePanel.test.tsx
apps/web/src/layout/boss/BossGatePanel.tsx
apps/web/src/layout/layout.css
apps/web/src/main.tsx
docs/prompts/antigravity-responsive-qa.md
docs/prompts/antigravity-responsive-retest.md
docs/prompts/codex-responsive-review.md
docs/responsive-coordination.md
reports/fix-bulk-equip.md
reports/fix-decorative-key.md
reports/fix-sheet-focus.md
reports/fix-stage-redraw.md
reports/fix-stage-redraw/actors-1600-900.png
reports/fix-stage-redraw/actors-320-568.png
reports/fix-stage-redraw/actors-390-844.png
reports/integrate-v2-stage.md
reports/responsive-window.md
reports/responsive-window/dark-1280-720.png
reports/responsive-window/dark-1600-900.png
reports/responsive-window/dark-320-568.png
reports/responsive-window/dark-390-844.png
reports/responsive-window/initial-partial-report.txt
reports/responsive-window/light-1280-720.png
reports/responsive-window/light-1600-900.png
reports/responsive-window/light-320-568.png
reports/responsive-window/light-390-844.png
reports/v16-stage.md
reports/v16-stage/stage-1280.png
reports/v16-stage/stage-390.png
reports/v19-arena.md
reports/v19-arena/1280.png
reports/v19-arena/390-reduced.png
reports/v20b-relic-wiring.md
reports/v26-e2e.md
reports/v26-e2e/equip-1280.png
reports/v26-e2e/equip-390-reduced.png
reports/v26-e2e/equip-390.png
reports/v26-e2e/forge-1280.png
reports/v26-e2e/forge-390-reduced.png
reports/v26-e2e/forge-390.png
reports/v26-e2e/fresh-1280.png
reports/v26-e2e/fresh-390-reduced.png
reports/v26-e2e/fresh-390.png
reports/v26-e2e/idle-1280.png
reports/v26-e2e/idle-390-reduced.png
reports/v26-e2e/idle-390.png
reports/v26-e2e/loss-1280.png
reports/v26-e2e/loss-390-reduced.png
reports/v26-e2e/loss-390.png
reports/v26-e2e/reload-1280.png
reports/v26-e2e/reload-390-reduced.png
reports/v26-e2e/reload-390.png
reports/v26-e2e/win-1280.png
reports/v26-e2e/win-390-reduced.png
reports/v26-e2e/win-390.png
```

## Checks run

FAIL — `corepack enable && corepack prepare pnpm@10.28.0 --activate && pnpm --version` (exit 127):
```text
zsh:1: command not found: corepack
```

PASS — mandated fallback `npx -y pnpm@10.28.0 --version`:
```text
10.28.0
```

PASS — `npx -y pnpm@10.28.0 install --frozen-lockfile` (exit 0), actual summary:
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10.
Done in 12.5s using pnpm v10.28.0
```

PASS — `npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` (exit 0):
```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/u3-layout-report
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```
The subsequent git diff had no output. No migration or live database operation ran.

PASS — `git diff --exit-code -- pnpm-lock.yaml pnpm-workspace.yaml package.json` (exit 0, no output). Dependencies, lock and workspace files were not changed.

Full suite skipped: docs only.

NOT VERIFIED — `npx -y pnpm@10.28.0 typecheck` (not run).
NOT VERIFIED — `npx -y pnpm@10.28.0 lint` (not run).
NOT VERIFIED — `npx -y pnpm@10.28.0 test` (not run).
NOT VERIFIED — `npx -y pnpm@10.28.0 build` (not run).
NOT VERIFIED — `cd apps/web && npx -y pnpm@10.28.0 test:e2e` (not run).
NOT VERIFIED — classic `VITE_GAME_V2=0` build and tests (not run).
NOT VERIFIED — v2 demo mode with empty Supabase env (not launched).

## Acceptance

- NOT VERIFIED — responsive header rows and header/HUD block height <= 140px at 390x844.
- NOT VERIFIED — secondary/ghost wallet, 44x44 icon on phones, accessible name at 1280 and 390.
- NOT VERIFIED — hint pill, two-line wrapping, no underline, original behavior/text preserved by implementation.
- NOT VERIFIED — demo badge and retained full accessible sentence.
- NOT VERIFIED — desktop stage clamp/max width, visible tabs and first panel heading at 1280x720.
- NOT VERIFIED — phone stage >= 200px at 390x844 and >= 170px at 320x568.
- NOT VERIFIED — desktop tab visuals and preserved tab semantics/keyboard behavior.
- NOT VERIFIED — 56px phone navigation, >= 44x44 items, labels inside viewport with >= 4px margin, safe-area/content padding.
- NOT VERIFIED — tab icons and reduced-motion behavior.
- NOT VERIFIED — no horizontal overflow at 1600x900, 1280x720, 390x844 and 320x568.
- NOT VERIFIED — existing StageLayout unit tests and stage-layout, resize, stage-redraw, character-bag, a11y specs unchanged and passing (not run).
- NOT VERIFIED — new `apps/web/e2e/ui/u3-layout.spec.ts` measurable checks (not created; gate stop).
- NOT VERIFIED — before/after light and dark screenshots (not captured; gate stop; SCREENSHOTS=1 was not used).
- PASS — no existing tests/assertions, timeouts, golden numbers, content, forbidden files or sharing settings changed.
- PASS — no PR, merge, deploy, GitHub Actions, contest submission, database writes, or auth/contract changes performed.

## Files touched and delivery

Only `reports/u3-layout.md` belongs to this report-only branch. Final committed scope, author, stat and push checks are appended below after execution. The implementation scope failure above is distinct from the report-only scope check.

PASS — report-only scope, `git diff --name-only origin/main...HEAD`:
```text
reports/u3-layout.md
```

PASS — `git diff --stat origin/main...HEAD` at first report commit `e8e616a` (before appending this delivery evidence):
```text
 reports/u3-layout.md | 185 +++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 185 insertions(+)
```

PASS — `git log --format='%an <%ae>' origin/main..HEAD` at first report commit:
```text
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

PASS — `git push -u origin codex/u3-layout-report` (exit 0):
```text
To https://github.com/ntbaoheyhey/taskbar-hero.git
 * [new branch]      codex/u3-layout-report -> codex/u3-layout-report
branch 'codex/u3-layout-report' set up to track 'origin/codex/u3-layout-report'.
```

Only this report was pushed; no PR was created. This appended delivery evidence is committed and pushed as a follow-up on the same task branch.
