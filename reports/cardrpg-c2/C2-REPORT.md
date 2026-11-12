# Lane C2 report

In progress. Lane C baseline e55b8c085 is preserved.

| Card | Status | Evidence / limitation |
|---|---|---|
| B0 | PASS | 4387 unit; 421/421 E2E; inherited exclusions in B0.md |
| B1 | PASS | Four-unit staggered formation, migration, targeting and slot contract; B1.md |
| V0–V2 | PASS | Skill audit and three painted pilots; user approved all three on 12 Nov |
| B2 | PASS | 33 screen budgets, max 24 words; 429/429 E2E; B2.md |
| B3 | PASS, 9/10 | Five real 30-minute runs; exact combat/economy parity, worst timing error 3.04%; B3.md |
| B4–B4b | Queued | Three config tuning passes; month-long economy projection and odds |
| V3 | Authorized, queued | Expand after balance/economy cards |
| B5 | READY received, queued | b6712694557c06161ccc6cdd54099d8bc8b22f71; campaign authority still open |
| B6 / V4 | Pending | Final metrics, visual inspection and risks |

Latest validation: 4396 package unit passes + 28 Node script passes; 2 expected failures and 11 inherited unit research skips unchanged. Web typecheck/lint pass. E2E 430/430 with no skips or flakes.

Inherited real-play misses: first loss 6.56 min (12–20 target); boss 170.77 s (p90 ≤110 target); inherited sim normal-win HP 94% (55–80 target). These remain Lane C observations until B3 supplies C2 measurements.

C2 baseline: all five real sessions and 500 simulations have no loss by 30 minutes. Real boss median/p90 55.997/62.997s; ordinary-win HP mean 97.225%, median 100%. B3 measurement passes, B4 balance does not. See B3.md for the old policy/clock discrepancy and all cohort definitions.
