STATUS: DONE

C14: pure TypeScript server replay adapter for the V19 boss arena. Branch `ai/codex-v19-cues`, starting main `a42765ccd523fc4ceb9632d54b053778be798527`.

## What was done

Implemented `buildArenaCues`, `finalState`, public arena exports, six static demo API fixtures, and Node tests. The adapter rebuilds a raw-like log and delegates timing, projectile releases, defeat detection, and shared ordering to `buildBossCues`. It inserts arena effects beside the cue that caused them, clamps HP at zero, and removes only shake/flash for reduced motion. No renderer or Phaser dependency was introduced.

Per the follow-up fixture plan, **`ch2-win` (witch, bossReadyStrong, seed 1)** replaces the impossible chapter 5 generated win. Chapter 2 was tried before chapter 4, and its first seed won. Chapter 4 and the hand-built fallback were therefore unnecessary. Chapter 5's `bossReadyWeak` loss remains an unmodified demo API result. All six fixtures are generated, including chapter 1 and 3 wins/losses. The replacement witch win also supplies six burn-dot events.

The generator deep-compares all generated fixtures and their full required `ServerStateV2` snapshots, verifies deterministic serialized bytes, and supports `UPDATE_ARENA_FIXTURES=1`. Seeds are recorded beside each fixture ID. It validates any future hand-built fallback structurally and includes the requested conditional chapter-5 reminder: if a hand-built fixture exists and a real chapter-5 win becomes possible, it warns and reports a runtime skip instead of failing. This is the card's explicit exception; no ordinary test is disabled or skipped. No hand-built fixture is present now.

Exact blocker: None.

## Scope and git

Only these six allowed files are included:

- `apps/web/src/game/arena/cues.ts`
- `apps/web/src/game/arena/cues.test.ts`
- `apps/web/src/game/arena/arenaFixtures.ts`
- `apps/web/src/game/arena/arenaFixtures.test.ts`
- `apps/web/src/game/arena/index.ts`
- `reports/v19-cues.md`

No balance numbers, config, game-rules files, API, combat, layout, packages, lockfile, dependency list, or existing tests were edited. No PR, workflow dispatch, merge, or external comment was created. The task branch is the only branch selected for push.

The initial environment fallback used pnpm 11.25.0 and failed installation. Its automatic workspace-policy placeholders were restored in the earlier session. All current checks use repository-pinned pnpm 10.28.0 through Corepack, selected by a temporary wrapper outside the repository; `CI=true` only supplies noninteractive install behavior. Optional native dependency scripts remain ignored under the pinned install's default policy. Chromium was installed to the standard environment cache because `/opt/pw-browsers` is absent; no repository browser configuration was changed.

### Files touched (`git diff --stat origin/main...HEAD`)

<!-- BEGIN DIFF STAT -->
```text
 apps/web/src/game/arena/arenaFixtures.test.ts | 133 ++++
 apps/web/src/game/arena/arenaFixtures.ts      |  24 +
 apps/web/src/game/arena/cues.test.ts          | 186 ++++++
 apps/web/src/game/arena/cues.ts               |  85 +++
 apps/web/src/game/arena/index.ts              |   3 +
 reports/v19-cues.md                           | 877 ++++++++++++++++++++++++++
 6 files changed, 1308 insertions(+)
```
<!-- END DIFF STAT -->

## Gate check output

The required fetch ran before work. The arena directory was absent on main; timeline.ts, the `buildBossCues` export, and `BossFightResultV2` existed. D2 optional flags were absent (grep exit 1). The three existing V19 branches are loot, boss gate, and loot icons, and their fetched trees have no arena directory. No CL6 arena branch was observed. These prerequisites were rechecked on resume before edits. `tasks/v2/plan-to-finish.md` is absent at this main revision; the supplied card gives the requirements.

```text
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
[exit 0]

$ git rev-parse origin/main
a42765ccd523fc4ceb9632d54b053778be798527
[exit 0]

$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
[exit 0]

$ git config user.name
ntbaoheyhey
[exit 0]

$ git ls-tree origin/main apps/web/src/game/arena
[exit 0]

$ git ls-remote origin 'refs/heads/*v19*'
33da1af1f05ef357faca93186bcab79ecc9ef878	refs/heads/ai/antigravity-v19a-loot
bcca59a8b7a61da1700162f6e393e258609846e2	refs/heads/ai/antigravity-v19b-boss-gate
30947c9769210611d935b8a8a59a184535d4f480	refs/heads/ai/antigravity-v19c-loot-icons
[exit 0]

$ git cat-file -e origin/main:apps/web/src/game/combat/timeline.ts
[exit 0]

$ git show origin/main:apps/web/src/game/combat/index.ts | grep -n "buildBossCues"
2:export { buildBossCues, buildIdleCues, CuePlayer } from './timeline';
[exit 0]

$ git show origin/main:apps/web/src/api/GameApiV2.ts | grep -n "export interface BossFightResultV2"
161:export interface BossFightResultV2 {
[exit 0]

$ git show origin/main:apps/web/src/api/GameApiV2.ts | grep -n "big?: boolean"
[exit 1]

$ git ls-tree 33da1af1f05ef357faca93186bcab79ecc9ef878 apps/web/src/game/arena
[exit 0]

$ git ls-tree bcca59a8b7a61da1700162f6e393e258609846e2 apps/web/src/game/arena
[exit 0]

$ git ls-tree 30947c9769210611d935b8a8a59a184535d4f480 apps/web/src/game/arena
[exit 0]
```

## Cue contract

