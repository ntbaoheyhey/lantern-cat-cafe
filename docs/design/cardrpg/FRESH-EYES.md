# Four separate systems self-reviews

Reviewed 2026-11-05 UTC by the same primary agent, taking four perspectives. These are source/data reviews, not independent reviewers or human playtests. Scores concern the delivered local systems and use a 10-point scale; no visual-art score is inferred from test counts. Each pass records five weak points and the changes made before freeze.

## 1. First-time player — 7.0 / 10

Method: follow starter account -> one chosen item -> equipment preview -> complete campaign -> exact reward -> quest -> earned invitation. Read B's current command adapter and screens without editing them.

1. **Reward screens could omit first-clear gear/seal or overstate capped amounts. Fixed in rules:** full battle preview now equals settlement; seed 1 fixture asserts a real victory. `battle.test.ts` checks both ordinary and fully capped rewards.
2. **Quest/service UI lists nominal payouts after caps. B requested:** A #7 asks for “up to daily caps”; actual rules already cap payouts. B's acknowledgement and integrated capture remain required.
3. **Too much to learn at once. Partial:** starter owns only six pieces, one team, three roles and one chapter; B handles onboarding. No first-user comprehension study exists.
4. **No saved progress. Deliberate boundary:** `LOCAL_NOTICE`, visible reset notice, in-memory commands and no I/O audit. Durable progression is not silently promised.
5. **A new cat is not a new combat kit. Disclosed:** all 12 definitions expose their role and inherited four skills; DESIGN and B detail screen say role variant. More unique kits remain the biggest content gap.

## 2. Skeptical three-minute contest judge — 7.1 / 10

Method: inspect safety boundaries, existing Solidity contract, metadata, evidence provenance and actual implementability of the demo claims.

1. **Local supply counters could be mistaken for chain enforcement. Fixed:** metadata explicitly states the existing contract lacks supply caps; DESIGN explains authoritative reservation/nonces/concurrency as future work. No mint/deploy is claimed.
2. **A source URL could falsely authenticate unrelated facts. Fixed:** Hearthstone reference corrected to duplicate-protection patch notes; all 27 comparison fields carry evidence scope. 34 games and 53 sources pass structural audit; unverified formulas/sentiment remain labelled.
3. **An impressive catalogue could overstate playable content. Fixed disclosure:** chapters 2/3 reject entry; four extra enemies and three reused role kits are explicitly identified.
4. **Need observable outcomes, not just files. Covered for A:** 663 rules tests; 3,600-condition-table battles; 1,600 fresh-seed battles; actual 30-day reducer/engine runs. B owns rendered/offline/flag-off evidence.
5. **Contest Avalanche integration is future design in this mode. Residual:** Fuji metadata compatibility is useful groundwork, not new technical chain integration. The existing app's chain work cannot be counted as a new Session A implementation.

## 3. Long-term collector — 6.6 / 10

Method: inspect collection saturation, duplicates after roster completion, full-set acquisition, irreversible actions and item distinctiveness using the 90-account simulation.

1. **Twelve cats saturate quickly. Residual:** casual collects 82.78%, heavy 93.33% by day 30. This is a prototype roster, not a retention forecast. Extend distinct kits/encounters before live operation.
2. **Duplicates could become dead inventory. Fixed:** matching shards ascend favourites; after five stars, 10 shards exchange for one capped essence. Tradeable conversion does not exist.
3. **Gear rarity could be only larger numbers. Addressed:** legendary shelter/ultimate-efficiency/healing properties change behavior; properties deduplicate. Only three property families exist, so variety remains limited.
4. **Random gear could block a set. Fixed:** deterministic rare sewing/epic tailoring, shared non-weapon slots, exact equip previews and chosen reforge. Median first rare four-piece set is day 3/2/1.
5. **Accidental salvage/reforge can erase investment. Covered:** equipped/locked/favourite checks are atomic; salvage never refunds enhancement. B added confirmation UI. No gear trading or persistent recovery is promised.

## 4. Economy director — 7.5 / 10

Method: audit formulas, effect-hit utility, all faucets/sinks, cap boundaries, golden-design dependency, gacha conditional odds and seeded cohort outcomes.

1. **An effect-hit stat had no useful headroom. Fixed:** ordinary enemy resistance is 10%; starters apply at 85%, four Moonwick pieces at 93%. A paired 400-seed action test shows additional successful casts without extra turns. Fresh combat holdout remains 61.75%/61% Auto versus 84.75%/87% active.
2. **Threads accumulated while fish blocked spending. Fixed:** chosen pantry supplies consume 10 threads plus a key, which can be mended for 40 threads. Heavy end balance falls from 1,876.4 in the previous trial to 142.93. Old trial retained; final trial also includes effect tuning, so this is not an isolated causal experiment.
3. **Heavy play could dominate weekly progress. Met in measured scenarios:** worst cohort-mean weekly currency/XP/pull ratio is 2.3631. This is not a universal bound across unlucky individual accounts or an anti-bot guarantee. Reward caps are a design mechanism; local day remains editable.
4. **A valuable design might indirectly require gacha. Tested separately:** zero-draw real 30-day runs at all three styles earn Golden Maneki eligibility. Recipe resources have deterministic service/quest/boss sources. Three examples prove reachability, not a population success rate.
5. **Base odds hide pity's actual issuance. Disclosed:** 1% base legendary; exact renewal calculation gives mean 37.5376 pulls and 2.6640% long-run legendary frequency including pity. Simulated 30-day means are 1.17/2.17/2.23 legendary cats. Future economy changes require re-running this analysis; rarity does not establish monetary value.

## Five weakest remaining areas, overall

1. Only three independent hero kits and one playable chapter.
2. No persistent/authenticated progression or authoritative global scarcity enforcement, by explicit scope.
3. No human comprehension, fun, balance or retention study.
4. Small collectible roster and only three legendary property families.
5. Per-game research details beyond the cited mechanisms are not a current live-game audit; exact popularity/market value was not measured.

Final API hygiene also removed the mutating internal item builder from the public entry point; fixture/simulation tools import it explicitly as an internal draft helper. Contract 0.4.0 preserves all UI actions and previews; callers regenerate in-memory fixtures.

The highest fixable systems defects (reward mismatch, useless effect-hit, excess threads, weak evidence scoping and a loss masquerading as a victory fixture) were corrected before freeze. Content production and authorized online operations cannot be inferred from this local deliverable.

## Integration regression follow-up

B #11 found that the extensionless new type import into the shared turn types broke the repository Deno import-map guard. The fix imports Rarity and Stats from the explicit `.ts` contract path. All 18 function graphs resolve, the four existing Deno graph regressions pass, and game-rules typecheck passes. Contract 0.4.0 and runtime behavior are unchanged; no server or contract changes. Evidence: `evidence/deno-integration-fix.json`.
