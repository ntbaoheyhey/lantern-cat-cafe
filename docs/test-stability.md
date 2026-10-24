# Test-suite stability

Measured 2026-10-24 on `main` (commit `40ea4d5`) on a 4-core cloud container. "Plain" means `pnpm test` alone; "under load" means `pnpm test` while two `pnpm build` runs execute at the same time (CI-like contention).

## Findings

| Run | Before the fix | After the fix |
| --- | --- | --- |
| Plain, 4 runs | 4 of 4 passed, 46.0 to 47.3 s | 4 of 4 passed, 37.3 to 39.2 s |
| Under load, 4 runs | **0 of 4 passed**, 50.8 to 54.0 s | 4 of 4 passed, 54.3 to 57.9 s |

Every failure before the fix was `Error: Hook timed out in 10000ms` in the `beforeAll` of supabase test files (run 1: `auth-wrappers`, `concurrency`, `forge`, `siwe`; run 2 and 3: `concurrency`, `siwe`; run 4: `siwe`). No assertion ever failed: no test was wrong, the setup was too slow. The cause is that every test file migrated its own fresh PGlite (about 3 s alone, much longer when twelve files do it at once on four cores) and vitest's default hook timeout is 10 s. This also explains the single suite-level failure seen once while developing `malformed.test.ts` (#90).

The web, game-rules, auth, chain and api-contract packages never failed in any of the 16 runs.

## What changed (tests only)

- `supabase/tests/global-setup.ts` (new): migrates PGlite **once per run** and dumps the data directory to a temp file. `migratedDb()` in `src/game-db.ts` now starts each file from that dump (about 0.5 s) and falls back to migrating from scratch if it is not available. A migration error now fails the whole run in one place.
- `schema.test.ts`, `siwe.test.ts` and `consistency.test.ts` used their own copy of the migrate loop; they now use `migratedDb()`.
- `supabase/tests/vitest.config.ts`: `hookTimeout` 60 s and `testTimeout` 30 s, so a slow machine produces a slow run, not a red one.
- No sleeps were added, no assertions loosened, no test skipped, nothing outside `supabase/tests` touched.

## Timing

Whole `pnpm test` (plain): about 47 s before, about 38 s after. The supabase package went from 28.8 s to 19.4 s; the web package takes about 15 s and is unchanged.

Slowest files (test time reported by vitest, after the fix):

| Package | File | Time |
| --- | --- | --- |
| supabase | `malformed.test.ts` | 3.8 s (about 130 requests, each followed by a full-database dump) |
| supabase | `concurrency.test.ts` | 2.0 s |
| supabase | `forge.test.ts` | 1.5 s |
| supabase | `rls.test.ts` | 1.0 s |
| web | `inventory/InventoryTab.test.tsx` | 1.3 s |
| web | `boss/BossTab.test.tsx`, `forge/ForgeTab.test.tsx` | 1.1 s each |

Most of the web package's time is the jsdom environment starting for each of its 23 files (about 60% of its wall time), not the tests.

## Notes

- Under load the suite takes 54 to 58 s versus 38 s plain. That slowdown is real CPU contention and is expected.
- Nothing in these runs needed a retry. If a hook timeout ever appears again, check whether the machine is out of memory first: the template dump is about 40 MB and each worker holds its own PGlite copy.
