STATUS: BLOCKED

U7 stage feedback was stopped before product edits because the required base and mandatory main-relative allowlist check conflict. Only this report was created. The original checkout's unrelated local changes were preserved; work used a separate worktree.

## Exact blocker and required decision

PASS — required base is reachable: `git fetch origin ai/codex-integrate-v2-stage` succeeded and `git merge-base --is-ancestor 577faae origin/ai/codex-integrate-v2-stage` exited 0.

```text
origin/ai/codex-integrate-v2-stage: 577faaeef7868bb5c013d54f17f8ea761c53d4b2
origin/main: 337977751204b5ea59d8f0cabfb91fb4cd4a391f
```

FAIL — the mandatory scope predicate for `git diff --name-only origin/main...HEAD` would fail immediately on the specified base. `git diff --name-only origin/main...577faae` lists 85 files, many outside this card's allowlist. The Git command itself exits 0; the failure is its disallowed output, not a test failure. Examples: `apps/web/src/game/stage/StageCanvas.tsx` (explicitly CX2-owned), `apps/web/playwright.config.ts`, `apps/web/src/game/v2/storeV2.ts`, and arena/backdrop-related files. Reverting inherited changes as self-check step 3 directs would itself edit forbidden files and invalidate the required integrated base. Self-check step 5 says STOP if the fix needs files outside the allowlist. No fix rounds were attempted.

Needed to continue: authorize checking U7's scope relative to `577faae` while exempting inherited integration changes from the main-relative allowlist, or provide an integrated base already on main. No additional product file ownership is needed if inherited changes are exempted. Otherwise the exact files needing scope exceptions are listed below. This report uses the explicitly required report-only fallback from origin/main.

## Tooling and real checks

PASS — fallback tool version:

```text
$ corepack enable && corepack prepare pnpm@10.28.0 --activate && pnpm --version
zsh:1: command not found: corepack
$ npx -y pnpm@10.28.0 --version
10.28.0
```

Corepack was unavailable; every pnpm invocation used `npx -y pnpm@10.28.0`.

PASS — `npx -y pnpm@10.28.0 install --frozen-lockfile` on the report-only branch, exit 0:

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10.
Done in 10.2s using pnpm v10.28.0
```

PASS — `npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` on the report-only branch, exit 0:

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/taskbar-hero-u7-report
> node scripts/gen-deno-json.mjs
wrote 18 Edge Function import maps
```

No generated drift. No migrations or database writes were run.

Full suite skipped: docs only. NOT VERIFIED — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `cd apps/web && pnpm test:e2e`; not run under the explicit report/docs-only exception. NOT VERIFIED — classic build/tests, stage-redraw.spec, resize.spec and U7 e2e; no product implementation was made.

## Acceptance

- PASS — base reachability and exact pnpm fallback version.
- PASS — own report-only task branch; original dirty checkout preserved.
- PASS — no product, forbidden, dependency, lock/workspace, auth or content files changed; no PR, Actions, merge, deploy, sharing change, or live database operation.
- NOT VERIFIED — floor alignment and documented floor computation.
- NOT VERIFIED — actor shadows and monster size clamp/crisp scales.
- NOT VERIFIED — hit flash, shake, damage/Miss text and big-hit treatment.
- NOT VERIFIED — existing monster HP availability and HP bar.
- NOT VERIFIED — reduced-motion behavior.
- NOT VERIFIED — stageFx helper unit tests and existing StageScene tests.
- NOT VERIFIED — unchanged stage-redraw/resize checks.
- NOT VERIFIED — U7 normal/reduced-motion 3-frame feedback checks and console checks.
- NOT VERIFIED — before/after screenshot sets and damage-number frame; no PNGs written.
- PASS — no tests or assertions changed, skipped, weakened or deleted; no timeouts or golden numbers changed.

## Required base scope evidence

`git diff --name-only origin/main...577faae`:

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

PASS — all inherited commit author lines from `git log --format='%an <%ae>' origin/main..577faae` have the required identity:

```text
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

## Report branch verification

Report-only branch: `codex/u7-stage-fx-report`, based on origin/main. The main-relative diff must contain only `reports/u7-stage-fx.md`. The required base-relative comparison is retained as evidence rather than claimed as an implemented U7 diff. Final diff stat, author and push results follow.
