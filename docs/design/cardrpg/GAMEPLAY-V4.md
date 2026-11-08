# Gameplay v4 — build an evening shift, see it work
REFERENCE: RESEARCH-GAMEPLAY-V4.md; RESEARCH-V4-EQUIPMENT.md; sources.json; NFT-VALUE-SPEC.md; reports/cardrpg-big/a4/G0-AUDIT.md; reports/cardrpg-big/memory/PROMPT-A4.md.

Status: implementation specification, 2026-11-07. Numbers below are authored hypotheses and acceptance targets, not measured v4 outcomes. Research is committed at 7cac3f43 before this specification. G0 source/gear/timing receipts exist; the complete level curve and 45-day baseline are still queued against immutable BEFORE source bytes. No claim of independent human playtesting.

## Product and compatibility contract

The player recruits three cats, assigns a front/rear formation and a standing plan, equips a coherent shift, chooses a route, watches an automatic encounter, and uses its explanation to improve the next preparation. During a fight, only speed, pause, skip and camera are player inputs. No skill selection, targeting, consumables, energy, break, flavour advantage or manual-play reward exists in the v4 resolver. Existing four-skill kits unlock through progression; none is chosen as a three-skill loadout.

One explicit rules flag `gameplayV4` lives in cardrpg. Its absent/false path retains the existing resolver, RNG order, serialization and numerical constants. It is carried into each new battle's setup and replay. Runtime defaults stay OFF; the main offline demo explicitly opts ON. Other demos do not inherit ON merely because they are offline. Existing in-progress encounters retain the mode in their stored setup until settled. Changing the next-run mode never rewrites an existing battle.

Keep the legacy `0.7.0` battle contract for OFF snapshots; add optional versioned v4 data only for ON accounts/setups. Save envelope `THC8` stores the extension; importer accepts raw legacy accounts and THC5/6/7/8. OFF export of legacy-only state remains THC7. The extension stores formation plan, loadouts, selector points, collection milestones and local issuance state. Migration validates defaults and preserves balances/items/replay snapshots; it never grants historical selector points or duplicates a claim. Loading a v4 save with mode OFF preserves its extension without applying new combat rules. Tests compare old save round trips and replay digests in both modes. The old checksum remains corruption detection, not authentication.

| Cadence | Player decision | Reward / endpoint | Target |
|---|---|---|---|
| Minute | Claim shift, inspect enemy, move a cat, compare one piece | One visible useful change | 30–90 seconds for a claim/build visit |
| Session | Prepare → automatic fight → route choice → reward | Several observations and one route settlement | 5–10 minutes; pause/leave without penalty |
| Day | Earn two shift claims, complete a feasible board, spend/save stamps | Existing shared daily caps | Casual 1 route/1 claim; heavy 6 routes/2 claims |
| Week | Existing three-win quest and rotating challenge | Earned milestone, optional harder matchup | No lost streak or attendance requirement |
| Season | Reserve eligible edition after recorded effort | Prestige record, no combat bonus | UTC monthly edition; lifetime issuance never resets |

## 1. Formation, crew jobs and standing plans

Keep three slots and two rows, with at least one living starting front-row cat. Click/keyboard placement is sufficient; no drag-only interaction. Ordinary hostile single-target pressure selects the front row while it lives; explicit piercing/healer-hunting enemies retain their displayed exception. Rear cover reduces ordinary single-target direct damage by 10% while a front cat remains. Row-wide attacks, damage over time and explicit pierce ignore cover. Shelter can redirect ordinary single-target attacks; it does not redirect row-wide effects. These rules appear on Prepare before Fight.

Each cat contributes two marks to its primary crew job and one to its secondary. A threshold needs at least two distinct contributing cats. At 2 marks activate the small effect; at 4 marks replace it with the larger effect (do not add both). This makes four reachable with three cats without a single cat activating its own synergy. Crew jobs are not elemental weaknesses.

