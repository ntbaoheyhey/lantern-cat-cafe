# V7b browser adapter

Implemented on `ai/codex-v7b-adapter` from latest fetched `origin/main` (`d0640ad`).

## Gate and isolation

Gate passed: both required API files exist on `origin/main`. The original checkout was on `ai/codex-v5-forge` with unrelated changes; this work uses a separate managed worktree, leaving those changes intact. No AGENTS.md applies in this repository.

Initial Git identity checks (exit 0; already correct, no configuration changes):

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
```

Required initial fetch (exit 0):

```text
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
   2ae54b5..d0640ad  main       -> origin/main
```

Gate commands (both exit 0; no output):

```text
$ git cat-file -e origin/main:apps/web/src/api/GameApiV2.ts
$ git cat-file -e origin/main:apps/web/src/api/SupabaseGameApi.ts
```

Branch creation in the isolated worktree (exit 0):

```text
$ git switch -c ai/codex-v7b-adapter
Switched to a new branch 'ai/codex-v7b-adapter'
```

Read before implementation: `docs/api-v2.md`, `GameApiV2.ts`, `SupabaseGameApi.ts`, `SupabaseGameApi.test.ts`, and `sessionGuard.ts`.

## Files changed

- `apps/web/src/api/GameApiErrorV2.ts`: shared v2 rejection type, created byte-identical to card C4's supplied version (including final newline).
- `apps/web/src/api/SupabaseGameApiV2.ts`: injected-fetch transport for all nine v2 endpoints; fresh token per call, typed error extras, malformed-success rejection.
- `apps/web/src/api/SupabaseGameApiV2.test.ts`: request bodies and headers, null unequip, all v2 codes, error extras, malformed JSON, network errors, response preservation and timeline, refreshed tokens, environment defaults.
- `apps/web/src/api/sessionGuardV2.ts`: all nine methods forward arguments/results, notify on unauthenticated rejection, and rethrow the same error object.
- `apps/web/src/api/sessionGuardV2.test.ts`: all-method pass-through and rejection coverage, repeated auth failures, all other error codes, unrelated errors.
- `reports/v7b-adapter.md`: this report.

No dependencies or lockfile changes. No app wiring, v1 behavior changes, package edits, or Supabase edits. No PR opened and no GitHub Actions invoked. Reviewed workflow triggers: CI is manual; deploy only reacts to main or manual dispatch, so this branch push triggers neither.

## Shared error file verification

Compared the file bytes against the exact block in the user attachment with Python: assertion passed.

```text
$ sha256sum apps/web/src/api/GameApiErrorV2.ts
09d2a9f7ac1fe0563128218fcc91b4d23efeb99498f472f34930cd696f835927  apps/web/src/api/GameApiErrorV2.ts
```

## Validation command outputs

All required commands exited 0. Outputs below are complete; combined validation output includes the separately captured build stdout/stderr.

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +505
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 505, reused 496, downloaded 0, added 132
Progress: resolved 505, reused 496, downloaded 0, added 356
Progress: resolved 505, reused 496, downloaded 0, added 357
Progress: resolved 505, reused 496, downloaded 0, added 493
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
Done in 6s using pnpm v10.28.0
```

```text
$ pnpm --filter @taskbar-hero/web test -- SupabaseGameApiV2 sessionGuardV2

> @taskbar-hero/web@0.0.0 test /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/apps/web
> vitest run -- SupabaseGameApiV2 sessionGuardV2


 RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/apps/web


 Test Files  47 passed (47)
      Tests  567 passed (567)
   Start at  01:09:26
   Duration  5.24s (environment 58%, tests 21%, import 12%, transform 9%)

Environment  jsdom was created 47 times · 25.51s total, 58% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments

```

The requested `test -- ...` invocation ran all 47 web test files (567 tests), including both new files, as shown above.

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

The diff command produced no output and exited 0.

```text
$ pnpm typecheck && pnpm lint && pnpm test && pnpm build

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero
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

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

> taskbar-hero@0.0.0 test /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/game-rules test$ vitest run
packages/chain test$ vitest run
supabase/tests test$ vitest run
packages/chain test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/packages/chain
packages/game-rules test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/packages/game-rules
packages/auth test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/packages/auth
supabase/tests test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  01:09:44
packages/chain test:    Duration  349ms (transform 66%, import 18%, tests 11%, worker 5%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  01:09:44
packages/auth test:    Duration  819ms (import 62%, tests 27%, transform 10%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  01:09:44
supabase/tests test:    Duration  6.47s (tests 79%, import 11%, transform 9%)
supabase/tests test: Done
packages/game-rules test:  Test Files  13 passed (13)
packages/game-rules test:       Tests  265 passed | 2 expected fail (267)
packages/game-rules test:    Start at  01:09:44
packages/game-rules test:    Duration  6.93s (tests 77%, transform 18%, import 4%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  01:09:51
packages/api-contract test:    Duration  243ms (transform 77%, import 18%, tests 3%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/apps/web
apps/web test:  Test Files  47 passed (47)
apps/web test:       Tests  567 passed (567)
apps/web test:    Start at  01:09:52
apps/web test:    Duration  5.49s (environment 57%, tests 27%, import 13%, transform 3%)
apps/web test: Environment  jsdom was created 47 times · 27.56s total, 57% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done


> taskbar-hero@0.0.0 build /Users/bao/.codex/worktrees/v7b-adapter/taskbar hero
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
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/v7b-adapter/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
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
apps/web build: ✓ built in 539ms
apps/web build: Done
```

## Integration and uncertainties

The v2 UI should call v1 `SupabaseGameApi.reportMint(nonce, txHash)`, then v2 `getState()`; v2 reuses `relic-mint-report`, whose response is a v1 state. No `reportMint` was added to the v2 adapter.

No unresolved implementation uncertainty. Transport tests use injected fake fetch and fake project URLs only; they make no network requests. The full existing suite reports two expected failures in game-rules; its command exits successfully. Install retains pnpm's ignored native build-script warning; the successful production build retains the browser externalization warning shown above. No tests were skipped, weakened, or deleted for this task.

## Pre-push checks

```text
$ git diff --check
$ git diff --cached --check
$ git diff --exit-code -- pnpm-lock.yaml supabase/functions
```

All exited 0 with no output. Only the six allowed files are included in the commit.

Required author check before first push (exit 0):

```text
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

No author correction was needed. The report was added to the same single commit by amendment.
