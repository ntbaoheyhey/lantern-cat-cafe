STATUS: DONE

Integrated the whole responsive v2 UI baseline with the three sibling branches. No remaining integration blocker. Branch: `ai/codex-integrate-v2-stage`; product integration commit: `0ff994f`. Date: 2026-10-26.

## What was done

Started from exactly `282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6`. Created real merge commits in the requested order:

1. Decorative key `096327b7c5f003013a6febabaa02125fce793a49`, merge `e5e3138`.
2. Sheet focus `3cfcdb724b7f7d086d2059fba8f1b68bf7f72dd4`, merge `a1659b9`.
3. Relic wiring `fd1f75d85b654a3d556b8bd2cd2e44c96564c401`, merge `0ff994f`.

Resolved the two expected conflicts in `apps/web/src/game/v2/storeV2.ts` and `apps/web/src/layout/StageLayout.tsx` by preserving both implementations. The equip queue, ref, disposal and generation cancellation survive alongside the Relic helper, MintPanel and unreported-mint retry. The sheet close ref/focus and decorative key remain.

The only integration edit to a test adds `subscribe: () => () => {}` to the Relic UI fake loop. No integration assertion changed. Assertions imported from the decorative-key branch remain exactly as authored there. No tests were disabled, deleted, weakened, given longer timeouts, or newly skipped; no snapshots/golden values changed. No product fix round was needed after integration.

```text
0ff994f a1659b9 fd1f75d ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> Merge Relic wiring while preserving equip queue and sheet focus
a1659b9 e5e3138 3cfcdb7 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> Merge remote-tracking branch 'origin/ai/codex-fix-sheet-focus' into ai/codex-integrate-v2-stage
e5e3138 282843d 096327b ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> Merge remote-tracking branch 'origin/ai/codex-fix-decorative-key' into ai/codex-integrate-v2-stage
```

## Acceptance

| Status | Check | Result |
| --- | --- | --- |
| PASS | Required ancestry | 282843d, 096327b, 3cfcdb7, fd1f75d all ancestors |
| PASS | Bulk queue, Relic wiring, sheet focus, decorative key | 6 files, 63 targeted tests passed; assertions preserved |
| PASS | Frozen install | pnpm 10.28.0, exit 0 |
| PASS | Generated Deno drift | exit 0, no tracked drift |
| PASS | Typecheck | 6 workspace projects, exit 0 |
| PASS | Lint | 6 workspace projects, exit 0 |
| PASS | Full unit suite | 124 files passed; 1,840 tests passed; inherited 2 skipped files, 4 skipped tests, 2 expected failures |
| PASS | Production build | exit 0 |
| PASS | Whole browser suite, all projects | 72 passed; project counts below |
| PASS | Required StageLayout symbols | grep evidence below |
| PASS | Ancestry, author, protected-file and scoped file audits | evidence below |
| PASS | Flag-flip information only | conflict reported; never merged |
| NOT VERIFIED | Real wallet / Fuji behavior | manual, user only |

Browser project counts from actual successful test lines: {'classic': 26, 'stage-layout': 31, 'v2-loop': 15}. The pre-existing game-rules skips/expected failures were not modified.

## Runtime setup and install

Checks used the repository-pinned pnpm 10.28.0 through a temporary launcher that invokes `corepack pnpm "$@"`. `/tmp/integrate-v2-stage-bin` was prepended to PATH for these processes. No dependency/lock/workspace file change remains.

FAIL — initial `pnpm install --frozen-lockfile` under the environment fallback pnpm 11.25.0 (exit 1):

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

FAIL — retry `CI=true pnpm install --frozen-lockfile` under fallback pnpm 11.25.0 (exit 1):

```text
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

The fallback incidentally added `allowBuilds` entries to `pnpm-workspace.yaml`; that incidental edit was immediately restored. An intermediate temporary corepack symlink invoked corepack's own installer and failed with `Unknown Syntax Error: Unsupported option name ("--frozen-lockfile").`; the launcher was corrected outside the repo. These were runtime setup errors, not product/test changes.

PASS — `CI=true pnpm install --frozen-lockfile` with pinned pnpm 10.28.0 (exit 0):

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 14.9s using pnpm v10.28.0
```

