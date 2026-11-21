# Decisions and tradeoffs

Decision date: 2026-11-05 UTC. Base: `3bf2cfa3bd32d8355c5c967e979240330a595682`. The user's no-limits update removes clock/retry/token/PR/demo-size ceilings; checkpoint content order and all safety/ownership boundaries remain. Only Session A writes the rules/design/sim paths. No subagents or extra model-calling helpers.

| Decision | Rationale | Evidence / tradeoff |
| --- | --- | --- |
| Preserve numbered rounds | Each living eligible actor acts once; readable tactics over frequency racing | `battle.test.ts`, existing `squad/turn/rounds.ts`; active-control effects reorder only pending actors |
| Four existing rarities | Keep stable language and pinned Relic IDs | `content.ts`, contract metadata tests; no mythic relabeling |
| Four slots, 2/4 sets | Enough build choices without multiplying housekeeping | `rules.test.ts` equip/set cases; no extra helm/boots grind |
| Three roles, twelve collectible variants | Start with complete role coverage and honest existing kit reuse | catalog test; new independent skill kits explicitly later |
| No energy gating | Let the player practise; cap economic output instead | service/XP/draw tests, 30-day simulations |
| Fixed main/affix templates, chosen reforge | Transparent equipment outcomes and complete deterministic set path | equip/enhance/reforge/salvage tests |
| Failure-free +12 | Avoid spending resources and making no progress | monotonic cost/stat property tests; high levels remain a long-term sink |
| 150 earned stamps per draw | Initial 100-cost trial collected the small roster too quickly | preserve `economy-initial.json`; tuned cohort and odds data; no runtime purchase path |
| Shared currency/XP caps | Heavy activity should not multiply weekly progress beyond 3× casual | 30-day cohort output; caps apply to repeatable grants, one-time rewards separately |
| Thread mending and epic tailoring | Initial spending left large thread and essence balances without chosen repeatable uses | `rules.test.ts` loop losses; tuned spending simulation |
| Full reward preview | Player must see exactly what is received, including first-clear and caps | regression tests compare preview and settlement and input immutability |
| Frozen item/card identity in combat | B must render the actual equipped loadout | identity/replay regression tests; B #4 answered in A #5 |
| Packed supplies spent on entry | Prevent abandon/restart from duplicating extra inventory | five-supply replay test; base expedition supplies are a separate finite run budget |
| No paid/tradeable draws | Reduce legal/contest risk structurally | `GachaResult` binding fields, no purchase command, odds/pity/property tests |
| Deterministic design claims only | Separate collectible issuance from random acquisition | cap-edge/effort/duplicate tests; no actual mint |
| Global and seasonal caps | Bound edition issuance across seasons | local proofs only; no claim of on-chain enforcement |
| Existing NFT contract untouched | No deployment or server authority in this task | diff ownership audit; source contract lacks supply cap and burn support |
| Feature flags remain B-owned and default off | Preserve existing app behavior | B integration screenshot/import/isolation gates; A does not edit shell |
| Chapter 2/3 data only | Design requested, but artwork/new mechanics and balance need their own production pass | `implemented:false` and startBattle rejection tests; no false playable claim |

## Review criteria and freeze

C0: verified base and research outline exchanged. C1: early versioned contract and seven fixtures. C2: full actions, evidence-backed economy/combat results and B consumption. C3: freeze only after open rule issues are resolved, then B integrates. C4: ledger reports and combined summary. The phases can overlap to unblock B, but none is considered complete only because a clock elapsed.

Four separate self-reviews must cover first-time player, skeptical three-minute contest judge, long-term collector and economy director. They are the same primary agent taking different perspectives, not independent human approval. Scores, five weakest points, fixes and residual limits belong in FRESH-EYES.md. Any UI-only issue is requested through the sync channel, never edited by A.

No runtime dependency added. Existing TypeScript, Vitest, fast-check and Vite run headless tools. The JSON fixtures are generated from typed rules; the battle reward fixture comes from a real completed run. CLI simulations do not call a model.

## Depth pass, 2026-11-06

