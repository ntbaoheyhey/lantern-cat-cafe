# Current verification evidence

Use the final files below. Other logs preserve earlier failed checks and their repair history; they are not the release result.

| Check | Current evidence |
|---|---|
| Full application suite | tests/release-suite.log |
| All workspace types | tests/release-types.log |
| Fuji demo build + metadata | tests/release-build.log |
| Final shared rewards-pool guard | tests/release-shared-pool.log |
| Live counters, source validation, UI odds | tests/live-counters-final.log |
| Ordinary demo quest gate | tests/quest-gate-final.log |
| Contract tests, unchanged contracts | tests/final-forge.log |
| Anvil v3 receipts, asset discovery and movement | tests/b6-anvil.json, tests/ownership-anvil.log |
| Guest and injected-wallet entry | tests/b4-anvil.json |
| Visible v3 quest/mint/withdraw flow | tests/b6-browser.json |
| Shell review | tests/b4-browser.json |
| Tutorial walkthrough | tests/b5-flow.json |
| Real concurrent database proof | tests/economy-postgres.log |
| Operator SQL + shell syntax | tests/deploy-sql.log, tests/deploy-guide-syntax.log |
| Glyph/font checks | tests/icons-final.log, tests/typography-final.log |
| Token conservation / acceptance | ECONOMY-SIM.json, ECONOMY-SIM.md |
| C2 complete cohort | COHORT-SUMMARY.json, evidence/cohort-final.jsonl.gz |
| Legacy supply refresh / regression repair | tests/legacy-supply-refresh.log, tests/release-token-sim.log |

`final-suite.log`, `b6-server-types.log` and files containing `failure` are historical pre-repair evidence. Full-suite expected failures/skips are reported separately; they are not claimed as passing cases. Public Fuji v3 smoke and hosted deployment have not run.
