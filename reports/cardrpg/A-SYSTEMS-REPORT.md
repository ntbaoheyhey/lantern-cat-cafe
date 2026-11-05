# Session A — Systems delivery report

Status: **PARTIAL — A systems and requested integration fix complete; B final integrated evidence pending.**
Updated: 2026-11-05T18:46:28.093765+00:00.

Base: `3bf2cfa3bd32d8355c5c967e979240330a595682` on `ai/codex-turn3d-polish-2026-11-05`. Systems head: `9ccf88e7eeac6814229e2b8d919b608bb4cee478` on `ai/codex-cardrpg-systems-2026-11-05`; worktree `/Users/bao/taskbar-hero-cardrpg-a`. Contract **0.4.0**. The no-limits update supersedes all clock/size/retry ceilings; checkpoints record content order only. No extra agents or model-calling helpers were used.

REFERENCE: `reports/turn3d-polish/TURN3D-POLISH-REPORT.md` was read first; prior reviewed artifact `docs/turn3d-polish/index.html`; existing asset/provenance, squad, rune, item and Relic contract sources informed this work. Evidence links below pin A's final source rather than a moving branch.

## Delivered behavior and scope

The local loop now has twelve original collectible cat role variants, 48 equipment templates, four equipment slots and four existing rarity names, three 2/4-piece sets, previews, enhancement through +12, chosen reforge, salvage, lock/favourite protection, levels/stars, duplicate shards, three earned-only banners with odds/pity/history, cafe service, quests, a battle/reward boundary and capped Relic design eligibility. All commands return immutable next states; no persistence, paid draw, tradeable random output or mint path exists.

Evidence: [catalog, command, property and cap tests](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/rules.test.ts); [combat, reward, replay and opt-in regressions](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/battle.test.ts); [source and ownership audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/audit.json); [663 passing rules tests](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/logs/cardrpg-rules-final.log).

The twelve cards share **three independent combat kits**. There is **one playable chapter** and three designed chapters; four of thirteen enemy designs are future content. Account progress is deliberately local and unsaved. The design is complete enough for this prototype's loop, not a claim of complete production/live-service content.

## Research, sources and original direction

34 game rows cover squad/gacha RPGs, card/deck games, classic turn-based readability and on-chain economies, plus a separate six-jurisdiction/platform fairness review. Each row has 27 comparison fields and field-specific evidence scope. The 53-source list below preserves access dates. Some live formulas, session estimates and player-sentiment fields remain explicitly unverified; a URL is not used to authenticate an entire row.

Evidence: [docs/design/cardrpg/RESEARCH.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/RESEARCH.md), [docs/design/cardrpg/research-matrix.json](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/research-matrix.json), [docs/design/cardrpg/sources.json](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/sources.json), [34-row / 53-source structural audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/audit.json).

The design keeps clear roles, visible enemy intent, meaningful equipment goals, duplicate protection and recurring earned progress. It changes repeated random gear rerolls into chosen reforge/tailoring, separates playable items from potential future scarce collectibles, and rejects action-frequency scheduling, paid random acquisition, transferable points and production-asset yield loops. Original cafe mechanisms include chosen pantry preparation, Yarnkeeper effort seals, practical shared gear sets and a guestbook of role variants. [20-mechanism keep/change/drop analysis](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/PATTERNS.md) and [decision record](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/DECISIONS.md) provide the rationale.

## Design decisions

| Decision | Implemented behavior | Verification / limitation |
| --- | --- | --- |
| Numbered rounds | One action per living eligible actor; integer initiative only changes ordering | Full event replay and per-round uniqueness tests; no speed-clock hits in audit |
| Four rarities / four slots | common, rare, epic, legendary; Weapon, Outfit, Charm, Relic | Catalogue invariants; existing IDs preserved |
| Three role kits / twelve cards | Each tier has guardian, witch and alchemist variants | Catalogue tests; independent new kits remain future content |
| Gear distinctiveness | Three set families, 2/4 bonuses and deduplicated legendary properties | Equip/stat/set and combat integration tests |
| Failure-free development | +12 enhancement, chosen affix reforge, exact before/after previews | Monotonic cost/stat and atomic error tests |
| No energy wall | Practice continues after economic caps | Reward/quest/XP tests and real 30-day simulation |
| No paid acquisition | Earned stamps only; all draws soulbound/non-tradeable | All seed/property trajectories and command surface audit |
| Deterministic Relic design | Effort seals plus chosen resource costs; global/season checks | Cap-boundary tests and zero-draw reachable runs; local simulation only |
| Opt-in combat | Frozen account stats, identity and supplies enter existing round engine | Replay, default-off shape, exact settlement tests |
| UI calls rules | B imports actions, previews and battle bridge | B #12 confirms final fix merged; 76 A-owned changed files match byte-for-byte |