| Decision | Reason | Verification |
| --- | --- | --- |
| Additive 0.5.0 depth contract enclosing the existing 0.4.0 account | Existing callers and identifiers keep their own schema while the new battle/run boundary can migrate independently | `cardrpg/depth/contract.ts`, migration tests in depth mode |
| Three equipped skills from each cat's four-skill kit | Reuses the approved rune proposal's pre-combat loadout choice and explicit unlocks. Two basics and a signature are available immediately. Level 6 or three stars unlocks the ultimate, which replaces one equipped skill | `cardrpg/depth/catalog.ts`, loadout and battle tests |
| Shared five energy per numbered round, individual ultimate charge | Makes support, control and damage compete for a visible resource. Defend and Pour energy each consume the actor's one turn | `cardrpg/depth/battle.test.ts` |
| Five-flavour cycle adds one break pressure | The exact consequence fits one sentence and works with enemy intent counterplay | `cardrpg/depth/catalog.test.ts` |
| Keep the inherited cafe shell and TurnScene | Layout, sockets, context disposal and existing animations already have measured coverage. Optional model IDs load only when the depth entry supplies them | `turn3d/assets.ts`, `turn3d/scene.ts` and new runtime captures |
| Original transform-node silhouettes | Each cat has individually authored body/head/ear/tail proportions, costume geometry and motion rhythm. Later art review must judge identity beyond file hash distinctness | `assets/provenance/cardrpg-depth-models.json`, portrait captures |

REFERENCE: packages/game-rules/src/cardrpg/depth/; docs/proposals/rune-skill-system/demo/index.html; tools/cardrpg-depth/models.mjs; assets/provenance/cardrpg-depth-portraits.json.

## Read-only bridges

The idle adapter accepts an immutable main-game result receipt containing a stable receipt ID, local day, chapter, boss wins and loot count. Its production data provider remains a fixture because the card entry has an isolated account graph. Each receipt contributes at most six materials, shares the run's 30-material daily ceiling and is deduplicated. Cafe service applies the existing eight-hour offline cap and 50% offline efficiency, then the existing two-service allowance and shared currency limits.

Fuji reads use `eth_accounts`, `eth_chainId`, a pinned block number, `balanceOfBatch` and `rarityOf` through viem. The supported ERC-1155 IDs are the existing four rarity IDs. One selected Relic replaces the first team member's relic equipment slot. Quantity adds no power. Each effect is smaller than the corresponding legendary affix or item effect. Fixture ownership is explicitly labelled. Imported ownership is cleared when live mode starts until a fresh read succeeds.

Moon Collar eligibility spends three seals after a chapter clear. Golden Maneki spends ten seals after all three chapter masteries or Tower floor five. Preview reservations use the existing global and seasonal edition limits. A server would need authoritative receipts, supply reservation and voucher issuance before live minting. This pass displays the local effort counters and design preview.

REFERENCE: packages/game-rules/src/cardrpg/depth/bridge.ts; packages/game-rules/src/cardrpg/depth/bridge.test.ts; apps/web/src/game/cardrpg/depth/relic-reader.ts; contracts/src/RelicNFT.sol; packages/game-rules/src/content.ts.

## Measured depth refinements

| Decision | Reason and evidence |
| --- | --- |
| Retain four equipment slots | Keeps the established loadout and all 48 IDs valid. Eight sets across four rarities produce 128 templates. Builds compete for four slots and the Relic bridge consumes one existing slot. `depth/equipment.test.ts` |
| Daily depth caps of 420 fish points, 90 threads, 180 stamps and 6 essence | The initial essence cap of 12 produced a 4.42 heavy/casual weekly ratio. The final 90-account simulation reduces the maximum currency ratio to 2.34. [reports/cardrpg-depth/sim/economy-before-cap.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cardrpg-depth/sim/economy-before-cap.json), `economy-45.json` |
| Legendary tailoring consumes one boss seal | Gives repeatable seal spending after the two local design reservations. It competes with effort previews and requires a Pantry clear. `depth/equipment.ts` |
| Versioned plaintext save with FNV checksum | Enables manual transfer in a storage-free file demo and automatic local saving in the app. Corruption detection, legacy migration and active-battle continuation have rule and browser checks. `depth/save.test.ts`, `depth/model.test.ts`, [reports/cardrpg-depth/browser/app-check.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cardrpg-depth/browser/app-check.json) |
| Fixed battle decision-panel height | The first natural playback trial changed the drawing buffer 46 times. Reserving panel space keeps one buffer size through actions, rewards and boss results. [reports/cardrpg-depth/performance-trial/measurement.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cardrpg-depth/performance-trial/measurement.json), `performance-stable/measurement.json` |
| Read rarity attributes only for positive holdings | Public Fuji reads showed IDs 3 and 4 have never been minted at the sampled block, and their mapping values default to zero. The reader now omits zero balances before validating the attributes. [reports/cardrpg-depth/validation/fuji-attributes.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cardrpg-depth/validation/fuji-attributes.json), `depth/relic-reader.test.ts` |

