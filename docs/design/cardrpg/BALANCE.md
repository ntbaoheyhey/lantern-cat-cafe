# Balance and reproduction evidence

Runtime source: `b65168c6`; contract 0.3.0. All measurements use the actual pure meta commands and existing numbered-round battle engine, not estimated reward formulas. The runtime files did not change between these final simulations and this revision. The audit records SHA-256 values. Previous tuning trials remain in `evidence/`; filenames containing `initial`, `pressure`, `durability`, `redistributed`, or `tuned` are historical, not final gates.

## Combat

Final grid: 36 conditions × 100 seeds (1–100) = 3,600 battles. Holdout: 2 doctrines × 2 policies × 400 fresh seeds (1001–1400) = 1,600 battles. No tuning followed the holdout. Starter Auto target is 55–75%; the active policy is a deterministic proxy using visible information, not a human player. First-death counts include eventual victories and can be lower than trials because some runs have no deaths.

| Encounter | Doctrine | Policy | Gear | Wins / 100 | Mean rounds | First deaths G/W/A |
| --- | --- | --- | --- | ---: | ---: | --- |
| patrol | hearthkeepers | auto | off | 100 | 15.64 | 0/0/0 |
| patrol | hearthkeepers | auto | starter | 100 | 12.21 | 0/0/0 |
| patrol | hearthkeepers | auto | high | 100 | 9.04 | 0/0/0 |
| patrol | hearthkeepers | active | off | 100 | 14.63 | 0/0/0 |
| patrol | hearthkeepers | active | starter | 100 | 11.28 | 0/0/0 |
| patrol | hearthkeepers | active | high | 100 | 8.70 | 0/0/0 |
| patrol | lanternbreakers | auto | off | 100 | 16.02 | 0/0/0 |
| patrol | lanternbreakers | auto | starter | 100 | 12.67 | 0/0/0 |
| patrol | lanternbreakers | auto | high | 100 | 9.39 | 0/0/0 |
| patrol | lanternbreakers | active | off | 100 | 14.67 | 0/0/0 |
| patrol | lanternbreakers | active | starter | 100 | 11.58 | 0/0/0 |
| patrol | lanternbreakers | active | high | 100 | 8.95 | 0/0/0 |
| boss | hearthkeepers | auto | off | 2 | 21.22 | 31/44/24 |
| boss | hearthkeepers | auto | starter | 62 | 18.41 | 11/27/4 |
| boss | hearthkeepers | auto | high | 100 | 10.79 | 0/0/0 |
| boss | hearthkeepers | active | off | 2 | 21.22 | 31/44/24 |
| boss | hearthkeepers | active | starter | 62 | 18.41 | 11/27/4 |
| boss | hearthkeepers | active | high | 100 | 10.79 | 0/0/0 |
| boss | lanternbreakers | auto | off | 2 | 20.10 | 31/51/17 |
| boss | lanternbreakers | auto | starter | 95 | 17.19 | 4/2/11 |
| boss | lanternbreakers | auto | high | 100 | 9.99 | 0/0/0 |
| boss | lanternbreakers | active | off | 2 | 20.10 | 31/51/17 |
| boss | lanternbreakers | active | starter | 95 | 17.19 | 4/2/11 |
| boss | lanternbreakers | active | high | 100 | 9.99 | 0/0/0 |
| campaign | hearthkeepers | auto | off | 0 | 36.53 | 74/22/4 |
| campaign | hearthkeepers | auto | starter | 55 | 32.51 | 21/28/7 |
| campaign | hearthkeepers | auto | high | 100 | 21.72 | 0/0/0 |
| campaign | hearthkeepers | active | off | 0 | 35.93 | 53/36/11 |
| campaign | hearthkeepers | active | starter | 81 | 30.49 | 7/14/7 |
| campaign | hearthkeepers | active | high | 100 | 20.54 | 0/0/0 |
| campaign | lanternbreakers | auto | off | 0 | 35.50 | 70/24/6 |
| campaign | lanternbreakers | auto | starter | 61 | 32.31 | 27/13/10 |
| campaign | lanternbreakers | auto | high | 100 | 21.43 | 0/0/0 |
| campaign | lanternbreakers | active | off | 1 | 35.26 | 72/22/5 |
| campaign | lanternbreakers | active | starter | 89 | 30.47 | 5/7/8 |
| campaign | lanternbreakers | active | high | 100 | 20.47 | 0/0/0 |

| Fresh holdout | Policy | Wins / 400 | Rate | First deaths G/W/A |
| --- | --- | ---: | ---: | --- |
| hearthkeepers | auto | 247 | 61.75% | 82/88/25 |
| hearthkeepers | active | 339 | 84.75% | 39/41/16 |
| lanternbreakers | auto | 244 | 61.00% | 117/76/27 |
| lanternbreakers | active | 348 | 87.00% | 46/28/23 |

All three roles now appear as first deaths. The distribution is not uniform: guardians are most exposed under Lanternbreakers. High gear makes chapter one nearly trivial, while gear-off remains deliberately punishing. Standalone boss has no campaign resource-selection decisions, so the two policy rows can coincide. These are limits of the narrow sandbox, not proof of long-term encounter balance.

## Thirty-day economy