| Cat | Primary / 2 marks | Secondary / 1 mark | Useful matchup hypothesis |
|---|---|---|---|
| Mochi | Door team | Kettle team | Front pressure and ally protection |
| Panko | Door team | Table team | Repeated small hits and counters |
| Brioche | Door team | Lantern team | Shield stripping and sustained pressure |
| Clover | Kettle team | Door team | Damage over time and recovery |
| Cinnamon | Kettle team | Table team | Focused rescue and one revival |
| Marigold | Kettle team | Lantern team | Team-wide attrition |
| Soot | Table team | Lantern team | Marked targets and stored damage |
| Mallow | Table team | Door team | Shielded rows and damage over time |
| Biscuit | Table team | Kettle team | Low-health priority and front offense |
| Sorrel | Lantern team | Kettle team | Dangerous rear utility and shield transfer |
| Inkcap | Lantern team | Door team | Utility suppression and decoys |
| Velvet | Lantern team | Table team | Rear reach and cleanup |

| Crew | 2 marks | 4 marks | Tradeoff |
|---|---|---|---|
| Door team | 3% maximum HP | 6% maximum HP; 8 opening shield per front cat | Survival, little burst |
| Kettle team | 4% effective healing | 8% effective healing; first cleanse adds 8 shield | Weak where little healing is needed |
| Table team | 3% direct attack | 6% direct attack; +3 raw damage to marked foes | Requires offensive support |
| Lantern team | 4% effect accuracy | 8% effect accuracy; first utility suppression heals its user 8 | Weak against pure attackers |

All percentages enter the utility score and matched-power fixture normalization. No crew trait changes currency, gacha odds or collectible eligibility. Sim tuning may revise magnitudes in a versioned table, preserving distinct roles. Required synergy gain is 10–25 percentage points against a random legal team of the same displayed power on mixed intended content; a best-team-only cherry-picked boss is insufficient.

Two standing settings are stored before combat: **Focus** (`finish`: lowest reachable HP fraction; `support`: healer/shielder/summoner first; `leader`: boss first) and **Care** (`steady`: normal rescue at <45% HP; `protect`: rescue preference at <65% HP). They weight legal choices in the existing one-action deterministic AI; they never bypass target reach, cooldown, fallen-target or ownership rules. Ties use stable skill and target IDs. Extra protection can sacrifice damage; support focus can delay a boss kill. The default is finish/steady.

Prepare shows enemy names, role, row, opening intent, special target exception and one counter hint beside editable rows and the two settings. It shows crew marks and distinct contributors together (for example, "3/4 marks ·2 cats; small effect active"), plus the effect added or lost by a change. It labels five-seed simulation as a rough build hint, never a promised win percentage. First-node preparation may replace cats from the collected roster before any action; later preparation changes rows/plans only, preserving each cat's carried health. Roster/gear changes during an active route require ending that route, avoiding free healing through bench rotation. Fight atomically commits the setup. Editing after an action, during playback or in a replay is rejected by rules, not just disabled in UI. Repeated edits preserve carried HP/statuses, encounter seed/enemies and RNG provenance; neither reroll nor healing is a preparation side effect.

Result presents up to three observed contributions and one practical next adjustment: cover damage prevented; shield absorbed; effective healing; utility suppressed; target chosen by the standing plan; active crew and relevant gear trigger. Text says what happened, not that a single event proves the win. Preview AI clones must never append events to the real battle or mutate its v4 counters.

## 2. Remove rejected mechanics without invalidating old content

ON skills use existing attack/support/status identities, cooldowns and complete unlocked kits. Resource-cost and charge checks are absent. Ultimates use a fixed opening delay of two own turns and their documented cooldown (four or five own turns depending on kit); there is no replacement meter. Basic/ordinary skills remain available when legal. `wait` is not a legal ON action; Defend remains an automatic survival choice.

| Historical feature | ON replacement, with source IDs preserved for saves |
|---|---|
| Shared energy costs/refunds, enemy energy theft | Costs/refunds removed; explicit energy skill effects grant a small immediate shield to the most injured eligible ally (6 shield per former point, max18/action); enemy theft becomes a direct 6 shield removal |
| Energy-generating Sorrel passive | 6 shield to the weakest ally on odd rounds |
| Break accumulation, flavour wheel, break-trigger interrupts | No accumulation or advantage; break effects apply a bounded single Rattled debuff through normal accuracy; Tangle reduces direct attack by 4% per stack instead |
| Energy/charge/break affixes | Existing IDs map to opening shield, effective healing or marked-target damage; exact replacement appears in comparison text; no hidden counters or meters |
| Charge-based ultimates and charge refunds | Fixed opening delay/cooldown; gear refunds become bounded heals/shields; no modification of action count |
| Energy/break run charms and thin-pot modifier | Original IDs retained; v4 descriptions and effects become shield/heal/marked utility. Thin pot becomes Small cups: healing reduced10%, opening party shield12 |
| Energy/break words in Field guide / equipment / skill text | Use mode-aware descriptions everywhere; historical text remains only in OFF/research history |