The three chapter stages share the cafe camera and geometry foundation. Original chapter props, light-facing palettes and transposed synthesized ambience distinguish the route. Skill sounds use unique registry signatures and existing sound synthesis. Audio begins after an explicit user click. Transform-node clips use individually varied rhythm and amplitude on the established rig vocabulary.

REFERENCE: apps/web/src/game/cardrpg/depth/chapter-stage.ts; apps/web/src/game/cardrpg/depth/assets.ts; apps/web/src/game/squad/turn3d/audio.ts; assets/provenance/cardrpg-depth-runtime.json; apps/web/src/game/cardrpg/depth/assets.test.ts.


## A4 research decisions — 2026-11-07

REFERENCE: RESEARCH-GAMEPLAY-V4.md; RESEARCH-V4-EQUIPMENT.md; sources.json V4-* records; PROMPT-A4.md.

The user's A4 instruction supersedes the historical manual-battle decisions above. Battles remain automatic; no player skill/target/energy/break/flavour-wheel controls. All new systems are opt-in gameplayV4 rules; live defaults and legacy OFF behavior remain intact.

| Decision entering design | Evidence / verification requirement |
|---|---|
| Three cats, primary job = 2 marks + secondary = 1; 2/4-mark thresholds require two distinct cats; visible enemy intent; pre-battle standing plans | V4-TFT/INSPECT, SAP, BG, AFKA; original mechanics, paired same-power synergy test |
| Keep four slots/eight sets/four gameplay rarities; separate edition prestige | SW, V4-RAID-GEAR, TFT, GU; explicit set niches and zero-stat design editions |
| Add full loadouts and guaranteed targeted rewards, retain chosen affix reforge | V4-EVER, HSR-CRAFT, DIS-SELECT, SW-REFINE; atomic loadout and selector tests |
| Pair numeric score with disclosed utility and observed battle events | V4-JAFFE/TFT; display share alone is not evidence of <=12 pp single-piece utility |
| Permanent earned selector, one-click odds, exact costs, no false urgency | V4-XIAO/ZC/DS/APPLE/GOOGLE/BE-OFFICIAL; gacha distribution and actual browser checks |
| Replayable local edition ledger, monotonic issuance, no cap reopening after burn | V4-DORMANS/AXIE-SOURCES/SOR/P2E; offline replay is not global/Sybil security |
| Finish cafe shift, quest board and collection milestones before extra modes | V4-SAP plus existing onboarding studies; each gets a claim loop, cap and day30 check |
| Retire linked adds with boss; measure actual wall time | V4-JAFFE plus G0 day7 22-second post-boss cleanup; typed finishing event request to B |

Research-only verification: current legal applicability in China and any enacted 2026 general Dutch loot-box rule remain NOT VERIFIED. No new purchase/on-chain flow is proposed. Community-only equipment fields stay explicitly limited. This is one agent's design judgement, not independent human playtesting.

## A4 P2 implementation notes — 2026-11-07
- THC9 carries optional three-slot shift presets and packed-supply snapshots; THC5–8 imports remain supported without trimming over-cap inventories. Legacy-only exports remain THC7.
- Whole-number gear bases round upward before the 1/1.25/1.5/1.75 rarity ladder, with a minimum 4 in the slot stat, then clamp the actual enhanced main stat to 8% of naked core. This avoids low-level integer ties without changing the displayed-only score. Balance acceptance remains pending.
- Clearleaf Tea packs one first-debuff cleanse: current routes preserve HP, not between-node debuffs. Pantry reservation is shown before Prepare, survives prepare rebuilds, returns on uncommitted abandonment and is consumed when Fight commits.
- Utility coefficients are explicit three-round estimates pending train calibration; the UI labels them approximate. No measured agreement is claimed.