Formulas, stat caps, costs, card roster and gear pools: [docs/design/cardrpg/DESIGN.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/DESIGN.md); authoritative tuning: [packages/game-rules/src/cardrpg/config.ts](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/config.ts). Existing live `packages/game-rules/src/config.ts` is unchanged; audit lists every changed A-owned file. No new runtime dependency.

## Published odds and pity

| Banner | Common | Rare | Epic | Legendary | Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cafe Guestbook | 60% | 30% | 9% | 1% | 150 earned stamps |
| Marigold at Closing Time | 60% | 30% | 9% | 1% | 150 earned stamps |
| Mending Basket | 55% | 34% | 10% | 1% | 150 earned stamps |

Every base and conditional row sums to exactly 10,000 basis points. Soft pity starts at draw 41 with 4% legendary, adds 3 percentage points per subsequent draw, and draw 60 is guaranteed legendary. Each banner has its own counter. Featured legendary is 50% Marigold; after a miss the next legendary guarantees her, at most 120 draws from reset. Unowned content is preferred within a rolled rarity; protection does not upgrade rarity. Base 1% is not consolidated issuance: exact renewal calculation gives **2.6640%** long-run legendary frequency and **37.5376** mean draws per legendary.

Evidence: [packages/game-rules/src/cardrpg/gacha.ts](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/gacha.ts), [odds, pity, pool, distribution, duplicate and soulbound tests](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/rules.test.ts), [all 180 conditional odds rows and renewal calculation](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/audit.json). No legal compliance or monetary-value conclusion follows from these numbers.

## Resource sources and uses

| Resource | Faucet | Sink | Repeatable daily earned cap |
| --- | --- | --- | ---: |
| fish | service, won battles, quests; initial and first-clear grants | cat levels/stars, gear enhancement, sewing/tailoring, reforge and designs | 420 |
| threads | service, won battles, daily service quest, salvaging finite items | sewing/tailoring, enhancement, reforge, level cost, pantry-key mending, designs | 90 from capped grants; salvage is recycling |
| stamps | service, won battles, quests; initial/first-clear/mender grants | all three earned-only banners, 150 per draw | 480 |
| essence | weekly wins, first-boss achievement, five-star shard overflow | epic tailoring, cafe ribbon, deterministic Relic designs | 12 |
| matching shards | duplicate owned cats | stars; after five stars, 10 shards→1 essence | bounded by daily draws and essence cap |
| Yarnkeeper Seal | first rewarded boss clear of each day | 3/10-seal design recipes | 1 |
| pantry key | weekly wins or 40-thread mending | one chosen supply recipe (+10 threads) | weekly quest once/week; mending is a sink |
| five pantry supplies | chosen pantry recipe | packed on entry and consumed by battle actions | carry cap: two each, one Starlight Treat |
| Cafe Ribbon | 10 essence +20 threads | single collection unlock; no combat advantage | once per account |

Currencies are off-chain, non-transferable integer points. There is no hard/premium currency. `fish` is a cafe resource, not money. Initial balances are 600 fish/40 threads/600 stamps/0 essence. Each won rewarded battle supplies 90 fish/12 threads/40 stamps and 60 XP; a loss supplies 20 XP. Each rewarded victory also grants one uniformly selected equipment template: a first chapter win selects among the 12 rare templates (1/12 each); later rewarded wins select among the 12 common templates (1/12 each). Losses and post-cap practice grant no item. Epic/legendary battle drop probability is zero; those tiers have chosen tailoring or the published equipment banner. Only the first six completed battles per day advance rewarded battle quests. A first chapter clear adds 200 fish/200 stamps once. Cafe service gives 140 fish/20 threads/70 stamps per ten-minute claim, at most two claims daily. These flows are further limited by shared per-currency and 180 repeatable-XP daily caps. One-time achievements are separate and cannot repeat.

The mode has no energy meter. Practice remains playable after reward caps. Service time/day is explicit simulation input and is visibly labelled local; the client can advance it. It is not anti-bot security or a claim of actual elapsed desktop time. A future taskbar integration must supply authenticated elapsed-time evidence and authoritative dates without penalizing absence. No server work is authorized here.