No change to protected Relic/Fuji bridge behavior. Existing held Relic effects remain a separate legacy path, and v4 edition reservations never connect to it. Item-power claims about v4 editions use zero added combat stats and paired tests; this is not a new promise about legacy Fuji holdings.

## 3. Equipment: four slots, eight jobs, bounded effects

Retain weapon/utensil (attack), outfit/apron (HP), charm/clasp (defense), relic/keepsake (HP). This ordinary keepsake slot is account-bound equipment, distinct from an NFT edition. Four gameplay rarities are enough; no new Uncommon collection wall. Keep 128 templates, 8 sets, 2/4-piece thresholds, +12 guaranteed enhancement and a selected compatible affix reforge. Item level describes its source tier independently of enhancement and character level.

Initial ON main-stat multipliers over each template's corresponding common base: Common1.00, Rare1.25, Epic1.50, Legendary1.75. Use the same slot base across sets; identity comes from effects, not a hidden stat advantage. Existing low/high affix rolls remain clamped; enhancement adds6% of the item's base per rank, at most72%. Runtime scaling is relative to the cat's naked level stats to prevent high-level saturation; each slot's complete base-plus-enhancement contribution is capped at8% of naked personal stat budget. Team-level displayed contribution must remain≤10% per piece, including utility. Do not clamp the display alone to hide an oversized item.

Rarity adds 0/1/2/3 selected-role affixes; Legendary adds one bounded unique behavior. A higher tier at equal enhancement has no lower main stat and retains the corresponding lower tier's relevant baseline role. Reforge chooses one different compatible affix and rolls its guaranteed minimum:90 fish/15 threads, no failure. Enhance costs30×(next rank)^2 fish and3×next rank threads. Salvage returns2/5/12/25 threads by rarity; equipped gear cannot be salvaged. Targeted tailoring retains existing recipes (rare180 fish/30 threads; epic120 fish/180 threads/5 essence; legendary500 fish/100 threads/20 essence plus20 mastery materials/1 seal and Pantry clear). Costs shown before commit; failure leaves all resources/IDs unchanged.

| Set | Two pieces | Four pieces | Intended niche / weakness |
|---|---|---|---|
| Hearthloom | Defend adds12 shield | Defend links a weak ally, at15% shared damage | Front slams; weak against damage over time |
| Moonwick | +3 marked-target direct damage | First marked hit each round heals user6 | Single marked leader; poor unmarked swarm |
| Mossbrew | Healing cleanses one debuff once per own turn | First Steep application per encounter grants one Cozy (P6 training revision) | Attrition; slower burst |
| Rainlace | Row swap shields both cats12 | Rear cats heal6/round | Row threats; less front offense |
| Crumbweave | Every third attack plants one Crumb | Detonation shields user8, once per turn | Stored damage; weak without setup |
| Bellsteel | Riposte adds3 damage | Defend adds one Riposte and Shelter | Repeated direct hits; weak versus scald |
| Emberfelt | Scald gains one duration, cap4 rounds | First Scald application each round heals user6 | Long fights; weak against cleanse |
| Velvetrim | Single-foe skills can reach rear | Opening shield12; support-focus gains a small target preference | Utility back row; little survival |

These are starting magnitudes, not PASS claims. All eight sets must achieve35–75% heldout wins at matched power and each must lead at least one predeclared situation. Role-specific situations are front slams, utility back row, scald attrition, row pressure, stored-damage swarm, multi-hit, persistent single boss and low-HP cleanup. Report every situation, including losses; do not choose seeds after seeing outcomes.

Twelve existing unique IDs receive ON effects with once-per-turn/encounter caps: doorstop heals8 after Defend; nightglass shields6 on first marked hit/round; seedcup adds12 shield to first healing recipient; rainbell cleanses one debuff after swap; crumbbook shields10 after detonation; panlid adds one counter stack after Defend; warmwick heals4 on first Scald application/round; silkspool shields12 after first ultimate; starladle heals12 after first ultimate; softcollar grants opening shield15; tidetray favors a weak ally for a shield-bearing skill; gardenkey heals8 after the first successful cleanse/turn. Gear must not grant free fatal-hit prevention, revive or extra turns. If any unique still exceeds12 pp heldout gain, reduce its real effect and remeasure.