## A4 P3 — 2026-11-08 pacing correction
The first training pilot exposed repeat shield/heal stalls (up to 251 actions); the built two-guard ordinary encounter measured 67.553 seconds at x1. In v4, utility enemies now use their disclosed 65-HP heal / 45-shield brace on the existing third-round signature cadence, and basic attacks between. Ordinary HP is 23%, elite 30%, bosses 30% (Pantry 25%) of the legacy catalogue before explicit level growth. OFF is unchanged. This is a training correction, not heldout acceptance; real x1 and replay checks follow.

## A4 P6 — 2026-11-08 pre-heldout candidate
- Adopt tuning2 only: gear-blind boss pressure3.1/1.9/2.3 (×1.15 at band6+), ordinaryHP.25, bounded one-action utility awareness, isolated preview copies and one Mossbrew Cozy per encounter. No B presentation timing change.
- Preserve every pilot and residual; do not infer one-piece balance from all-loss bare-party cells. Register coherent-kit/fourth-slot pairs before heldout. Pilot worst88pp remains a miss until the full receipt says otherwise.
- Reject the extra bounded-defense variant:384 coherent-kit pilot outcome digests unchanged. No unsupported extra runtime change.
- Acceptance train1–500 and heldout10001–10500 each use3625cells; no heldout sampled before this record. Source hashes bind every resume. Any subsequent tuning based on heldout must disclose contamination and a new reserved block.
## A5 B3 — restore reachable earned rewards, 2026-11-08

- Adopt the registered reward-only360-stamp/24-mark/soft13/hard24/+700bp candidate after corrected4050-day parity. A4's180 daily cap made all styles identical and censored every60-mark selector. Preserve every original pilot and the rejected480/40 proposal; do not claim it was measured.
- Keep the old60-mark balances and pity counters, including when V4 is disabled. Changed mode caps limit future earnings without clawing back earned currency. No new state or save version; old THC7/THC12 imports remain valid.
- Show a suggested first-week goal plus tomorrow's real daily allowance. No manufactured daily unlock, promised Legendary date, purchase, expiring marks or edition-cap change.
- Evidence: reports/cardrpg-big/a5/B3-PROGRESSION.md; b3/reward-validation-02/summary.json; b3/invitations-01/gacha.json. Bot reward gates do not substitute for the pending earned-day7 retry and selected-combat acceptance gates.

### A5 revision — named payoff and informed retries, 2026-11-08

Result contributions are exact observed amounts, grouped by actor and effect identifier. They are not counterfactual proof that one item caused a win. E1 keeps the original earned day7 battle exactly equal to H0 while naming its healing, shields, damage and first fallen cat.

The available retry command settles the lost route once, checks the owned/affordable change again, and starts a new route at its first stop. This preserves the existing route economy and avoids resurrecting a settled boss battle. The button explicitly says “Apply and retry route”; it does not promise an immediate boss rematch or victory. Forecasts use20 fixed TRAIN seeds in a worker and qualitative bands; CPU4 page throttle is reported separately because worker slowdown is not calibrated.

Scouting exposes opening, reach and closing separately after the first, story and elite stops. The original opening copy leaked the closing phase; the reviewed artifact fixes this and verifies3/3 at boss preparation. Evidence: reports/cardrpg-big/a5/E1-CHOICE-PAYOFF.md and e1/reviewed/audit.json. No combat tuning, save schema or version1 B event change in E1.

## A5 E2 implementation — stars and discoveries, 2026-11-08

Each node keeps three independent badges across visits, keyed by chapter/band/map position/kind. Noncombat stops use completion, half-health and four-mark crew goals, since they have no winner or battle-round count. Three once-only milestone rewards share existing daily caps; replay stars are not a new uncapped currency source. THC13 is required for the saved journal, with quiet migration and OFF preservation.

Discovery earned-reveal version2 explicitly discriminates crew/set/rank/Legendary/star events instead of inventing invitation fields. Version1 events remain unchanged. The A-owned DOM fallback lasts1.2s and stays hidden during battle or invitation reveal. Evidence and limits: reports/cardrpg-big/a5/e2/CONTRACT.md and rules/checks.json; broader economy and engagement remain unmeasured on this change.

### A5 revision — one visible opening choice, 2026-11-08

The original V4 practice cushion dies in three actions on all50registered TRAIN seeds, before row placement can change any HP. The chosen300HP/60attack practice snapshot (before existing tutorial scaling) gives the cushion one gentle turn: all150registered formation/seed cases still win, at most five actions, and the front cat’s HP loss differs. The360HP alternative adds an unnecessary action and is not adopted. This affects only the V4 practice setup in the A-owned model; campaign rules and OFF practice stay unchanged. Wall time must be measured in the browser, never inferred from action count.

