# Lantern Cat Café: squad combat review and next development direction

Date: 2026-11-05. Reviewed candidate: `0b925536685512a0672a784fcfffe80097a0a821`, worktree `/Users/bao/taskbar-hero-gameplay2`.

Status: design proposal, not implemented. This review responds to the user's latest request to inspect, score, think through, and propose further development. The earlier gameplay-pass prompt and delivery reports are historical context, not a new instruction to execute their five-hour implementation/release workflow.

## Conclusion

Develop an idle squad RPG with three genuinely independent cats fighting groups of enemies. Keep the warm household setting and existing desktop navigation. Rebuild the combat presentation and simulation together around targeting, distinct abilities, and visible cooperation. A satisfying short battle should come before expanding the catalogue or adding another progression subsystem.

The current candidate has improved presentation and more progression choices, but the player-facing combat is still shallow. The largest gap is between rules described by UI text and actions visibly performed by characters. More particles or item names alone will not resolve that gap.

## Review scope and evidence limits

- Read the latest handoff, delivery report, design notes, art bible, combat rules, renderer, Sample reducer/UI, class and item registries, and layout metrics.
- Inspected the supplied cropped screenshot. It only shows a small part of the header/stage, so it cannot establish the quality of the entire combat scene.
- Opened the running local candidate at `http://127.0.0.1:5391/?demo&coach=off#home`, reviewed the desktop Home, Map, boss replay and Bag; then inspected the opt-in Sample Patrol, Wardrobe, and boss presentation. Desktop observations included 1440×900 and 1280×720. These were exploratory reviews, not a full breakpoint audit.
- The main-game exploratory Rogue boss attempt at level 16 / Power 91 lost in 10.5 simulated seconds against the recommended Power 266. This was an existing guest save with equipment unequipped, not a controlled balance sample; it illustrates the readiness communication problem, not a measured class win rate.
- Sample exploration used an existing local save, including its Daring tier and mixed kit. The debug query was present but no jump, grant, or time-advance control was used. Neither this session nor the earlier scripted runs establish human enjoyment or retention.
- No runtime source, asset, rules, server, contract, or deployment change was made for this review. No test-suite rerun is claimed. Previously reported test/performance figures remain historical evidence only.

## Current score

Subjective product-design rubric: 5 means functional but repetitive; 7 means coherent and reasonably engaging; 9 requires sustained, readable, varied play demonstrated with players. Categories have equal weight. This rubric evaluates the broader squad-RPG direction requested now and is not comparable with the earlier 8.56 Sample iteration score.

| Dimension | Main candidate | Local Sample | Reason |
|---|---:|---:|---|
| Combat and encounter depth | 5.0 | 6.5 | Main fights are sequential. Sample adds choices and counters, but most ordinary encounters are route decisions and boss responses repeat. |
| Abilities, animation, impact | 4.5 | 5.0 | Existing attacks, numbers, flashes and tells help; ability-specific movement and effects remain weak, especially in Sample. |
| Art and visual identity | 6.5 | 6.5 | Warm palette and household theme work; silhouettes, sprite detail and motion integration still need art direction. |
| Layout and readability | 7.5 | 7.5 | Main navigation and hierarchy are established. A larger cast needs a different arena composition; Sample adds a second navigation/economy layer. |
| Gear and build choices | 6.0 | 7.0 | Main has breadth but much of it is rarity/stat variation. Sample sets and kit comparisons add purpose. |
| Progression and reasons to return | 6.5 | 7.0 | Goals, collection, crafting and return summary help. Main boss accessibility and reliable early equipment access remain concerns. |
| **Equal-weight mean, rounded** | **6.0** | **6.6** | Design judgment, not a measured retention result. |

An 8–8.5 experience is a reasonable next development target, not a predicted or achieved score.

## Findings that change the plan

