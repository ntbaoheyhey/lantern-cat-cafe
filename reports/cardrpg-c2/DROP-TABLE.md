# B4b — drop and recruit audit

Pre-tuning audit, 12 November 2026. All rates below describe the inherited C2/A6 rules before economy tuning. Counts are gross creation; salvaging does not erase issuance. Random rewards use seeded public rules, with no paid currency. Final values and measured supply will replace the pending column after B4b.

| Source | Item / rarity | Rate or amount before tuning | Pity / cap | Duplicates / overflow |
|---|---|---|---|---|
| Ordinary encounter | Chapter-eligible gear | Common 65%, Rare 30%, Epic 5%, Legendary 0% | First six eligible wins across all modes/day | Separate usable gear; full 240-piece shelf converts to rarity salvage within daily thread cap |
| Elite encounter | Chapter-eligible gear | Rare 70%, Epic 27%, Legendary 3% | Same shared six-drop cap | Same as ordinary |
| Boss encounter | Chapter-eligible gear | Rare 20%, Epic 70%, Legendary 10% | Same shared six-drop cap | Same as ordinary |
| Daily route | Gear and route currencies | Encounter table by node kind; win 90 fish, 18 threads, 40 stamps, 2 essence; loss 30/6/10/0 | One rewarded daily identity; six rewarded routes/day and shared currency caps | No extra daily-only roll |
| Tower floor | Gear and route currencies | Encounter table by floor node kind; route rewards as above | Once per floor reward identity, plus shared drop/route/currency caps | No separate random chest |
| Tower chests | Stamps / threads | At configured milestone floor f: 50+2f stamps, 10+f threads | One claim per milestone; capped preview preserves unclaimed reward when no currency room | Deterministic |
| Campaign first clear | Materials / currencies | Chapter 1/2/3: 80/100/120 materials; 120 fish, 80 stamps, 4 essence | Once per chapter; currencies use shared daily caps | Deterministic |
| Rewarded route | Mastery material | 2 × visited nodes + 5 on victory | 30 materials/day; six rewarded routes/day | Stack persists |
| Rewarded boss/route victory | Boss seal | One seal and dated effort identity | At most one/day; Tower requires a fifth floor for boss quest progress | Spending consumes the corresponding proof identity |
| Standard cat invitation | Common/Rare/Epic/Legendary cat | 60/30/9/1%; 60 stamps each | Soft pity on draw 13, +7 pp/step; Legendary by draw 24; separate banner groups; 30 draws/day | Unowned preferred in rolled rarity; duplicates give 2/5/12/25 shards |
| Featured cat invitation | Same rarity table; Marigold | On Legendary: 50% featured, or 100% after a featured miss | Featured guarantee separate from rarity pity | Unowned protection applies inside the selected featured group |
| Gear invitation | All-catalog gear | 55/34/10/1%; 60 stamps each | Soft 13, hard 24, +7 pp/step; separate gear pity | Missing template preferred in rolled rarity; duplicate is usable/salvageable gear; full batch requires shelf room |
| Welcome invitation | One standard companion draw | Current standard cat odds; stamps refunded | Once/account; advances recruit counter and consumes a daily invitation; no selector marks | Same unowned preference and duplicate shards as standard recruit |
| Selector | Chosen cat or gear | 100%; 24 earned invitation marks | Gear requires source chapter; Legendary additionally requires that chapter mastery | Unowned cat required until collection complete; owned cat gives rarity shards; gear is a usable instance |
| Gear tailoring | Chosen template, seeded affix rolls | 100%; Rare/Common 180 fish + 30 threads; Epic 120 fish + 180 threads + 5 essence; Legendary 500 fish + 100 threads + 20 essence | Source chapter; Legendary needs Pantry clear, 20 materials and one unspent boss seal | Usable gear; cannot overflow shelf |
| Legacy gear recipes | Chosen Rare/Epic template | 100%; config recipe costs | Source chapter and shelf room | Usable gear; conversion into Depth gear is recorded |
| Salvage | Threads | Common/Rare/Epic/Legendary: 2/5/12/25 | Only unequipped gear; instance is consumed | Deterministic currency recovery; explicit salvage currently bypasses daily earned cap |
| Reforge | Chosen compatible replacement affix | 100%; 90 fish + 15 threads; replacement roll at tier minimum | Existing affix and legal slot required | Deterministic replacement, no new gear |
| Pantry forge | Key / finite supply | 100%; key 40 threads; chosen supply one key + 10 threads | Key stack 99; supply stack 20 | Full stacks reject before spending |
| Ribbon forge / chapter journal | Cosmetic Cafe Ribbon | 100%; forge 10 essence + 20 threads, or three-chapter milestone | One owned ribbon | Duplicate rejected; already-owned journal reward is 20 capped threads |
| Local edition reservation | Moon Collar / Golden Maneki | 100% when eligible; three / ten distinct boss-day proofs | Lifetime 2400/360; season 400/60; one/account/season; eligibility and local ledger only | Reservation cannot reuse consumed proofs; no automatic on-chain mint |
| Daily tasks | Stamps and fish/threads | Each task 20 stamps; patrol/recruit/gear also 30 fish; tips/train also 5 threads | Once/task/day; shared currency caps | Deterministic |
| Login gifts | Currencies | Seven published gifts: 100F+40S; 100S+15T; 120F+20T; 100S+3E; 150F+30T; 150S; 180S+6E | One/day, seven onboarding gifts, shared caps | Deterministic |
| Weekly task chests | Stamps / threads | At 10/20/30 points: 4×points stamps and points threads | One per weekly chest; shared caps | Deterministic |
| Quest board | Currencies, XP, Pantry Key | Exact QUESTS config; weekly three wins includes one key | Daily/weekly/achievement identity; reward previews enforce stack and currency room | Deterministic; full claims remain available |
| Star rewards / journal | Currencies and ribbon | Three stars: 30 stamps; nine: 20 threads; eighteen: 40 stamps; journal uses MILESTONES_V4 | One per goal; shared caps | Deterministic |
| Idle / fast reward | Fish, threads, stamps | Per minute: 1+0.08×stage fish, 0.15+0.01×stage threads, 0.25+0.015×stage stamps | Idle 12h, claim ≥10min; two fast 60min rewards/day; all shared caps | Deterministic; rejected capped claim does not consume entitlement |