The opening equipment step offers two existing affordable recipes (Soot’s Moonwick rare weapon or Clover’s Mossbrew rare relic), previews their real180fish/30thread cost, and selects the actual crafted item for the normal comparison/equip command. No reward, unlock, currency or saved field is injected. The registered first-route pair changes Soot’s observed damage202→204 with the wand; Clover’s relic changes HP/targeting and healing43→73 in that exact fixture. These are examples, not guaranteed outcomes. Hearthloom rare outfit has no observed outcome change in this fixture; Bellsteel charm is chapter-locked, so neither is offered in the opening.

Evidence: reports/cardrpg-big/a5/e3/opening-pilot/pilot.json, REGISTERED-METHOD.json and CORRECTION.md. Keep all failed original harness attempts and all tested options. Next: real-click timing, three desktop sizes and the full source gates.


## A5 B3 — soften the first training step, 2026-11-08

The old challenge6 combines two abrupt multipliers and raises Yarn Giant attack by30.27% over challenge5. Adopt the registered anchored60 curve only: training weight0 through band5, then .6/.7/.8/.9 at6–9 and1 at10+. All enemy stats in1–5 and10–50 remain exact. Existing saved enemyStats continue to determine replay; no save field or version change.

Fresh90account/4050day TRAIN replay yields casual26/30 and regular28/30 first-two wins, heavy28/30 first wins and advice24/24 losses. Early chapter clears and pulls through day5 are unchanged; reward gates pass. The heavy advised retries lose0/2 against2/2 without advice; recommendations are not guaranteed improvements. Evidence: reports/cardrpg-big/a5/B3-DAY7-RETRY.md and b3/anchored-validation-03.

This adopts a bounded progression repair, not balance closure. Original TRAIN50 matrix still has68 fourth-slot misses, worst88pp, cats61.75–86.65%, sets76.75–92.25%, one flat tier step and two band-spread misses (9/1 and10/1). The latter band10 is source-identical to A4. Keep these failures for B1/B2; fresh20001–20500 is unused. Browser x1 and full source checks follow before draft publication.


### A5 fatal follow-up guard

A registered TRAIN Scent-policy probe exposed an existing automatic-preview exception: Kettle Knight reflection kills the last party member during Velvet's Stolen flame, then its energy-to-shield follow-up dereferences a missing ally. The V4 effect now skips a missing recipient and preserves the normal12shield if an ally survives. Legacy energy is unchanged. Two unit scenarios fail-before/pass-after for the no-ally case; the captured round10/seed21 state and every legal-action preview replay without throwing. No numeric balance or policy adoption is implied. Evidence: reports/cardrpg-big/a5/b2/fatal-followup/checks.json and scent-policy-crash-07/failure.json.


### A5 Hush utility suppression, 2026-11-08

A Hushed V4 heal or shield signature now spends its committed utility turn without replacement damage. Ordinary basic attacks, Drowsy softened attacks, summon/boss damage and OFF retain their existing behavior. No skill power, gear, AI, save field or event schema changes.

The old resolver silently converted the stopped65HP refill into70shield plus39HP damage against Mochi in the captured Inkcap–Velvetrim replay. Removing Quiet spores or rear reach restored50/50 wins, while removing the four-piece threshold did not. The registered branch correction changes the intended matched fixture21/50→48/50 (fixed-core21→49); every other carrier cell and negative pair remains visible. Common-fixture Inkcap54.47→56.35%, but Soot47.25%, Sorrel53.20%, Cinnamon84% and crew30.75pp still miss their gates. This repairs a contradictory mechanic, not broad balance or acceptance. Evidence: reports/cardrpg-big/a5/B2-UTILITY-SUPPRESSION.md and b2/utility-suppression-15/paired-carriers.json.

### A5 Hush credit at the actual suppressed action, 2026-11-08

Hush no longer earns a suppression event or the existing once-only8HP Lantern heal on ordinary enemy attacks. Heal/shield signatures credit the skipped utility branch. Summon signatures credit only a living eligible summoner with a free thread slot, after its attack and retaliation resolve. Phase-one Pantry, full summon capacity and defeated summoners cannot earn credit. Drowsy still credits its softened action; the Result reason now says enemy actions. No amount, gear, AI, schema, saved field or OFF behavior is changed.

