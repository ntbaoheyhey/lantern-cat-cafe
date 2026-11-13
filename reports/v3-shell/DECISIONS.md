# Decisions

- 2026-11-13: User final decisions win: free audio only; planner economy; automatic pilot review; local CI; user deploys 20 Nov. No agents.
- Saved 658 paused CHAIN files at 86093b682 and pushed; workspace typecheck and chain package 32/32 pass. Old evidence logs have whitespace, retained unchanged.
- Merged integration base and CHAIN; combined demo:play with isolated chain:test, retained latest CHAIN screenshots. No code conflicts remained.
- .env.example and supabase/.temp excluded from commits.
- User allows partial after two methods with four repairs per method; report unmet gates honestly.
- Kenney download repair: unsigned URL and token request without browser headers failed. Cookie/referer-aware official downloader succeeds; use this method for all four packs.
- SeasonRewards has immutable SEASON_LENGTH=13 weeks and BASE_ROUTINE_CAP=12; game seasons use four-week windows but vouchers use contract.currentSeason(). The 25% withdrawal fee stays in pool, not an on-chain burn.

- B6 C2 runner repair: four targeted audio/Node replay runs exposed additional browser globals. Broadened the method to audit every model/audio browser access before rerunning; no fake browser simulation is substituted for rule execution.

- B6 economy tuning: tested weekly Spool 1.5, 8 and 16 (ECONOMY-TUNING.json). Larger faucets still miss Star Thread balance and push half-demand burn/emission below 1.0. Kept 1.5; no unimplemented Mythic/pass/Deed-upgrade demand is counted. B6 simulation gate remains PARTIAL.
- Corrected tower drop policy to floor multiples of ten before the final cohort. Stopped only own baseline runner PID 58714. Final C2 cohort uses 40 seeds/profile, 30 days, 20 stratified dates (120 accounts); report sample size and censoring explicitly. Earlier frozen baseline is not final evidence.

- Final UI review: preserve detailed A6 battle notes behind the illustrated basic guide; use spoken “to” in stat comparisons. Bell is the v3 display name for the existing bound stamps ledger key. No destructive currency migration.
- Direct RPC indexing proves Deed mints, YARN supply burn and indexed transaction counts. Completed fusion totals require the verified stats endpoint; dead-address transfers alone are not counted as completed fusions.

- Final B6 audit: include all Deed and quality IDs in Bag/move discovery at a single block; generate their ERC-1155 metadata during production builds. No extra image payload or contract change.
- Final authority audit: v3 campaigns use v3 drops and import earned gear into the café; legacy new seal/export routes are disabled under v3. Existing pending seal finalization stays available. PostgreSQL race proof verifies the finite v3 budget and unique Deed allocation.
- Cohort completed: 40 accounts per profile, all 120 uncensored at 30 days. First Legendary median is day 11 for all profiles; heavy target 5–9 days and faster-per-day requirement fail. Tuning cap already reached; keep the miss visible.

- Final report correction: include initial tester grants in the v3 emission denominator. Re-evaluated the same three candidates; all half-demand headline ratios now fail (0.846–0.897). Routine-only ratios remain labeled separately. No extra tuning round.
- Ordinary level-five demo guests can complete the quest after an authoritative boss win without a Judge pack; launch keeps level fifteen. Added direct contract-season burn/claims reads and validated optional edition counters.
- Legacy token-sim regression detected the changed rules fingerprint. Re-run the real legacy-mode supply study; never patch hashes onto stale measured rates or call legacy data v3 evidence.
- V3 activation also requires finite tester-grant reservations from the shared rewards pool. The deploy guide reserves the v3 ceiling in the tester budget; flags cannot silently retain uncapped legacy gifts.
- Delivery resumed from the saved passing suite/build; no broad rerun was needed. The final shared-pool change has its focused passing check. Staging found one source whitespace line and blank EOF lines in 15 new logs; normalized whitespace only, preserving all test output, then passed the staged diff check.
- B6 implementation and evidence are committed at 9af6da640 and pushed. Draft PR #445 targets main. B7 closes the queue with B6 explicitly PARTIAL, and records later Session A integration/user deployment as external follow-ups. No new agent, paid audio, hosted mutation or main merge was used.
- Stopped only recorded preview PIDs 41682/41781 after verifying their commands and worktree directories. The .env.example and supabase/.temp exclusions remain intact.
