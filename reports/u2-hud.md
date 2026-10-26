STATUS: BLOCKED

U2 HUD: report-only stop before product edits. No HUD implementation or screenshots were made.

## Exact blocker

The required integrated base and final scope requirement conflict. `origin/ai/codex-integrate-v2-stage` is exactly `577faaeef7868bb5c013d54f17f8ea761c53d4b2` and is reachable, but `git diff --name-only origin/main...577faae` contains 85 inherited files, all outside the U2 allowlist. The self-check requires every line relative to origin/main to be allowed and asks to revert other files; doing so would edit other cards' files, including the explicitly forbidden apps/web/src/game/stage/StageCanvas.tsx. The hard ownership stop takes precedence. No fix rounds were attempted because resolving this requires changes outside the allowlist or revised instructions.

Needed to continue: authorize final scope checking against 577faae for inherited changes (while allowing only U2 changes thereafter), or first integrate the required base into main. No extra product file permission is needed if the comparison rule is corrected. Otherwise the inherited files listed below would need permission to revert, contradicting the required integrated stack and StageCanvas ownership restriction.

The requested report-only fallback branch was created from origin/main at 337977751204b5ea59d8f0cabfb91fb4cd4a391f. Existing dirty changes in the original checkout were left untouched; all checks ran in an isolated worktree.

## Gate checks and real output

PASS — `git fetch origin ai/codex-integrate-v2-stage`
```
From https://github.com/ntbaoheyhey/taskbar-hero
 * branch            ai/codex-integrate-v2-stage -> FETCH_HEAD
```
PASS — `git merge-base --is-ancestor 577faae origin/ai/codex-integrate-v2-stage`: exit 0, no output.
PASS — `git fetch origin +main:refs/remotes/origin/main`: exit 0, no output.
FAIL — required integrated base has out-of-allowlist changes relative to main:
`git diff --name-only origin/main...577faae | wc -l`
```
      85
```
Full inherited file list:
```
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

## Toolchain and checks

NOT VERIFIED — Corepack activation; command failed before activation:
`corepack enable && corepack prepare pnpm@10.28.0 --activate && pnpm --version`
```
zsh:1: command not found: corepack
```
PASS — required fallback `npx -y pnpm@10.28.0 --version`
```
10.28.0
```
PASS — `npx -y pnpm@10.28.0 install --frozen-lockfile` (exit 0)
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Done in 13.8s using pnpm v10.28.0
```
Install also reported ignored build scripts for bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10. No approval/build-policy changes were made.

PASS — `npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` (exit 0)
```
> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/taskbar-hero-u2-report
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```
The drift check emitted no diff. `git status --short` afterward emitted no output. No tracked generated files, dependency files or workspace files changed.

full suite skipped: docs only

NOT VERIFIED — pnpm typecheck, pnpm lint, pnpm test, pnpm build, apps/web pnpm test:e2e: not run on this report-only branch under the explicit docs-only exception.
NOT VERIFIED — classic VITE_GAME_V2=0 build/tests and demo-mode VITE_GAME_V2=1 HUD rendering.

## Acceptance checklist

- PASS: Required base fetched and reachable; final scope conflict detected before implementation.
- PASS: Only the allowed report file changed on the fallback branch; forbidden files untouched; no PR, merge, deployment, Actions run, database writes or sharing changes initiated.
- PASS: pnpm fallback version is exactly 10.28.0.
- NOT VERIFIED: Dark HUD surface, container queries and all three responsive layouts.
- NOT VERIFIED: XP styling and preservation of progressbar semantics.
- NOT VERIFIED: Full Chapter 2 · Round 5 text, visible Power, no ellipsis/clipping, no chip intersection at all four widths.
- NOT VERIFIED: HUD height <= 88px at 390/320 and <= 64px at 1600; background luminance < 0.2.
- NOT VERIFIED: Gated true/false rendering and existing HUD tests passing unchanged.
- NOT VERIFIED: New apps/web/e2e/ui/u2-hud.spec.ts and project selection; spec not created due to stop.
- NOT VERIFIED: BEFORE/AFTER screenshots at all requested light/dark sizes and gated 390px states; no PNGs written.
- PASS: No tests, assertions, snapshots, game rules, content or numbers changed.

## Files touched and final branch checks

PASS — report-only scope and author checks after initial report commit:
`git diff --stat origin/main...HEAD`
```
 reports/u2-hud.md | 167 ++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 167 insertions(+)
```
This stat precedes this final verification-log addition; final scope remains this single report.

`git diff --name-only origin/main...HEAD`
```
reports/u2-hud.md
```
`git diff --name-only 577faae...HEAD`
```
reports/u2-hud.md
```
The report-only branch starts at main, so this merge-base comparison does not contain the required integrated base and does not imply HUD work was performed on it.

`git log --format='%an <%ae>' origin/main..HEAD`
```
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

The final amended report commit is to be pushed only to codex/u2-hud-report. Push outcome and final commit hash are supplied in the user-facing completion message.
