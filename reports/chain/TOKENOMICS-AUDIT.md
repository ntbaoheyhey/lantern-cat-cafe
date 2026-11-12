# Tokenomics follow-up — 2026-11-12

The public Fuji judge loop passed 18 transactions. Economic acceptance remains **NOT MET**. This follow-up corrects the model and reporting; it changes no deployed contract, reward amount, fee or C2 drop table.

## Deployed evidence

Read-only snapshot: `FUJI-READONLY-AUDIT.json`, block60934939, 2026-11-12T07:22:48Z, chain43113. All three deployed runtimes match local compiled artifacts after masking immutable slots; token/signer/epoch/cap/fee/treasury values were read separately. YARN1bn genesis; V2 fee500bps; tester20, routine ceiling12, combined weekly32. Season0 has40 YARN claimed and2.024691357824691357 burned; pool9960. These are small test observations, not player-demand estimates. The pool could fund at most498 further20-YARN grants if used solely for grants; gas/IP/day limits still apply.

The contract already records weekly burns, includes tester claims in emittedInSeason, and automatically reduces routine caps on season rollover. Old statements that this exists only in the simulator were stale. A routine weekly/rank **issuer** still needs authoritative campaign entitlements. No redeployment is needed to obtain the existing policy behavior.

## Corrections

1. Previously the controller omitted the20-YARN grant from first-season emission. It now matches the deployed denominator and exact integer floor order.
2. Previously every entitlement was multiplied by the policy. The contract actually limits a signed claim by the current cap; the model now uses min(entitlement, cap).
3. Previously forge/cosmetics helped pass the headline gate although they are unshipped. Separate profiles prevent them from validating implemented sinks.
4. The live demo profile has one material and three Relics after pass/boss, no repeating material source or routine rewards. Counterfactual campaign rates remain0.4 rare/0.08 Epic per active week, explicitly not supplied by C2.
5. Bot wallets are not invented utility buyers. More bot wallets, weak demand and fee-free transfers are separate stress cases. Individual-wallet/hour fairness does not establish Sybil resistance.
6. Exact monetary conservation uses bigint wei. Null represents an undefined ratio; zero-demand failure is visible. Correct execution and economic acceptance have different statuses and an optional strict exit gate.

## Results at week52

| Scenario using implemented sinks | All claims / burns | Final weekly routine ceiling | Outcome |
|---|---:|---:|---|
| Casual-heavy | 2.3904 | 2.0817 | misses <=2 |
| Balanced | 2.5332 | 1.8764 | misses <=2 |
| Farmer-heavy,20% bots | 2.7797 | 1.9647 | misses <=2 |
| 10% demand | 19.2330 | 0.1848 | misses <=2 |
| Zero demand | undefined | 0 | fails; stops after first season |
| 50% bot wallets | 2.9030 | 1.5854 | misses; bots receive53.24% of claims |
| 80% fee bypass | 2.8562 | 1.8924 | misses <=2 |

The main profiles accumulate roughly22,000 sealed items with no deployed item sink. Fees destroy tokens, not items. A release dominated by immutable first-season subsidies cannot be repaired merely by reducing future claims. Keeping future rewards disabled until measured issuance/demand is available is the conservative course; increasing fees to force a simulated pass is not justified.

## What follows from the evidence

- Keep the competition demo funded as a bounded test, with its one-time grants. Its success is a technical integration claim, not an earnings or sustainability claim.
- Before enabling routine payouts, obtain C2 server-owned earning receipts and actual weekly rare/Epic rates, then measure seal uptake, real buyers, stock and unique-human abuse signals. Re-run the model with provenance via --supply.
- Optional forge/cosmetics remain a separate roadmap experiment. No change to allocations or numerical fees was made. References E1/E2/E10 support cautious emission and no-growth stress; T6/T7/T8 support the wallet/Sybil caveat; none supplies the scenario demand coefficients.
- Do not redeploy current contracts to make a chart pass. The 0.8 trigger, absorbing zero cap, tester bypass and all-holder burn accounting are deployed facts and must stay explicit.
- No user key, secret, public signing or public deployment was needed for this research.

Evidence: `tests/economy-unit.log`, `tests/economy-simulation.log`, `tests/economy-strict.log`; `tools/chain/token-sim.test.mjs`, `contracts/test/SeasonPolicy.t.sol`; generated `docs/chain/tokenomics.json`,16 CSVs, HTML/SVG and Vietnamese pitch.
