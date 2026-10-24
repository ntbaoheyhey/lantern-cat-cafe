# S2 bag helpers — rerun

Date: 2026-10-25 (Asia/Ho_Chi_Minh).
Branch: `ai/codex-s2-bag-r2`.
Base: latest fetched `origin/main`, `2ae54b5a8bb647b7a524ea258dda962955a8c8dd`.

## Built

- Added pure bag helpers and a structural `BagItem` matching the documented API item, without importing the web app.
- `compareItems(cat, equipped, candidate)` returns `stats: { stat, before, after, delta }[]`, `powerBefore`, `powerAfter`, and `verdict`. The adapter maps API instance ids, rarity, level and bonus lines to `deriveStats`. It preserves all other equipped slots. Numeric derived stats include `attackIntervalMs`; class id and cat level are excluded. Verdict follows rounded `powerRating`.
- `bestLoadout` starts from the input items marked equipped, takes the largest strictly positive power gain across eligible slots, and repeats until no single swap improves power. It returns only the final changed instance ids, one per slot in registry order. Ties retain the current item; deterministic input order resolves equal improvements. It respects class weapons and slot unlock levels. Locked items may be equipped, as the API lock applies to salvage.
- `salvageCandidates` returns item objects in input order, excluding equipped/locked items and rarities above the inclusive ceiling. It preserves all best/tied items and stat tradeoffs. See the interpretation below.
- `bagUsage` counts all owned items including equipped ones, defaults to `V2_CONFIG.bag.limit`, and reads `V2_CONFIG.bag.nearFullRatio`. Explicit limits are supported. Config values read on the fetched main: limit **200**, near-full ratio **0.9**. `config.ts` was not edited.
- `sortItems` returns a new array: rarity descending then level descending; level mode prioritizes level descending; slot mode follows registry slot order then rarity/level. Equal keys keep input order. Recent mode reverses server acquisition order.
- Added exactly one barrel export to `v2/index.ts` and regenerated the seven game Edge Function import maps (four bag entries each). Auth maps are unchanged.
- Added 24 tests including a fast-check property with seed `20261025`, `numRuns: 500`, all classes, random levels/bonuses, and bags up to 60 items. The property checks power monotonicity, fixed points/idempotence, unique slots, class/level eligibility, engine agreement, salvage dominance/protections, sort stability and input immutability.

## Contract interpretations / limits

The task does not prescribe a property name for comparison differences; this implementation uses `stats`. Compare and loadout take the existing combat `CatState` (a chosen class, plus level). A caller with the API's nullable class must wait for class selection before calling them.

Salvage has no cat argument, so class-dependent power cannot rank accessories safely. "Worse" is conservatively defined as strict componentwise dominance of uncapped item contributions: every stat is at least as high on another owned item, and at least one is higher. Weapons compare only within the same weapon type. Equipped or locked items can protect inferior copies. Equal items and different stat tradeoffs are retained. This needs no arbitrary scoring weights and cannot remove all best items. It may suggest fewer items than a cat-specific power ranking.

API ItemV2 has no acquisition timestamp. The existing `v2_items_json` orders inventory by `created_at, id` oldest first, so recent uses reverse input order; callers should pass the original server inventory for this mode. No timestamps or ordering are guessed from UUIDs. Registry definitions supply base stats and slot/type validation; API rarity supplies the multiplier.

Greedy loadout optimizes the existing rounded UI power, stopping at a local fixed point; it does not promise an exhaustive global optimum or equip utility-only accessories with no power gain. This matches the requested greedy power-gain behavior.

No dependencies, v1 behavior, existing functions, migrations or config were changed. No GitHub Actions were dispatched and no pull request was opened. The checked workflow triggers are manual CI and deploy on main only, so this branch push does not trigger them.

## Setup evidence

The requested identity check was the first action:

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git fetch origin main
From https://github.com/ntbaoheyhey/taskbar-hero
 * branch            main       -> FETCH_HEAD
