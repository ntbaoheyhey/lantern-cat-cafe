# V3 — idle progression v2

Branch: `ai/codex-v3-idle`. Base: latest fetched `origin/main`, `683ad5322859f08128efda1e536d2c8acf4f2ba1` (24 October 2026).

The original checkout contained another task's unfinished forge changes. Work was isolated at `/Users/bao/.codex/worktrees/v3-idle/taskbar hero`; that checkout was left alone. No dependencies, PRs, GitHub Actions, migrations, existing functions, or v1 behavior were changed.

## Built

- Exported pure `computeClaimV2(input, elapsedSeconds, seed)` and the exact requested `ClaimDeltaV2` shape from `v2/idle/types.ts`, with `ClaimInputV2`, `StackId`, and `OwnedItem`.
- Analytical counts for the deterministic regular-monster rotation plus the final elite, including partial rounds. Each simulation step processes up to a whole round; production code never loops through kills or combat hits. Round work is capped by `idle.maxRoundsPerClaim`.
- Uses `deriveStats`, `monsterAt`, `monsterFight`, and `stageOf`. Fight time plus configured walking time determines completed kills. XP and Fish use the stage/archetype rewards and derived XP/Fish bonuses; Yarn uses its configured stage curve and `lootMul`.
- Level-up XP carries over, with `ceil(xpBase * xpGrowth^(level-1))` thresholds and the existing level-60 cap. XP is zero at the cap.
- Checks the whole next round, including its elite, before granting frontier progress. A gate freezes the frontier for this claim and farms the nearest earlier winnable round, searching earlier cleared chapters if necessary. Levels earned while gated can unlock progression on the next claim. `neededPower` is a UI estimate from a bounded binary search scaling the current HP/ATK/DEF, always above the blocked cat's current power.
- Boss-ready is represented as the last regular round with `kills === killsPerRound` (chapter 1: round 10, kills 6; later chapters: round 10, kills 10). Further time farms behind that frontier. The engine never selects a boss, advances a chapter, or records a boss clear.
- First positive-duration claim of a UTC+7 game date grants the configured daily key and records the date even if already capped. The caller supplies `today` and `lastDailyKeyDay` as ISO game dates. Random keys roll at 1/150 per kill only in cleared chapters. The key cap comes from `MATERIALS`.
- Material, key, and gear counts use an exact seeded binomial sampler via geometric gaps. It visits sampled successes, rather than every kill; complements handle probabilities above 0.5. Batches aggregate equivalent monster/stage/level rewards. No normal approximation or expected-count substitution is used.
- Actual gear counts go through shared `rollLoot` for configurable rarity weights. Catalog chapter availability, unlocked slots, rarity level limits, distinct bonus lines, and content bonus ranges are respected. Exactly 60% of weapon selections use the class weapon branch; the other branch excludes it. `SMART_LOOT.classWeaponShare` is imported.
- `OwnedItem` contains catalog key, slot, optional weapon type, rarity, level, bonus, locked/equipped flags and `source: 'drop'`. Persistence assigns owned UUIDs and handles bag overflow/auto-salvage; the requested input has no bag state.
- Added only one `idle` config block, the single requested v2 barrel export, five allowed idle files, this report, and regenerated Deno maps (four import entries in each of seven game maps; auth maps remained unchanged).

## Decisions and limitations

The material registry currently has IDs/caps but no monster-source metadata. Its generated docs list chest/salvage sources only. To stay within the allowed files, the task's monster sources and new probabilities live in `V2_CONFIG.idle.materialDrops`: Fluff Tuft from all chapters, Shiny Button from chapter 2+, and rare Catnip Crystal from elites. No Moon Pearl or Starlight Scale monster drops were invented.

The existing stage helper supplies XP and Fish, but no Yarn curve exists. The new configurable Yarn base is 0.1 and growth 1.1; walk time is 1000 ms; gear chance is 0.02 with common/uncommon/rare/epic/legendary weights 70/20/8/1.8/0.2. These are explicit initial tuning choices, not pre-existing approved balance values. All are isolated in the allowed idle block; no existing number changed.

XP/Fish round down per kill to integer rewards. Yarn retains its fractional accumulation during a claim and rounds down once. Incomplete kill time cannot persist through the specified API, which has no sub-kill time field. Tests cover <1% XP/Fish differences both for an eight-hour offline claim split in half and a claim split within the online window.

