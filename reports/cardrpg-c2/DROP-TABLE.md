# B4b — drop and recruit audit

Pre-tuning audit, 12 November 2026. All rates below describe the inherited C2/A6 rules before economy tuning. Counts are gross creation; salvaging does not erase issuance. Random rewards use seeded public rules, with no paid currency. The historical audit is preserved below; final frozen values are listed separately. The completed 600-account monthly projection and exact READY supply are now published in ECONOMY.md and OUTBOX.md; historical measurements below remain labeled.

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

## Final frozen C2 source tables

Runtime `4e68bb5977dfd04657aada154793a2bc1513811b3b48ecd183af9d8dd57f69a1`; no further table changes during the final cohorts. Sources not changed below retain the amounts, caps and guarantees in the historical audit above.

| Source | Final Common / Rare / Epic / Legendary odds or cost | Guarantee / duplicate treatment |
|---|---|---|
| Ordinary encounter | 65 / 30 / 5 / 0% | Shared first six eligible wins/day; after the cap all drop chances are zero |
| Elite encounter | 0 / 72 / 27.95 / 0.05% | Same cap; uniform eligible template within rarity |
| Boss encounter | 0 / 29.85 / 70 / 0.15% | Same cap; daily and Tower encounters use their actual node kind |
| Gear invitation | Base 55 / 34 / 10 / 1%; 300 stamps | Soft pity starts at 13; hard Legendary cap 24; current odds read the saved counter; missing templates preferred |
| Standard / featured companion invitation | Base 60 / 30 / 9 / 1%; 60 stamps | Same 13/24 rarity pity; featured 50%, then 100% after featured miss; duplicates yield 2/5/12/25 shards |
| Legendary gear selector | 72 marks | 100% chosen eligible template; chapter/mastery requirements retained |
| Other selectors | 24 marks | Existing chosen-item rules and useful duplicate conversions retained |
| Common / Rare tailoring | 180 fish + 30 threads | 100% chosen template; published uniform integer affix ranges |
| Epic tailoring | 20 fish + 240 threads + 9 essence | 100% chosen template; source chapter and shelf space required |
| Legendary tailoring | 100 fish + 300 threads + 60 essence + 200 mastery materials + 10 distinct boss seals | Pantry clear, legal template and shelf space; receipts consumed once |
| Legacy gear forge | Same corresponding C2 tailoring price | Cannot bypass the C2 cost table |
| Full-shelf automatic drop conversion | 2 / 5 / 12 / 25 threads | Uses normal rarity salvage even when capped earned-thread income is full; gross gear creation remains counted |
| Manual salvage | 2 / 5 / 12 / 25 threads | Consumes one unequipped instance; no extra gear created |

Every source's Odds popover is driven by live public preview functions or deterministic reward amounts. Displayed content uses numbers/symbols with descriptive accessibility labels; exact template probabilities, exhausted caps and the current hard-pity remainder remain inspectable. Unit/E2E checks passed on the final candidate; the 33 screen budgets still pass.

The latest CHAIN READY `394cf60613b5b576367e860b7dff8bab60dc84aa` expands catalog coverage to all 128 Depth templates, including 64 Epic/Legendary tradable template IDs. Final supply will use that exact catalog, replacing the older three-set policy only for eligibility classification. Normal campaign saves remain untrusted; eligible creation never authorizes a mint. Routine rare/limited materials remain bound unless explicitly listed; one-time Star Thread stays separate.

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

## Complete corrected catalog screen

All128 templates ×48 crew/context cells ×100 paired seeds95001–95100 completed on frozen c7b8656e runtime:6,144 cells,12 exceed the12pp absolute-impact threshold, maximum18pp. Saturated cells:4,608 before/4,524 after; these do not establish balance by themselves. All12 failed cells are being independently remeasured on the predeclared1,000 seeds98001–99000. Keep the full screen separate from the holdout; no acceptance claim from the first few holdout cells.

The predeclared independent holdout is complete (all12 cells ×1,000 seeds98001–99000). Seven Hearthloom cells measure2.4–5.8pp. Five Crumbweave/Bellsteel cells still miss12pp; worst16.1pp. No item-impact acceptance.

| Item / wearer (fourth piece, L6, chapter3 boss) | Original100 paired seeds | Independent1,000 | Paired normal95% interval |
|---|---|---|---|
| crumbweave-weapon-legendary / soot | 14.0pp | 13.0pp | 9.50–16.50pp |
| bellsteel-outfit-epic / panko | 14.0pp | 14.0pp | 10.67–17.33pp |
| bellsteel-charm-epic / panko | 16.0pp | 15.9pp | 12.55–19.25pp |
| bellsteel-outfit-legendary / panko | 15.0pp | 15.0pp | 11.69–18.31pp |
| bellsteel-charm-legendary / panko | 18.0pp | 16.1pp | 12.74–19.46pp |

