# V12 demo mode

Branch: `ai/codex-v12-demo`, based on fetched `origin/main` at `2a5825afae6ea650684468e489b983293e86f94c`.

## Prerequisite gate

Ran before implementation:

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
   d0640ad..2a5825a  main       -> origin/main
$ git ls-tree --name-only origin/main packages/game-rules/src/v2/state/index.ts packages/game-rules/src/v2/idle/index.ts
packages/game-rules/src/v2/idle/index.ts
packages/game-rules/src/v2/state/index.ts
$ git show origin/main:packages/game-rules/src/v2/state/index.ts | grep -n 'export'
1:export * from './apply';
2:export * from './equip';
3:export * from './stacks';
5:export type { PlayerStateV2, StateResultV2, StateRefusalV2, StateRefusalCodeV2, StacksV2,
$ git show origin/main:packages/game-rules/src/v2/idle/index.ts | grep -n 'computeClaimV2'
2:export { computeClaimV2 } from './claim';
$ git show origin/main:packages/game-rules/src/v2/config.ts | grep -n lossCooldownSeconds
89:    lossCooldownSeconds: 60,
```

All three gates passed. The original checkout contained uncommitted forge changes; this task uses an isolated managed worktree, preserving that checkout.

## Implementation and exports

Pure view functions: `itemViewV2`, `unlockedSlotsV2`, `frontierV2`, `stateViewV2`, `lootViewV2`, `gainsViewV2`, `rollChestV2`, `claimInputV2`, `gateOfV2`, `timelineViewV2`.

View types: `OtherMaterialIdV2`, `ItemViewV2`, `AutoSalvagedViewV2`, `LootViewV2`, `GainsViewV2`, `GateV2`, `TimelineEventViewV2`, `StateViewV2`, `StateViewContextV2`, `ChestRollInputV2`, `ClaimContextV2`.

Idle adds `gateV2` and re-exports the existing `xpToNextV2`; `computeClaimV2` is unchanged. The new `MockGameApiV2` implements all nine GameApiV2 methods, persists successful mutations, maps refusals to the exact supplied GameApiErrorV2, and returns independent snapshots. Rejected calls do not save or advance the seed counter. Boss rewards include actual capped credits and overflow salvage without subtracting the spent key. No new dependencies or lockfile changes.

## Storage keys checked

Searched `MockGameApi.ts` and all `apps/web/src` for `localStorage`, `Storage`, and `taskbar-hero`. v1 MockGameApi has no persistence: its state, pending voucher and forged relic are held in memory. Existing localStorage keys are `taskbar-hero.howToPlaySeen`, `taskbar-hero.unreportedMint`, and `taskbar-hero.miniMode`. Also checked `taskbar-hero.session` (sessionStorage). New key `taskbar-hero:v2-demo:1` clashes with none of these.

## Found edge case

`applyBossResult` advances chapter 5 to chapter 6 after its first clear. Idle rejects that chapter as unknown. `frontierV2` clamps any chapter above the last registry chapter to `{ chapter: 5, round: 10, kills: 10 }`, permitting final-chapter farming and previously cleared boss rematches. Earlier frontiers are unchanged. Both state and claim views use this helper; tests exercise chapter 6 through a real demo claim.

## Decisions and limitations

- The requested stored envelope does not name a place for the pending voucher and today's relic. Optional `pending` and `todayRelic` fields supplement its required fields so reloads retain paid vouchers. Saves without these optional fields remain compatible. Pending vouchers return without spending; expired vouchers preserve the relic and receive a new nonce and expiry, matching v1.
- ForgeStatus has exactly `blockedBy`, `forgedToday`, `pending`, and `today`; no field was guessed. A pending voucher makes `blockedBy` null, as in v1.
- Followed the explicit chest Fish formula `reward.amount * FISH_UNIT`. The current registry already constructs its Fish rewards with `amount: FISH_UNIT`; this makes actual totals larger than the registry's narrative Fish-range comment. No registry data was changed.
- No app layout/store wiring was changed: those files are forbidden by the task. This delivers the browser API implementation for the integration cards.
- No migrations applied, no Edge Function logic edited, no GitHub Actions manually run, and no PR opened.
- Dependency installation reports the repository's existing ignored native build scripts; it succeeds without changing dependencies.

## Validation output

### `pnpm install --frozen-lockfile (initial clean worktree install)`

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +505
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 505, reused 496, downloaded 0, added 153
Progress: resolved 505, reused 496, downloaded 0, added 376
Progress: resolved 505, reused 496, downloaded 0, added 414
Progress: resolved 505, reused 496, downloaded 0, added 497
Progress: resolved 505, reused 496, downloaded 0, added 503
Progress: resolved 505, reused 496, downloaded 0, added 505, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 5.9s using pnpm v10.28.0
```

### `pnpm install --frozen-lockfile (pre-push sequence)`

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
Done in 391ms using pnpm v10.28.0
```

### `pnpm gen:deno && git status --short supabase/functions`

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/v12-demo/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
 M supabase/functions/boss-fight/deno.json
 M supabase/functions/equip/deno.json
 M supabase/functions/game-state/deno.json
 M supabase/functions/idle-claim/deno.json
 M supabase/functions/relic-forge/deno.json
 M supabase/functions/relic-mint-report/deno.json
 M supabase/functions/upgrade/deno.json
```

### `pnpm --filter @taskbar-hero/game-rules test`

```text
> @taskbar-hero/game-rules@0.0.0 test /Users/bao/.codex/worktrees/v12-demo/taskbar hero/packages/game-rules
> vitest run


 RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/packages/game-rules


 Test Files  15 passed (15)
      Tests  276 passed | 2 expected fail (278)
   Start at  01:18:42
   Duration  3.33s (tests 66%, transform 24%, import 8%, worker 1%)
```

### `pnpm --filter @taskbar-hero/web test -- MockGameApiV2`

```text
> @taskbar-hero/web@0.0.0 test /Users/bao/.codex/worktrees/v12-demo/taskbar hero/apps/web
> vitest run -- MockGameApiV2


 RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/apps/web


 Test Files  46 passed (46)
      Tests  492 passed (492)
   Start at  01:19:34
   Duration  12.86s (environment 51%, tests 21%, transform 17%, import 11%)

Environment  jsdom was created 46 times · 57.59s total, 51% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

The requested web test command runs the entire web suite in this Vitest configuration (46 files, 492 tests); this includes the new MockGameApiV2 tests.

Final validation completed successfully in the required order. The full workspace run passed 1,155 tests, with the two existing `it.fails.each` cases in `v2/lootcheck/lootcheck.test.ts` still reported as expected failures. No tests were skipped, weakened, or deleted.

## Files changed

- `apps/web/src/api/GameApiErrorV2.ts`
- `apps/web/src/api/MockGameApiV2.test.ts`
- `apps/web/src/api/MockGameApiV2.ts`
- `packages/game-rules/src/v2/idle/claim.ts`
- `packages/game-rules/src/v2/idle/idle.test.ts`
- `packages/game-rules/src/v2/idle/index.ts`
- `packages/game-rules/src/v2/index.ts`
- `packages/game-rules/src/v2/view/chest.ts`
- `packages/game-rules/src/v2/view/claim.ts`
- `packages/game-rules/src/v2/view/index.ts`
- `packages/game-rules/src/v2/view/loot.ts`
- `packages/game-rules/src/v2/view/state.ts`
- `packages/game-rules/src/v2/view/timeline.ts`
- `packages/game-rules/src/v2/view/types.ts`
- `packages/game-rules/src/v2/view/view.test.ts`
- `reports/v12-demo.md`
- `supabase/functions/boss-fight/deno.json`
- `supabase/functions/equip/deno.json`
- `supabase/functions/game-state/deno.json`
- `supabase/functions/idle-claim/deno.json`
- `supabase/functions/relic-forge/deno.json`
- `supabase/functions/relic-mint-report/deno.json`
- `supabase/functions/upgrade/deno.json`

## Final pre-push validation

### `pnpm gen:deno && git diff --exit-code -- supabase/functions` (after committing regenerated files)

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/v12-demo/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

Exit 0; the git diff portion emitted nothing.

### `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

```text
> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/v12-demo/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck: Done
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/v12-demo/taskbar hero
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

> taskbar-hero@0.0.0 test /Users/bao/.codex/worktrees/v12-demo/taskbar hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/chain test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/packages/chain
packages/game-rules test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/packages/game-rules
packages/auth test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/packages/auth
supabase/tests test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  01:21:14
packages/chain test:    Duration  704ms (import 59%, transform 36%, worker 3%, tests 2%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  01:21:14
packages/auth test:    Duration  1.49s (import 79%, tests 11%, transform 10%)
packages/auth test: Done
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  01:21:14
supabase/tests test:    Duration  6.94s (tests 78%, import 11%, transform 10%)
supabase/tests test: Done
packages/game-rules test:  Test Files  15 passed (15)
packages/game-rules test:       Tests  276 passed | 2 expected fail (278)
packages/game-rules test:    Start at  01:21:14
packages/game-rules test:    Duration  7.62s (tests 84%, import 8%, transform 6%, worker 2%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  01:21:22
packages/api-contract test:    Duration  245ms (transform 78%, import 18%, tests 3%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v12-demo/taskbar hero/apps/web
apps/web test:  Test Files  46 passed (46)
apps/web test:       Tests  492 passed (492)
apps/web test:    Start at  01:21:23
apps/web test:    Duration  4.93s (environment 54%, tests 28%, import 14%, transform 2%, worker 1%)
apps/web test: Environment  jsdom was created 46 times · 22.89s total, 54% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

> taskbar-hero@0.0.0 build /Users/bao/.codex/worktrees/v12-demo/taskbar hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
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
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/v12-demo/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1722 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 868ms
apps/web build: Done
```

All four commands exited 0. The production build includes the existing transitive `ox` worker_threads browser-externalization warning and completes successfully.

Additional review: GameApiErrorV2 matches the supplied content byte for byte; `git diff --check` is clean; changed paths are all within the allowlist; `pnpm-lock.yaml` is unchanged. GitHub CI is manual-only (`workflow_dispatch`), so the branch push does not trigger Actions.