The v1 time policy is imported unchanged: capped elapsed time, full-rate initial online window unless explicitly offline, and offline efficiency for the rest. Splitting a long online claim resets that full-rate window, so arbitrary online splits cannot preserve reward totals within 1%; this is inherent in the required v1 policy. Offline and equal-effective-time splits are tested. Reopening a previously gated frontier on a later claim can also change its farming stage.

The API does not carry boss-clear rows. Cleared farming chapters are inferred from `chapter < input.chapter` or a `bestStage` beyond that chapter's last stage. At a normal current frontier, no random keys are granted unless farming an earlier chapter.

## Validation

Final full command chain exited 0. All 59 test files passed: 911 passing tests plus two existing `it.fails` expectations in `v2/lootcheck/lootcheck.test.ts` (first/repeat chest gear-count monotonicity). No tests were deleted, skipped, or marked expected-failure by this task. All 17 new idle tests pass.

The frozen install reported existing ignored native build scripts; the web build reported the existing `node:worker_threads` browser-externalization warning. Neither failed a check. Deno output was staged, regenerated again, and checked for zero additional diff.

### Git setup

Executed first, before repository work:

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git fetch origin main
From https://github.com/ntbaoheyhey/taskbar-hero
 * branch            main       -> FETCH_HEAD
```

A managed isolated worktree was created from `origin/main`, then:

```text
$ git switch -c ai/codex-v3-idle
Switched to a new branch 'ai/codex-v3-idle'
$ git log -1 --format='%h %an <%ae>'
683ad53 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

### Initial test typing correction

`pnpm --filter @taskbar-hero/game-rules test src/v2/idle/idle.test.ts` initially passed all 16 tests. Typecheck caught test-only Node/global helpers not present in the package's ES2022-only typings:

```text
$ pnpm --filter @taskbar-hero/game-rules typecheck
src/v2/idle/idle.test.ts(1,29): error TS2307: Cannot find module 'node:perf_hooks' or its corresponding type declarations.
src/v2/idle/idle.test.ts(135,20): error TS2304: Cannot find name 'structuredClone'.
src/v2/idle/idle.test.ts(194,5): error TS2584: Cannot find name 'console'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.
Exit status 2
```

Replaced those helpers with `Date.now()` and a JSON copy, removed logging, and reran typecheck successfully. Added the online-window split test; the focused command then exited 0:

```text
$ pnpm --filter @taskbar-hero/game-rules test src/v2/idle/idle.test.ts
 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  20:30:28
   Duration  308ms (tests 66%, transform 24%, import 9%, worker 1%)
```

### Final required local checks — exact command and pasted output

```sh
pnpm install --frozen-lockfile && pnpm gen:deno && git diff --exit-code -- supabase/functions && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

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
Done in 451ms using pnpm v10.28.0

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/v3-idle/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/v3-idle/taskbar hero
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

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/v3-idle/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint: Done
packages/auth lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

> taskbar-hero@0.0.0 test /Users/bao/.codex/worktrees/v3-idle/taskbar hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/auth test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v3-idle/taskbar hero/packages/auth
packages/chain test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v3-idle/taskbar hero/packages/chain
packages/game-rules test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v3-idle/taskbar hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v3-idle/taskbar hero/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  20:31:10
packages/chain test:    Duration  376ms (import 67%, transform 19%, tests 7%, worker 6%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  20:31:10
packages/auth test:    Duration  729ms (import 79%, tests 17%, transform 3%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  12 passed (12)
supabase/tests test:       Tests  301 passed (301)
supabase/tests test:    Start at  20:31:10
supabase/tests test:    Duration  4.25s (tests 81%, import 17%, transform 2%)
supabase/tests test: Done
packages/game-rules test:  Test Files  11 passed (11)
packages/game-rules test:       Tests  205 passed | 2 expected fail (207)
packages/game-rules test:    Start at  20:31:10
packages/game-rules test:    Duration  5.40s (tests 93%, import 4%, transform 2%, worker 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v3-idle/taskbar hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  20:31:16
packages/api-contract test:    Duration  167ms (transform 48%, import 40%, tests 8%, worker 4%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v3-idle/taskbar hero/apps/web
apps/web test:  Test Files  32 passed (32)
apps/web test:       Tests  358 passed (358)
apps/web test:    Start at  20:31:16
apps/web test:    Duration  3.69s (environment 58%, tests 23%, import 16%, transform 2%)
apps/web test: Environment  jsdom was created 32 times · 18.44s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

> taskbar-hero@0.0.0 build /Users/bao/.codex/worktrees/v3-idle/taskbar hero
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
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/v3-idle/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1695 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-djZZZ0we.css               34.77 kB │ gzip:   7.28 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-C6uSdp8y.js                98.00 kB │ gzip:  28.59 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 345ms
apps/web build: Done
```