PASS — `cd apps/web && pnpm exec playwright install chromium` (exit 0). The expected browser cache was absent. `/opt/pw-browsers` is not writable (`mkdir: cannot create directory ‘/opt/pw-browsers’: Permission denied`), so matching browsers were installed into Playwright's default user cache, without changing repository configuration:

```text
Chrome for Testing 156.0.8078.4 (playwright chromium v1248) downloaded to /home/agent/.cache/ms-playwright/chromium-1248
FFmpeg (playwright ffmpeg v1013) downloaded to /home/agent/.cache/ms-playwright/ffmpeg-1013
Chrome Headless Shell 156.0.8078.4 (playwright chromium-headless-shell v1248) downloaded to /home/agent/.cache/ms-playwright/chromium_headless_shell-1248
```

## Checks and real output

All checks ran locally. Long logs retain their actual result/summary lines.

PASS — `pnpm gen:deno && git diff --exit-code -- supabase/functions` (exit 0):

```text
> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

PASS — targeted command (exit 0):

```sh
pnpm --filter @taskbar-hero/web test src/game/stage/bulkEquip.test.ts src/game/stage/relicWiring.test.ts src/game/stage/relicWiring.ui.test.tsx src/layout/StageLayout.test.tsx src/layout/boss/BossGatePanel.test.tsx src/layout/a11y/v2-components.a11y.test.tsx
```

```text
> @taskbar-hero/web@0.0.0 test /workspace/taskbar-hero/apps/web
> vitest run src/game/stage/bulkEquip.test.ts src/game/stage/relicWiring.test.ts src/game/stage/relicWiring.ui.test.tsx src/layout/StageLayout.test.tsx src/layout/boss/BossGatePanel.test.tsx src/layout/a11y/v2-components.a11y.test.tsx


 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  6 passed (6)
      Tests  63 passed (63)
   Start at  08:32:47
   Duration  15.38s (tests 53%, environment 30%, import 12%, transform 5%)

Environment  jsdom was created 6 times · 4.28s total, 30% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

PASS — `pnpm typecheck` (exit 0):

```text
> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

PASS — `pnpm lint` (exit 0):

```text
> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

PASS — `pnpm test` (exit 0):

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
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test: Done
apps/web test:  Test Files  83 passed (83)
apps/web test:       Tests  1082 passed (1082)
apps/web test: Done
```

PASS — `pnpm build` (exit 0):

```text
> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build$ tsc --noEmit
packages/auth build: Done
supabase/tests build$ tsc --noEmit
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1793 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-IyvSZK5E.css               80.97 kB │ gzip:  14.40 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-Dz2dIBPy.js                0.97 kB │ gzip:   0.58 kB
apps/web build: dist/assets/StageScene-BnPCyUpu.js            2.13 kB │ gzip:   1.03 kB
apps/web build: dist/assets/ArenaScene-D1NchxmY.js            5.91 kB │ gzip:   2.32 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/index-BQlmdTnd.js               713.13 kB │ gzip: 111.54 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 844ms
apps/web build: Done
```

PASS — `cd apps/web && pnpm test:e2e` (exit 0, no project filter):

```text
Running 72 tests using 1 worker
  72 passed (1.7m)