**Power and comparison:** raw core = HP/5 +2×ATK +1.5×DEF. Utility adds expected shield absorption/5, effective heal/5, status/counter/reach value from a documented three-round reference window, and crew contribution. Each named coefficient is published with the score; coefficients are calibrated on training outcomes only. The number is a build estimate, not a win probability. Compare an item by applying it to a cloned current loadout, then show changed stats, set thresholds gained/lost, unique/AI behavior and the measured-reference scope. Report ranking agreement and worst paired residual on heldout; if it is poor, label the score approximate rather than invent accuracy.

Three full **Shift loadouts** store team IDs, rows, focus/care and item instance IDs. Preview lists transfers, missing pieces, affected set thresholds and resulting utility score. Apply validates all references, unique ownership, matching slots and front row first, then commits atomically. Missing/salvaged items do not partially unequip the party. Naming is local text, max40 characters. Saving/applying costs nothing. Source: research principles4–7 and the preset/forge evidence supplement.

## 4. Complete item catalogue and rarity presentation

Inventory is a functional catalogue and management surface: category, rarity, slot/set, owned/equipped, source, binding and sorting (name, tier, new, utility). Items with no current acquisition path are labelled legacy-only, never advertised as a new reward. Gear capacity240 is shared by drops/crafting/draws/selectors. Existing saves above240 load without deletion; they cannot acquire more until below cap. Mandatory battle drops convert to disclosed salvage threads through the shared daily reward cap; voluntary craft/draw/selector rejects before spending if capacity is insufficient. A batch uses worst-case gear slots before committing. Mirrored legacy inventory is not counted as a second physical item.

| Type / tier | Source | Sink | Cap | Binding / screen |
|---|---|---|---|---|
| 12 companion cards / 4 rarities | Invitations, welcome, chosen selector | Level/ascend; duplicates become shards | One owned record per cat; rarity level caps20/30/40/50, stars5 | Account-bound; Companions/Invitations |
| Cat shards / parent rarity | Duplicate draws | Ascend,10 shards→1 essence | Acquisition bounded by30 draws/day; safe-integer storage | Account-bound; Companions/Inventory |
| Gear / 4 rarities | Route drops, basket, targeted tailoring, selector | Equip/enhance/reforge/salvage | 240 instances, +12, four equipped slots/cat | Account-bound; Equipment |
| Fish / common earned currency | Service, routes, quests, milestones | Levels, recipes, enhancement | Shared repeatable420/day | Account-bound; topbar/Inventory |
| Threads / common material currency | Service, routes, capped rewards; owned-item salvage | Enhance, reforge, tailoring, keys | Shared reward90/day; salvage conserves already-owned value | Account-bound; topbar/Inventory |
| Stamps / rare earned currency | Service, routes, quests, milestones |150/draw | Shared180/day,30 draws/day; no purchase | Account-bound; Invitations |
| Essence / epic material currency | Rewards, duplicate-shard exchange | Awakening, tailoring, cosmetics | Shared reward6/day; conversion consumes old value | Account-bound; Inventory |
| Mastery materials / rare | Route settlement/first clears | Awakening, legendary tailoring |30 repeatable/day plus one-time chapter80/100/120 | Account-bound; Inventory |
| Boss seals / epic | First rewarded won route of a day | Legendary tailoring, design reservations |1/day; one durable claim receipt/day | Account-bound; Inventory/Collectibles |
| Run points / common temporary | Nodes, tradeoffs, fights | Run shop, event choices | Only current run, no transfer to wallet | Run-bound; Map/shop |
| Packed tonic / common | Start with1; run shop45 points | Heal100 per cat strictly between fights |5 packed; buy rejected at cap | Run-bound; Map |
| Pantry supplies / common/rare | Existing recipes or saved stacks | Between-fight tonic/heal/shield preparation below |20 of each stack; one preparation supply per encounter | Account-bound; Inventory/Map |
| Pantry key / rare | Existing weekly quest or40-thread recipe | Chosen pantry preparation |99; reject voluntary craft at cap | Account-bound; Inventory |
| Cafe ribbon / epic cosmetic | Existing10 essence/20 thread recipe; journal milestone | Permanent badge unlock |1; duplicates rejected | Account-bound; Journal |
| Run charms / 6 original families | Reward, shop, story | Automatic effects for that run |2 stacks each; no inventory ownership | Run-bound; Map/Prepare |
| Skill upgrades / run improvement | Reward/campfire | Improve an unlocked automatic skill |3 ranks/skill/run | Run-bound; Map/Prepare |
| Selector marks / earned progress |1 per paid earned-currency draw |60 for chosen cat or eligible gear template |No expiry;30 added/day; safe-integer balance | Account-bound; Invitations |
| Collection entries / permanent | First owned cat/template, actual clears | Milestone claim once; entries never consumed |12 cats/128 gear templates/3 chapters | Account-bound; Journal |
| Relic edition designs / prestige | Recorded seals and achievement gate |Reservation, cosmetic burn/fusion |Moon2400 lifetime/400 season; Maneki360/60;1/account/edition/season | Local account-bound preview; future Fuji Relics only; Collectibles |
| Actual Fuji holdings / existing rarity | Existing read-only holding snapshot | Existing selection path |Existing protocol, outside v4 design issuance | Protected unchanged panel; no v4 mint/trade flow |

