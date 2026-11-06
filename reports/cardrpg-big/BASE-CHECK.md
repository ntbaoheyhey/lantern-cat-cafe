# Baseline validation
REFERENCE: reports/cardrpg-big/baseline/base.txt; reports/cardrpg-big/validation; reports/cardrpg-big/baseline/sim-hashes.txt

Base cd5edcc9895b42384578df9b040daac9ce51fccf, newest #332 tip verified against origin. Frozen-lockfile installation completed in 5.3 seconds. Tests ran sequentially before cold-load timing.

| Check | Result |
| --- | --- |
| pnpm typecheck | Exit 0 |
| pnpm lint | Exit 0 |
| pnpm test | Exit 0 |
| Root script tests | 11 passed |
| Web unit at base / after F0 hook | 1629 / 1630 passed |
| Rules unit | 890 passed, 2 expected failures, 11 skipped |
| Chain / auth / API unit | 32 / 24 / 16 passed |
| Supabase tests package | 581 passed |
| pnpm build | Exit 0 |
| Playwright E2E, four workers | 421 passed in 2.3 minutes |

The existing resize-burst case passed in this run. Validation reads existing chain and Supabase tests. Runtime or service changes to those areas are outside scope. Source rules and previous simulation hashes are preserved in baseline/.
