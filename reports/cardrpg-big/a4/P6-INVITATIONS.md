# P6 invitations: probability and earned time

REFERENCE: GAMEPLAY-V4 sections 5/9; p6/REGISTERED-METHOD.md. The registered P6 coordinator completed these samples without rerolling seeds or changing game rules.

| Banner | Accounts / paid draws | First Legendary median / p90 / maximum pulls | Maximum CDF deviation | Chosen reward |
|---|---|---|---|---|
| Standard | 10,000 / 600,000 | 44 / 50 / 60 | 0.640337 percentage points | All redeemed at 60 pulls |
| Featured | 10,000 / 600,000 | 44 / 50 / 60 | 0.640337 percentage points | All redeemed at 60 pulls |
| Equipment | 10,000 / 600,000 | 44 / 50 / 60 | 0.640337 percentage points | All redeemed at 60 pulls |

All three first-Legendary CDFs satisfy the registered maximum-deviation gate of 1 percentage point. Each banner uses seeds 1–10,000 with a controlled 9,000-stamp bankroll, six actual ten-draw commands and a day rollover after 30 draws. Each account actually redeems a chosen cat with its 60 earned selector marks; this sample does not measure every possible gear-selector transaction. There are no censored first-Legendary or chosen-reward observations in this controlled pull-count experiment.

The featured cohort checks 1,457 follow-up Legendary guarantees after a featured miss. The equipment cohort reaches all 128 eligible templates. Raw conditional rarity counts and expected frequencies are retained for all 60 pity buckets per banner. An independent read-only audit verifies fixed seed order, current source hashes, account and bucket accounting, and the observed CDF. Its largest standardized bucket residuals are 2.800 / 3.018 / 2.928 in absolute value; these are diagnostics across many comparisons, not newly introduced acceptance thresholds.

The fixed seed sequence is shared across banners, so their results are not three independent replications of the same Legendary curve. Each banner still has 10,000 independently seeded accounts. Comparing unconditional outcomes with the base 1% rate would ignore the conditional pity schedule and is not used here.

| Earned schedule | Accounts observed through day 45 | First Legendary median / p90 / latest day | Chosen reward observed / censored |
|---|---|---|---|
| Casual | 30 | 33 / 38 / 45 | 0 / 30 |
| Regular | 30 | 33 / 38 / 45 | 0 / 30 |
| Heavy | 30 | 33 / 38 / 45 | 0 / 30 |

The separate new-save economy bot earns currency through public game commands. All 90 accounts finish day 45 at 58 paid draws, below the 60-mark selector requirement. Chosen-reward median and p90 remain **greater than 45 days, administratively censored**. Do not infer a day-46 or later completion date without extending that experiment. The controlled guarantee at 60 pulls is established; earned time to reach it is not established within this 45-day sample.

Evidence: [controlled draws and pity buckets](p6/gacha/gacha.json), [independent accounting audit](p6/gacha/audit.json), [earned daily accounts](p6/economy/progression.json), [earned-data audit](p6/economy/audit.json), [complete balance report](P6-BALANCE.md). Reproduce the registered controlled sample with `node tools/cardrpg-big/a4-p6-gacha.mjs` using its retained checkpoint; do not resample accepted data merely to reproduce this report.
