# Skills V5 spec (user-approved direction, 2026-11-09)

Approved by the user on 9 Nov 2026 (option B, "Skills V5 full"). Source doc (Vietnamese): https://claude.ai/artifact/TnU4qQmkEd6wz6FzuUJCnG
Both lane prompts (A rules, B look) embed this file verbatim; copy it to docs/design/cardrpg/SKILLS-V5.md (lane A) when you start.

## Why
Rules already have 16 statuses and 16 mechanics, but a local 180-battle probe (A5 source 27f192301, gameplayV4 ON, policy `auto`, crews Mochi/Soot/Clover, Panko/Mallow/Cinnamon, Biscuit/Inkcap/Sorrel x encounters [button-guard,sock-skipper], [teacup-healer,kettle-knight], [yarn-giant] x seeds 1-20, base stats, no gear) measured:
- only 9.1% of party damage actions hit more than one foe; 19.4% of support actions touch more than one ally;
- the 8 most used skills are single-target basics (~50% of actions); each ultimate is 2-3% of actions;
- enemies apply only Tangle to cats, so cleanse is almost unused (Clearleaf rinse 0.1%);
- average fight 17.3 rounds;
- lane B shows 3D cues for 6/16 statuses (feet level, 35-50% opacity) and no status badges in the lookV2 HUD.
The user sees "one hit, one heal" and wants burn, bleed, heal reduction, AoE, combos.

## 8 core keywords (display name / internal id / rule)
Display name is plain English; the cafe name stays as subtitle in tooltips (e.g. "Burn - Scald"). Internal ids are kept so saves, text and art keep working.

| Display | Internal id | Rule | Stacks / duration | Counter |
|---|---|---|---|---|
| Burn | scald | Round end: lose 12 HP per stack, bypasses shield | max 5, 3 rounds, new stack refreshes duration | Regen removes 1 stack per heal; Cleanse |
| Bleed | snag (NEW) | Each time the bearer takes its own action: lose 8 HP per stack; blocked by shield | max 5, 3 rounds | Shield, Cleanse |
| Bitter | bitter (NEW) | Healing and shields received -50% | 1, 2 rounds | Cleanse |
| Mark | scent | +20% direct damage taken; targetable through the front row | 1, 2 rounds | Cleanse |
| Shred | brittle (absorbs tangle) | -8% defense and -15 shield per direct hit, per stack | max 3, 2 rounds | Cleanse |
| Daze | drowsy (absorbs hush, rattled) | Next action becomes a half-power basic; bosses only lose their signature | 1, 1 round, then 1 round immune | effect resist |
| Regen | steep | Round end: heal 18 per stack | max 3, 3 rounds | Bitter halves it |
| Warm | cozy | -10% direct damage per stack (not Burn) | max 3, 2 rounds | dispel |

Signature statuses keep their current rules, get their own icon, and are NOT part of the core vocabulary: crumb, riposte, link, sprout, decoy, glaze, shelter. Shield stays a number bar. Total ids: 18 (16 old + snag + bitter); old ids tangle/hush/rattled keep loading (mapped) when skillsV5 is OFF.

## Global rules
1. Same status: add stacks up to cap and refresh duration; all sources share one slot.
2. Fixed round-end order: Regen -> Burn -> expiry. Bleed resolves just before the bearer's action.
3. Hit chance uses existing effectHit vs effectResist. Bosses +30% resist vs Daze only.
4. Length caps: total damage-over-time on a boss <= 6% max HP per round; each target triggers at most 1 reaction per round.
5. Reactions are one level deep: reaction damage never triggers another reaction.
6. Enemies apply statuses to cats too (Burn, Bleed, Bitter).
7. At most 4 badges visible per unit, rest as "+N".

## 7 target shapes
| Shape | Rule | Power per target |
|---|---|---|
| Single | 1 foe, respects front row | 100% |
| Pierce | 1 foe in any row | 100% |
| Row | a whole row | 60% |
| Splash (NEW) | main + adjacent foes | 100% / 40% |
| Bounce | 3 different foes | 100 / 70 / 50% |
| All | every foe | 55-65% |
| Multi-hit (NEW) | 3 hits, each picks a seeded random foe | 40% each |
Ally side adds "Weakest" and "Row" next to "One" and "Team".

## 4 reactions (primer -> trigger)
| Name | Condition | Result |
|---|---|---|
| Crumb Burst | crumb -> detonate | existing rule, now announced and shown |
| Wildfire | target has >= 3 Burn -> hit by Splash/Row/All | each adjacent foe gains 1 Burn |
| Rupture | Bleed + Shred on target -> direct hit | consume all Bleed, deal 12 per stack now, bypassing shield |
| Spread | Marked target is defeated | its debuffs jump to the nearest foe at 50% stacks (round up) |