| Event | Primary cue | Extras | Reduced motion |
| --- | --- | --- | --- |
| attack_start | attackStart, numbered 1..n | none | unchanged |
| impact | impact, source hit | shared projectile release at travelMs earlier; boss flash on crit; first-zero-HP shared defeat | drop flash only |
| boss_windup | bossWindup | none | unchanged |
| boss_impact | bossImpact | shake unless dodged; cat flash for damage > 0 | drop shake/flash only |
| dot | dot, witch burn / alchemist poison | first-zero-HP shared defeat | unchanged |
| end | end, result.won | bossDefeat on win / catDefeat on loss immediately after end at the same time | unchanged |

The scheduler also emits one initial spawn snapshot. Shared cues keep the combat RANK and stable source order; extras remain immediately after their cause. `finalState` uses the last server HP values and full HP for untouched sides. It uses the authoritative result.won.

### Flags and measured inference agreement

Local compatibility type: `TimelineEventV2 & { big?: boolean; dodged?: boolean }`. Explicit flags, including false, win independently. Otherwise, a zero-damage boss impact means dodged; big means damage strictly greater than 1.5 times the median of all positive boss-impact damages, with the mean of the middle two for even counts. Its most recent preceding windup is big as well, unless that windup has an explicit flag. With no positive impacts there is no inferred big impact.

The fixture test re-simulates each fight using the same pre-fight equipped stats and `deriveSeed(seed, 0)`, compares `timelineViewV2(raw.log)` with the actual demo response, strips optional wire flags, and measures inference against raw big/dodged. This audit is observational; it does not assert that lossy inference perfectly reconstructs raw big flags.

| Fixture | impact.big | impact.dodged | windup.big |
| --- | --- | --- | --- |
| ch1-win | N/A (0/0) | N/A (0/0) | N/A (0/0) |
| ch1-loss | 4/4 | 4/4 | 3/5 |
| ch3-win | 6/7 | 7/7 | 6/7 |
| ch3-loss | 1/1 | 1/1 | 1/1 |
| ch5-loss | 1/1 | 1/1 | 1/1 |
| ch2-win | 2/2 | 2/2 | 2/2 |
| Total | 14/15 | 15/15 | 13/16 |

### Fixture list

| ID | Class | Chapter | Level | Seed | Won | Duration (ms) | Events |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ch1-win | warrior | 1 | 60 | 1 | true | 740 | 5 |
| ch1-loss | warrior | 1 | 1 | 1 | false | 6000 | 22 |
| ch3-win | archer | 3 | 60 | 1 | true | 9950 | 68 |
| ch3-loss | archer | 3 | 1 | 1 | false | 1500 | 7 |
| ch5-loss | witch | 5 | 1 | 1 | false | 1500 | 5 |
| ch2-win | witch | 2 | 60 | 1 | true | 4050 | 22 |

numbers or timeline changes (C5e/CL8, C12 D2 flags) require UPDATE_ARENA_FIXTURES=1 pnpm --filter @taskbar-hero/web exec vitest run src/game/arena/arenaFixtures.test.ts

## Acceptance self-check

The original goal, gates, exact six-file allowlist, forbidden edits, and ten acceptance tests were reread along with the follow-up fixture exception. Results:

| Acceptance item | Result | Evidence |
| --- | --- | --- |
| Required initial fetch and gates 1/2/3 | PASS | Gate output above; existing V19 branch trees have no arena |
| Record D2 state; accept optional flags before/after C12 | PASS | Absent on main; local intersection and synthetic explicit true/false cases |
| Same local branch; preserve earlier work | PASS | Continued ai/codex-v19-cues; adapted original five source files |
| Exact allowlist; no forbidden edits or new dependencies | PASS | Final committed audit below; forbidden-path stat empty |
| 1. One fixed primary mapping per timeline event | PASS | Node fixture tests; spawn separately identified as initial snapshot |
| 2. Sorted times, shared RANK, source order, adjacent extras | PASS | All fixtures plus deliberately scrambled same-time synthetic events |
| 3. HP never negative, including synthetic negatives | PASS | Cue, spawn, and Skip checks |
| 4. finalState matches last HP, defaults, won | PASS | All six fixtures; untouched sides and authoritative healing cases |
| 5. Win/loss ends with correct arena defeat after end | PASS | Per-fixture effect/end assertions |
| 6. Reduced motion preserves damage/times | PASS | Exact equality after only shake/flash removal |
| 7. Flag inference and explicit flag precedence | PASS | Zero/odd/even median and explicit true/false synthetic cases |
| 8. Archer releases precede every impact by travelMs | PASS | Both archer fixtures including volley timing |
| 9. Fixtures regenerate/deep-equal, outcomes/IDs correct | PASS | Six generated fixtures, byte comparison, structural/outcome tests |
| 10. No Phaser import; public module works in Node | PASS | Source import checks and Node execution |
| Keep ch1/ch3 generated wins/losses and generated ch5 weak loss | PASS | Demo API regeneration at first accepted seeds |
| Approved chapter-5-win replacement preference | PASS | Chapter 2 strong witch wins seed 1; no hand-built fallback needed |
| Hand-built structural/removal reminder (conditional code) | PASS | Implemented with the requested warning/runtime-skip exception; currently inactive |
| Author identity; one or two commits; task branch only | PASS | Exact required author, one commit, six allowed paths; final audit below |
| Required repository and card checks | PASS | Frozen install, Deno drift, typecheck, lint, full unit suite, build, both browser commands, focused arena/combat, regeneration, forbidden-path stat |