The registered144-case semantic comparison passes144 versus125 on the prior source; all72OFF streams and controlled attack payloads are exact. The unchanged1321 TRAIN1–50 composition retains every piece/tier/band/set/crew outcome; one of660team cells loses four of50wins after false healing is removed. The same90earned day7 saves retain all win/advice/cost results. Original68fourth-piece misses, worst88pp, two band misses and cat/set misses remain open. This correctness repair is not balance closure. Evidence: reports/cardrpg-big/a5/B2-HUSH-ATTRIBUTION.md and b2/hush-eligibility-22/audit.json. Fresh20001–20500 remains unused; full source/compatibility checks follow on the adopted source.

## A5 owned reserve-cat advice revision
Result recommendations now evaluate one owned reserve-cat substitution into the same row, using its earned level/kit and existing gear. No items move or currency is granted; the existing deterministic ten-seed comparison and threshold still apply. Current28 shows six improved first-two outcomes and zero regressions on90old earned inputs; all first battle/state hashes remain exact. This is not fresh acceptance or a guarantee. Evidence: reports/cardrpg-big/a5/e1/crew-advice-28/audit.json.


A5 advice29 revision: an owned-cat suggestion must retain the selected challenge band. The real-click advice28 check exposed a level-1 reserve suggested for band 5; its bot had silently lowered retry difficulty, so the apparent six-account gain is withdrawn as same-difficulty evidence. Filter under-level reserves and atomically reject an invalid result swap before settlement. Corrected, same-band baseline/candidate replays are identical across all 90 earned saves (27/30 casual, 28/30 regular first-two; heavy 28/30 first). No population win improvement is claimed. A separate earned UI fixture spends 250 fish and 8 threads through public level commands to train Mallow from 1 to 5 before the loss. Evidence: reports/cardrpg-big/a5/e1/crew-advice-28/UI-REJECTION.md and e1/crew-advice-29/{REGISTERED-METHOD.md,audit.json,browser-fixture.json}.

### A5 Equipment41 — contextual boss comparison, 2026-11-08

Add a qualitative whole-crew before/after comparison alongside the static equipment score. The existing 20-seed worker rehearses a named unlocked boss at a shared legal band, full health and without route rewards. The real equipGear transaction determines both the recipient's and donor's gear, including reserve transfers. No percentage, extra survival-hit count or guaranteed victory is inferred from those samples; close outcomes may share a band. This supplements the static display gate without replacing or relaxing it.

Contextual40's 384 TRAIN contexts give chapter correlations 0.738/0.754/0.729, but forecast seeds overlap outcome seeds. Retain opposite signs and negative pairs; independent acceptance and static-score calibration remain open. The isolated UI passes three widths, both looks, ON/OFF, immutable preview/actual Equip parity and native-worker stale/CSP cases. Evidence: reports/cardrpg-big/a5/E1-EQUIPMENT-FORECAST.md and e1-equipment-forecast/prototype-audit.json. Full source closure follows adoption; no combat, save or event schema changes.

### A5 Home43: the next star and primary route agree
An earned minute42 checkpoint reproduced a chapter1 star hint with a chapter3 primary destination. Home now selects a legal unfinished-star chapter/band after uncleared chapter priority, keeps explicit band selection and active routes intact, and avoids inaccessible goals. This is UI navigation only; no rule, reward or cadence credit. Evidence: [reports/cardrpg-big/a5/E2-HOME-STARS.md](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cardrpg-big/a5/E2-HOME-STARS.md) and source-bound `e2-home-stars/audit.json`.

- A5 C1 decision visibility (2026-11-09): a first uncleared chapter defaults to band1, or the prior chosen band for that same chapter, bounded by the current crew ceiling. Growing the crew no longer silently raises that first-clear challenge. The player can still choose a higher band; active routes keep their stored band. Home54 reconstructs the old retained2→default5 change; its separate TRAIN probe improves22/400 but leaves377/400losses, so this is not a combat-wall claim. See reports/cardrpg-big/a5/c1-decisions/adoption.json and e2-home-band/fixtures/checks.json. Pending route choices precede the map; ordinary V4 losses emphasize the available advice, while completed retained routes respect the OFF preference and active routes keep their committed gameplay mode.
