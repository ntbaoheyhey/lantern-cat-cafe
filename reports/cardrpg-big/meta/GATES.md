# M self-check
REFERENCE: ../memory/PROMPT.md lines119–127, PLAN.md, screens/checks.json

| Brief requirement | Status and measured evidence |
| --- | --- |
| Shared collectible card with four original frames, real2× portrait, role, stars, level and power | PASS shared CompanionCard used by collection, formation, invitation result and battle result. Linen, enamel, foil and gold frames differ in material and border. Epic foil and legendary frame animate. Existing F2 portrait measurements remain the sharpness evidence |
| Collection with owned/locked state, role/rarity filters and detail | PASS twelve cards, ownership and healer filters checked with real clicks at1280×720,1440×900,1024×600. Rotation reaches180°. Detail includes four skill previews, stats, gear and awakening |
| Three-cat team, front/back drag/drop, hints, power, best team and saved presets | PASS real drag/drop and preset restoration at three sizes. Best team selects the strongest owned guardian, offensive companion and healer. Ten focused cases cover model sockets, presets, comparisons and team logic. PASS all three card bottoms654.375px at720/900px viewports and587.53125px at600px |
| Every equipment template visible, legendary geometry, paper doll, comparison and transactions | PASS128 templates×3 starter models=384 visibility cases, each above8 changed pixels at one of three angles. Minimum450 pixels in the current measured artifact. Twelve named geometries and36 design/model combinations have visible/hidden captures. Real equip/enhance/reforge/salvage checks pass at three sizes |
| Equipment/materials/consumables/collectibles/currencies, sorting/filtering and rarity colours | PASS five categories captured at three sizes. Gear has slot/rarity/set filters and rarity/enhancement/name sorting. Binding labels use the existing account rules |
| Cozy live hub, three idling cats, next goal, quests and clear entry points | PASS three correctly identified models in all three home captures, chapter/power hint and existing daily progress. Watch a battle now stays accessible in the first viewport |
| Reuse existing ten destinations | PASS sidebar retained. Team, collection, equipment, invitations and home reuse their existing route IDs. Prepare/Result remain phaseA additions |
| Reduced motion and offline operation | PASS saved preference disables frame/foil animations and scene motion.33 screen captures record0 page errors and0 remote requests |
| Navigate while model lighting compiles | PASS20 real-click cases,10 native and10 CPU4. Each detaches the canvas, waits for warmup, disposes once and releases its context.0 page errors and0 early disposals. lifecycle/checks.json |
| Typecheck, lint, unit, E2E and build before push | PASS m-final passes1679web,903rules and421E2E, plus typecheck/lint/build. Rules retain2 expected failures and11 skips. ../validation/m-final.json |
| Rerun F0 harness, avoid a new hitch | NOT YET. Cold7,720 skill matrix and five profile reruns are queued after validation and baseline sims. F5 pageMAX300ms remains the comparison |

## Visual review and corrections
REFERENCE: screens/1280-team.png, screens/1280-cafe.png, screens/1024-collection.png, ../validation/m-focused*.log

The team originally placed its formation below the fold. Moving the formation above presets and skill explanations makes the principal decision visible sooner. Screenshot review found a stronger legacy portrait selector defeating the compact height. The corrected selector now has a three-card first-viewport assertion in meta-check.mjs.

The narrow collection detail preview remains small. The home tableau uses the existing cafe stage and has prominent flat contact shadows. These are qualitative weaknesses for F7 review. The current proof covers equipment on the three starter models. Broader visual evidence for the other nine companions remains open.

## Reproducibility and saved choices
REFERENCE: ../../../tools/cardrpg-big/meta-check.mjs, ../../../tools/cardrpg-big/meta-gear-measure.mjs, ../../../tools/cardrpg-big/meta-lifecycle.mjs, ../../../assets/provenance/cardrpg-big-meta.json

Browser team presets use a versioned UI preference with validated ownership and rows. Offline presets persist for the current visit, matching the storage-free demo. All team and equipment changes use existing rules commands. Source-authored geometry and CSS provenance record the twelve designs and four card materials.

The initial equipment pilot retains its shader-disposal error under gear-pilot-disposal. The corrected renderer stops drawing/input immediately and retires GPU resources after shader preparation settles. Early-navigation coverage records the actual retirement order.
