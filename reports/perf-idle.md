STATUS: DONE

## What was done
- packages/game-rules/src/v2/idle/idle.test.ts, test 'handles an eight-hour claim under 50 ms with a generous 150 ms CI ceiling':
  - kept the existing JIT warm-up call;
  - replaced the single Date.now() sample with the minimum of 5 timed runs using the global performance.now() clock;
  - kept the 150 ms ceiling and the result assertion (stackDeltas.fish > 0) unchanged.
- Typing note: game-rules has no DOM or Node typings (lib ES2022, no @types/node), so the clock is reached through globalThis with a narrow type. No dependency was added.
- Why min-of-5 does not hide a real regression: CI load only adds time to individual runs, so the minimum is a stable lower bound on cost. A real slowdown makes every run slow, so the minimum still exceeds 150 ms and fails.

## Files touched
- packages/game-rules/src/v2/idle/idle.test.ts
- reports/perf-idle.md

## Gate / checks (run from worktree root, pnpm 10.28.0)
- CI=true pnpm install --frozen-lockfile: done, 506 packages added, exit 0
- pnpm gen:deno + git diff --exit-code -- supabase/functions: wrote 18 import maps, no drift, EXIT=0
- pnpm typecheck: EXIT=0 (first attempt failed on 'performance' type; fixed via globalThis cast)
- pnpm lint: EXIT=0
- pnpm test (run in parallel with the 20x loop): packages/game-rules 330 passed | 2 expected fail | 11 skipped; apps/web 1082 passed; supabase/tests 385; chain 7; auth 24; api-contract 16; EXIT=0
- pnpm build: apps/web built, EXIT=0
- apps/web pnpm test:e2e (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers): 96 passed, 1 skipped, EXIT=0

## Proof: 20x loop with pnpm test in parallel
- Loop of `vitest run src/v2/idle/idle.test.ts -t 'eight-hour claim'`, 20 iterations, started while a full `pnpm test` ran in the background.
- Result: 20 pass, 0 fail. Each run: "Tests 1 passed | 18 skipped (19)".

## Acceptance
- Test passes 20x under parallel pnpm test: PASS
- Ceiling unchanged (150 ms): PASS (see diff below)
- Full suite green: PASS
- Scope = the test file + reports/perf-idle.md: PASS (see git diff --name-only)

## Ceiling diff (only the measurement lines change)
  -    const start = Date.now();
  -    const result = computeClaimV2(input, 8 * 3600, 2);
  -    const elapsed = Date.now() - start;
  -    expect(elapsed).toBeLessThan(150);
  +    let best = Infinity;
  +    let result = computeClaimV2(input, 8 * 3600, 2);
  +    for (let run = 0; run < 5; run++) { start = now(); result = ...; best = Math.min(best, now() - start); }
  +    expect(best).toBeLessThan(150);

## NOT verified
- Not run against GitHub Actions, per the card.
- No PR opened or merged, per the card.
- The 20x loop covered only the single timing test (-t filter); the parallel pnpm test covered the full suite once.

## Needed to continue
- Nothing for this lane. CL-V can review and merge ai/claude-perf.