Supplies are spent strictly before an encounter, with a visible confirmation of the selected effect: Milk Tonic heals100 to the chosen living cat immediately between nodes; Shield Biscuit packs20 opening shield for that cat; Quicken Yarn packs one opening Cozy stack; Clearleaf Tea removes one carried debuff or packs a one-time first-debuff cleanse; Starlight Treat packs12 effective healing after that cat's first automatic ultimate. One packed effect per next encounter; replacing it returns the previous unspent stack before deducting the next. After Fight commits, the effect is consumed and cannot be changed. Zero-effect Milk/Tea uses are rejected without spending. No supply starts energy/charge counters, changes action count or adds an in-fight button. Existing run tonic remains separate and clearly named Packed tonic. All legacy recipe adapters apply cap/duplicate checks before spending; no silent truncation on migration.

Acquisition/conversion sims check cycles across craft, draw, salvage, key recipes, supplies, shard conversion and selector. Recycled value may not exceed the consumed inventory/budget; any unavoidable disposal conversion is displayed before entering the reward path.

Common is readily replaceable: plain readable label, one main stat. Rare adds one build refinement; blue label plus text, never colour alone. Epic adds two refinements and targeted source planning; violet frame token plus source. Legendary adds three refinements and one bounded behavior; gold label and a skippable earned reveal. Collectible is a separate **edition** badge and supply record, never a fifth combat tier. Existing B-owned tokens/assets are referenced, not rewritten. A requests any new frame/reveal work from B and uses text badges meanwhile. No market price, investment or guaranteed-value language.

Each of the first6 rewarded gear drops/day is one item: ordinary Common65%/Rare30%/Epic5%/Legendary0%; elite0%/70%/27%/3%; boss0%/20%/70%/10%. After6 drops the chance of another reward is0%. These are existing source probabilities, conditional on an eligible won encounter, not banner odds. Keep them unless a versioned tuning receipt justifies a change. Tier acceptance compares equal source budgets and enhancement, not a legendary full set against a single common piece. Source chapter and account requirements are shown for every targeted recipe.

## 5. Earned invitations and guaranteed choice

Retain three banners and separate pity groups: Cafe Guestbook, featured guest, Mending Basket. Cat base rarity odds60/30/9/1%; basket55/34/10/1%. Cost150 stamps each; batch1–10; maximum30/day. Legendary conditional odds rise by3 percentage points per draw starting on draw41; hard guarantee at60. Remaining rarity weights renormalize exactly as the existing implementation. Featured legendary chance50%, then100% on the next legendary after a miss. Pity carries inside its group; no banner countdown or paid currency. Unowned candidates are preferred only within the rolled rarity and featured partition, and this rule appears in the disclosed item pool.

Every paid earned draw grants one permanent selector mark after successful acquisition.60 marks buys one chosen companion (including Legendary) or one eligible chosen gear template; gear remains subject to its chapter/mastery gates. Welcome/free invitations grant no mark. The selector spends marks, never pity or hidden future draw odds. No season expiry. Owned-cat selection shows the exact shard conversion and is disabled until all cats are collected to avoid accidental duplicate choice. Capacity and gate failures consume nothing. Gear basket selects from the complete128-template depth catalogue in ON mode; OFF keeps its historical pool.

