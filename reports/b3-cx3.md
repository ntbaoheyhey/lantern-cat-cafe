# B3-CX3: Abuse-controls assessment

## Delivery

- Branch: `ai/codex-b3-cx3`, created from `origin/main` at `e64934d718132afbb52a00f3664b74b87496f66d` (includes theme-token PR #42).
- Added `docs/abuse-controls.md`: all nine public endpoint abuse scenarios, current authentication/ownership/replay/economy limits, RLS/service-role boundaries, five prioritized controls with estimated cost and effort, and explicit unverified assumptions.
- Added this required report as the authorized exception to the May touch list. No source, migrations, contracts, config or lockfile changes.
- User clarified delivery during this chat: **push branch only; no PR**. No merge, PR, deployment or GitHub Actions run was requested by this work.

## Setup and read-only review

The first command was `git config user.email && git config user.name`; exit 0, exact output:

```text
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

No identity change was necessary. `gh auth status` confirmed the active account `ntbaoheyhey` has repository access; credential output is intentionally omitted. `git fetch origin main ai/codex-b3-cx3` reported `fatal: couldn't find remote ref ai/codex-b3-cx3` because the task branch did not yet exist. A subsequent `git fetch origin main` passed, then `git switch -c ai/codex-b3-cx3 origin/main` passed.

Reviewed `docs/auth.md`, `docs/api.md`, `docs/database.md`, every endpoint and shared TypeScript file under `supabase/functions`, every SQL migration, `supabase/config.toml`, the delegated auth/game-rule/chain modules and `contracts/src/RelicNFT.sol`. `rg` found no AGENTS.md in the searched project tree. An initial read of `packages/game-rules/src/idle.ts` failed because that path does not exist; the relevant implementation was subsequently read from `packages/game-rules/src/rules.ts`. The `reports` directory did not exist and was created for this report. These read-only lookup failures do not affect verification results.

Primary Supabase documentation on RLS and Edge Function rate limiting was checked; links appear in the assessment. No live attack traffic, wallet signatures, chain transactions, secret inspection or remote configuration changes were performed.

## Verification commands and output

All commands ran locally before committing/pushing. Output below is verbatim for the redirected validation logs. All six validation commands exited 0. Unit/database total: 599 tests across 43 files; Playwright: 16 tests. Tests cover existing behavior; they do not demonstrate the proposed controls, which are documentation only.

`pnpm install` — PASS (exit 0), relevant output:

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10.
Done in 458ms using pnpm v10.28.0
```

The install warning was informational; no dependency scripts were approved or configuration changed.

### typecheck

Exact command: `pnpm typecheck > /tmp/b3-cx3-typecheck.log 2>&1` — PASS (exit 0).

```text

> taskbar-hero@0.0.0 typecheck /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck: Done
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

### lint

Exact command: `pnpm lint > /tmp/b3-cx3-lint.log 2>&1` — PASS (exit 0).

```text

> taskbar-hero@0.0.0 lint /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint: Done
packages/auth lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

### test

Exact command: `pnpm test > /tmp/b3-cx3-test.log 2>&1` — PASS (exit 0).

```text

> taskbar-hero@0.0.0 test /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
supabase/tests test$ vitest run
packages/game-rules test$ vitest run
packages/auth test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/auth
packages/chain test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/chain
packages/game-rules test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  13:51:02
packages/chain test:    Duration  381ms (import 51%, transform 34%, tests 11%, worker 3%)
packages/chain test: Done
packages/game-rules test:  Test Files  4 passed (4)
packages/game-rules test:       Tests  63 passed (63)
packages/game-rules test:    Start at  13:51:02
packages/game-rules test:    Duration  497ms (tests 61%, import 28%, transform 7%, worker 4%)
packages/game-rules test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  13:51:02
packages/auth test:    Duration  916ms (import 70%, tests 25%, transform 4%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  12 passed (12)
supabase/tests test:       Tests  301 passed (301)
supabase/tests test:    Start at  13:51:02
supabase/tests test:    Duration  7.36s (tests 83%, import 16%, transform 1%)
supabase/tests test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  13:51:11
packages/api-contract test:    Duration  232ms (transform 41%, import 38%, tests 11%, worker 9%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/apps/web
apps/web test:  Test Files  23 passed (23)
apps/web test:       Tests  188 passed (188)
apps/web test:    Start at  13:51:11
apps/web test:    Duration  3.23s (environment 57%, tests 24%, import 17%, transform 2%)
apps/web test: Environment  jsdom was created 23 times · 15.30s total, 57% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

### build

Exact command: `pnpm build > /tmp/b3-cx3-build.log 2>&1` — PASS (exit 0).

```text

> taskbar-hero@0.0.0 build /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/chain build$ tsc --noEmit
packages/auth build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build: Done
packages/auth build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/Documents/ChatGPT/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1658 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-DotazktF.css               30.48 kB │ gzip:   6.53 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-BcFL8Zlx.js            8.27 kB │ gzip:   3.41 kB
apps/web build: dist/assets/index-CR1S46O6.js                81.94 kB │ gzip:  23.56 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 363ms
apps/web build: Done
```

### e2e

Exact command: `pnpm --filter @taskbar-hero/web test:e2e > /tmp/b3-cx3-e2e.log 2>&1` — PASS (exit 0).

```text

> @taskbar-hero/web@0.0.0 test:e2e /Users/bao/Documents/ChatGPT/taskbar hero/apps/web
> playwright test

[WebServer] (node:94713) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `pnpm --trace-warnings ...` to show where the warning was created)
[WebServer] (node:94751) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 16 tests using 6 workers

(node:94765) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:94766) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:94767) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:94769) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:94768) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:94764) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓   6 e2e/forge.spec.ts:3:1 › forge tab shows the cost, odds and why forging is blocked in demo mode (2.0s)
  ✓   1 e2e/market.spec.ts:3:1 › market tab asks for a wallet when none is connected (2.0s)
  ✓   3 e2e/boss.spec.ts:3:1 › boss tab fights, replays the log and shows the outcome (2.2s)
  ✓   7 e2e/polish.spec.ts:35:3 › 320px: no horizontal scroll and no overlap between the HUD, wallet and Menu (479ms)
  ✓   8 e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 1280px with no horizontal scroll and valid layout (457ms)
  ✓   4 e2e/onboarding.spec.ts:3:1 › first visit shows How to play; closing it reveals the game and it stays closed (2.7s)
  ✓  10 e2e/polish.spec.ts:35:3 › 390px: no horizontal scroll and no overlap between the HUD, wallet and Menu (373ms)
  ✓  11 e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 390px with no horizontal scroll and valid layout (415ms)
  ✓  12 e2e/polish.spec.ts:35:3 › 1280px: no horizontal scroll and no overlap between the HUD, wallet and Menu (403ms)
  ✓   5 e2e/demo-path.spec.ts:8:5 › Judge demo path at 390px › plays from onboarding through upgrading, a boss fight, Forge and Market (3.3s)
  ✓  13 e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 320px with no horizontal scroll and valid layout (437ms)
  ✓  15 e2e/demo-path.spec.ts:8:5 › Judge demo path at 1280px › plays from onboarding through upgrading, a boss fight, Forge and Market (2.0s)
  ✓   9 e2e/smoke.spec.ts:3:1 › strip renders a canvas and the panel opens and closes (3.6s)
  ✓   2 e2e/inventory.spec.ts:3:1 › inventory tab equips a demo item and the power goes up (6.6s)
  ✓  14 e2e/polish.spec.ts:101:3 › reduced motion › the forge reveal shows the Relic without motion (4.5s)
  ✓  16 e2e/polish.spec.ts:127:1 › tabs switch with the keyboard (Tab and Enter) (462ms)

  16 passed (9.8s)
```

`git diff --exit-code -- pnpm-lock.yaml` — PASS (exit 0, no output; install did not change the lockfile).

`git diff --check` — PASS (exit 0, no output). The check will also be repeated with the new files staged before commit.

The production build emitted a `node:worker_threads` browser-externalization warning; it completed successfully. Playwright was run after the production build even though no web source changed. No additional tests were written for this docs-only task. `forge test` was not run because no contracts were touched.

## Limits and open questions

- Live deployed database grants, functions, secrets, upstream firewall settings and quota usage were not verified; this is a source assessment, not a live audit.
- No exploit proof was attempted for the pre-lock boss attempt seed/snapshot concern, interleaved claim/equip snapshots, or stale RPC/finality during voucher reissue. The assessment explicitly distinguishes these concerns from proven guarantees.
- Proposed thresholds, cost and effort are estimates, not measured traffic limits or current vendor plan guarantees. The owner should decide whether invite-gating new players and limiting automated play fit the demo's access goals.
- No PR or screenshot attachment is applicable after the user's explicit branch-only clarification. The only changed files are the assessment and this required report.