Evidence: [packages/game-rules/src/cardrpg/progression.ts](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/progression.ts), [packages/game-rules/src/cardrpg/equipment.ts](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/equipment.ts), [caps, sinks, lost-value recycling and once-only claims](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/rules.test.ts); measured balances below. All four currencies have repeatable or deterministic sinks. Local day/elapsed-time input is not anti-bot authority.

## Scarcity — design only, not minted

| Design | Fuji Relic ID / rarity | Lifetime / season cap | Deterministic requirements |
| --- | --- | --- | --- |
| Moon Collar | 3 / epic index 2 | 2,400 / 400 | 3 distinct rewarded boss days; 900 fish, 120 threads, 15 essence |
| Golden Maneki | 4 / legendary index 3 | 360 / 60 | 10 distinct rewarded boss days; 2,400 fish, 300 threads, 30 essence |

One local eligibility per account/series/season. `mintedSoFar=0`; all current inventory remains soulbound. Both caps are checked before spending; new seasons do not reset lifetime issuance. Eligibility does not depend on random draws. The only future tradeable candidate is a separately earned Relic on **Avalanche Fuji, chain 43113**. No fungible asset, mainnet, custom L1, real mint, contract edit or deploy is included.

Evidence: [boundary/cap, effort, duplicate and metadata tests](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/rules.test.ts); [three zero-draw real 30-day reachability runs](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/economy-no-draws.json); [unchanged existing ERC-1155 voucher contract](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/contracts/src/RelicNFT.sol). The contract currently has **no on-chain total/season cap or item-burn enforcement**. These are local rules proofs, not global concurrency, identity or on-chain scarcity proofs. Fixed supply cannot guarantee demand or price.

## Measured combat and economy


Measured gameplay source: `b65168c6`; contract 0.3.0. Final contract 0.4.0 removes an internal mutating builder from the public API and regenerates fixture version fields; tuning and simulation outcomes are unchanged. All measurements use the actual pure meta commands and existing numbered-round battle engine, not estimated reward formulas. The runtime files did not change between these final simulations and this revision. The audit records SHA-256 values. Previous tuning trials remain in `evidence/`; filenames containing `initial`, `pressure`, `durability`, `redistributed`, or `tuned` are historical, not final gates.

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

### Holdout sampling uncertainty

Calculated from the existing 400-seed holdout rows, without a new tuning run: 95% Wilson binomial intervals are 56.90–66.38% for Hearthkeepers Auto (247/400), 56.14–65.65% for Lanternbreakers Auto (244/400), 80.90–87.94% for Hearthkeepers active (339/400), and 83.35–89.95% for Lanternbreakers active (348/400). Both Auto intervals lie within the 55–75% target for these sampled simulator conditions. This quantifies seed sampling uncertainty under the usual independent-trial model, not player skill, production telemetry or a confidence interval for human experience.

The policies share seeds: Hearthkeepers has 131 seeds won only by active and 39 only by Auto; Lanternbreakers has 133 won only by active and 29 only by Auto. The net improvements are 92/400 and 104/400 wins, respectively. Active is better in aggregate, not on every individual seed. Evidence: [all 1,600 retained battle outcomes and four summaries](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/combat-final-holdout.json). Wilson calculation uses z=1.959963984540054 and each row's actual wins/sample size.

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


Pinned raw receipts: [3,600-battle grid](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/combat-final-grid.json), [1,600-battle fresh holdout](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/combat-final-holdout.json), [90-account economy](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/economy-final.json), [commands/log hashes](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/receipts.json). Historical unsuccessful trials are retained and excluded from final gates. The subsequent type-only Deno fix does not change these runtime outcomes.

## Tests and gates