## NOT verified

No Phaser renderer, CL6 integration, visual arena animation, live server/wallet flow, or rebalance is implemented or manually verified by this pure-TS card. C12 is not merged on the tested main; its flags are covered synthetically rather than through a changed wire API. The optional hand-built fallback and its future-balance warning branch were not exercised because a generated chapter 2 win exists. A real chapter 5 win remains outside scope and is not claimed. The root unit run retains upstream gated tests in `packages/game-rules/src/v2/sim/search.test.ts:13,55,119` and `packages/game-rules/src/v2/sim/report.write.test.ts:12`: these report four skips across two files unless their opt-in simulation variables are set. It also reports two existing expected failures from `packages/game-rules/src/v2/lootcheck/lootcheck.test.ts:41`. These existing files were not changed, and no extra simulation/document-writing mode was enabled. Contract-specific forge/ABI checks were not applicable to this allowlist (verify-pr.sh selects them only for contract/chain changes).

## Checks run and actual output

All required check commands exited 0. The unit suite reports 1,719 passes, two upstream expected failures, and four upstream opt-in skips; the web portion has 1,003 passes. Focused arena/combat has 62 passes. Each whole browser invocation has 47 passes. No fix rounds, timeout increases, test weakening, or snapshot changes were needed after the approved fixture-plan revision.

These are the repository commands selected by scripts/verify-pr.sh for a web change, run locally from the repository root (browser commands from apps/web), plus the card's additional checks. The script itself was read rather than invoked with a PR number: no PR or GitHub Actions was used. Output is preserved below, including pass/fail summaries. Empty output is explicitly marked.

### `CI=true pnpm install --frozen-lockfile`

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
Done in 2.7s using pnpm v10.28.0
```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```

### `pnpm typecheck`

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

### `pnpm lint`

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

### `pnpm test`

```text

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  06:52:07
packages/chain test:    Duration  881ms (import 44%, transform 26%, tests 15%, worker 14%)
packages/chain test:     Isolate  2 workers spawned · ~328ms startup each (spawn + environment, per file)
packages/chain test:              at least ~328ms faster with isolate: false — reuses workers across files instead of one per file
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  06:52:07
packages/auth test:    Duration  2.07s (import 75%, tests 20%, transform 4%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  17 passed (17)
supabase/tests test:       Tests  372 passed (372)
supabase/tests test:    Start at  06:52:10
supabase/tests test:    Duration  182.82s (tests 93%, import 6%, transform 1%)
supabase/tests test: Done
packages/game-rules test:  Test Files  18 passed | 2 skipped (20)
packages/game-rules test:       Tests  297 passed | 2 expected fail | 4 skipped (303)
packages/game-rules test:    Start at  06:52:09
packages/game-rules test:    Duration  278.10s (tests 98%, import 1%, transform 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  06:56:50
packages/api-contract test:    Duration  1.11s (transform 62%, import 31%, tests 5%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  68 passed (68)
apps/web test:       Tests  1003 passed (1003)
apps/web test:    Start at  06:56:51
apps/web test:    Duration  224.56s (environment 60%, tests 27%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 68 times · 117.54s total, 60% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

### `pnpm build`

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
apps/web build: ✓ 1724 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-unBFXH2h.js               132.03 kB │ gzip:  38.56 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 2.78s
apps/web build: Done
```

### `cd apps/web && pnpm test:e2e`

