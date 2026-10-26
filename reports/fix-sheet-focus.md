STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first

# QA1 finding 2

Opening a phone panel now moves focus to its Close button; Escape and Close restore focus to the selected navigation tab.

Gate PASS: `origin/ai/antigravity-qa-v2-1` @ 163127d96257329b3f00da0f43051d6fbf5ea2b7 names this bug in reports/qa-v2-1.md finding 2. Read-only inspection found this report on that branch only, not main or other Antigravity branches. No Antigravity commits merged. One bug per branch.

Regression verified red before fix; final full checks below. Existing assertions are retained; no test is disabled or skipped. The fix is based on Q5 so it can be reviewed/merged independently of the other QA fix. Any merge into Q10b/Q10 should retain their later wiring and flag behavior.

## Acceptance

- PASS: named QA finding fixed; regression test reproduces before and passes after.
- PASS: all required checks; only source, matching regression test, and this report changed relative to the declared stack.
- NOT VERIFIED: real assistive technology/device behavior; future combined branches; production deployment.
- Q9 bulk-equip failure remains BLOCKED: QA1 does not name it. Request an eligible QA report or explicit new scope for StageLayout/BagPanel/loop changes. Its failing regression remains available on Q9.
- Later fix cards WAITING on named QA findings. CL8 numbers, live migration/cutover, and final class art remain user hard stops.

## Actual commands and output

### before

```text
AssertionError: expected <button role="tab" …(4)></button> to be <button type="button" …(2)></button> // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 8 passed (9)
```

### install

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 774ms using pnpm v10.28.0
EXIT 0; runtime 0.84s
```

### deno

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs
EXIT 0; runtime 0.35s
```

### typecheck

```text
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck
Scope: 6 of 7 workspace projects
EXIT 0; runtime 15.22s
```

### lint

```text
$ pnpm lint
> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint
Scope: 6 of 7 workspace projects
EXIT 0; runtime 14.02s
```

### test

```text
$ pnpm test
> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test
Scope: 6 of 7 workspace projects
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  79 passed (79)
apps/web test:       Tests  1061 passed (1061)
EXIT 0; runtime 162.93s
```

### build

```text
$ pnpm build
> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build
Scope: 6 of 7 workspace projects
EXIT 0; runtime 14.23s
```

### e2e

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e
> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test
  53 passed (1.1m)
EXIT 0; runtime 64.72s
```

## Files touched and reasons

```text
 apps/web/src/layout/StageLayout.test.tsx | 18 ++++++++++++++++++
 apps/web/src/layout/StageLayout.tsx      |  4 +++-
 2 files changed, 21 insertions(+), 1 deletion(-)
```

The production change fixes the named finding; the test guards the user-visible accessibility behavior; this report records review evidence.
