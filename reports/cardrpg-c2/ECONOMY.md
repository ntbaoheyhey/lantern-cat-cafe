# B4b — final 30-day economy projection

All 600 accounts completed: three declared player policies × 200 seeds (90001–90200) × 30 days. Rules runtime SHA256: `007ce084d8e4573ec2d3d275390a0181719f88bbeff585cafeb7e66185d97efc`. Source commit: `4357db76e0bba11f19ec6e0c3dd22ea98518a93a`; run metadata: 2026-11-12T14:56:59.846Z. Raw daily accounts and the immutable runtime remain outside Git in `/Users/bao/Documents/Codex/2026-11-12/x/work/c2/item7-economy`. Compact reproducible results: [ECONOMY.json](ECONOMY.json).

This is a modeled player policy using public transactions and the battle playback clock. The five real 30-minute UI sessions are reported separately in [BALANCE.md](BALANCE.md). Account seeds cycle evenly through 28 consecutive start dates from 2026-11-12; matching casual/regular/heavy accounts share a start date. Daily-route seeds are still shared by calendar date, so 600 accounts are not 600 independent calendar samples. This cohort measures variation across the declared start-date window.

![Cumulative first-gear timing](../../docs/cardrpg-c2/economy-rarity.svg)

| Profile | Minutes/day | First Epic median / p90 day | First Legendary median / p90 day | Legendary censored at day30 | Bag final median / p90 / max seen |
|---|---:|---:|---:|---:|---:|
| casual | 30 | 1 / 1 | 11 / 11 | 0 | 48 / 48 / 51 |
| regular | 60 | 1 / 1 | 11 / 11 | 0 | 48 / 48 / 51 |
| heavy | 180 | 1 / 1 | 11 / 11 | 0 | 48 / 48 / 51 |

The casual first-Epic target is day 1–2; the first-Legendary target is day 10–16. Bag size reflects the declared policy that salvages spare low-rarity pieces above 48, while preserving equipment and counting gross creation before salvage; the game's shelf limit is 240. The maximum can temporarily exceed 48 after a transaction. [CDF data](../../docs/cardrpg-c2/economy-rarity.csv) preserve all 30 days and any censoring.

| Profile | Currency | Mean starting balance | Mean earned | Mean spent | Mean ending balance | Out/in | 0.8–1.1 target |
|---|---|---:|---:|---:|---:|---:|---|
| casual | fish | 600.00 | 12600.00 | 13087.50 | 112.50 | 1.039 | PASS |
| casual | threads | 40.00 | 3431.64 | 3338.31 | 133.33 | 0.973 | PASS |
| casual | stamps | 600.00 | 10800.00 | 11356.20 | 43.80 | 1.052 | PASS |
| casual | essence | 0.00 | 178.68 | 156.57 | 22.11 | 0.876 | PASS |
| regular | fish | 600.00 | 12600.00 | 13088.73 | 111.28 | 1.039 | PASS |
| regular | threads | 40.00 | 3441.84 | 3351.28 | 130.56 | 0.974 | PASS |
| regular | stamps | 600.00 | 10800.00 | 11367.60 | 32.40 | 1.053 | PASS |
| regular | essence | 0.00 | 179.73 | 157.91 | 21.82 | 0.879 | PASS |
| heavy | fish | 600.00 | 12600.00 | 13084.25 | 115.75 | 1.038 | PASS |
| heavy | threads | 40.00 | 3473.87 | 3383.05 | 130.82 | 0.974 | PASS |
| heavy | stamps | 600.00 | 10800.00 | 11371.20 | 28.80 | 1.053 | PASS |
| heavy | essence | 0.00 | 179.98 | 159.22 | 20.77 | 0.885 | PASS |

Out/in uses actual earned income, with starting balances shown separately. A ratio above one can consume starting funds. No idle balances were deleted to improve this ratio. Purchases use legal public transactions and prospective mean-roll Power; the policy cannot inspect a future random roll.

| Heavy / casual progress per active hour | Ratio | ≤3× target |
|---|---:|---|
| xpPerHour | 0.167× | PASS |
| gearPerHour | 0.167× | PASS |
| masteryPerHour | 0.167× | PASS |

These are explicit XP, gross gear and mastery-material proxies. Daily caps flatten extra play; they do not imply that every subjective definition of progress has been bounded.

Per-item weekly gross creation and eligible template supply are published in [WEEKLY-SUPPLY.json](WEEKLY-SUPPLY.json) and [OUTBOX.md](OUTBOX.md), using CHAIN's exact READY catalog. Eligible templates are not authoritative mint receipts. Ordinary browser-save campaign issuance remains zero pending trusted player, earning and consumed/sealed records. Star Thread is a separate one-time CHAIN judge entitlement, never recurring campaign supply.

Item-impact evidence and runtime-matched acceptance stay separate in [DROP-TABLE.md](DROP-TABLE.md). An economy result does not establish a universal item-effect bound; original screens and independent holdouts retain their own sample labels.

## Acceptance and verification

All declared economy targets pass: casual first Epic day 1 and first Legendary day 11; all 12 profile/currency ratios fall between 0.876287 and 1.052889; all three heavy/casual progress-per-hour proxies are approximately 0.167×, below the 3× target. These are profile-level aggregate ratios, not a promise that every account has the same ratio.

[Export validation](ITEM7-ECONOMY-VALIDATION.json) verifies 600 unique profile/seed pairs, all 30 daily records, 28 matched calendar strata, currency ledgers, weekly item totals, cumulative rarity curves, bag bounds and frozen runtime/catalog hashes. The 253 account files retained across the worker-count change remain byte-identical. Earlier single-date results remain in Git history and their original raw files.

The chart was rendered headlessly and personally inspected at publication: all six curves, axes, legend and calendar-correlation note are readable and unclipped. All 69 Epic+/material rows are published in OUTBOX.md; two bound Epic materials are included separately from the 64 equipment templates.

B4b self-score: **8/10** for the declared measurements. Item evidence remains scoped to the fixed fixtures: the 100-pair screen retains its −13 pp sample, the corresponding independent 1,000-pair result is −7.0 pp, and the separately predeclared 10,000-pair follow-up resolves the one marginal interval crossing 12 pp. This is not a universal or simultaneous item-effect bound.