```text

> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test

[WebServer] (node:3200) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:3212) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:3237) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:3249) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:3276) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:3288) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 47 tests using 1 worker

(node:3312) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓   1 [classic] › e2e/a11y.spec.ts:32:5 › Accessibility at 390px › How to play traps Tab in both directions and Escape returns focus to Menu (1.7s)
  ✓   2 [classic] › e2e/a11y.spec.ts:57:5 › Accessibility at 390px › every tab is reachable with Tab and activates with Enter and Space (2.8s)
  ✓   3 [classic] › e2e/a11y.spec.ts:80:5 › Accessibility at 390px › buttons and links have accessible names on onboarding and every tab (3.1s)
  ✓   4 [classic] › e2e/a11y.spec.ts:94:5 › Accessibility at 390px › primary Forge text and background have at least 4.5:1 contrast (1.4s)
  ✓   5 [classic] › e2e/a11y.spec.ts:121:5 › Accessibility at 390px › reduced motion leaves no running CSS animations on the Forge tab (1.4s)
  ✓   6 [classic] › e2e/a11y.spec.ts:32:5 › Accessibility at 1280px › How to play traps Tab in both directions and Escape returns focus to Menu (1.1s)
  ✓   7 [classic] › e2e/a11y.spec.ts:57:5 › Accessibility at 1280px › every tab is reachable with Tab and activates with Enter and Space (2.7s)
  ✓   8 [classic] › e2e/a11y.spec.ts:80:5 › Accessibility at 1280px › buttons and links have accessible names on onboarding and every tab (2.5s)
  ✓   9 [classic] › e2e/a11y.spec.ts:94:5 › Accessibility at 1280px › primary Forge text and background have at least 4.5:1 contrast (1.4s)
  ✓  10 [classic] › e2e/a11y.spec.ts:121:5 › Accessibility at 1280px › reduced motion leaves no running CSS animations on the Forge tab (1.8s)
  ✓  11 [classic] › e2e/boss.spec.ts:3:1 › boss tab fights, replays the log and shows the outcome (1.8s)
  ✓  12 [classic] › e2e/demo-path.spec.ts:8:5 › Judge demo path at 390px › plays from onboarding through upgrading, a boss fight, Forge and Market (3.0s)
  ✓  13 [classic] › e2e/demo-path.spec.ts:8:5 › Judge demo path at 1280px › plays from onboarding through upgrading, a boss fight, Forge and Market (3.2s)
  ✓  14 [classic] › e2e/forge.spec.ts:3:1 › forge tab shows the cost, odds and why forging is blocked in demo mode (1.3s)
  ✓  15 [classic] › e2e/inventory.spec.ts:3:1 › inventory tab equips a demo item and the power goes up (7.4s)
  ✓  16 [classic] › e2e/market.spec.ts:3:1 › market tab asks for a wallet when none is connected (1.4s)
  ✓  17 [classic] › e2e/onboarding.spec.ts:3:1 › first visit shows How to play; closing it reveals the game and it stays closed (2.3s)
  ✓  18 [classic] › e2e/polish.spec.ts:35:3 › 320px: no horizontal scroll and no overlap between the HUD, wallet and Menu (962ms)
  ✓  19 [classic] › e2e/polish.spec.ts:35:3 › 390px: no horizontal scroll and no overlap between the HUD, wallet and Menu (964ms)
  ✓  20 [classic] › e2e/polish.spec.ts:35:3 › 1280px: no horizontal scroll and no overlap between the HUD, wallet and Menu (1.2s)
  ✓  21 [classic] › e2e/polish.spec.ts:101:3 › reduced motion › the forge reveal shows the Relic without motion (10.6s)
  ✓  22 [classic] › e2e/polish.spec.ts:127:1 › tabs switch with the keyboard (Tab and Enter) (1.0s)
  ✓  23 [classic] › e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 1280px with no horizontal scroll and valid layout (1.2s)
  ✓  24 [classic] › e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 390px with no horizontal scroll and valid layout (1.1s)
  ✓  25 [classic] › e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 320px with no horizontal scroll and valid layout (1.1s)
  ✓  26 [classic] › e2e/smoke.spec.ts:3:1 › strip renders a canvas and the panel opens and closes (4.4s)
(node:3695) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  27 [stage-layout] › e2e/layout/character-bag.spec.ts:34:3 › character panel and bag are visible without horizontal scroll at 320px (1.3s)
  ✓  28 [stage-layout] › e2e/layout/character-bag.spec.ts:52:3 › equipping from the bag updates the slot name and locked slots show their level at 320px (1.2s)
  ✓  29 [stage-layout] › e2e/layout/character-bag.spec.ts:34:3 › character panel and bag are visible without horizontal scroll at 390px (971ms)
  ✓  30 [stage-layout] › e2e/layout/character-bag.spec.ts:52:3 › equipping from the bag updates the slot name and locked slots show their level at 390px (1.4s)
  ✓  31 [stage-layout] › e2e/layout/character-bag.spec.ts:34:3 › character panel and bag are visible without horizontal scroll at 1280px (983ms)
  ✓  32 [stage-layout] › e2e/layout/character-bag.spec.ts:52:3 › equipping from the bag updates the slot name and locked slots show their level at 1280px (1.1s)
  ✓  33 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 320px (1.1s)
  ✓  34 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 320px with reduced motion (1.1s)
  ✓  35 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 390px (1.1s)
  ✓  36 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 390px with reduced motion (1.1s)
  ✓  37 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 1280px (1.2s)
  ✓  38 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 1280px with reduced motion (1.2s)
  ✓  39 [stage-layout] › e2e/layout/stage-layout.spec.ts:114:3 › desktop tabs › shows Inventory, Boss, Forge, Market and Help; every tab is reachable by keyboard (3.7s)
  ✓  40 [stage-layout] › e2e/layout/stage-layout.spec.ts:132:3 › desktop tabs › arrow keys move focus along the tabs (831ms)
  ✓  41 [stage-layout] › e2e/layout/stage-layout.spec.ts:144:3 › desktop tabs › buttons and links have accessible names on every tab (3.0s)
  ✓  42 [stage-layout] › e2e/layout/stage-layout.spec.ts:154:3 › desktop tabs › the next-step chip opens the tab it points to (887ms)
  ✓  43 [stage-layout] › e2e/layout/stage-layout.spec.ts:166:3 › phone bottom sheet › opens from the bottom nav, covers at most 60% of the screen and closes again (1.8s)
  ✓  44 [stage-layout] › e2e/layout/stage-layout.spec.ts:198:3 › phone bottom sheet › every nav tab is reachable by keyboard (1.3s)
  ✓  45 [stage-layout] › e2e/layout/stage-layout.spec.ts:210:3 › phone bottom sheet › the sheet does not hide the stage (845ms)
  ✓  46 [stage-layout] › e2e/layout/stage-layout.spec.ts:224:3 › Mini mode › switches to the classic 96 px strip, is remembered, and switches back (2.3s)
  ✓  47 [stage-layout] › e2e/layout/stage-layout.spec.ts:244:3 › Mini mode › works when localStorage throws (1.2s)

  47 passed (1.8m)
```

### `pnpm --filter @taskbar-hero/web exec vitest run src/game/arena src/game/combat`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  4 passed (4)
      Tests  62 passed (62)
   Start at  06:49:17
   Duration  10.59s (environment 69%, tests 12%, transform 11%, import 6%, worker 1%)

Environment  jsdom was created 4 times · 5.80s total, 69% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments

```

### `git diff --stat origin/main -- apps/web/src/game/combat apps/web/src/layout apps/web/src/api packages pnpm-lock.yaml`

```text
(no output)
```

### `cd apps/web && pnpm exec playwright test`

```text
[WebServer] (node:4049) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:4061) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:4086) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:4098) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:4125) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:4137) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 47 tests using 1 worker