Thirty seeded accounts per style, 90 total, across 2,700 account-days and 9,000 complete battles. Styles label 10/30/120 minutes, using 1/3/6 rewarded attempts per day and 1/2/2 cafe services. Service accrues alongside desktop activity, not additional active play time. These are scenario labels, not measured human session durations. The policy buys a chosen rare set, saves for Golden Maneki, develops cards/gear, then prepares supplies. No player purchasing or market prices are modeled.

| Style | Draws/week | Draws/30 days | First legendary median day | First rare 4-set median day | Collection day 30 | Legendary cats day 30 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| casual | 12.65 | 54.20 | 24 | 3 | 82.78% | 1.17 |
| regular | 22.84 | 97.87 | 13 | 2 | 93.06% | 2.17 |
| heavy | 23.80 | 102.00 | 13 | 1 | 93.33% | 2.23 |

All 90 scenarios receive at least one legendary and earn Golden Maneki local eligibility by day 30. This is observed for these seeds, not a promise: the hard guarantee is 60 draws, and a casual account may earn fewer than 60 by day 30. Base legendary probability is 1%; pity raises the exact long-run frequency to 2.6640% (mean 37.5376 draws). The 12-cat roster becomes mostly complete within a month; expansion needs real new kit/encounter content.

| Style | Resource | Earned | Spent | Initial | Day-30 balance |
| --- | --- | ---: | ---: | ---: | ---: |
| casual | fish | 6968.00 | 7535.67 | 600 | 32.33 |
| casual | threads | 1314.47 | 1208.50 | 40 | 145.97 |
| casual | stamps | 7621.33 | 8130.00 | 600 | 91.33 |
| casual | essence | 35.00 | 30.00 | 0 | 5.00 |
| regular | fish | 12800.00 | 13218.67 | 600 | 181.33 |
| regular | threads | 2756.80 | 2647.93 | 40 | 148.87 |
| regular | stamps | 14149.33 | 14680.00 | 600 | 69.33 |
| regular | essence | 40.00 | 30.00 | 0 | 10.00 |
| heavy | fish | 12800.00 | 13258.33 | 600 | 141.67 |
| heavy | threads | 3068.67 | 2965.73 | 40 | 142.93 |
| heavy | stamps | 14700.00 | 15300.00 | 600 | 0.00 |
| heavy | essence | 40.00 | 30.00 | 0 | 10.00 |

“Inflation” here means unspent point accumulation, not market-price inflation. Spent can exceed earned because of starter balances. Recycling gear counts as earned threads; crafting never refunds its total cost. Final heavy threads are 142.93 vs 1,876.4 in the preceding trial; simultaneous combat tuning prevents attributing the entire change to pantry costs alone. Essence retains a small reserve because this policy saves for the second design; repeatable epic tailoring remains available.

| Week | Fish ratio | Thread ratio | Stamp ratio | Essence ratio | XP ratio | Draw ratio |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1.829 | 2.363 | 1.824 | 1.000 | 1.497 | 1.633 |
| 2 | 1.850 | 2.323 | 1.999 | 1.000 | 1.765 | 1.983 |
| 3 | 1.840 | 2.332 | 1.897 | 1.000 | 1.553 | 2.012 |
| 4 | 1.829 | 2.321 | 1.921 | 1.000 | 1.598 | 1.838 |

The maximum weekly cohort-mean ratio is 2.3631, below the 3× design target. This is not a universal bound for every pair of players: luck, losses and chosen spending differ. Caps bound repeated grants; a local client/day is not secure against tampering. No bot-resistance or online economy claim follows.

Three additional 30-day runs disable every draw: casual/regular/heavy all forge Golden Maneki eligibility with zero pulls and starter cats plus chosen gear. This proves the deterministic route is reachable without gacha; three examples do not establish a population rate. See `evidence/economy-no-draws.json`.

## Verification and commands

Rules: baseline 614 passed; final 663 passed (+49), unchanged 2 expected failures and 11 skips. All workspace typechecks pass. The final rule regression includes paired effect-hit investment across 400 seeds, exact capped reward previews, a genuine victorious reward fixture, local global/season cap edges, pity, deterministic replay, immutable commands, no tradeable draw output, and losing forge/enhance/salvage loops. `evidence/audit.json` checks research coverage, ownership, pure meta I/O exclusions, current-core scheduler grep and every next-pull odds row.

```sh
pnpm --filter @taskbar-hero/game-rules test
pnpm typecheck
node tools/cardrpg-sim/fixtures.mjs
node tools/cardrpg-sim/audit.mjs
CARDRPG_FULL=1 CARDRPG_SEEDS=100 CARDRPG_TRIAL=final-grid node tools/cardrpg-sim/combat.mjs
CARDRPG_SEEDS=400 CARDRPG_SEED_OFFSET=1000 CARDRPG_TRIAL=final-holdout node tools/cardrpg-sim/combat.mjs
CARDRPG_PLAYERS=30 CARDRPG_TRIAL=final node tools/cardrpg-sim/economy.mjs
CARDRPG_PLAYERS=1 CARDRPG_NO_DRAWS=1 CARDRPG_TRIAL=no-draws node tools/cardrpg-sim/economy.mjs
```

Run from the systems worktree with pnpm 10.28.0 and its frozen-lockfile install. Tools use existing local Vite/TypeScript/Vitest/fast-check, no new runtime dependencies or model calls. Never substitute fixture balances for real play when reporting a simulated outcome. Rendered integration, flag-off screenshots and actual offline behavior belong to Session B and are linked by the final ledger report.
