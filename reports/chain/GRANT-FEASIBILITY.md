# Grant feasibility — 2026-11-12

50 exact synthetic cases, not simulated players. All1000 wallets already received20. No grants, fees or allocation changed.

|Spenders|Burn each|Total burn|Admissible routine budget|Extra burn before full100-account pilot|
|---:|---:|---:|---:|---:|
|100|12|1200|0|9787.125|
|100|20|2000|0|8987.125|
|250|12|3000|0|7987.125|
|250|20|5000|0|5987.125|
|500|12|6000|0|4987.125|
|500|20|10000|0|987.125|
|750|12|9000|0|1987.125|
|750|20|15000|1974.25|0|
|1000|12|12000|1974.25|0|
|1000|20|20000|1974.25|0|

Twelve is the entire3-style catalog. Twenty is an optimistic all-sink ceiling consuming the participant's whole grant. At500 spenders the20-YARN ceiling merely reaches the original2× boundary and leaves no headroom for new rewards. With100 additional tester slots, reserve another2000 claims in the denominator as well as the pool. Spending intent and pending orders are not burns.

The planner now takes the minimum of funding, closed-period burn credit, announced budget and cumulative headroom: max(0,2B−C−L−20N), where B is reviewed cumulative eligible burn, C is every prior gross reward claim including recycling, L is disjoint unpaid promises and N is additional tester slots. Missing full history disables a candidate. The budget cannot certify season-by-season demand.

A one-time budget is deliberately allowed after enough genuine use; recurrent payouts are never promised. Next input is observed voluntary content use and authoritative earning receipts. Finite utility can be developed/tested locally; simulated adoption cannot supply those observations.

Reproduce: node tools/chain/grant-feasibility-study.mjs. All rows: docs/chain/grant-feasibility-study.json/CSV. Fingerprint:92b11c9b055626ca301ee78a42509e8d4409e09650f7e4a3ee1a8d14af31051c.