(node:4172) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓   1 [classic] › e2e/a11y.spec.ts:32:5 › Accessibility at 390px › How to play traps Tab in both directions and Escape returns focus to Menu (1.4s)
  ✓   2 [classic] › e2e/a11y.spec.ts:57:5 › Accessibility at 390px › every tab is reachable with Tab and activates with Enter and Space (2.5s)
  ✓   3 [classic] › e2e/a11y.spec.ts:80:5 › Accessibility at 390px › buttons and links have accessible names on onboarding and every tab (2.7s)
  ✓   4 [classic] › e2e/a11y.spec.ts:94:5 › Accessibility at 390px › primary Forge text and background have at least 4.5:1 contrast (1.4s)
  ✓   5 [classic] › e2e/a11y.spec.ts:121:5 › Accessibility at 390px › reduced motion leaves no running CSS animations on the Forge tab (1.4s)
  ✓   6 [classic] › e2e/a11y.spec.ts:32:5 › Accessibility at 1280px › How to play traps Tab in both directions and Escape returns focus to Menu (886ms)
  ✓   7 [classic] › e2e/a11y.spec.ts:57:5 › Accessibility at 1280px › every tab is reachable with Tab and activates with Enter and Space (2.2s)
  ✓   8 [classic] › e2e/a11y.spec.ts:80:5 › Accessibility at 1280px › buttons and links have accessible names on onboarding and every tab (2.2s)
  ✓   9 [classic] › e2e/a11y.spec.ts:94:5 › Accessibility at 1280px › primary Forge text and background have at least 4.5:1 contrast (1.1s)
  ✓  10 [classic] › e2e/a11y.spec.ts:121:5 › Accessibility at 1280px › reduced motion leaves no running CSS animations on the Forge tab (1.4s)
  ✓  11 [classic] › e2e/boss.spec.ts:3:1 › boss tab fights, replays the log and shows the outcome (1.7s)
  ✓  12 [classic] › e2e/demo-path.spec.ts:8:5 › Judge demo path at 390px › plays from onboarding through upgrading, a boss fight, Forge and Market (2.6s)
  ✓  13 [classic] › e2e/demo-path.spec.ts:8:5 › Judge demo path at 1280px › plays from onboarding through upgrading, a boss fight, Forge and Market (2.9s)
  ✓  14 [classic] › e2e/forge.spec.ts:3:1 › forge tab shows the cost, odds and why forging is blocked in demo mode (1.2s)
  ✓  15 [classic] › e2e/inventory.spec.ts:3:1 › inventory tab equips a demo item and the power goes up (7.2s)
  ✓  16 [classic] › e2e/market.spec.ts:3:1 › market tab asks for a wallet when none is connected (998ms)
  ✓  17 [classic] › e2e/onboarding.spec.ts:3:1 › first visit shows How to play; closing it reveals the game and it stays closed (1.9s)
  ✓  18 [classic] › e2e/polish.spec.ts:35:3 › 320px: no horizontal scroll and no overlap between the HUD, wallet and Menu (859ms)
  ✓  19 [classic] › e2e/polish.spec.ts:35:3 › 390px: no horizontal scroll and no overlap between the HUD, wallet and Menu (830ms)
  ✓  20 [classic] › e2e/polish.spec.ts:35:3 › 1280px: no horizontal scroll and no overlap between the HUD, wallet and Menu (932ms)
  ✓  21 [classic] › e2e/polish.spec.ts:101:3 › reduced motion › the forge reveal shows the Relic without motion (9.4s)
  ✓  22 [classic] › e2e/polish.spec.ts:127:1 › tabs switch with the keyboard (Tab and Enter) (1.1s)
  ✓  23 [classic] › e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 1280px with no horizontal scroll and valid layout (950ms)
  ✓  24 [classic] › e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 390px with no horizontal scroll and valid layout (957ms)
  ✓  25 [classic] › e2e/responsive-screenshots.spec.ts:26:5 › Responsive visual verification & screenshots › renders at 320px with no horizontal scroll and valid layout (925ms)
  ✓  26 [classic] › e2e/smoke.spec.ts:3:1 › strip renders a canvas and the panel opens and closes (4.3s)