Odds drawer is one click from the draw and selector: base, next conditional odds, pity distance, featured state, exact item probabilities, duplicate conversion, capacity, current marks and chosen-reward distance. Batch preview shows total cost and available space; the reveal can be skipped after results are committed. A typed ceremony receipt includes bannerId, draw index, rarity, original item/cat ID, duplicate output and pity before/after. B may animate it but must not perform the draw or change probabilities.

Simulation:10,000 independently seeded accounts per banner through at least first Legendary and a60-paid-draw selector; compare first-Legendary CDF with the exact conditional-odds survival product at every draw (max absolute deviation≤1 pp), inspect individual rarity frequencies conditioned on pity buckets, and check featured miss→guarantee. Report median/p90/max pulls and days to first Legendary and chosen reward under casual/heavy earned schedules, including censored accounts. Never compare the unconditional1% base rate with a pity-inflated total rate. Daily30/batch10 and no-overdraft/replay tests are separate from statistics.

## 6. Edition ledger and future NFT boundary

Implement the pure authority transition in `depth/scarcity.ts`; details in NFT-VALUE-SPEC.md. It validates expected revision, command ID, trusted effort receipts, per-account season limits, monotonic lifetime caps and burn/fusion conservation. Local demo authority lives in a save and is labelled **Design only — not minted**; it is not globally secure across copied saves. Actual identity and receipt authority belong to a future server. No wallet, contract, SIWE, token, purchase, cash-out or existing Fuji path edits.

Moon Collar needs3 spent boss-day seals plus chapter1 clear; Golden Maneki needs10 plus all3 mastery clears or Tower5. At most1 reservation/account/edition/season and1 reservation/account/UTC day; season rollover resets only seasonal allowance, never total issued or spent proof. Burns never reopen supply or effort. Fusion consumes2 owned live Moon records from different seasons and creates a nontradeable commemorative badge, not a new capped edition. Designs/cosmetic badge add zero combat stats; identical paired boss outcomes are the expected test (gate≤3 pp). Screen shows lifetime issued, season issued, own live/burned reservations and exact effort still missing, with the scope labelled local authority preview.

## 7. Finish three loops beyond battle

**Today's board** extends existing daily/weekly quests instead of a second reward source. Hub shows progress, claimable reward after shared caps, and one next action (service, prepare, improve, claim). Two daily tasks are service1 and complete2 rewarded routes; weekly3 wins; existing achievements retained. Claim commands are idempotent. A full daily cap leaves a permanent milestone claim pending; do not consume it for zero currency. The board links to the working action, never a mock button.

**Cafe shift** uses elapsed time with a monotonic last-claim watermark and the existing capped idle calculation through its public API; protected bridge code stays unchanged. Hub shows accrued claim,2-claim daily limit and next useful time. Clock rollback produces zero elapsed credit; advancing across many days does not grant every missed day's currency. No streak decay, push notification requirement or paid acceleration. Existing saved idle receipts deduplicate settlement.

**Collection journal** records first ownership independently of current inventory and persistent achievements. Milestones: recruit6 cats→60 stamps; discover12 gear templates→40 threads; assemble any4-piece set→80 fish; clear all3 chapters→one cosmetic Cafe Ribbon (if already owned,20 threads); finish10 rewarded routes→60 stamps. Each claim only once, with shared currency-cap preview and deferred claim when no room. Counts survive salvage. Journal separates collection, chapter mastery and battle observations; it names the next achievable milestone. Existing Tower/challenge routes remain working optional content, not a new unfinished weekly-boss mode.

New-save→day30 run-bot exercises real commands, no unlock/grant cheats, including claim refusal, loadout changes, targeted recipe and selector progress. First play teaches a single decision per stage: front row, one opponent intent, one gear effect, then earned invitations. Returning day7 skips tutorial repetition. Rewards and effort limits are visible before choices.

## 8. Pacing and presentation contract

Ordinary15–30 s, elite25–45 s, bosses45–90 s at x1 in the actual build, all3 chapters. G0 boss177.346 s and ordinary52.477–63.705 s are measured examples to improve. First target action budgets: ordinary10–18 total actions, elite18–28, boss30–48; these are provisional until renderer timing is measured. Tune actual HP/attack/phase scaling and number of surviving enemies; do not merely accelerate nominal x1 playback.