### Eight-hour benchmark

After one warm-up, ten eight-hour claims took 4.789–11.111 ms on this host. The test measures wall time and uses a generous 150 ms ceiling for shared/loaded runners; the measured local result meets the requested 50 ms target. The benchmark uses already-installed Vite only and writes no source files.

```sh
pnpm --filter @taskbar-hero/web exec node --input-type=module <<'JS'
import { createServer } from 'vite';
import { performance } from 'node:perf_hooks';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { computeClaimV2 } = await server.ssrLoadModule('../../packages/game-rules/src/v2/idle/index.ts');
  const input = { classId: 'warrior', level: 60, xp: 0, chapter: 1, round: 1, kills: 0, bestStage: 0, equipped: [{ itemId: 'wpn.sword.ninelives', level: 50 }, ...['helmet', 'armor', 'gloves', 'boots'].map(slot => ({ itemId: `arm.cozy.${slot}.legendary`, level: 50 }))], keysHeld: 0, lastDailyKeyDay: '2026-10-24', today: '2026-10-24', offline: false };
  computeClaimV2(input, 28800, 1);
  const durations = [];
  for (let seed = 2; seed < 12; seed++) {
    const start = performance.now();
    const result = computeClaimV2(input, 28800, seed);
    durations.push(performance.now() - start);
    if (seed === 2) console.log(JSON.stringify({ progress: result.progress, fish: result.stackDeltas.fish, items: result.items.length }));
  }
  console.log('8-hour claims (ms):', durations.map(n => n.toFixed(3)).join(', '));
  console.log('maximum (ms):', Math.max(...durations).toFixed(3));
} finally { await server.close(); }
JS
```

```text
{"progress":{"level":60,"xp":0,"chapter":1,"round":10,"kills":6,"bestStage":10},"fish":66367,"items":329}
8-hour claims (ms): 8.045, 11.111, 8.914, 6.630, 5.304, 5.638, 5.146, 4.987, 5.140, 4.789
maximum (ms): 11.111
```

### Final scope and identity audit

`git diff --check` exited 0 with no output. Only the task's allowlisted paths are staged. The new commit's author is checked before push; its output and the push result are recorded in the delivery section below.

## Delivery

Implementation commit: `dc60ce5` (`feat: add deterministic v2 idle progression`). A second report-only commit records this delivery evidence. No code changed after the final validation chain.

```text
$ git diff --cached --check
(exit 0, no output; an initial report EOF blank-line warning was removed before committing)
$ git commit -m "feat: add deterministic v2 idle progression"
[ai/codex-v3-idle dc60ce5] feat: add deterministic v2 idle progression
 15 files changed, 850 insertions(+)
$ git log origin/main..HEAD --format='%h %an <%ae>'
dc60ce5 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
$ git push -u origin ai/codex-v3-idle
remote:
remote: Create a pull request for 'ai/codex-v3-idle' on GitHub by visiting:
remote:      https://github.com/ntbaoheyhey/taskbar-hero/pull/new/ai/codex-v3-idle
remote:
To https://github.com/ntbaoheyhey/taskbar-hero.git
 * [new branch]      ai/codex-v3-idle -> ai/codex-v3-idle
branch 'ai/codex-v3-idle' set up to track 'origin/ai/codex-v3-idle'.
$ pnpm gen:deno && git diff --exit-code && git status --short --branch && git log origin/main..HEAD --format='%h %an <%ae>'
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/v3-idle/taskbar hero
> node scripts/gen-deno-json.mjs
wrote 9 Edge Function import maps
## ai/codex-v3-idle...origin/ai/codex-v3-idle
dc60ce5 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

The remote printed its generic PR creation link; it was not followed and no PR was created. Inspected workflows: CI is manual-only, and Edge Function deployment triggers only on main or manual dispatch. Pushing this feature branch does not trigger either. No Actions commands or dispatches were run.
