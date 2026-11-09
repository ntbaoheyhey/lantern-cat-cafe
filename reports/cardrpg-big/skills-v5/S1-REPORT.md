# S1 status core
Skills V5 remains opt-in, requires automatic Gameplay V4, and retains a run’s committed mode.
Core rules live in skills-v5/statuses.ts with small battle hooks; legacy catalogue entries remain unchanged.
Burn bypasses shields; Bleed resolves before the bearer acts and is shield-absorbed.
Bitter halves received healing/shields; Mark opens rear targeting; Shred lowers defense and strips shields.
Daze spends the next action as a half-power basic; bosses keep full basic power and lose signatures.
Boss Daze gets an extra 30 percentage points of resistance; consumed Daze grants the following round of immunity.
Regen heals globally before Burn; then expiry resolves. Both DoTs share the boss 6%-max-HP round budget.
Tangle maps to Shred; Hush and Rattled map to Daze only when enabled. Signature statuses retain their rules.
THC14 codes preserve V5 preferences and active runs; old saves default OFF and retain existing code versions.
31 focused status/save tests PASS, including cap/refresh/cleanse/resist/shield/timing/replay cases.
First focused attempt failed because the timing fixture’s seed was resisted by a boss; fixed fixture hit accuracy only.
First typecheck failed on test-only findLast unsupported by the existing TS target; replaced with reverse/find.
Original failure logs are retained. No runtime change followed these test-fixture corrections.
Six source gates: typecheck/lint/web1783/rules1223/build PASS; E2E420/421 first run + isolated failed-test recovery PASS.
E2E first-play Home timing missed 5s at 5.28s; unchanged-source isolated rerun PASS, original failure retained.
Rules retain 2 expected failures and 11 skips. Source-bound audit PASS (s1/audit.json).
Legacy OFF: 165 cells / 8,250 routes PASS, SHA47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3.
V4 fallback: 180 battle SHA c29ec7d2cfb9fbd46aa32b363ade8bc84b3100d558bb646aa4ea04b80f49d031.
Fallback probe SHA376e28110a8b02e203a6531004877ec893b31d605709a6f0236ba08b27cbd583.
Fallback 45-route SHA b85feeb659f013dfd1817d452d233d6c48f8f3e1402e4c5625bf760e49341540.
Baseline-v1 and all13 historical sims byte-exact; protected/B-owned scope and commit author checks PASS.
No balance, UI readability or performance acceptance claim. Fresh20001–20500 remains UNUSED.
S2 shapes/reactions are staged separately and not included in S1. Draft publication stacked on S0 #407.