P3 training correction (historical; P6 revision below): utility enemies refill/brace on the existing third-round signature cadence and use basic pressure between; Prepare discloses this. HP multipliers before level growth are regular .23, elite .30, boss .30 (Pantry .25), subject to measured acceptance.

Bosses have opening and closing phases, triggered immediately when crossing50% HP, once only. Closing phase changes the next signature's target pattern using existing enemy identities. Defeating the primary boss retires its linked adds immediately and emits one finishing event; no adds-only cleanup actions or post-victory damage. Simultaneous defeat resolves party loss consistently; fatal damage/retirement/replay order is tested. Never fabricate a wall-time PASS from turn count.

`events-v4.ts` exports a version1 discriminated union with common fields `{version:1, sequence, round, actorId?, targetId?, text}` and kinds `crew-active`, `formation-cover`, `plan-target`, `gear-trigger`, `boss-phase`, `boss-finish`, `earned-reveal`. Numeric amounts mean effective HP/shield changes, never requested amounts before caps. Phase includes bossId/from/to/threshold; finish includes bossId/retiredIds/outcome; plan includes focus/care/reason; gear includes instance/template/effect identity when available. Store events on the battle snapshot with monotonic sequence. Preview clones get their own arrays. A fallback renders in Prepare/Result/readable log outside Battle.tsx. Ask B for cue timing≤400ms phase and≤800ms finishing flourish within existing action duration; decorative animation must not extend simulation or add input. Send schemas and deterministic fixtures, not a request to invent behavior.

## 9. Balance protocol and gates

Before tuning, register train seeds1–500 and heldout10001–10500; content-case keys fixed by chapter, type, band, set and team. Use50-seed cells for rapid train pilots; acceptance uses at least500 per cell, with paired seed differences and Wilson intervals in reports. The original48 adjacent-step gate stays2 samples×2 levels(1,6)×3 chapters×4 steps; both samples reported separately, plus the all-band analysis. Coherent crew teams are selected on train; freeze them, random-team sampling and situation weights before heldout. No rerolling heldout to rescue a tuning choice. Any heldout-driven tuning is labelled contamination and a fresh explicitly named reserved seed block is used for the next acceptance pass.

Intended challenge rating is explicit and based on chosen content band/character level progression, never equipped gear, selector count or collectible ownership. Preserve fixed low-band completed routes for easy farming; rewards already cap. Prepare shows the selected band and threat, and all tiers in a paired test face identical enemies. Compare each level1–10 and max50 on its intended band; test fixed-content dominance separately. Level-six ultimate timing must not bypass the gear ladder.

| Measure | Gate | Required fixture / receipt |
|---|---|---|
| Adjacent tiers |≥44/48 each≥2 pp;0 reversals |Same cats/level/content/seed/enhancement; all rows shown |
| Band ladder |Bare→best≥15 pp at levels1–10 and50; no band all tiers≥95% |Intended content, gear-blind scaling |
| One piece |Heldout paired gain≤12 pp; display share≤10% including utility |Every template/slot, all chapters; report worst |
| Sets |35–75% heldout matched-power; each leads one situation |Power tolerance±2%, common content pool and role niches |
| Cats |55–75% heldout matched-power; each top pick in a team |All legal triples; no unrelated860-case B visual matrix |
| Crew |Coherent vs random equal-power10–25 pp |Predeclared mixed cases; both groups normalized |
| Wall time |Ordinary15–30, elite25–45, bosses45–90 s |Real headless x1 playback; all3bosses plus samples |
| Economy |45-day heavy/casual≤3× for every earned currency and paid draws |30 accounts/style, same seed distribution, actual commands |
| Invitations |10k-account conditional CDF deviation≤1 pp |Every banner; first/chosen distributions and seed list |
| Editions |Paired gain≤3 pp; expected exact equality |With/without each edition and fused cosmetic |
| Compatibility |OFF sim hashes exactly equal; old saves load both modes |13 historic files plus fresh behavioral G0 digest |
| Product |5 gates + build; all new screens have functional paths |Type/lint/web/rules/E2E, original failures retained |
| Desktop |1280×720,1440×900;1024×600 usable; contrast≥4.5:1 |Headless DOM/contrast and local acceptance artifacts; no desktop research |
| Startup/artifact |No startup byte or coldCPU increase over current main; baseline-v1 exact |Report inherited/current misses; main≤32MB exception disclosed |