## Kits (keep skill names; change shape/side effects only)
| Cat | Basic | Skill 2 | Skill 3 | Ultimate | Combo role |
|---|---|---|---|---|---|
| Mochi | Door knock: Splash 100/40 + 18 self shield | Warm welcome: shield Weakest + Warm | Apron crossing: keep | Last light shelter: team shield + remove 1 debuff each | protects primers |
| Soot | Cocoa spark: Pierce + crumb | Black cup: Mark | Lantern wick: Crumb Burst | Midnight service: All + detonate + Daze | primes + triggers Crumb Burst |
| Clover | Leaf tap: Single + heal 18 to Weakest | Patient steep: Regen to a Row | Clearleaf rinse: Cleanse team + heal 45 | Greenhouse morning: keep | answers enemy Burn/Bleed |
| Panko | Pan reply: Single + Riposte + 1 Shred | Bread cover: keep | Crust return: keep | Oven door: keep | primes Shred for Rupture |
| Mallow | Whisk flare: Splash + 1 Burn on main | Split ember: Row + 1 Burn | Burnt sugar: Single, +30% per Burn on target | Closing blaze: All + 3 Burn | primes + triggers Wildfire |
| Sorrel | Moon spoon: Single + Bitter | Cold brew: Pierce + Daze | Decanted moon: keep | Shared pot: team heal + glaze | anti-healer |
| Biscuit | Rolling pin: Multi-hit 3x40% + 1 Bleed per hit | Sideboard step: keep | Last crumb: Pierce, triggers Rupture | Bakers procession: Bounce 3 + Shred | primes + triggers Rupture |
| Inkcap | Ink thread: Pierce + Shred | Quiet spores: Pierce + Daze | Paper decoy: keep | Dreaming canopy: All + Daze + 2 Shred | locks boss signatures |
| Cinnamon | Spice pinch: Single + drain + 1 Burn | Comfort cup: heal Weakest 80 + Warm, cooldown 1 | Clean apron: keep | Second serving: keep | sustains Burn crews |
| Brioche | Bell patrol: Single + glaze | Borrowed blanket: keep | Starched collar: dispel + Shred, triggers Rupture | Constellation apron: keep | front-row Rupture trigger |
| Velvet | Silk nick: Pierce + Mark + 2 Bleed | Candle bounce: Bounce 3 | Stolen flame: dispel + hit | Velvet curtain: keep | primes Spread |
| Marigold | Seed stitch: keep | Garden bell: Regen team | Spring pruning: 2 Burn + 2 crumb | First tea blossom: keep | double primer |

Target crews (design goal, matches A5 gate ">= 4 distinct crews within 5 pp of best"):
Oven (Mallow, Cinnamon, Mochi) Burn/Wildfire vs crowds; Thread (Velvet, Biscuit, Brioche) Bleed/Shred/Rupture vs shields; Night lamp (Soot, Marigold, Inkcap) crumb/Daze/Crumb Burst vs signature bosses; Afternoon tea (Clover, Sorrel, Panko) Bitter + sustain vs healers.

## Chapter-1 enemies
| Enemy | New mechanic | Counter |
|---|---|---|
| Button Guard | shields its whole row | Shred, Burn |
| Sock Skipper | hits rear cats + 1 Bleed | shield the rear |
| Spool Ram | charges 1 round, then Row hit | Daze during charge |
| Needle Moth | Multi-hit 3x random cats | Warm, team shield |
| Teacup Healer | heals Weakest foe every 2 rounds | Bitter, Mark |
| Kettle Knight | below 50% HP its basic adds 1 Burn to the front row | Cleanse |
| Yarn Giant | phase 1 Row + Shred; phase 2 All + Bitter on cats | Cleanse, Daze its signature |
Chapters 2-3 enemies: after 21 Nov.

## Visual language (lane B)
| Status | Colour | On body (while active) | On apply | On tick / trigger | Number |
|---|---|---|---|---|---|
| Burn | #efaa73 | 1-5 small flames round shoulders, count = stacks | ember dart from caster | 200 ms flare | orange italic |
| Bleed | #d9616b | red yarn scratch marks on body | crossed slash | drops when bearer acts | small red |
| Bitter | #8d7aa6 | violet smoke ring at feet | bitter tea drop | heal numbers struck through + "-50%" | grey |
| Mark | #f4db95 | spinning cup-saucer above head | shrinking reticle | ring flash when hit | - |
| Shred | #9fd3e0 | cracks on shield/body | shards burst | shield shards fall | blue |
| Daze | #c19ada | 3 small stars/clouds circling head | sleepy cloud drops | "DAZED" text when it bites | - |
| Regen | #a3dba3 | slow tea leaves falling | steam rises | leaf flash | green |
| Warm | #efbc73 | thin honey shield halo | knitted blanket wraps | halo flash on block | - |
Signature statuses: distinct small icon + existing cue. Opacity 60-80%, body height, never covers faces (LOOK-BIBLE protected-face rule).
Reaction callouts: big word 400-600 ms above target ("CRUMB BURST!", "WILDFIRE!", "RUPTURE!", "SPREAD!") + own effect (crumb explosion, fire wave to neighbours, snapping thread, debuffs flying on an arc). Multi-target hits land staggered 60-90 ms per target.
HUD: per unit a 16 px badge row (icon + stacks + rounds-left ring), max 4 + "+N", tooltip on hover/focus; a small combo ticker at the screen edge ("Mallow -> Wildfire x3").
Budget: reuse B2 pools; peak draws <= 130 (now 115); no new texture > 256 px; demo +<= 1.5 MB; native cast window stays <= 16.8 ms.