(node:4558) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  27 [stage-layout] › e2e/layout/character-bag.spec.ts:34:3 › character panel and bag are visible without horizontal scroll at 320px (1.1s)
  ✓  28 [stage-layout] › e2e/layout/character-bag.spec.ts:52:3 › equipping from the bag updates the slot name and locked slots show their level at 320px (1.0s)
  ✓  29 [stage-layout] › e2e/layout/character-bag.spec.ts:34:3 › character panel and bag are visible without horizontal scroll at 390px (873ms)
  ✓  30 [stage-layout] › e2e/layout/character-bag.spec.ts:52:3 › equipping from the bag updates the slot name and locked slots show their level at 390px (1.1s)
  ✓  31 [stage-layout] › e2e/layout/character-bag.spec.ts:34:3 › character panel and bag are visible without horizontal scroll at 1280px (692ms)
  ✓  32 [stage-layout] › e2e/layout/character-bag.spec.ts:52:3 › equipping from the bag updates the slot name and locked slots show their level at 1280px (2.0s)
  ✓  33 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 320px (1.6s)
  ✓  34 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 320px with reduced motion (1.5s)
  ✓  35 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 390px (1.7s)
  ✓  36 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 390px with reduced motion (1.5s)
  ✓  37 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 1280px (1.3s)
  ✓  38 [stage-layout] › e2e/layout/stage-layout.spec.ts:58:5 › stage layout at 1280px with reduced motion (1.2s)
  ✓  39 [stage-layout] › e2e/layout/stage-layout.spec.ts:114:3 › desktop tabs › shows Inventory, Boss, Forge, Market and Help; every tab is reachable by keyboard (4.5s)
  ✓  40 [stage-layout] › e2e/layout/stage-layout.spec.ts:132:3 › desktop tabs › arrow keys move focus along the tabs (1.1s)
  ✓  41 [stage-layout] › e2e/layout/stage-layout.spec.ts:144:3 › desktop tabs › buttons and links have accessible names on every tab (4.4s)
  ✓  42 [stage-layout] › e2e/layout/stage-layout.spec.ts:154:3 › desktop tabs › the next-step chip opens the tab it points to (1.0s)
  ✓  43 [stage-layout] › e2e/layout/stage-layout.spec.ts:166:3 › phone bottom sheet › opens from the bottom nav, covers at most 60% of the screen and closes again (2.9s)
  ✓  44 [stage-layout] › e2e/layout/stage-layout.spec.ts:198:3 › phone bottom sheet › every nav tab is reachable by keyboard (2.1s)
  ✓  45 [stage-layout] › e2e/layout/stage-layout.spec.ts:210:3 › phone bottom sheet › the sheet does not hide the stage (1.2s)
  ✓  46 [stage-layout] › e2e/layout/stage-layout.spec.ts:224:3 › Mini mode › switches to the classic 96 px strip, is remembered, and switches back (3.0s)
  ✓  47 [stage-layout] › e2e/layout/stage-layout.spec.ts:244:3 › Mini mode › works when localStorage throws (1.1s)

  47 passed (1.7m)
```

### `UPDATE_ARENA_FIXTURES=1 pnpm --filter @taskbar-hero/web exec vitest run src/game/arena/arenaFixtures.test.ts --silent=false`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web

stdout | src/game/arena/arenaFixtures.test.ts > regenerates every generated demo API fixture and audits inference against the raw log
ch1-win: class=warrior chapter=1 level=60 seed=1 won=true duration=740ms events=5; inference impact.big=0/0 impact.dodged=0/0 windup.big=0/0
ch1-loss: class=warrior chapter=1 level=1 seed=1 won=false duration=6000ms events=22; inference impact.big=4/4 impact.dodged=4/4 windup.big=3/5
ch3-win: class=archer chapter=3 level=60 seed=1 won=true duration=9950ms events=68; inference impact.big=6/7 impact.dodged=7/7 windup.big=6/7
ch3-loss: class=archer chapter=3 level=1 seed=1 won=false duration=1500ms events=7; inference impact.big=1/1 impact.dodged=1/1 windup.big=1/1
ch5-loss: class=witch chapter=5 level=1 seed=1 won=false duration=1500ms events=5; inference impact.big=1/1 impact.dodged=1/1 windup.big=1/1
ch2-win: class=witch chapter=2 level=60 seed=1 won=true duration=4050ms events=22; inference impact.big=2/2 impact.dodged=2/2 windup.big=2/2


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  06:50:41
   Duration  1.94s (tests 41%, import 30%, transform 28%, worker 1%)

```

### `pnpm --filter @taskbar-hero/web exec vitest run src/game/arena/arenaFixtures.test.ts --silent=false --reporter=verbose`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web

stdout | src/game/arena/arenaFixtures.test.ts > regenerates every generated demo API fixture and audits inference against the raw log
ch1-win: class=warrior chapter=1 level=60 seed=1 won=true duration=740ms events=5; inference impact.big=0/0 impact.dodged=0/0 windup.big=0/0
ch1-loss: class=warrior chapter=1 level=1 seed=1 won=false duration=6000ms events=22; inference impact.big=4/4 impact.dodged=4/4 windup.big=3/5
ch3-win: class=archer chapter=3 level=60 seed=1 won=true duration=9950ms events=68; inference impact.big=6/7 impact.dodged=7/7 windup.big=6/7
ch3-loss: class=archer chapter=3 level=1 seed=1 won=false duration=1500ms events=7; inference impact.big=1/1 impact.dodged=1/1 windup.big=1/1
ch5-loss: class=witch chapter=5 level=1 seed=1 won=false duration=1500ms events=5; inference impact.big=1/1 impact.dodged=1/1 windup.big=1/1
ch2-win: class=witch chapter=2 level=60 seed=1 won=true duration=4050ms events=22; inference impact.big=2/2 impact.dodged=2/2 windup.big=2/2

 ✓ src/game/arena/arenaFixtures.test.ts > regenerates every generated demo API fixture and audits inference against the raw log 297ms
 ✓ src/game/arena/arenaFixtures.test.ts > keeps six distinct outcomes and validates any approved hand-built win structurally 2ms
 ✓ src/game/arena/arenaFixtures.test.ts > reminds us to replace a hand-built win when chapter 5 becomes winnable 4ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  06:49:45
   Duration  4.26s (transform 44%, import 38%, tests 17%, worker 1%)

