# S1 shared v2 state builder — rerun 2

Implemented on `ai/codex-s1-state-r2`, based on fetched `origin/main` at `2ae54b5`.
The existing checkout was on `ai/codex-v5-forge` with uncommitted work. It was left intact;
this branch uses `/Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2`.

## Built

- Plain owned-item, claim-delta and player-state types, and fresh empty saves.
- Atomic stack deltas with actual credits/spends, content material caps, and key cap 5.
- Ordered bag insertions and V5 salvage yields for overflow, with item-level `autoSalvaged` results.
- Class selection, matching starter descriptor, strongest matching owned weapon, equip and lock operations.
- Pure claim application, actual gains after caps/overflow, XP/progress replacement, daily key date and revision bump.
- Boss reach/key/cooldown checks, loss cooldown without spending, win chest application, fight counts,
  first-clear advancement exactly once and recorded rematch wins.
- V5-backed crafting/salvaging and Relic costs/day tracking. Costs and salvage yields are read from registries.
- Tests for 2,000 seeded stack operations, 2,000 equipment/class operations, every state refusal code
  (including all stack-specific shortages), caps, bag overflow, frozen inputs, repeat clears,
  locking, deterministic crafting and direct V3 claim compatibility.
- Regenerated Deno maps for seven game Edge Functions; auth maps were regenerated identically.

`V2_CONFIG.bag.limit` (200) is used by claim, boss and craft; `nearFullRatio` (0.9) is UI tuning
and is not needed by these pure state transitions. `config.ts` was read and never changed.
No v1 code, existing function source, migrations, dependency manifests or lockfiles were edited.
No GitHub Actions were dispatched and no PR was opened. Current workflows are manual or main-only;
pushing this feature branch does not trigger them.

## Integration decisions and limits

- `chooseClass` returns `starterWeapon` separately when no matching weapon is owned, as requested
  ("returns the starter weapon to add"). It does not insert the descriptor itself. The caller assigns
  the persistence id, inserts it, then equips it; existing matching weapons are equipped immediately.
  This keeps starter insertion/bag policy explicit instead of silently exceeding the bag limit.
- The state-specific `OwnedItem`, `StackId` and exact requested `ClaimDeltaV2` declarations live in
  `state/types.ts`. The v2 barrel already exports idle declarations with those names, so state exports
  aliases `StateOwnedItemV2`, `StateStackIdV2`, `StateClaimDeltaV2`. The sole parent-barrel change is
  `export * from './state';`. Existing idle imports remain compatible until V12 unifies the types.
- The merged V3 idle delta actually has drops without instance ids or combat `itemId`. `applyClaim`
  accepts that existing delta as well as the requested state delta, maps `itemKey` to combat `itemId`,
  copies bonus lines and allocates deterministic distinct local ids. No changes to V3 were necessary.
- Generated starter/craft/drop ids are local identifiers, not UUIDs. Database adapters must assign
  row UUIDs when persisting. No randomness, clock reads, networking or storage I/O occurs here.
- Boss availability follows the merged idle engine: the final round's kills must be complete;
  a previously cleared chapter allows rematches. A repeated win is a rematch, earns its supplied
  chest and increments wins; it cannot advance progress a second time. The caller must supply
  the proper first/repeat chest and serialize writes. Optional expected revision/fight values
  (and expected class for equip) return `stale` when a previously observed snapshot changed.
- `applyRelicForge` takes an explicit YYYY-MM-DD game date, adapts it for the V5 block helper,
  applies the registry's 30 Yarn + 1 Moon Pearl cost and records the date. Voucher signing, pending
  voucher reuse, shared-v1 daily history and database locking remain the server adapter's work.
- Refusal objects retain useful API fields (`stack`, `reason`, `cooldownUntil`). Internal stack
  shortages use the requested `not_enough:<stackId>`; craft uses API `not_enough` plus `stack`.
- All checks below pass. The two expected-failure loot-balance cases predate this work in
  `v2/lootcheck/lootcheck.test.ts`; no tests were skipped, deleted or changed outside the new suite.
  Install reports pre-existing ignored optional native build scripts; Vite reports the dependency's
  existing worker-thread browser externalization warning. Neither failed validation.

## Setup transcript

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git fetch origin main
From https://github.com/ntbaoheyhey/taskbar-hero
 * branch            main       -> FETCH_HEAD
   683ad53..2ae54b5  main       -> origin/main
$ git worktree add -b ai/codex-s1-state-r2 '/Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2' origin/main
Preparing worktree (new branch 'ai/codex-s1-state-r2')
branch 'ai/codex-s1-state-r2' set up to track 'origin/main'.
HEAD is now at 2ae54b5 V17a: Character and Bag screens in the stage layout (sample data until demo mode) (#133)
```

The configured identity was rechecked in the new checkout and already matched, so no config changes
or author amendments were needed.

## Final local validation transcript

Commands were run from the new checkout. stdout/stderr were captured using
`> /tmp/s1-r2-<check>.log 2>&1`, then pasted below via `cat`. All six commands completed successfully.
This is the final pass after adding direct compatibility with the merged V3 delta.

```text
$ pnpm install --frozen-lockfile
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
Done in 412ms using pnpm v10.28.0
```

```text
$ pnpm gen:deno

> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

```text
$ pnpm typecheck

> taskbar-hero@0.0.0 typecheck /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2
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
```

```text
$ pnpm lint

> taskbar-hero@0.0.0 lint /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2
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

```text
$ pnpm test

> taskbar-hero@0.0.0 test /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/chain test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/packages/chain
packages/game-rules test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  00:16:04
packages/chain test:    Duration  385ms (import 40%, transform 29%, tests 16%, worker 15%)
packages/chain test: Done
packages/auth test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/packages/auth
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  00:16:05
packages/auth test:    Duration  420ms (import 65%, tests 30%, transform 4%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  00:16:04
supabase/tests test:    Duration  5.91s (tests 87%, import 11%, transform 1%)
supabase/tests test: Done
packages/game-rules test:  Test Files  12 passed (12)
packages/game-rules test:       Tests  241 passed | 2 expected fail (243)
packages/game-rules test:    Start at  00:16:04
packages/game-rules test:    Duration  6.45s (tests 91%, import 6%, transform 2%, worker 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  00:16:11
packages/api-contract test:    Duration  187ms (transform 59%, import 32%, tests 6%, worker 4%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/apps/web
apps/web test:  Test Files  42 passed (42)
apps/web test:       Tests  452 passed (452)
apps/web test:    Start at  00:16:12
apps/web test:    Duration  5.09s (environment 58%, tests 25%, import 14%, transform 2%)
apps/web test: Environment  jsdom was created 42 times · 25.52s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

```text
$ pnpm build

> taskbar-hero@0.0.0 build /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2
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
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1711 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-B9umeeOY.js               126.66 kB │ gzip:  36.87 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 349ms
apps/web build: Done
```

## Generated-file and whitespace verification

After staging implementation and generated maps, regenerated once more and checked for unstaged drift:

```text
$ pnpm gen:deno

> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/taskbar-hero-s1-state-r2
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
$ git diff --exit-code -- supabase/functions
(no output; exit 0)
$ git diff --cached --check
(no output; exit 0)
```

Delivery command: `git push -u origin ai/codex-s1-state-r2` after committing this report and implementation.
The final chat response confirms the remote branch and commit after pushing.
