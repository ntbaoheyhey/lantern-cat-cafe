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

Remaining final validation results will be recorded after committing regenerated maps.

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