```

### `pnpm --filter @taskbar-hero/web exec playwright install chromium (environment setup)`

```text
Downloading Chrome for Testing 156.0.8078.4 (playwright chromium v1248) from https://cdn.playwright.dev/builds/cft/156.0.8078.4/linux64/chrome-linux64.zip
|                                                                                |   0% of 191.1 MiB
|■■■■■■■■                                                                        |  10% of 191.1 MiB
|■■■■■■■■■■■■■■■■                                                                |  20% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■                                                        |  30% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                                |  40% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                        |  50% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                |  60% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                        |  70% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                |  80% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■        |  90% of 191.1 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100% of 191.1 MiB
Chrome for Testing 156.0.8078.4 (playwright chromium v1248) downloaded to /home/agent/.cache/ms-playwright/chromium-1248
Downloading FFmpeg (playwright ffmpeg v1013) from https://cdn.playwright.dev/dbazure/download/playwright/builds/ffmpeg/1013/ffmpeg-linux.zip
|                                                                                |   0% of 2.2 MiB
|■■■■■■■■                                                                        |  10% of 2.2 MiB
|■■■■■■■■■■■■■■■■                                                                |  20% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■                                                        |  30% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                                |  40% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                        |  50% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                |  60% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                        |  70% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                |  80% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■        |  90% of 2.2 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100% of 2.2 MiB
FFmpeg (playwright ffmpeg v1013) downloaded to /home/agent/.cache/ms-playwright/ffmpeg-1013
Downloading Chrome Headless Shell 156.0.8078.4 (playwright chromium-headless-shell v1248) from https://cdn.playwright.dev/builds/cft/156.0.8078.4/linux64/chrome-headless-shell-linux64.zip
|                                                                                |   0% of 120 MiB
|■■■■■■■■                                                                        |  10% of 120 MiB
|■■■■■■■■■■■■■■■■                                                                |  20% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■                                                        |  30% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                                |  40% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                        |  50% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                                |  60% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                        |  70% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                |  80% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■        |  90% of 120 MiB
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100% of 120 MiB
Chrome Headless Shell 156.0.8078.4 (playwright chromium-headless-shell v1248) downloaded to /home/agent/.cache/ms-playwright/chromium_headless_shell-1248
```

## Earlier stopped session and recovery

The first session correctly stopped when the original chapter-5 strong witch lost for seeds 1..20. The fixture plan was subsequently changed by the user; no balancing workaround was applied. The earlier frozen-install failures were due to the environment fallback pnpm version and its noninteractive/build-policy behavior; the pinned version resolved installation. The earlier fixture failure output is retained here as historical evidence, not a current acceptance failure.

### Earlier fallback install (no TTY)

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

### Earlier fallback install (ignored native build scripts)

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
? Verifying lockfile against supply-chain policies (520 entries)...
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 504, reused 0, downloaded 0, added 0
Progress: resolved 504, reused 0, downloaded 1, added 0
Progress: resolved 504, reused 0, downloaded 8, added 6
Progress: resolved 504, reused 0, downloaded 11, added 8
Progress: resolved 504, reused 0, downloaded 12, added 8
Progress: resolved 504, reused 0, downloaded 22, added 15
Progress: resolved 504, reused 0, downloaded 57, added 29
Progress: resolved 504, reused 0, downloaded 61, added 29
Progress: resolved 504, reused 0, downloaded 62, added 33
Progress: resolved 504, reused 0, downloaded 72, added 47
Progress: resolved 504, reused 0, downloaded 80, added 80
Progress: resolved 504, reused 0, downloaded 99, added 107
Progress: resolved 504, reused 0, downloaded 121, added 129
Progress: resolved 504, reused 0, downloaded 124, added 132
Progress: resolved 504, reused 0, downloaded 128, added 136
Progress: resolved 504, reused 0, downloaded 162, added 170
Progress: resolved 504, reused 0, downloaded 188, added 196
Progress: resolved 504, reused 0, downloaded 189, added 197
Progress: resolved 504, reused 0, downloaded 198, added 206
Progress: resolved 504, reused 0, downloaded 228, added 216
Progress: resolved 504, reused 0, downloaded 252, added 261
Progress: resolved 504, reused 0, downloaded 259, added 268
Progress: resolved 504, reused 0, downloaded 300, added 309
Progress: resolved 504, reused 0, downloaded 317, added 326
Progress: resolved 504, reused 0, downloaded 352, added 360
Progress: resolved 504, reused 0, downloaded 381, added 390
Progress: resolved 504, reused 0, downloaded 396, added 405
Progress: resolved 504, reused 0, downloaded 443, added 452
Progress: resolved 504, reused 0, downloaded 455, added 464
Progress: resolved 504, reused 0, downloaded 495, added 504, done
✓ Lockfile passes supply-chain policies (520 entries in 33.2s)

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### Earlier fallback retry

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 1m ago)
Lockfile is up to date, resolution step is skipped
Already up to date

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### Earlier fallback command auto-install before test startup

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 1m ago)
Lockfile is up to date, resolution step is skipped
Already up to date

   ╭──────────────────────────────────────────────────────────────────────╮
   │                                                                      │
   │                 Update available! 11.25.0 → 12.15.0.                 │
   │                 Changelog: https://pnpm.io/v/12.15.0                 │
   │   To update, run: curl -fsSL https://get.pnpm.io/install.sh | sh -   │
   │                                                                      │
   ╰──────────────────────────────────────────────────────────────────────╯


[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)
```