Shared C2/A6 daily currency ceilings before tuning: 420 fish, 90 threads, 360 stamps, 6 essence. Starter balances and salvage must be counted separately from capped income. Gear rarity selects a uniform eligible template after collection protection where applicable; it does not promise a specific item.

Code owners: `depth/equipment.ts`, `depth/gacha-v4.ts`, `depth/run.ts`, `depth/daily-a6.ts`, `depth/idle-a6.ts`, `depth/tower-a6.ts`, `depth/meta-v4.ts`, `depth/journey-v4.ts`, `depth/editions-v4.ts`, `cardrpg/config.ts` and `cardrpg/catalog.ts`.

CHAIN policy at READY b6712694557c06161ccc6cdd54099d8bc8b22f71 permits only Epic/Legendary gear in the three legacy sets (hearthloom, moonwick, mossbrew), explicitly named relics, and the one-time authoritative Star Thread fixture. Other five Depth sets, ordinary gear, routine materials, keys, supplies, currencies and cats are bound or unknown and fail closed. Report all item creation, then filter eligible template IDs; do not label total Epic+ output as tradable output. Browser saves cannot authorize ordinary campaign seals. Production campaign issuance remains zero until a trusted progression adapter exists.

Measurement running: 30 days × 200 seeds × three play profiles; per-item weekly gross supply, sink ratios, day-to-rarity curves, and paired-seed item win-rate comparisons. The nine-source research and design targets are recorded in DECISIONS.md.

Inherited B3 audit finding: full-shelf automatic drops could award zero threads at the earned cap. The current C2 candidate now recovers the same useful rarity salvage amount as manual salvage; the regression passes. The table above preserves the pre-tuning audit at B2 3126240bf.

Working C2 candidate: encounter Legendary rates0/0.05/0.15% (ordinary/elite/boss); gear invitation300stamps with unchanged soft13/hard24; Legendary tailoring10seals/200materials plus100fish/300threads/60essence; Epic tailoring20fish/240threads/9essence; Legendary gear selector72marks. All live source Odds read these tables. Full measurement and item-impact repair remain pending; no acceptance claim.

## Link source and policy repair — frozen validation

Corrected runtime `c7b8656e3c02f9ec14af1152a137efccd1202faa04943828aef43eafdff3f366`. All15 previously failed cells pass on the original100 paired seeds95001–95100 (maximum absolute movement6pp) and on the predeclared independent1,000-seed holdout97001–98000 (maximum6.4pp). This is targeted evidence, not the full-catalog acceptance. Keep all earlier failed samples and incomplete pre-fix economy output.

| Item / wearer | Holdout change (pp) | Paired 95% interval (pp) |
|---|---|---|
| hearthloom-outfit-common / mochi | 2.0 | 0.59–3.41 |
| hearthloom-charm-common / mochi | 1.1 | 0.01–2.19 |
| hearthloom-relic-common / mochi | 3.4 | 1.90–4.90 |
| hearthloom-relic-common / soot | -0.6 | -1.38–0.18 |
| hearthloom-relic-rare / mochi | 4.8 | 3.19–6.41 |
| hearthloom-relic-rare / soot | -0.5 | -1.31–0.31 |
| hearthloom-outfit-epic / mochi | 5.2 | 3.37–7.03 |
| hearthloom-charm-epic / mochi | 5.1 | 3.30–6.90 |
| hearthloom-relic-epic / mochi | 4.7 | 2.77–6.63 |
| hearthloom-weapon-legendary / mochi | 3.6 | 1.29–5.91 |
| hearthloom-outfit-legendary / mochi | 6.0 | 3.92–8.08 |
| hearthloom-charm-legendary / mochi | 6.4 | 4.36–8.44 |
| bellsteel-weapon-common / panko | 2.0 | 0.34–3.66 |
| bellsteel-weapon-rare / panko | 2.2 | 0.57–3.83 |
| bellsteel-weapon-epic / panko | 2.5 | 0.88–4.12 |

Prospective final cohorts use this exact runtime: every128 templates ×48 cells ×100 paired seeds95001–95100;30days ×3 profiles ×200 account seeds90001–90200; model80001–80500 and real UI80001–80005 at1,800seconds. No configuration values change during these cohorts. Prior balance measurements stay labeled pre-link-fix.