```

## Gate and preservation evidence

PASS — ancestry and integration file audit:

```text
PASS integration file allowlist
PASS git merge-base --is-ancestor 282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6 HEAD (exit 0)
PASS git merge-base --is-ancestor 096327b HEAD (exit 0)
PASS git merge-base --is-ancestor 3cfcdb7 HEAD (exit 0)
PASS git merge-base --is-ancestor fd1f75d HEAD (exit 0)
PASS flag-flip is not an ancestor (exit 1)
PASS author check: 24 commits, ['ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>']
Files changed since required baseline:
apps/web/src/game/stage/relicWiring.test.ts
apps/web/src/game/stage/relicWiring.ui.test.tsx
apps/web/src/game/v2/storeV2.ts
apps/web/src/layout/StageLayout.test.tsx
apps/web/src/layout/StageLayout.tsx
apps/web/src/layout/a11y/v2-components.a11y.test.tsx
apps/web/src/layout/boss/BossGatePanel.test.tsx
apps/web/src/layout/boss/BossGatePanel.tsx
reports/fix-decorative-key.md
reports/fix-sheet-focus.md
reports/v20b-relic-wiring.md
```

PASS — source-content comparisons:

```text
PASS equip queue unchanged from baseline
PASS Relic handoff unchanged from source
PASS Relic UI test only adds requested subscribe
PASS apps/web/src/game/stage/bulkEquip.test.ts assertions unchanged
PASS apps/web/src/game/stage/relicWiring.test.ts assertions unchanged
PASS apps/web/src/layout/boss/BossGatePanel.test.tsx assertions unchanged
PASS apps/web/src/layout/a11y/v2-components.a11y.test.tsx assertions unchanged
PASS sheet focus regression test unchanged
```

PASS — `grep -nE 'createEquipQueueV2|forgeRelicForWalletV2|sheetCloseRef' apps/web/src/layout/StageLayout.tsx`:

```text
20:import { createEquipQueueV2, forgeRelicForWalletV2, getGameLoopV2, useGameSnapshotV2, useGameModeV2 } from '../game/v2/storeV2';
134:  const sheetCloseRef = useRef<HTMLButtonElement>(null);
136:  const equipQueue = useRef<ReturnType<typeof createEquipQueueV2> | null>(null);
156:    const queue = createEquipQueueV2(loop);
206:      const message = await forgeRelicForWalletV2(loop, { connected: wallet.isConnected, mint: next => { setVoucher(next); } });
226:    sheetCloseRef.current?.focus();
280:              <button type="button" className="v2-sheet-close" ref={sheetCloseRef} aria-label="Close panel" onClick={closeSheet}>
```

PASS — protected files unchanged from baseline (exit 0, no output):

```sh
git diff --exit-code 282843d HEAD -- contracts packages/auth packages/game-rules/src/v2/config.ts docs/proposals/numbers-v2.md supabase pnpm-lock.yaml pnpm-workspace.yaml package.json apps/web/package.json
```

PASS — earlier browser tests/config, bulk queue test, stage/redraw components and responsive CSS unchanged from baseline (exit 0, no output):

```sh
git diff --exit-code origin/ai/codex-responsive-window HEAD -- apps/web/e2e apps/web/playwright.config.ts apps/web/src/game/stage/bulkEquip.test.ts apps/web/src/game/stage/StageScene.ts apps/web/src/game/stage/StageCanvas.tsx apps/web/src/layout/layout.css
```

PASS — `git diff --check` (exit 0, no output).

## Files touched and author audit

PASS — `git fetch origin +main:refs/remotes/origin/main` (exit 0). The generic main-relative self-check includes the explicitly requested inherited baseline: its 76 existing files are part of the required whole v2 stack, including arena, V16, V26, redraw and responsive assets. They were preserved. The task-specific integration allowlist is checked with `git diff --name-only 282843d...HEAD`: only the three source branches' changed paths plus this report are permitted. There are no unexpected files. No baseline file was reverted to main, which would discard the required earlier work.

```text
Main-relative files: 84; inherited baseline files: 76; integration files: 11; unexpected: []
PASS required baseline is preserved; integration adds only source-branch paths
```

Actual `git diff --name-only origin/main...HEAD` at product integration commit `0ff994f`, before adding this report:

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

Actual `git diff --stat origin/main...HEAD` at product integration commit `0ff994f`, before the report-only commit adds `reports/integrate-v2-stage.md`:

```text
apps/web/e2e/layout/arena.spec.ts                  |  22 ++
 apps/web/e2e/layout/character-bag.spec.ts          |  17 +-
 apps/web/e2e/layout/resize.spec.ts                 |  62 ++++
 apps/web/e2e/layout/stage-layout.spec.ts           |  45 ++-
 apps/web/e2e/layout/stage-redraw.spec.ts           |  48 +++
 apps/web/e2e/v2/loop.spec.ts                       | 146 +++++++++
 apps/web/playwright.config.ts                      |   7 +-
 apps/web/src/dev/ArenaPreview.tsx                  |  13 +
 apps/web/src/game/arena/ArenaScene.test.ts         |  39 +++
 apps/web/src/game/arena/ArenaScene.ts              |  96 ++++++
 apps/web/src/game/arena/BossArena.test.tsx         |  32 ++
 apps/web/src/game/arena/BossArena.tsx              |  38 +++
 apps/web/src/game/arena/arena.css                  |   8 +
 apps/web/src/game/arena/assets.ts                  |  39 +++
 apps/web/src/game/arena/index.ts                   |   2 +
 apps/web/src/game/arena/playBossFight.ts           |  21 ++
 apps/web/src/game/arena/playback.test.ts           |  39 +++
 apps/web/src/game/arena/playback.ts                |  28 ++
 apps/web/src/game/stage/StageCanvas.tsx            |  33 ++
 apps/web/src/game/stage/StageScene.test.ts         |  59 ++++
 apps/web/src/game/stage/StageScene.ts              |  58 ++++
 apps/web/src/game/stage/bulkEquip.test.ts          |  57 ++++
 apps/web/src/game/stage/progress.ts                |   8 +
 apps/web/src/game/stage/relicWiring.test.ts        |  41 +++
 apps/web/src/game/stage/relicWiring.ui.test.tsx    |  79 +++++
 apps/web/src/game/stage/storeV2.test.ts            |  33 ++
 apps/web/src/game/v2/storeV2.ts                    |  81 +++++
 apps/web/src/layout/StageLayout.test.tsx           |  67 ++++-
 apps/web/src/layout/StageLayout.tsx                | 146 +++++++--
 .../src/layout/a11y/v2-components.a11y.test.tsx    |   7 +-
 apps/web/src/layout/boss/BossGatePanel.test.tsx    |   2 +
 apps/web/src/layout/boss/BossGatePanel.tsx         |   2 +-
 apps/web/src/layout/layout.css                     |  38 +++
 apps/web/src/main.tsx                              |   2 +
 docs/prompts/antigravity-responsive-qa.md          |  23 ++
 docs/prompts/antigravity-responsive-retest.md      |  17 ++
 docs/prompts/codex-responsive-review.md            |  15 +
 docs/responsive-coordination.md                    |  38 +++
 reports/fix-bulk-equip.md                          | 136 +++++++++
 reports/fix-decorative-key.md                      | 150 ++++++++++
 reports/fix-sheet-focus.md                         | 120 ++++++++
 reports/fix-stage-redraw.md                        | 306 +++++++++++++++++++
 reports/fix-stage-redraw/actors-1600-900.png       | Bin 0 -> 10438 bytes
 reports/fix-stage-redraw/actors-320-568.png        | Bin 0 -> 3332 bytes
 reports/fix-stage-redraw/actors-390-844.png        | Bin 0 -> 2826 bytes
 reports/responsive-window.md                       | 249 +++++++++++++++
 reports/responsive-window/dark-1280-720.png        | Bin 0 -> 34104 bytes
 reports/responsive-window/dark-1600-900.png        | Bin 0 -> 40945 bytes
 reports/responsive-window/dark-320-568.png         | Bin 0 -> 23818 bytes
 reports/responsive-window/dark-390-844.png         | Bin 0 -> 33483 bytes
 .../responsive-window/initial-partial-report.txt   | 180 +++++++++++
 reports/responsive-window/light-1280-720.png       | Bin 0 -> 34164 bytes
 reports/responsive-window/light-1600-900.png       | Bin 0 -> 40898 bytes
 reports/responsive-window/light-320-568.png        | Bin 0 -> 23955 bytes
 reports/responsive-window/light-390-844.png        | Bin 0 -> 33624 bytes
 reports/v16-stage.md                               | 333 +++++++++++++++++++++
 reports/v16-stage/stage-1280.png                   | Bin 0 -> 36093 bytes
 reports/v16-stage/stage-390.png                    | Bin 0 -> 31824 bytes
 reports/v19-arena.md                               | 300 +++++++++++++++++++
 reports/v19-arena/1280.png                         | Bin 0 -> 31112 bytes
 reports/v19-arena/390-reduced.png                  | Bin 0 -> 21169 bytes
 reports/v20b-relic-wiring.md                       | 319 ++++++++++++++++++++
 reports/v26-e2e.md                                 | 192 ++++++++++++
 reports/v26-e2e/equip-1280.png                     | Bin 0 -> 36171 bytes
 reports/v26-e2e/equip-390-reduced.png              | Bin 0 -> 33580 bytes
 reports/v26-e2e/equip-390.png                      | Bin 0 -> 33575 bytes
 reports/v26-e2e/forge-1280.png                     | Bin 0 -> 34251 bytes
 reports/v26-e2e/forge-390-reduced.png              | Bin 0 -> 40646 bytes
 reports/v26-e2e/forge-390.png                      | Bin 0 -> 40646 bytes
 reports/v26-e2e/fresh-1280.png                     | Bin 0 -> 34894 bytes
 reports/v26-e2e/fresh-390-reduced.png              | Bin 0 -> 29483 bytes
 reports/v26-e2e/fresh-390.png                      | Bin 0 -> 29483 bytes
 reports/v26-e2e/idle-1280.png                      | Bin 0 -> 36127 bytes
 reports/v26-e2e/idle-390-reduced.png               | Bin 0 -> 31828 bytes
 reports/v26-e2e/idle-390.png                       | Bin 0 -> 31824 bytes
 reports/v26-e2e/loss-1280.png                      | Bin 0 -> 35852 bytes
 reports/v26-e2e/loss-390-reduced.png               | Bin 0 -> 30999 bytes
 reports/v26-e2e/loss-390.png                       | Bin 0 -> 42368 bytes
 reports/v26-e2e/reload-1280.png                    | Bin 0 -> 35600 bytes
 reports/v26-e2e/reload-390-reduced.png             | Bin 0 -> 32900 bytes
 reports/v26-e2e/reload-390.png                     | Bin 0 -> 32900 bytes
 reports/v26-e2e/win-1280.png                       | Bin 0 -> 36716 bytes
 reports/v26-e2e/win-390-reduced.png                | Bin 0 -> 34531 bytes
 reports/v26-e2e/win-390.png                        | Bin 0 -> 34471 bytes
 84 files changed, 3760 insertions(+), 33 deletions(-)