$ git log -1 --oneline origin/main
2ae54b5 V17a: Character and Bag screens in the stage layout (sample data until demo mode) (#133)
$ git worktree add -b ai/codex-s2-bag-r2 /tmp/taskbar-hero-s2-bag-r2 origin/main
Preparing worktree (new branch 'ai/codex-s2-bag-r2')
branch 'ai/codex-s2-bag-r2' set up to track 'origin/main'.
HEAD is now at 2ae54b5 V17a: Character and Bag screens in the stage layout (sample data until demo mode) (#133)
```

The original checkout had unrelated in-progress forge changes, which were left intact. All work and validation below ran in the isolated worktree. Read `docs/api-v2.md`, `docs/proposals/schema-v2.md`, `docs/content-v2.md`, the requested stats/content files and config before implementation. Also checked the API type, existing bag placeholder and server inventory ordering to resolve the structural type and recent sort.

## Verification

An initial focused run passed:

```text
$ pnpm --filter @taskbar-hero/game-rules test src/v2/bag/bag.test.ts
> @taskbar-hero/game-rules@0.0.0 test /private/tmp/taskbar-hero-s2-bag-r2/packages/game-rules
> vitest run src/v2/bag/bag.test.ts
 RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/packages/game-rules
 Test Files  1 passed (1)
      Tests  24 passed (24)
   Start at  00:12:32
   Duration  313ms (tests 55%, transform 31%, import 12%, worker 1%)
```

The first targeted typecheck found that the package's ES2022-only library declarations do not expose `structuredClone`:

```text
$ pnpm --filter @taskbar-hero/game-rules typecheck
> @taskbar-hero/game-rules@0.0.0 typecheck /private/tmp/taskbar-hero-s2-bag-r2/packages/game-rules
> tsc --noEmit
src/v2/bag/bag.test.ts(182,24): error TS2304: Cannot find name 'structuredClone'.
/private/tmp/taskbar-hero-s2-bag-r2/packages/game-rules:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL @taskbar-hero/game-rules@0.0.0 typecheck: `tsc --noEmit`
Exit status 2
```

Fixed by explicitly copying the test item's fields and bonus lines. No test was skipped or removed. All required checks then passed, in the requested order. The generated maps were staged before regeneration; the subsequent diff commands confirm regeneration leaves no additional changes. The two expected failures in the full game-rules output are existing `it.fails.each` lootcheck cases in `src/v2/lootcheck/lootcheck.test.ts:41`, unchanged by this task. Total passing tests: 1,068, plus those two existing expected failures.

Exact final validation commands and captured output:

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
Done in 391ms using pnpm v10.28.0
[exit 0]

$ pnpm gen:deno

> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-s2-bag-r2
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
[exit 0]

$ git diff --exit-code -- supabase/functions
[exit 0]

$ pnpm typecheck

> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-s2-bag-r2
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
[exit 0]

$ pnpm lint

> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-s2-bag-r2
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
[exit 0]

$ pnpm test

> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-s2-bag-r2
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/chain test:  RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/packages/chain
packages/auth test:  RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/packages/auth
packages/game-rules test:  RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  00:13:18
packages/chain test:    Duration  364ms (transform 70%, import 17%, worker 9%, tests 4%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  00:13:18
packages/auth test:    Duration  791ms (import 56%, transform 27%, tests 16%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  00:13:18
supabase/tests test:    Duration  5.80s (tests 82%, import 10%, transform 8%)
supabase/tests test: Done
packages/game-rules test:  Test Files  12 passed (12)
packages/game-rules test:       Tests  229 passed | 2 expected fail (231)
packages/game-rules test:    Start at  00:13:18
packages/game-rules test:    Duration  6.28s (tests 83%, transform 12%, import 5%, worker 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  00:13:25
packages/api-contract test:    Duration  238ms (transform 77%, import 18%, tests 3%, worker 1%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /private/tmp/taskbar-hero-s2-bag-r2/apps/web
apps/web test:  Test Files  42 passed (42)
apps/web test:       Tests  452 passed (452)
apps/web test:    Start at  00:13:25
apps/web test:    Duration  6.20s (environment 52%, tests 25%, import 13%, transform 9%)
apps/web test: Environment  jsdom was created 42 times · 27.76s total, 52% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
[exit 0]

$ pnpm build

> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-s2-bag-r2
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
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/private/tmp/taskbar-hero-s2-bag-r2/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1710 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-D6cFxOW9.js               126.17 kB │ gzip:  36.71 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 528ms
apps/web build: Done
[exit 0]

$ git diff --check
[exit 0]

$ git diff --exit-code
[exit 0]

```