## Acceptance (same 180-battle probe + lane A sims)
| Metric | Now | Target |
|---|---|---|
| Damage actions hitting > 1 foe | 9.1% | >= 30% |
| Support actions touching > 1 ally | 19.4% | >= 35% |
| Reactions per battle | ~4.8 detonate, unannounced | >= 2 announced; each reaction in >= 40% of its crew's battles |
| Ultimates | 2-3% of actions | >= 1 per cat per normal battle |
| Normal fight length | 17.3 rounds | 8-12 rounds; boss stays 45-90 s |
| Keyword coverage | cleanse 0.1% | each keyword >= 1 per 3 battles; cleanse >= 3% of support actions |
| Crew diversity | not measured | 4 crews above within 5 pp of best per boss/elite; cats 55-75% |
| Performance | cast 16.8 ms, 115 draws | cast <= 16.8 ms, <= 130 draws, demo +<= 1.5 MB |
| Readability | not measured | viewer names "what is on this unit" >= 4/5 after 2 fights (playtest kit) |
| Compatibility | - | skillsV5 OFF: OFF digest 47477251... and A5 hashes byte-identical; old saves load |

## Schedule (UTC, planned)
V0 lane B now (9-11 Nov): badges + VFX for the 16 existing statuses + Crumb Burst callout, reading actor.statuses only.
A5 paused 9 Nov with a handoff. Lane A now: R1 A5 wrap-up (reports, draft PR on #405), then V1 -> 16 Nov: rules behind `skillsV5`, events-v4 v2, policy. V2 lane A 16-19 Nov: balance on TRAIN together with A5's open B1/B2 gates, then ONE combined acceptance on the still-unused block 20001-20500 (registered first; 30001-30500 only for a retune).
V3 lane B 14-19 Nov: Bleed/Bitter VFX, 4 reactions, multi-target stagger from A's v2 fixture. V4 19-21 Nov: integrate into demo-build, 20 s before/after video, user review before 21 Nov.
Fallback D if S1-S3 are not done by 14 Nov: V0 + snag/bitter/splash + retarget ~12 skills, no reactions.


## User amendment — skill design optimisation, 2026-11-09

Authority: `reports/cardrpg-big/skills-v5/ADDENDUM-SKILLDESIGN.md`, timestamp03:40UTC as supplied by the user. These amendments resolve design gaps; original acceptance gates and denominators are unchanged. All changes require skillsV5; fallback behavior stays byte-identical.

- Cinnamon **Comfort cup** heals the weakest living ally80 and grants1Warm; adjacent living allies receive40% of that heal (base32). Warm remains on the main patient. New ally-splash landing order is weakest patient then adjacent formation neighbors. Bitter and normal heal modifiers apply per recipient.
- Cinnamon **Second serving** revives a fallen ally at40%HP once per battle when available. With no available revive it heals every living ally35 and grants1Warm each. The old revive-only kit left a skill unused in healthy battles and had no multi-ally skill; the revised kit visibly sustains Burn crews without requiring artificial casualties.
- Singleton bosses begin with two existing Binding Threads; singleton elites begin with an existing helper. Boss phase changes add one or two helpers; exact TRAIN-selected counts and caps are recorded with the candidate. Thread defeat frees its own knot; other sources remain. The existing boss-finish rule retires linked helpers. Enemy identities, automatic battle flow and 45–90s pacing gate remain.
- Policy and cooldown tuning may improve shape, status/reaction and skill-use diversity within the existing combo roles. Black cup's rejected Mark-strike power trial stays rejected. Every named crew's eight keyword coverage, matched-power5–60%skill shares and distinct same-role top-two shape/status patterns are reported, including misses.

Candidate-specific values and before/after results are in S5 registrations and FIXLOG.md. This amendment grants design authority; it is not evidence that pending candidates or numeric gates pass.

### TRAIN design3 amendments (S5, 2026-11-09)

Selected after three registered fixed-prefix candidates: Black cup cooldown2 (power55 unchanged); Ink thread and Silk nick cooldown1. Apron crossing shields its ally row55 and Links it, swapping only the main ally; Bread cover shields its row65; Decanted moon transfers to the main ally and shields its row45 with Glaze; Sideboard step adds shield65+Warm; Split ember power115 before the existing60%row multiplier. Automatic policy values actual pending prevention, future Mark hits and Spread. These remain provisional until fullTRAIN/compatibility checks; no rejected Mark-strike is restored.

Existing Button Guard opens with Warm; Teacup Healer opens with Regen and Marks its ordinary attack target; Binding Thread applies Shred and Dazes on its signature. These provide opposing keyword contexts without making the cat kits identical. Opening buffs do not refresh on every action. Full before/after and unresolved gates are recorded in reports/cardrpg-big/skills-v5/s5/SELECTION.md.