Numeric gates become rule-test/simulation assertions that load real receipts, not hard-coded desired outcomes. Functional unit tests cover invalid/atomic transitions, RNG determinism and adversarial replay. Long simulations and headless timing use the shared lock, short windows and handoff; one agent, no model calls. A full204-image pack is reserved for the last artifact only; respect the user's no-screen research steering. Every missed or unmeasured gate is listed in A4-GAMEPLAY-REPORT.md. Each phase has a draft PR stacked on the prior one; nothing is merged or deployed.

## P6 registered training revision — 2026-11-08

Before heldout sampling, select the tuning2 candidate: ordinary HP .25 (previous .23), unchanged elite/boss HP, and gear-independent boss attack pressure multipliers3.1/1.9/2.3 by chapter, multiplied1.15 at band6+. The one-action automatic policy values Glaze, exposed Riposte, Tangle and signature suppression; it does not add manual combat input. Preview actor copies isolate mutable lists/maps. Mossbrew four-piece Cozy triggers on the first Steep application per encounter. Its visible description follows the same rule.

Training still contains a coherent-kit fourth-slot outlier of88pp and cat/set misses. These changes are provisional, not an acceptance claim. The extra bounded-defense alternative yielded384 identical outcome digests and was rejected. Full registered acceptance includes3625cells×500seeds for each sample, including384coherent-kit/fourth-slot cells alongside2304bare-item cells. Display shares at+12 are measured separately; combat pairs use+0 and do not prove max-enhancement combat balance. Registration: reports/cardrpg-big/a4/p6/REGISTERED-METHOD.md.
## A5 revision — earned progress, 2026-11-08

Sections4/5's invitation values are superseded in gameplayV4 only:360 stamps/day across the existing sources,24 marks for one chosen reward, soft pity13 with +700 basis points per draw, hard guarantee24. OFF keeps180 stamps/day and its historical41/60 pity. Base rarity/featured odds,150 stamps/draw,30 daily draws, ownership protection and other currency/edition caps are unchanged. No saved field is added; THC7 and THC12 preserve existing credits. Counters already beyond the new guarantee receive a Legendary on the next V4 draw.

Reason: the A4 cohort saturated180 stamps for every style, producing58 paid draws in45 days and no60-mark selector. The registered reward-only candidate produces paid-Legendary medians6/5/5 and selector medians11/9/9 for casual/regular/heavy. Heavy/casual earnings stay≤3 for every currency and paid draw. Source correction is matched against all4050 original account-days; all-source Legendary dates are reported separately. See [B3-PROGRESSION.md](../../../reports/cardrpg-big/a5/B3-PROGRESSION.md) and its original receipts. These are bot proxies on A4 combat, not day7 victory or fresh combat acceptance.

The first-week Hub suggests an available preparation goal and tomorrow's fresh service/earned allowance. Goals do not invent calendar locks or guarantee a drop. Odds, selector cost and displayed caps come from the same rule functions used to settle draws. Existing counters never become a negative countdown. No schema bump is needed for a rule/copy change; tests cover old envelopes and mode-toggle credit preservation.

### A5 revision — named payoff and informed retries, 2026-11-08

Result contributions are exact observed amounts, grouped by actor and effect identifier. They are not counterfactual proof that one item caused a win. E1 keeps the original earned day7 battle exactly equal to H0 while naming its healing, shields, damage and first fallen cat.

The available retry command settles the lost route once, checks the owned/affordable change again, and starts a new route at its first stop. This preserves the existing route economy and avoids resurrecting a settled boss battle. The button explicitly says “Apply and retry route”; it does not promise an immediate boss rematch or victory. Forecasts use20 fixed TRAIN seeds in a worker and qualitative bands; CPU4 page throttle is reported separately because worker slowdown is not calibrated.

Scouting exposes opening, reach and closing separately after the first, story and elite stops. The original opening copy leaked the closing phase; the reviewed artifact fixes this and verifies3/3 at boss preparation. Evidence: reports/cardrpg-big/a5/E1-CHOICE-PAYOFF.md and e1/reviewed/audit.json. No combat tuning, save schema or version1 B event change in E1.