### Earlier pinned install (passed)

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 0, added 0
Progress: resolved 506, reused 0, downloaded 9, added 4
Progress: resolved 506, reused 0, downloaded 10, added 4
Progress: resolved 506, reused 0, downloaded 23, added 8
Progress: resolved 506, reused 0, downloaded 24, added 8
Progress: resolved 506, reused 0, downloaded 25, added 9
Progress: resolved 506, reused 0, downloaded 32, added 12
Progress: resolved 506, reused 0, downloaded 57, added 63
Progress: resolved 506, reused 0, downloaded 76, added 84
Progress: resolved 506, reused 0, downloaded 98, added 106
Progress: resolved 506, reused 0, downloaded 117, added 125
Progress: resolved 506, reused 0, downloaded 137, added 144
Progress: resolved 506, reused 0, downloaded 164, added 171
Progress: resolved 506, reused 0, downloaded 175, added 183
Progress: resolved 506, reused 0, downloaded 176, added 183
Progress: resolved 506, reused 0, downloaded 199, added 207
Progress: resolved 506, reused 0, downloaded 219, added 227
Progress: resolved 506, reused 0, downloaded 237, added 246
Progress: resolved 506, reused 0, downloaded 250, added 258
Progress: resolved 506, reused 0, downloaded 264, added 273
Progress: resolved 506, reused 0, downloaded 276, added 284
Progress: resolved 506, reused 0, downloaded 284, added 293
Progress: resolved 506, reused 0, downloaded 299, added 308
Progress: resolved 506, reused 0, downloaded 304, added 309
Progress: resolved 506, reused 0, downloaded 333, added 321
Progress: resolved 506, reused 0, downloaded 349, added 357
Progress: resolved 506, reused 0, downloaded 374, added 383
Progress: resolved 506, reused 0, downloaded 393, added 402
Progress: resolved 506, reused 0, downloaded 407, added 415
Progress: resolved 506, reused 0, downloaded 417, added 426
Progress: resolved 506, reused 0, downloaded 441, added 450
Progress: resolved 506, reused 0, downloaded 464, added 473
Progress: resolved 506, reused 0, downloaded 465, added 473
Progress: resolved 506, reused 0, downloaded 480, added 473
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 44s using pnpm v10.28.0
```

### Original chapter-5 strong witch seed search (known balance stop)

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web

stdout | src/game/arena/arenaFixtures.test.ts > regenerates six deterministic demo API fixtures and audits inference against the raw log
ch1-win: class=warrior chapter=1 level=60 seed=1 won=true duration=740ms events=5; inference impact.big=0/0 impact.dodged=0/0 windup.big=0/0

stdout | src/game/arena/arenaFixtures.test.ts > regenerates six deterministic demo API fixtures and audits inference against the raw log
ch1-loss: class=warrior chapter=1 level=1 seed=1 won=false duration=6000ms events=22; inference impact.big=4/4 impact.dodged=4/4 windup.big=3/5

stdout | src/game/arena/arenaFixtures.test.ts > regenerates six deterministic demo API fixtures and audits inference against the raw log
ch3-win: class=archer chapter=3 level=60 seed=1 won=true duration=9950ms events=68; inference impact.big=6/7 impact.dodged=7/7 windup.big=6/7

stdout | src/game/arena/arenaFixtures.test.ts > regenerates six deterministic demo API fixtures and audits inference against the raw log
ch3-loss: class=archer chapter=3 level=1 seed=1 won=false duration=1500ms events=7; inference impact.big=1/1 impact.dodged=1/1 windup.big=1/1

 ❯ src/game/arena/arenaFixtures.test.ts (1 test | 1 failed) 136ms
   × regenerates six deterministic demo API fixtures and audits inference against the raw log 134ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/game/arena/arenaFixtures.test.ts > regenerates six deterministic demo API fixtures and audits inference against the raw log
AssertionError: STOP: bossReadyStrong chapter 5 witch had no expected outcome for seeds 1..20: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/game/arena/arenaFixtures.test.ts:66:108
     64|         break;
     65|       }
     66|       expect(found, `STOP: ${kind} chapter ${chapter} ${classId} had n…
       |                                                                                                            ^
     67|     }
     68|   }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  06:36:40
   Duration  1.48s (transform 78%, tests 11%, import 10%, worker 1%)

undefined
/workspace/taskbar-hero/apps/web:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/game/arena/arenaFixtures.test.ts
```

### First revised-fixture generation (passed)

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  06:48:43
   Duration  2.35s (transform 57%, import 26%, tests 15%, worker 1%)

```

## Final git audit

<!-- BEGIN GIT AUDIT -->
```text
$ git fetch origin +main:refs/remotes/origin/main && git diff --name-only origin/main...HEAD
apps/web/src/game/arena/arenaFixtures.test.ts
apps/web/src/game/arena/arenaFixtures.ts
apps/web/src/game/arena/cues.test.ts
apps/web/src/game/arena/cues.ts
apps/web/src/game/arena/index.ts
reports/v19-cues.md
[exit 0]

$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
[exit 0]

$ git rev-parse origin/main
a42765ccd523fc4ceb9632d54b053778be798527
[exit 0]

$ git rev-list --count origin/main..HEAD
1
[exit 0]

$ git diff --check origin/main...HEAD
[exit 0]
```

PASS: all six committed paths are exactly the allowlist; one commit; author matches the required identity. The final report amendment changes only this report, and these audits will be repeated before push.
<!-- END GIT AUDIT -->

## CL6 hand-off / needed to continue

`import { buildArenaCues, finalState, ARENA_FIXTURES } from './arena'; the renderer reads cues only`.

CL6 should consume cue timing and target HP, including the shared initial spawn; it should not re-simulate fights or infer damage timing. Renderers can use `finalState` for Skip. The sample win for witch is chapter 2 until an owned future fixture update returns to a generated chapter 5 win. The generation comment and command describe required refreshes after balance/timeline changes.