| Gate | Result | Evidence |
| --- | --- | --- |
| At least 20 researched games | MET: 34 / 53 sources / 27 fields | research-matrix, sources, audit; per-field evidence limits retained |
| Currency sinks | MET | rules.test.ts; all four currency balances and spending in 30-day output |
| Exact odds sums | MET | all 60 pity positions × three banners, nonnegative integer sum 10,000 |
| Hard pity | MET | boundary and full-trajectory seeded/property tests |
| Local global/season caps | MET for local reducer | final available issue succeeds; exhausted counters reject without spending |
| No paid path / tradeable draw | MET | command surface, pure I/O audit, all result binding checks |
| Starter Auto 55–75% | MET | grid 55%/61%; fresh holdout 61.75%/61% |
| Active stronger than Auto | MET for simulated policy | grid 81%/89%; holdout 84.75%/87%; not human playtesting |
| First deaths across roles | MET, uneven | holdout G/W/A counts in balance table |
| Three 30-day styles | MET | 30 seeded accounts/style, 9,000 real battles |
| Heavy/casual weekly progress | MET in cohort means | worst currency/XP/pull ratio 2.3631; not universal individual bound |
| Contract consumed by B | MET at 0.4.0 / 9ccf88e7 | B #12; independent byte comparison of all 76 A-owned changed files is identical |
| Numbered rounds / replay | MET | battle.test.ts and source grep audit |
| Pure API / immutable commands | MET | command/state/reward-preview tests; internal builder removed |
| Deno import compatibility | MET locally after B #11 | 18 clean graphs, 4 existing regression tests, typecheck; receipt linked below |
| Full integrated suite / flag-off pixels | PENDING B final evidence | A does not substitute source inspection for screenshots or full integration |
| Four separate fresh-eyes passes | MET with residual gaps | first-player 7.0, judge 7.1, collector 6.6, economy 7.5; same agent, not independent review |

Rules baseline: **614 passed, 2 expected failures, 11 skips** in 38 passing/3 skipped files. Final: **663 passed, 2 expected failures, 11 skips** in 40 passing/3 skipped files (**+49** passing tests). The expected failures/skips are inherited, not silently claimed as new passes. Workspace typecheck passed. Deno integration follow-up: all **18 function graphs** resolve, all **4 Deno import tests** pass, game-rules typecheck passes; no Edge Function was deployed or executed remotely.

Evidence: [docs/design/cardrpg/evidence/logs/cardrpg-a-baseline.log](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/logs/cardrpg-a-baseline.log), [docs/design/cardrpg/evidence/logs/cardrpg-rules-final.log](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/logs/cardrpg-rules-final.log), [docs/design/cardrpg/evidence/logs/cardrpg-typecheck-final.log](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/logs/cardrpg-typecheck-final.log), [docs/design/cardrpg/evidence/deno-integration-fix.json](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/evidence/deno-integration-fix.json), [docs/design/cardrpg/FRESH-EYES.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/docs/design/cardrpg/FRESH-EYES.md).

## Contract, coordination and artifact

A published 0.1 → 0.2 battle bridge → 0.3 reward/identity → 0.4 public-API freeze with regenerated typed fixtures. B's UI-needs and requests were answered only through `coord/cardrpg/`: B #4 equipment identity, B #8 capped reward copy, B #11 import regression. Latest A #11 delivers `9ccf88e7`. B #12 confirms the final `9ccf88e7` fix merged. At integrated head `25466d096cce0442b8ec6896b79cc6abbb98303e`, an independent read-only comparison finds all 76 changed A-owned paths byte-identical to A. The UI model delegates commands and battle outcomes to imported rules; Collection/Inventory/Forge/Gacha use the exported stats, previews and conditional odds. Source inspection covers delegation, while final browser evidence remains B-owned. A never edits B's owned paths.