```

PASS — `git log --format='%an <%ae>' origin/main..HEAD` at `0ff994f` (all 24 lines):

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
```

The report-only commit uses the same required author. Final ancestry, scope, author and clean-tree audits are repeated after committing the report.

## Flag-flip probe: information only

PASS — reported the requested conflict probe: `git merge-tree --write-tree HEAD origin/ai/codex-v29-flag-flip`, against `0ff994f`, exit 1. The only conflicted file is `apps/web/src/layout/StageLayout.test.tsx`. `apps/web/playwright.config.ts` auto-merges. This probe only creates temporary Git objects; it did not merge, checkout or apply the flag-flip branch.

```text
ad71bdf4f44b0d970267c9a7328220d850b04a41
100644 b3ff44ea9f4c38324c552c55f7136e3bc348db9c 1	apps/web/src/layout/StageLayout.test.tsx
100644 0ef88f3f3a799f88b669f4f8c82190f13a556697 2	apps/web/src/layout/StageLayout.test.tsx
100644 40361b0c62f63fbed234f81b85064d51254521b7 3	apps/web/src/layout/StageLayout.test.tsx

Auto-merging apps/web/playwright.config.ts
Auto-merging apps/web/src/layout/StageLayout.test.tsx
CONFLICT (content): Merge conflict in apps/web/src/layout/StageLayout.test.tsx
```

## NOT VERIFIED and what is needed to continue

NOT VERIFIED — real wallet connection/signature, actual Fuji mint, or live confirmation reporting. Those are manual user-only checks; automated Relic fakes do not verify a real chain transaction.

NOT VERIFIED — deployed demo behavior. No deployment or sharing setting change was performed.

No integration blocker remains. Only the user-only real-wallet/Fuji check remains manual. Delivery is the task branch only: `git push -u origin ai/codex-integrate-v2-stage`. No PR, merge to main, GitHub Actions invocation, Vercel/deploy, contest submission, repository visibility change, Supabase migration, or live database write was performed.
