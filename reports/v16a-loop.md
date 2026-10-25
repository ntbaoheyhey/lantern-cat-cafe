# V16a: v2 game loop and API switch

Implemented the authoritative v2 loop, injected API selection, event stream, and fake-only tests beside v1. No app wiring, dependencies, v1 edits, network tests, Actions runs, or PR.

## Gate and Git setup

Gate passed against fetched origin/main at `d0640ad` (latest when fetched). Both required interface files exist. No AGENTS.md was found in the repository or ancestor directories. The original checkout contained unrelated changes; they were preserved by working in `/tmp/taskbar-hero-v16a-loop` on the requested new branch.

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git fetch origin +main:refs/remotes/origin/main
(no output; exit 0)
$ git ls-tree origin/main apps/web/src/api/GameApiV2.ts apps/web/src/game/gameState.ts
100644 blob afbee95cf0dc71331812ecea68e8836dcbc9c5a2	apps/web/src/api/GameApiV2.ts
100644 blob 7ab62b454b6c8518c7e290048b4ede810a3aca7d	apps/web/src/game/gameState.ts
$ git worktree add -b ai/codex-v16a-loop /tmp/taskbar-hero-v16a-loop origin/main
Preparing worktree (new branch 'ai/codex-v16a-loop')
branch 'ai/codex-v16a-loop' set up to track 'origin/main'.
HEAD is now at d0640ad feat(art): chapter 5 night rooftop monsters and boss pixel art (v24e) (#139)
```

Read docs/api-v2.md (including Rate notes), GameApiV2.ts, gameState.ts and its tests, apiSwitch.ts and its tests, store.ts, and wallet/session.ts before implementation. Claims run every 30 seconds while visible; the server enforces the documented 10-second minimum. No prediction or local progression is added.

## Files changed

- `apps/web/src/game/v2/loopV2.ts`: stable snapshots, generation cancellation, visible claims, shared claim promise, boss barrier, serialized actions, structural errors and stale refetch.
- `apps/web/src/game/v2/loopV2.test.ts`: hand-written interface fake and visibility document, fake timers, required loop scenarios plus lifecycle, gain detection, action wiring and failure regressions.
- `apps/web/src/game/v2/apiSwitchV2.ts`: injected demo/server/guard factories, token changes, cached demo and expired notice.
- `apps/web/src/game/v2/apiSwitchV2.test.ts`: selection, token changes, loop restarts, guard expiration and demo reuse without network.
- `apps/web/src/game/v2/events.ts`: event union and forward-only progression diffs.
- `apps/web/src/game/v2/index.ts`: public barrel exports.
- `reports/v16a-loop.md`: this report.

## Public API

Types referenced below come from GameApiV2.ts; SessionStore comes from wallet/session, and GameMode is reused from the v1 apiSwitch. These are declaration signatures of the implementation.

```ts
export const CLAIM_INTERVAL_MS_V2 = 30_000;

export interface GameSnapshotV2 {
  state: ServerStateV2 | null;
  loadFailed: boolean;
  paused: boolean;
  busy: ActionNameV2 | null;
  lastEvent: LoopEventV2 | null;
  eventSeq: number;
}

export interface GameLoopV2Options {
  api: GameApiV2;
  /** Clock in milliseconds, also used for event timestamps. */
  now?: () => number;
}

export class GameLoopV2 {
  constructor(opts: GameLoopV2Options);
  readonly subscribe: (fn: () => void) => () => void;
  readonly getSnapshot: () => GameSnapshotV2;
  onEvent(fn: (event: LoopEventV2) => void): () => void;
  start(doc?: Document): Promise<void>;
  stop(): void;
  switchApi(api: GameApiV2): void;
  retry(): Promise<void>;
  claimNow(): Promise<void>;
  chooseClass(classId: ClassId): Promise<void>;
  equip(itemId: string | null, slot: GearSlotId): Promise<void>;
  fightBoss(chapter: number): Promise<BossFightResultV2 | null>;
  craft(recipeId: RecipeId, slot: GearSlotId): Promise<CraftResultV2 | null>;
  salvage(itemIds: string[]): Promise<SalvageResultV2 | null>;
  setLocked(itemId: string, locked: boolean): Promise<void>;
  forgeRelic(): Promise<ForgeResultV2 | null>;
}

export interface ApiSwitchV2Options {
  sessions: SessionStore;
  env: { supabaseUrl?: string; anonKey?: string };
  /** Builds the demo (mock) API; called once and reused. */
  demo: () => GameApiV2;
  server: (opts: { baseUrl: string; anonKey: string; getToken: () => string | null | undefined }) => GameApiV2;
  guard?: (api: GameApiV2, onUnauthenticated: () => void) => GameApiV2;
}

export class ApiSwitchV2 {
  constructor(opts: ApiSwitchV2Options);
  readonly loop: GameLoopV2;
  get api(): GameApiV2;
  readonly getMode: () => GameMode;
  readonly subscribe: (fn: () => void) => () => void;
}

export type ActionNameV2 = 'chooseClass' | 'equip' | 'fightBoss' | 'craft' | 'salvage' | 'setLocked' | 'forgeRelic';

export type LoopEventV2 =
  | { type: 'claimed'; gains: GainsV2; at: number }
  | { type: 'levelUp'; from: number; to: number; at: number }
  | { type: 'roundUp'; chapter: number; round: number; at: number }
  | { type: 'chapterUp'; chapter: number; at: number }
  | { type: 'bossFight'; result: BossFightResultV2; at: number }
  | { type: 'crafted'; result: CraftResultV2; at: number }
  | { type: 'salvaged'; result: SalvageResultV2; at: number }
  | { type: 'forged'; result: ForgeResultV2; at: number }
  | { type: 'refused'; action: ActionNameV2; code: string; at: number }
  | { type: 'error'; action: ActionNameV2 | 'load' | 'claim'; message: string; at: number };

export function diffProgressEventsV2(before: ServerStateV2 | null, after: ServerStateV2, at: number): LoopEventV2[];
```

Barrel exports:

```ts
export { GameLoopV2, CLAIM_INTERVAL_MS_V2 } from './loopV2';
export type { GameLoopV2Options, GameSnapshotV2 } from './loopV2';
export { ApiSwitchV2 } from './apiSwitchV2';
export type { ApiSwitchV2Options } from './apiSwitchV2';
export { diffProgressEventsV2 } from './events';
export type { ActionNameV2, LoopEventV2 } from './events';
```

## Claude V16 wiring

```ts
// Once C4/C9 and the v2 guard are available, construct one shared switch:
const sw = new ApiSwitchV2({ sessions, env, demo: () => new MockGameApiV2(), server: (o) => new SupabaseGameApiV2(o), guard: withSessionGuardV2 });
// Mount/unmount the stage with sw.loop.start(document) and sw.loop.stop().
// Read state with useSyncExternalStore(sw.loop.subscribe, sw.loop.getSnapshot); mode with sw.subscribe/sw.getMode.
// Subscribe to sw.loop.onEvent for stage effects; send HUD actions to sw.loop and unsubscribe effects on cleanup.
```

## Validation: full command output

Outputs below are unabridged. The requested filtered command actually runs the whole web suite with the current pnpm/Vitest argument forwarding (`vitest run -- game/v2`); the new test files are included. All required final commands exited 0. Across workspaces: 1,155 passing tests and 2 existing expected failures (game-rules).

### `pnpm install --frozen-lockfile`

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +505
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 505, reused 496, downloaded 0, added 128
Progress: resolved 505, reused 496, downloaded 0, added 304
Progress: resolved 505, reused 496, downloaded 0, added 366
Progress: resolved 505, reused 496, downloaded 0, added 405
Progress: resolved 505, reused 496, downloaded 0, added 503
Progress: resolved 505, reused 496, downloaded 0, added 504
Progress: resolved 505, reused 496, downloaded 0, added 505, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 6.5s using pnpm v10.28.0
```

### `pnpm --filter @taskbar-hero/web test -- game/v2`

```text

> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-v16a-loop/apps/web
> vitest run -- game/v2


 RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/apps/web


 Test Files  47 passed (47)
      Tests  503 passed (503)
   Start at  01:10:51
   Duration  8.17s (environment 60%, tests 25%, import 12%, transform 3%)

Environment  jsdom was created 47 times · 42.22s total, 60% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments

```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v16a-loop
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

`git diff --exit-code` produced no output and exited 0.

### `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

```text

> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v16a-loop
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

> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v16a-loop
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

> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-v16a-loop
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/auth test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/packages/auth
packages/chain test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/packages/chain
packages/game-rules test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  01:11:17
packages/chain test:    Duration  453ms (worker 41%, transform 38%, import 17%, tests 4%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  01:11:17
packages/auth test:    Duration  930ms (import 64%, tests 22%, transform 13%)
packages/auth test: Done
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  01:11:17
supabase/tests test:    Duration  6.96s (tests 75%, import 15%, transform 11%)
supabase/tests test: Done
packages/game-rules test:  Test Files  13 passed (13)
packages/game-rules test:       Tests  265 passed | 2 expected fail (267)
packages/game-rules test:    Start at  01:11:17
packages/game-rules test:    Duration  7.39s (tests 78%, transform 17%, import 4%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  01:11:25
packages/api-contract test:    Duration  238ms (transform 78%, import 18%, tests 3%, worker 1%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/apps/web
apps/web test:  Test Files  47 passed (47)
apps/web test:       Tests  503 passed (503)
apps/web test:    Start at  01:11:26
apps/web test:    Duration  5.38s (environment 58%, tests 28%, import 12%, transform 2%)
apps/web test: Environment  jsdom was created 47 times · 26.36s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v16a-loop
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
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/private/tmp/taskbar-hero-v16a-loop/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1715 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-DRCa5LIp.js               126.72 kB │ gzip:  36.87 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 705ms
apps/web build: Done

```

## Earlier verification and correction

The first test run caught session storage persisting across switch test cases. Clearing sessionStorage in beforeEach (as v1 does) fixed the test isolation; no assertions were weakened or tests deleted. The initial typecheck also passed. Full outputs:

### Initial `pnpm --filter @taskbar-hero/web test -- game/v2` (exit 1)

```text

> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-v16a-loop/apps/web
> vitest run -- game/v2


 RUN  v5.0.5 /private/tmp/taskbar-hero-v16a-loop/apps/web

 ❯ src/game/v2/apiSwitchV2.test.ts (7 tests | 1 failed) 14ms
   × swaps on token change, restarts the loop, and builds demo only once 3ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/game/v2/apiSwitchV2.test.ts > swaps on token change, restarts the loop, and builds demo only once
AssertionError: expected "vi.fn()" to be called 1 times, but got 2 times
 ❯ src/game/v2/apiSwitchV2.test.ts:101:30
     99|   expect(sw.loop.getSnapshot().state).toBeNull();
    100|   await vi.advanceTimersByTimeAsync(0);
    101|   expect(serverApi.getState).toHaveBeenCalledTimes(1);
       |                              ^
    102|   signIn(sessions); // unchanged token does not rebuild or restart
    103|   expect(server).toHaveBeenCalledTimes(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 46 passed (47)
      Tests  1 failed | 500 passed (501)
   Start at  01:10:15
   Duration  5.73s (environment 57%, tests 22%, import 12%, transform 8%)

Environment  jsdom was created 47 times · 27.83s total, 57% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments

/private/tmp/taskbar-hero-v16a-loop/apps/web:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/web@0.0.0 test: `vitest run -- game/v2`
Exit status 1
```

### Initial `pnpm typecheck` (exit 0)

```text

> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v16a-loop
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

## Scope and remaining uncertainty

- `git diff --exit-code -- pnpm-lock.yaml`: no output, exit 0. No dependencies changed.
- `git diff --check`: no output, exit 0.
- Only the seven allowlisted new files are staged and committed; v1, API, packages, layout and Supabase files remain unchanged from origin/main.
- No unresolved implementation questions. The concrete demo/server clients and optional session guard must be injected by the integration lane; none are imported here.
- When no guard is supplied the injected server API is used directly; session expiration handling is delegated to the optional guard, as specified.
- The install reports ignored native dependency build scripts; the build reports the existing ox/node:worker_threads browser externalization warning. Both commands passed without configuration changes.
- Existing CI is workflow_dispatch only; deployment push trigger targets main only. This feature branch push does not request Actions.

## Pre-push author audit

```text
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

The single commit has the required author; no author correction was needed. The worktree is clean after committing. Publish command: `git push -u origin ai/codex-v16a-loop`. No PR will be opened.