1. **The deeper systems are separate from the default main game.** [packages/game-rules/src/config.ts:11](../../packages/game-rules/src/config.ts#L11) leaves both `originalEconomy` and `cafeAdventure` off. The Sample's equipment, patches, mastery and boss counters do not upgrade the verified main game. The next phase must include an integration design, not another disconnected final destination.
2. **Multiple enemies require real simulation support.** [packages/game-rules/src/v2/combat/fight.ts:6](../../packages/game-rules/src/v2/combat/fight.ts#L6) explicitly calculates one monster analytically. `apps/web/src/game/stage/StageScene.ts` holds one `cat` and one `monster`; its plans are sequential. Drawing six monsters would not supply six health pools, targeting decisions or meaningful area damage.
3. **Some existing class concepts cannot express their full value.** There are seven classes in `v2/content/classes.ts`, including cleave, mark, volley, burn and poison. `v2/combat/stats.ts` explicitly excludes cleave's splash value from the single-target damage multiplier. Groups would give these identities a stronger purpose.
4. **Boss presentation breaks physical causality.** [apps/web/src/game/arena/ArenaScene.ts:50](../../apps/web/src/game/arena/ArenaScene.ts#L50) and `:53` place the cat and boss at fixed x=110 and x=380. `:120` plays an attack pose without a melee approach. `:124` represents arrow, bolt and flask as differently colored circles. It is difficult to feel a sword connecting or recognize an ability by shape.
5. **Sample combat art barely performs the rules.** [apps/web/src/cafe/CafeAdventure.tsx:73](../../apps/web/src/cafe/CafeAdventure.tsx#L73) uses a fixed warrior idle sheet for Mochi. The corresponding CSS adds a two-pixel breathe transform, but no background-frame playback. Boss sheets change with phase state; damage is represented primarily by floating numbers and meters. [packages/game-rules/client/cafe.ts:200](../../packages/game-rules/client/cafe.ts#L200) advances boss damage once per second. Its rules are richer than its visible actions.
6. **Boss variety is limited by a shared response structure.** All five Sample bosses cycle named Dodge/Break/Interrupt moves through the same reducer. Phases mostly increase damage and shorten tells. Names and order change more than spatial problems or target priorities.
7. **Equipment is not numerically scarce in the catalogue.** `v2/content/items.ts` generates 35 weapons + 60 armor pieces + 60 accessories = 155 entries, across nine equip slots. Many entries share base stats and differ by rarity or appearance. Sample's 48 is an inventory limit, not 48 uniquely designed mechanics. The issue is access and consequential variety, not simply item count.
8. **The current stage scale is inherited from a strip.** `StageCanvas.tsx` fixes logical scene height at 96; `layout/metrics.ts` scales that scene by whole numbers. This preserves pixel edges but does not add source detail or space for six independently readable actors.
9. **Rewards do not necessarily create decisions.** The previous report records one main idle seed receiving no gear in ten minutes. More frequent currency acknowledgments can reduce apparent waiting while leaving the player's options unchanged.
10. **Hero identity is inconsistent across surfaces.** In the inspected main view, the Rogue's dark combat cat and the orange Mochi portrait differed. A squad needs matching portrait, silhouette, weapon and status identity per cat.

## Proposed play model

Prepare a squad and tactics → fight a short sequence of enemy groups → choose a route or useful reward → adapt to an elite/boss → improve one hero or a team interaction → unlock another household room or recruit.

Use two compatible play modes: full-screen adventure for readable fights and optional intervention; compact idle view for low-attention farming. Both must use the same progression rules. The compact view may simplify rendering, but cannot silently grant a different economy.

Auto mode must be a legitimate way to complete ordinary progression. Active input offers priority targeting, saving an ultimate for a dangerous cast, and better control. It must not become a requirement to press a button every few seconds. New players should discover systems progressively; the review prototype can start with three heroes to expose the full mechanic immediately.

### Squad

- Three active cats, each with its own HP, target, cooldowns, equipment and role. Keep the seven existing class identities as a content pool; implement three fully first.
- Simple front/rear formation with staggered positions. Melee actors approach a valid contact position, ranged actors maintain a firing position, and everyone has a stable home anchor. Avoid a full free-movement/pathfinding system initially.
- Start with Guardian, Witch and Alchemist for a visible guard/control/damage/healing demonstration. Then add Rogue and Archer to prove burst and focus-fire alternatives. Tank/healer/DPS is a helpful starting composition, not a mandatory party recipe.
- Use shared catch-up XP or a level floor for newly recruited cats so changing a squad does not require repeating the entire grind. Preserve individual gear identity while allowing safe gear transfer and saved team loadouts between fights.
- Tactics are a few readable presets: protect allies; target the backline caster; hold healing for an injured ally; save ultimate for a marked opening. Avoid a programming interface in the first version.

### Enemy groups and encounters

Prototype targets, not final balance values: 3–6 simultaneous ordinary enemies, with a cap of 8 in special waves. A short encounter uses three authored waves, not repeated copies of one enemy. Early wave duration target: 15–30 seconds; short encounters approximately 45–90 seconds, including transitions.

Build enemy roles that create different decisions: front guard, fast flanker, ranged attacker, support/healer, armored elite, and a telegraphed charger. Compose them deliberately. An armored guard plus a healer is a targeting problem; fragile enemies around a caster are an area-damage opportunity. HP persists across waves within the encounter, with clear between-encounter recovery so support has value without creating an endless failure spiral.

Use a total encounter threat budget. Do not multiply one-enemy damage by six and call it balanced. Limit simultaneous heavy windups, offset routine attacks, cap spawned adds, and make enemy focus fire survivable. Give every enemy a persistent ID, state and reward contribution; rewards are settled once against an encounter budget, not once for every displayed effect.

Suggested room structure: normal group → choose safe/reward/challenge branch → elite group → rest or temporary modifier → boss. A route changes enemy composition or a visible tactical condition. It should not be only a different percentage on the same reward button.

### Skills and cooperation

Per prototype hero: basic attack, two cooldown abilities, one ultimate, and one passive. Three heroes therefore provide nine non-basic activated abilities plus three passives. Normally the two cooldown abilities are automatic; the three ultimates fit a simple bottom bar with auto/manual behavior.

| Hero | Cooldown abilities | Ultimate | Readable cooperation |
|---|---|---|---|
| Guardian | Shield Bash: strike/stagger; Rally: taunt and guard | Hearthwall: a broad defensive barrier | Groups pressure onto a protected front and creates a safe casting window. |
| Witch | Thread Snare: group control; Ember Orb: visible area burst | Lanternstorm: several clearly marked strikes | Control holds a pack in the damage area; fire has persistent, capped burn. |
| Alchemist | Milk Flask: heal the most injured ally; Moss Flask: protective ground patch | Nine-Lives Shelter: team shield and cleanse | Stabilizes the squad after an enemy volley; the landing point and protected area are visible. |

These are original working names, not implemented content. A passive must have an observable trigger, such as a guard icon/shield appearing after a successful interrupt. Avoid long lists of invisible percentage passives.

Example readable sequence: Guardian intercepts a charger → Witch snares the guard and two small enemies → Ember Orb lands on that group → Alchemist's flask arcs to the injured Guardian. Target priority can instead eliminate a healer before committing the area burst. This creates choices before and during the battle.

Skill variants should change behavior: a piercing projectile versus a splash projectile; a large single heal versus a smaller group heal; longer control versus more damage. Gear can specialize these choices later.

### Bosses

Use one main boss; adds are occasional mechanics rather than mandatory population. Make the first two boss designs fundamentally different before creating five reskins.

- **Yarn Giant:** a directional sweep, visible threads that restrain a hero, and a small add phase. The player chooses whether to free an ally, clear adds, or burst during an exposed knot. Its silhouette and animation tell the move before UI text confirms it.
- **Vacuum Beast:** a suction lane, debris projectiles and a motor cast that can be interrupted. Overheating creates a damage opening. Threat comes from space and timing, not merely higher HP.
- Reserve major phase changes for genuinely new behavior. Give bosses a break/stagger resource and resistance to repeated control so permanent stun is not the optimal universal strategy.
- Explain a loss specifically: backline hit by two volleys, healing exhausted, no interrupt available, or insufficient damage before enrage. Offer an actionable adjustment and a short retry cycle.

## Art, effects and animation as one deliverable

Retain the dusk/amber palette and household setting. Increase authored character detail rather than enlarging tiny art indefinitely. Prototype a 48–64-pixel character body with enough frame padding for weapons, and a 96–128-pixel boss body. These are starting art budgets; judge them at their actual display size before committing the full roster.

Pixel art can be crisp and detailed. Nearest-neighbor scaling preserves edges, but it cannot invent anatomy or silhouette information. Use consistent source pixel density, integer display scaling and snapped resting positions. Resize the logical view/letterboxing when needed instead of stretching the entire interface. Do not solve coarseness with blur or smooth upscaling.

Every hero needs coordinated idle, move, basic attack, two casts, ultimate, hit, defeat and victory states. Produce shared body/gear anchors, contact frames, projectile launch points, target impact points and timing metadata. Frame count follows action readability; it is not a quality score by itself. AI concept art can inform an original design, but a generated sheet still requires consistency cleanup and in-engine validation.

Every damaging or supporting skill requires an effect contract:

1. Recognizable anticipation/body pose.
2. Release, motion or projectile with a distinct silhouette.
3. Impact at the correct target and correct simulation event.
4. Hit reaction, HP/status change, and appropriate number.
5. Brief residue/recovery that communicates duration without obscuring the next action.

Initial timing ranges for experimentation: 150–350ms anticipation for routine skills; 800–1500ms or longer for major telegraphs where player response matters; brief 40–70ms presentation hit-stop on exceptional impacts only. These are hypotheses to tune, not measured requirements. Reduced motion retains visible zones, icons, target outlines and timing information.

Use shape, motion and icon plus color: arc slash, arrow trail, expanding burst, marked healing circle, directional danger lane. Layer enemy danger above environmental decoration. Restrict simultaneous bright effects and combine routine damage numbers; rare large effects should remain special. Provide sound effects as an optional later polish layer, after the visuals already communicate every action.

## Layout direction

Keep the left rail and top resource HUD. In Adventure, make the central battlefield approximately 65–75% of the content width, with the right panel showing the current wave, selected enemy and compact goal. Replace the large persistent hero summary with three compact party cards below the arena; show HP, statuses, cooldown readiness and ultimate controls there. Full gear/build information belongs in an inspect drawer or preparation screen.

At 1280×720, reduce header repetition, collapse the verbose log by default and keep the battlefield and all three ultimate controls visible together. Design for 1440×900 and 1920×1080 without simply magnifying all sprites. Show arena depth through staggered rows, not by hiding front units behind effects. Check overlaps, target selection, health bars and keyboard focus with the maximum planned cast on screen.

Unify the final experience so the player does not have to reason about two separate bags and two different boss systems. Temporary Sample labeling stays during development until the progression and server integration are real.

## Stats, equipment and progression

Expose HP, attack, defense, attack speed and crit in the basic view, then skill-specific details such as cooldown reduction, healing and break strength when relevant. Preserve the current diminishing-return defense concept. Add explicit limits for cooldown reduction, attack speed and chained control. Define additive/multiplicative order so buffs cannot accidentally compound across three heroes.

Treat Power as a rough summary. Team damage, survival, healing, control coverage and enemy matchup should drive recommendations. A lower-Power item that completes a control or sustain build must not be automatically marked bad. Show skill-relevant comparison and team effects, not only one larger number.

Prioritize a small number of distinctive equipment effects over increasing the 155-entry catalogue: a projectile pierces; the last heal leaves a small shield; a guarded hit charges a break attack. Start with a few sets supporting area clearing, boss burst and sustain. Tune set bonuses so mixed gear remains viable and collection does not become compulsory uniformity.

Improve early access: a predictable first useful weapon/defense choice, targeted crafting for a missing role, and visible sources for desired items. Any guarantee must be part of accepted server rewards when integrated. Do not grant extra economic rewards in a client-side preview.

Additional high-value features:

- A training arena to test a squad against single-target and group scenarios, with a concise damage/heal/shield breakdown.
- Defeat review and a retry shortcut that points to a meaningful adjustment.
- Recruitment through chapter goals and small character stories; no dependence on a gacha system to make squad formation work.
- Cafe restoration as visible long-term progress and a home for recruited cats.
- Bestiary entries that teach enemy behavior and identify farming sources, rather than only counting completion.
- A short expedition with temporary choices, added only after the core fight is enjoyable.
- Honest offline catch-up using the selected squad and capped rewards, without running a costly full animated simulation while hidden.

Defer PvP, guilds, multiple new currencies, large random skill trees and a broad item expansion. Their value depends on a convincing core battle.

## Implementation architecture and integration boundary

Extend the shared game-rules approach with a pure multi-actor combat model: actor IDs, sides, HP, status instances, target selection, cooldowns, wave definitions, per-fight RNG, and a versioned command/event log. React owns preparation and HUD; Phaser presents the authoritative combat events.

Event types should identify source, targets, timing and resolved outcomes: cast start, projectile release, impact, status application/expiry, heal, shield, death and wave transition. Rendering must never recalculate damage. Presentation hit-stop must not change simulation time. Tie target death/retarget rules and simultaneous effects to deterministic ordering.

Share one event-driven battle presenter between ordinary encounters and bosses so a skill does not appear correctly in one mode and as a generic number in another. Reuse palette, content IDs, original art tooling and useful existing effect pooling; replace the one-cat/one-monster state assumptions.

Begin as a local, explicitly labeled prototype with no new server grants. Integrating three heroes, group rewards, equipped items and skill commands into verified play requires a versioned server/replay/state plan and save migration. Keep old saves/replays readable during transition. A local successful fight must not silently become a server-accepted reward. No backend/contract mutation or release is part of this design review.

## Development order and completion criteria

| Stage | Concrete delivery | Gate before expanding |
|---|---|---|
| 1. Combat slice | Three heroes; five ordinary enemy roles; three-wave encounter; one distinctive boss; nine activated abilities and three passives; coherent temporary art and full effect timing. | Groups have real targets/HP; front-line contact and ranged impacts are visible; full auto works; active targeting changes outcomes; two compositions are viable. |
| 2. Art and arena quality | Final art for those three heroes and the initial enemies, all animations, effect palette, three desktop compositions and compact idle mode. | A viewer can identify who acts, whom it hits and what changes without reading a combat log. No clipping or unreadable overlap in a crowded wave. |
| 3. Builds and progression | Behavior-changing items, a few sets, recruitment, squad presets, early reward choices, training and defeat review. | Different builds change target/timing/skill behavior; changing teams does not require punitive duplicate grinding. |
| 4. Integration and breadth | Versioned save/server/replay integration, reward validation, then more existing classes, rooms, bosses and optional expeditions. | Same inputs reproduce the same result; rewards stay within accepted budgets; old saves have a tested migration; player sessions show the core remains enjoyable. |

Prototype testing must cover group target selection, AoE boundaries, projectile/target death, heal/shield ordering, interrupt resistance, wave rewards exactly once, and deterministic replay across update rates. Stress the planned maximum enemy count rather than only a duel. Measure renderer frame time, hidden behavior and battery on the target machine; prior single-enemy performance is not evidence for a squad scene.

Use a small human pilot (for example five players, explicitly a usability sample, not retention research) with first-session and returning-session tasks. Check whether players understand one combo and one enemy counter, can distinguish two builds, and voluntarily replay after a defeat. Compare auto and active policies across multiple seeds. Keep numerical results separate from subjective fun scores.

The next milestone should be a complete playable combat slice demonstrating one memorable group fight. Broader content production should follow that result.