Intervals are diagnostic paired normal approximations. They do not establish universal bounds or replace the original sample. Before any further table changes, isolate the contribution from stats versus set/unique effects in these five remaining cells. Keep the frozen600-account economy cohort running as evidence for this measured candidate.


## Affix and equipment Riposte candidate — independent union holdout

Frozen runtime `4e68bb5977dfd04657aada154793a2bc1513811b3b48ecd183af9d8dd57f69a1`. Halved C2 affixScale0.5→0.25 and capped equipment Bellsteel Riposte at the first Defend per encounter. Native Panko Riposte, legacy replay behavior, main-stat budgets and B4 enemy tables stay unchanged. Mechanism ablation and every earlier screen remain preserved.

The predeclared union of15 previous and12 current failed cells contains27 distinct cells. All27 completed exactly1,000 paired seeds99001–100000 with no early stopping:0 point-estimate misses, maximum absolute movement9.3pp. This targeted holdout does not replace the full6,144-cell screen, which remains running. Confidence intervals are diagnostic paired normal approximations; a point estimate below12pp is not proof of a universal effect bound.

| Item / wearer / context | Change (pp) | Paired95% interval (pp) |
|---|---|---|
| hearthloom-outfit-common / mochi / fourth L6 C3 6-0 | 1.6 | 0.16–3.04 |
| hearthloom-charm-common / mochi / fourth L6 C3 6-0 | 1.3 | 0.18–2.42 |
| hearthloom-relic-common / mochi / fourth L6 C3 6-0 | 1.7 | 0.28–3.12 |
| hearthloom-relic-common / soot / fourth L6 C3 5-0 | -0.7 | -1.60–0.20 |
| hearthloom-relic-rare / mochi / fourth L6 C3 6-0 | 2.3 | 0.75–3.85 |
| hearthloom-relic-rare / soot / fourth L6 C3 5-0 | -0.9 | -1.84–0.04 |
| hearthloom-outfit-epic / mochi / fourth L6 C3 6-0 | 3.4 | 1.66–5.14 |
| hearthloom-charm-epic / mochi / fourth L6 C3 6-0 | 4.1 | 2.47–5.73 |
| hearthloom-relic-epic / mochi / fourth L6 C3 6-0 | 2.6 | 0.90–4.30 |
| hearthloom-weapon-legendary / mochi / fourth L6 C3 6-0 | 0.5 | -1.47–2.47 |
| hearthloom-outfit-legendary / mochi / fourth L6 C3 6-0 | 3.8 | 2.02–5.58 |
| hearthloom-charm-legendary / mochi / fourth L6 C3 6-0 | 4.0 | 2.31–5.69 |
| bellsteel-weapon-common / panko / fourth L6 C3 5-0 | 2.9 | 1.08–4.72 |
| bellsteel-weapon-rare / panko / fourth L6 C3 5-0 | 3.1 | 1.30–4.90 |
| bellsteel-weapon-epic / panko / fourth L6 C3 5-0 | 3.4 | 1.62–5.18 |
| hearthloom-charm-rare / panko / fourth L6 C3 6-0 | 2.2 | 0.17–4.23 |
| hearthloom-outfit-epic / panko / fourth L6 C3 6-0 | 2.8 | 0.66–4.94 |
| hearthloom-charm-epic / panko / fourth L6 C3 6-0 | 3.2 | 1.04–5.36 |
| hearthloom-relic-epic / panko / fourth L6 C3 6-0 | 2.1 | -0.05–4.25 |
| hearthloom-outfit-legendary / panko / fourth L6 C3 6-0 | 3.4 | 1.24–5.56 |
| hearthloom-charm-legendary / panko / fourth L6 C3 6-0 | 3.4 | 1.24–5.56 |
| hearthloom-relic-legendary / panko / fourth L6 C3 6-0 | 2.4 | 0.24–4.56 |
| crumbweave-weapon-legendary / soot / fourth L6 C3 6-0 | 7.9 | 4.86–10.94 |
| bellsteel-outfit-epic / panko / fourth L6 C3 6-0 | 6.0 | 3.22–8.78 |
| bellsteel-charm-epic / panko / fourth L6 C3 6-0 | 6.9 | 4.13–9.67 |
| bellsteel-outfit-legendary / panko / fourth L6 C3 6-0 | 6.2 | 3.40–9.00 |
| bellsteel-charm-legendary / panko / fourth L6 C3 6-0 | 9.3 | 6.39–12.21 |

Raw candidate holdout: `/Users/bao/Documents/Codex/2026-11-12/files-pasted-by-the-user-paste-9/work/c2/item-affix-holdout.json`. New600-account monthly projection and500model/fiveUI progression cohorts use the same runtime. The superseded monthly cohorts remain partial diagnostics: loot-set416accounts and loot-link329accounts at resume; completed accounts/runtime files retained, processes terminated to free CPU.


## Affix/Riposte candidate — complete catalog screen

