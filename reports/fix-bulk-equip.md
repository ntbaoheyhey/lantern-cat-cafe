STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first

# Bulk equipment fix

Authorization: the user explicitly answered “Authorize the fix and finish Q9” to the scope question naming StageLayout/storeV2, dedicated regression tests, three Q9 runs and full checks. This authorizes this dedicated product fix despite Q9's original apps/web/src/** prohibition and Q13's absent named QA finding. No economy, live-cutover or other hard-stop exception was requested or inferred.

Before: Q9 @ de1e4b64ce3b3d4d981ae13fb3f6f432a635355e failed in 1280, 390 and reduced motion: expected [fx:midGame:1, fx:midGame:2], received [fx:midGame:1]. BagPanel synchronously calls onEquip for every upgrade; the loop's busy guard silently refused later simultaneous calls.

After: the stage adapter queues those callbacks in order and awaits each real loop action before starting the next. It retains the loop busy guard and API/revision handling. Queue lifetime belongs to the stage effect (safe under StrictMode setup/cleanup); disposal cancels pending callbacks, and API/account resets invalidate the queued generation.

## Files and reasons

- apps/web/src/game/v2/storeV2.ts: a small equip queue adapter; no loop/API/auth/contract changes.
- apps/web/src/layout/StageLayout.tsx: use that adapter for bag equipment and dispose it with the stage.
- apps/web/src/layout/StageLayout.test.tsx: extend its existing store mock for the adapter, retaining all assertions.
- apps/web/src/game/stage/bulkEquip.test.ts: real busy-guarded loop + MockGameApiV2 prove both upgrades persist; account-switch and stage-disposal cases prove pending work cancels.
- reports/fix-bulk-equip.md: evidence and review scope.

## Acceptance

- PASS: two same-click upgrades both applied through the real loop; idle busy guard remains unchanged.
- PASS: pending work cancelled across account changes and unmount; existing stage tests pass.
- PASS: pinned install, generated-map drift, typecheck, lint, full unit suite, build and all 53 existing browser tests.
- PASS: source edits confined to the explicitly authorized adapter/layout/tests; no protected file edits.
- Q9 retains its failing-then-passing regression unchanged; rebasing and three repeat runs are the next card, not replaced by this branch's tests.
- NOT VERIFIED: production/deployed server, real wallet/Fuji, final integrated merges. No migration, deployment, PR, main merge, signer or number change.

## Actual verification output

### focused

```text
$ pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/bulkEquip.test.ts src/layout/StageLayout.test.tsx
 Test Files  2 passed (2)
      Tests  11 passed (11)
   Duration  5.65s (tests 57%, environment 21%, import 16%, transform 6%)
```

### install

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 855ms using pnpm v10.28.0
EXIT 0; runtime 0.93s
```

### deno

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs
EXIT 0; runtime 0.39s
```

### typecheck

```text
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck
Scope: 6 of 7 workspace projects
EXIT 0; runtime 16.80s
```

### lint

```text
$ pnpm lint
> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint
Scope: 6 of 7 workspace projects
EXIT 0; runtime 15.39s
```

### test

```text
$ pnpm test
> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test
Scope: 6 of 7 workspace projects
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Duration  376ms (import 55%, transform 21%, tests 12%, worker 11%)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Duration  657ms (import 58%, tests 29%, transform 8%, worker 4%)
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Duration  44.32s (tests 89%, import 10%)
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Duration  85.10s (tests 99%, import 1%)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Duration  210ms (transform 50%, import 39%, tests 7%, worker 4%)
apps/web test:  Test Files  80 passed (80)
apps/web test:       Tests  1063 passed (1063)
apps/web test:    Duration  79.78s (environment 56%, tests 32%, import 11%, transform 1%, worker 1%)
EXIT 0; runtime 167.62s
```

### build

```text
$ pnpm build
> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build
Scope: 6 of 7 workspace projects
EXIT 0; runtime 15.52s
```

### e2e

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e
> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test
  53 passed (1.2m)
EXIT 0; runtime 69.76s
```

## Own diff (completed Q5 parent)

```text
 apps/web/src/game/stage/bulkEquip.test.ts | 57 +++++++++++++++++++++++++++++++
 apps/web/src/game/v2/storeV2.ts           | 22 ++++++++++++
 apps/web/src/layout/StageLayout.test.tsx  |  2 +-
 apps/web/src/layout/StageLayout.tsx       |  9 +++--
 4 files changed, 86 insertions(+), 4 deletions(-)
```