Public surface: `createStarterAccount`, `applyCommand`, equipment/forge/progression/gacha actions, all previews/selectors, `startBattle`, `finishBattle`, `previewBattleRewards`, `abandonBattle`. Fixtures: starter-account, midgame-account, banner-standard, banner-featured, pity-near-hard, battle-reward (actual winning seed 1), team-equipped. Exact exports: [packages/game-rules/src/cardrpg/index.ts](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/index.ts); seven generated fixtures: [packages/game-rules/src/cardrpg/fixtures/index.ts](https://github.com/ntbaoheyhey/taskbar-hero/blob/9ccf88e7eeac6814229e2b8d919b608bb4cee478/packages/game-rules/src/cardrpg/fixtures/index.ts).

B owns the self-contained artifact at `/Users/bao/taskbar-hero-cardrpg-int/docs/cardrpg/index.html`; final integrated file:// validation/hash is pending. Open it in a desktop browser once B publishes final evidence; only 1024×600, 1280×720 and 1440×900 are claimed.
REFERENCE: `docs/cardrpg/index.html`; `docs/cardrpg/build.json`; `coord/cardrpg/B-OUTBOX.md` entries #7–#11. Earlier preview observations are not presented as final integrated proof.

## Integration inspection receipt

The read-only comparison enumerated `git diff --name-only 3bf2cfa3bd32d8355c5c967e979240330a595682 HEAD` in A and compared each file to the real integration worktree: 76 files, zero differences at `25466d096cce0442b8ec6896b79cc6abbb98303e`. The rules client `apps/web/src/game/cardrpg/model.ts` SHA-256 was `c0e6c1d8c4131e243434c5d0a602547b9a4ad4de0a1d571c71d7b1ead0d4b3b2`; its command/start/finish/abandon methods call imported game-rules functions directly. Screens obtain actual stats, preview costs and odds from the same package. This is a source-boundary review, not a substitute for runtime browser tests.

All 32 pinned evidence links resolve to 26 existing files; all recorded evidence hashes in receipts.json match. B #12 reports 1,621 isolated web tests passed and zero changed flag-off pixels at all three target sizes; final full-suite/report artifacts still need review before promotion to DONE.

## C4 verification in progress — 2026-11-05 UTC

Source `4bcf182195128e1cdc3a51f3d5172353eba00d1a` passed the recorded delivery rerun: 2,937 package tests plus 11 root tests, 421 browser tests, workspace typecheck/lint/build, and zero differing flag-off pixels at all three desktop sizes. A independently re-compared all 76 changed systems paths to frozen `9ccf88e7`: zero differences. The earlier 96 local Foundry tests concern unchanged contracts; no remote execution or deployment was performed.

These checks do **not** close the final artifact gate. The strict real wave-transition test subsequently exposed context pressure and console-level embedded-texture CSP failures not caught by the earlier page-error-only journey check. B is correcting context disposal and permitting local `blob:` loading while external networking stays prohibited, and has strengthened the full-journey/transition checks. The artifact changed after the `324175aaa5c4299126d2071069f0f965201205cf44e4ef1e8e77415765bc53a8` capture set. That set is historical and must not be cited as proof of the replacement file. Final production cast/transition measurements, console-clean journey, captures and publication remain pending.
REFERENCE: `docs/cardrpg/index.html`; `docs/cardrpg/build.json`; `reports/cardrpg/validation/delivery-results.json`; `reports/cardrpg/validation/safety-delivery.json`; `reports/cardrpg/isolation/pixels.json`; `reports/cardrpg/transition-context-diagnostic/transitions.json`; `tools/cardrpg-demo/path-check.mjs`; `tools/cardrpg-demo/transition-performance.mjs`.

## Draft review stack

All six PRs were read back through GitHub: open, **draft**, unmerged. No auto-merge enabled or release requested. The user removed the PR-size ceiling; the final evidence diff is large because it retains raw seeded trials.

| PR | Contents | Base |
| --- | --- | --- |
| [#316](https://github.com/ntbaoheyhey/taskbar-hero/pull/316) | Contract, catalogs, typed fixtures | verified polish branch |
| [#317](https://github.com/ntbaoheyhey/taskbar-hero/pull/317) | Equipment, earned draws, progression reducers | #316 |
| [#318](https://github.com/ntbaoheyhey/taskbar-hero/pull/318) | Round-engine stat/replay/reward integration | #317 |
| [#319](https://github.com/ntbaoheyhey/taskbar-hero/pull/319) | Exact capped rewards, identities, supply routes | #318 |
| [#320](https://github.com/ntbaoheyhey/taskbar-hero/pull/320) | Research, patterns, design and decisions | #319 |
| [#321](https://github.com/ntbaoheyhey/taskbar-hero/pull/321) | Final tuning, simulations, reviews, public API and Deno fix | #320 |

## Remaining gaps and decisions

1. **Content depth:** three independent kits, one playable chapter, twelve-card collection saturating to 82.78–93.33% in measured 30-day scenarios. Next content should add actual tactical kits/encounters before multiplying rarity tiers.
2. **Durable and authoritative operation:** deliberately no saves, authenticated rewards, shared cap ledger or mint. A future phase would need separate authorization and security design; no deployment decision is required for this delivery.
3. **Human evidence:** no new-user comprehension, fun, retention or market-demand study. Simulated policies and self-scores do not replace it.

Four fresh-eyes passes fixed mismatched reward previews, ineffective effect-hit investment, excess thread accumulation, weak evidence scoping and a loss labelled as a victory fixture. Integration then fixed Deno type resolution. Details and five weaknesses per pass are in FRESH-EYES.md. No user decision blocks the local systems package; the next product choice is which independent kits/chapter to develop after hands-on review.

## Source list

The entries below list the retained 53 references with access dates and claimed scope. Evidence confidence and any unverified comparisons remain in sources.json/research-matrix.json; this list alone does not turn a source into proof for every game field.

- [SW — Com2uS rune crafting event](https://sw.com2us.com/en/skyarena/news/list/6645) — 2026-11-05 UTC; primary. Selectable rune creation; odd-slot main properties are fixed.
- [SW2 — Com2uS rune-set event](https://summonerswar.com/en/skyarena/news/list/6902?r=p1) — 2026-11-05 UTC; primary. Two/four-piece rune types and random main/sub-properties.
- [E7 — RPGFan Epic Seven review](https://www.rpgfan.com/review/epic-seven/) — 2026-11-05 UTC; review. Animation praised; progression slows into character development; rate-up guarantee discussed. Historical 2021 review, not a current banner audit.
- [HSR — HoYoverse pity help](https://support.hoyoverse.com/hc/en-us/articles/50913710696217-How-does-the-pity-system-work-for-different-banners-and-reruns) — 2026-11-05 UTC; primary. Character banner 0.6% base, 1.6% consolidated, five-star by 90; banner-specific details must be read in game.
- [AFK — AFK Journey beginner guide](https://www.prydwen.gg/afk-journey/guides/beginner-guide) — 2026-11-05 UTC; specialist. Class equipment, recycling/forging, recruitment and guild activities.
- [AFK2 — AFK Journey equipment guide](https://d2ankz0m1a0dsp.cloudfront.net/afk-journey/guides/equipment-and-priority/) — 2026-11-05 UTC; specialist. Six class-wide gear slots; gear is shared by every hero of that class.
- [RAID — Plarium gear overview](https://forum.plarium.com/raid-shadow-legends/673_guides-and-tutorials/594614_basic-guide-artifacts-overview/) — 2026-11-05 UTC; primary. Equipment sets can combine; enough matching pieces activate set effects; gear dungeons and forge materials.
- [FEH — Nintendo FEH beginners](https://fire-emblem-heroes.com/en-gb/sp/beginners/) — 2026-11-05 UTC; primary. Summoning uses Orbs; story/hero battles provide progression.
- [FEH2 — Nintendo FEH FAQ](https://support.fire-emblem-heroes.com/en-US/faq) — 2026-11-05 UTC; primary. Favourites protect against sending home and merging; Orbs also improve castle.
- [CRK — Cookie Run topping guide](https://www.noff.gg/cookie-run-kingdom/faqs/what-are-toppings) — 2026-11-05 UTC; specialist. Up to five toppings; three quality sizes; stat and set bonuses.
- [MSF — Scopely red stars](https://scopely.helpshift.com/hc/en/46-marvel-strike-force/faq/5903-what-are-red-stars/?p=all) — 2026-11-05 UTC; primary. Red Stars multiply character power and affect level/gear bonuses.
- [MSF2 — Scopely orb probabilities](https://marvelstrikeforce.com/en/shop-orbs) — 2026-11-05 UTC; primary. Publisher exposes orb-specific probabilities; no one universal orb rate.
- [LANG — Langrisser encyclopedia](https://us-news.zlongame.com/sysmz/900.jhtml) — 2026-11-05 UTC; primary. Four hero equipment slots; items contribute attributes.
- [HS — Blizzard 17.0 duplicate-protection patch notes](https://hearthstone.blizzard.com/en-us/news/23357896/ashes-of-outland-patch-17-0-march-26) — 2026-11-05 UTC; primary. Historical March 2020 change extends collection protection across rarities; protection is not an increase in high-rarity odds.
- [SNAP — Marvel Snap upgrade disclosure](https://marvelsnap.com/fntyspltlglpg/) — 2026-11-05 UTC; primary. Visual card upgrades consume boosters/credits and advance collection level.
- [SNAP2 — Marvel Snap collection evolution](https://marvelsnap.com/collection-level-evolution/) — 2026-11-05 UTC; primary. Developer explicitly acknowledges poor acquisition pacing at higher collection levels. Historical design note.
- [LOR — Riot LoR FAQ](https://playruneterra.com/en-us/news/lor-announce-faq) — 2026-11-05 UTC; primary. Region progression and deterministic card acquisition through shards/wildcards.
- [LOR2 — Riot duplicate protection](https://support.riotgames.com/en-us/legends-of-runeterra/gameplay/duplicate-protection-and-shard-conversion-in-legends-of-runeterra) — 2026-11-05 UTC; primary. Extra low-rarity copies convert into shards; protected acquisition differs by rarity.
- [STS — Slay the Spire publisher store page](https://store.steampowered.com/app/646570/Slay_the_Spire/) — 2026-11-05 UTC; primary. Run-based deck selection, branching routes, relic synergies and daily climbs.
- [MT — Monster Train publisher store page](https://store.steampowered.com/app/1102190/Monster_Train/) — 2026-11-05 UTC; primary. Three vertical fields, two-clan decks, card upgrades/duplication and difficulty levels.
- [GWENT — GWENT official overview](https://www.playgwent.com/en/about) — 2026-11-05 UTC; primary. Tactical card battles and collection; detailed live acquisition balance not audited.
- [INS — Inscryption publisher store page](https://store.steampowered.com/app/1092790/Inscryption/) — 2026-11-05 UTC; primary. Deckbuilding, escape-room puzzles and authored horror narrative.
- [DD — Darkest Dungeon community wiki](https://darkestdungeon.wiki.gg/wiki/Getting_Started) — 2026-11-05 UTC; community. Skill launch positions and legal target positions are explicit; front faces front.
- [OCT — Square Enix Octopath series Break/Boost explanation](https://www.square-enix.com/asia/newsportal/en/my/octopathtraveler0/) — 2026-11-05 UTC; primary. Weakness hits reduce shield points; break prevents action and lowers defense. Series source; original-game particulars not fully audited.
- [FFX — Square Enix FFX retrospective](https://www.square-enix-games.com/en_US/news/whats-good-about-final-fantasy-x) — 2026-11-05 UTC; primary. Turn-based combat and extensive side activities; CTB specifics treated as historical knowledge.
- [P5 — Atlus Persona 5 Royal](https://persona.atlus.com/p5r/index.html?lang=en) — 2026-11-05 UTC; primary. Hitting weaknesses grants One More; authored single-player RPG.
- [AXIE — Sky Mavis economic adjustment](https://blog.axieinfinity.com/p/upcoming-season-20-and-economic-balancing) — 2026-11-05 UTC; primary. At the stated historical checkpoint daily SLP creation was about four times breeding burn; rewards were cut. Not a current price claim.
- [AXIE2 — Sky Mavis economy journal](https://blog.axieinfinity.com/p/dev-journal-economic-balancing) — 2026-11-05 UTC; primary. Supply/demand depends on player growth and timing of new sinks; future sinks cannot justify unlimited present issuance.
- [GU — Immutable Flux, Fusing and the Forge](https://immutable.zendesk.com/hc/en-us/articles/15427615705231-Flux-Fusing-and-the-Forge) — 2026-11-05 UTC; primary. Earned plain Core cards plus Flux and GODS fuse into tradeable Meteorite quality. We adopt the free/tradeable separation, not its fungible payment mechanism.
- [SPL — Splinterlands card supply](https://docs.splinterlands.com/cards/card-supply) — 2026-11-05 UTC; primary. Finite edition print runs and combination reduce circulating copies; exact unopened-pack per-card maxima are estimates, and current soulbound reward cards have no fixed supply limit in this source.
- [SPL2 — Splinterlands burn guide](https://docs.splinterlands.com/cards/burning-cards) — 2026-11-05 UTC; primary. Burn removes cards; return type varies by binding/edition/rarity.
- [PAR — Parallel official manual](https://parallel.life/game-manual) — 2026-11-05 UTC; primary. Paragon chooses faction plus Universal cards; starter cards cannot be scrapped.
- [SOR — Sorare official scouting guide](https://sorare.com/help/a/4406429217053/understanding-sorare-cards-pro-common-and-scarcity-levels) — 2026-11-05 UTC; primary. Scarcity is defined per player per season; do not generalize a sport/season edition table to lifetime supply.
- [PIX — Pixels reputation report](https://playtoearn.com/id/news/pixels-unveils-reputation-system) — 2026-11-05 UTC; secondary. Historical reputation scores affected withdrawal eligibility; not proof that bots were eliminated.
- [ILL — Illuvium official FAQ](https://portal.illuvium.io/illuvium-overworld-frequently-asked-questions-faq) — 2026-11-05 UTC; primary. Capture/resource collection feeds team combat in Arena; cross-game resource utility.
- [ILL2 — Illuvium economy patch](https://portal.illuvium.io/news/illuvium-overworld-update-110) — 2026-11-05 UTC; primary. Fusion costs were changed as an economy balancing lever; historical patch.
- [BIG — Big Time economy wiki](https://wiki.bigtime.gg/big-time-economy/economy-components/resources/time-crystals) — 2026-11-05 UTC; primary. Time Crystals are account-bound premium currency with workshop/portal sinks.
- [BIG2 — Big Time hourglasses](https://wiki.bigtime.gg/big-time-economy/economy-components/hourglasses) — 2026-11-05 UTC; primary. Hourglass collectibles are a reward-production mechanism; this is deliberately not adopted.
- [ORIG — Sky Mavis Origins overview](https://support.axieinfinity.com/hc/en-us/articles/4702490760603-Axie-Origins-Overview) — 2026-11-05 UTC; primary. Free starter axies allow play without buying axies.
- [ORIG2 — Sky Mavis rune guide](https://support.axieinfinity.com/hc/en-us/articles/4597304842523-Runes-Guide) — 2026-11-05 UTC; primary. One equipped rune per axie; crafting, events and starter progression provide different acquisition routes.
- [DFK — DeFi Kingdoms heroes](https://docs.defikingdoms.com/gameplay/heroes) — 2026-11-05 UTC; primary. Hero NFTs have profession and progression utility.
- [DFK2 — DeFi Kingdoms gardens](https://docs.defikingdoms.com/how-defi-kingdoms-works/the-gardens) — 2026-11-05 UTC; primary. LP staking and hero profession rewards are intertwined; not suitable for the contest prototype.
- [CRAB — Crabada shutdown/snapshot report](https://playtoearn.com/de/news/crabada-marketplace-closes-this-week-nft-snapshot) — 2026-11-05 UTC; secondary. May 2023 Battle Game closure and NFT migration snapshot; exact broader shutdown chronology is not asserted.
- [OTG — Off The Grid extraction guide](https://decrypt.co/resources/off-the-grid-game-hex-guide?amp=1) — 2026-11-05 UTC; secondary. Hexes are carried to extraction and retained after successful extraction; risk is tied to play.
- [SHRAP — Shrapnel white paper](https://public.shrapnel.com/Shrapnel-White-Paper.pdf) — 2026-11-05 UTC; primary design document. Published ecosystem/economy proposal; current implementation and market performance not verified.
- [MAPLE — Nexpace economy overview](https://docs.nexpace.io/maplestory-universe/overview/) — 2026-11-05 UTC; primary. Limited-quantity item economy and fission/fusion exchange mechanisms.
- [MAPLE2 — Nexpace item circulation FAQ](https://support.msu.io/hc/en-us/articles/14887297942031-Can-these-submitted-items-ever-come-back-to-circulation) — 2026-11-05 UTC; primary. Returned items can re-enter circulation; remove-from-circulation is not necessarily permanent burning.
- [BEL — Belgian Gaming Commission 2018 report translation, mirrored by law firm](https://www.skadden.com/-/media/files/publications/2019/08/video-gaming-egaming-law-update/fn12_onderzoeksrapportlootboxenengelspublicatie.pdf?la=en) — 2026-11-05 UTC; primary report mirror. Historical paid loot-box assessment; jurisdiction-specific, not a universal NFT ruling.
- [NL — Dutch Council of State 2022 judgment](https://www.raadvanstate.nl/uitspraken/%40130150/202005769-1-a3/) — 2026-11-05 UTC; primary law. FIFA packs assessed within the wider game; fine overturned. Does not legalise every standalone chance mechanism.
- [CN — China 2016 Ministry of Culture notice](https://www.cac.gov.cn/2016-12/06/c_1120060575.htm) — 2026-11-05 UTC; primary historical law. Historical random-draw probability disclosure requirement; present applicability needs jurisdiction review.
- [JP — Japan CAA card-matching FAQ](https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/card) — 2026-11-05 UTC; primary law. Complete-gacha/card-matching restrictions; not a blanket prohibition of all random draws.
- [APPLE — Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 2026-11-05 UTC; platform policy. Purchased random virtual-item odds must be disclosed before purchase; gambling has separate requirements.
- [GOOGLE — Google Play Developer Policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en) — 2026-11-05 UTC; platform policy. Purchased random virtual-item odds must be disclosed in advance near the purchase.