Frozen runtime 4e68bb5977dfd04657aada154793a2bc1513811b3b48ecd183af9d8dd57f69a1. All128 templates and6,144 cells completed100 paired seeds95001–95100. Four point-estimate misses remain at13pp; the screen is not a pass. Preserve the27-cell independent union holdout separately (maximum9.3pp). The predeclared follow-up measures every newly failed cell on exactly1,000 independent seeds100001–101000, without early stopping or table changes.

| Item | Wearer/context | Screen impact |
|---|---|---|
| mossbrew-weapon-common | soot / fourth L6 C3 6-0 | 13pp |
| mossbrew-weapon-rare | soot / fourth L6 C3 6-0 | 13pp |
| mossbrew-weapon-epic | soot / fourth L6 C3 6-0 | 13pp |
| crumbweave-weapon-legendary | soot / fourth L6 C3 6-0 | 13pp |


## Candidate full-catalog follow-up — independent holdout

All four failures from the completed candidate catalog screen were measured on exactly1,000 independent paired seeds100001–101000 using the same frozen runtime. No early stopping or table changes. All four follow-up point estimates meet12pp; the original100-seed screen retains four13pp misses and is not relabeled as a pass.

| Item | Screen impact | Holdout impact | Paired95% interval |
|---|---|---|---|
| mossbrew-weapon-common | 13pp | 4.7pp | [2.598994221502168, 6.8010057784978315]pp |
| mossbrew-weapon-rare | 13pp | 4.8pp | [2.6907284284467865, 6.909271571553213]pp |
| mossbrew-weapon-epic | 13pp | 4.6pp | [2.507311038139903, 6.692688961860097]pp |
| crumbweave-weapon-legendary | 13pp | 11pp | [7.988122544689808, 14.011877455310193]pp |

All cells use Soot/fourth equipment slot/level6/chapter3/node6-0. These sample estimates and approximate intervals do not establish a universal item-effect bound. Earlier screens and the27-cell holdout remain separate. Raw evidence: session9 work/c2/item-affix-catalog-holdout.json.


## Completed monthly acceptance

All600accounts×30days on frozen4e68bb59 completed and exported on 2026-11-12T12:56:18.145352+00:00. See [ECONOMY.md](ECONOMY.md) for rarity, bag and all currency ratios, and [OUTBOX.md](OUTBOX.md) for every Epic+/material weekly rate. Final source tables and all item-impact samples above are unchanged. Self-score7 remains due to the four13pp screen cells and unresolved Crumbweave interval; the once-returned item repair was fully remeasured, not treated as universal acceptance.


## Reopened pass5 — independent historical fixture panel

Runtime `c9f7f596a2c0ab3dd3d5b08cfe47e772b1c2b1c5c87b7472403ddb2bcbad2585`; all 30 previously failed fixtures measured on the predeclared 1,000 paired seeds 101001–102000. The completed panel has three misses: Bellsteel Epic charm/Panko/fourth slot +14.1pp, Legendary charm +14.2pp, Legendary outfit +12.8pp, all chapter3/level6/boss. Their marginal paired 95% intervals are 11.28–16.92, 11.36–17.04 and 10.02–15.58pp. Compact evidence: [PASS5-HISTORICAL-HOLDOUT.json](PASS5-HISTORICAL-HOLDOUT.json).

The full 128-template screen remains in progress. After completion, every new failed fixture outside this panel receives the same fixed seed range in a disjoint panel. These samples are not pooled. Diagnose all misses before selecting another prospective table candidate; a diagnostic on these observed seeds is not fresh acceptance evidence.

The complete pass5 screen now contains all128 templates/6,144 cells with100 pairs each:18 original sample misses, maximum24pp. The historical30-cell panel overlaps exactly one screen miss; the declared additional17-cell panel on101001–102000 is running. Their47-cell union covers every historical/current failed fixture without pooling outcomes. See [PASS5-ITEM-SCREEN.json](PASS5-ITEM-SCREEN.json).

Candidate6 is prospective: C2 HP main-stat weight0.4; Bellsteel grants its first Riposte without equipment Shelter; Rain Bell removes one debuff stack per swap. Numeric limits and live text share the same C2 tables; legacy rules retain their previous behavior. Reused-screen diagnostics do not replace the predeclared fresh47-cell panel on102001–103000 or the next complete catalog screen.

## Completed pass5 disjoint panel

2026-11-12T14:00:49.013733+00:00. All17 new failed fixtures completed1,000 paired seeds101001–102000; all17 exceed12pp (13.4–23.6pp). Together with historical30 panel,20/47 misses. Runtime matches exactly; panels are disjoint and cover all18 screen misses plus all30 historical fixtures. Evidence: PASS5-NEW-HOLDOUT.json. Candidate6 reused100-pair diagnostic has4/47 misses (one+15pp, three−13/−14pp), retained as diagnostics. Continue the declared full6,144-cell screen and fresh47-fixture holdout before any acceptance.
