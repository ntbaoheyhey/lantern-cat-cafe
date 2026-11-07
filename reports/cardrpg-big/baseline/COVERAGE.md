# Feedback coverage audit
REFERENCE: reports/cardrpg-big/baseline/screens/1280-battle.png; reports/cardrpg-big/baseline/screens/1280-hub.png; apps/web/src/game/cardrpg/depth; packages/game-rules/src/cardrpg/depth

Scores are the primary agent's initial visual assessment on a ten-point scale. Runtime measurements accompany this audit in baseline/summary.json. Each destination is reachable from the cafe sidebar. The first battle exposes manual choices and optional Auto.

| User ask | Existing implementation and visible entry | Initial score | Gap to address |
| --- | --- | ---: | --- |
| Effects and motion | depth/assets.ts maps 48 skills to five recipes. Battle scene uses role clips. [Battle](screens/1280-battle.png) | 4 | Unique action silhouettes and gestures, starting with Mochi, Soot, Clover. |
| Sharp images | turn3d/scene.ts has DPR cap 2 and anisotropy 8. post.ts Medium has zero MSAA samples. [Fixed crops](sharpness/dpr1-fixed.png) | 5 | Measure crop sharpness, retain antialiasing in Medium, improve face readability. |
| Layout, scale, faces | Battle.tsx has top order, fixed enemy cards, party cards and 190px manual panel. [Battle](screens/1280-battle.png) | 4 | Dominant stage, compact anchored plates, restrained facing, three presets. |
| Turn clarity and lag | model.ts waits for manual input. Old performance starts after warmup. [Tutorial](screens/1280-tutorial.png) | 4 | Automatic controller, full cold-open/click timings, MAX and hitch counts. |
| Features beyond battle | Pages.tsx and RunMap.tsx expose ten destinations and three chapters. [Hub](screens/1280-hub.png) | 6 | First-screen watch action, visible next goal, Prepare and Result. |
| Equipment | Inventory shows equip, enhance, salvage, reforge, tailoring and set counts. [Equipment](screens/1280-equipment.png) | 6 | Paper doll, before/after comparison, coherent rarity presentation. |
| Items | Gear, currencies, shards, mastery materials and supplies exist across screens. [Equipment](screens/1280-equipment.png) | 5 | Categorised inventory with sources and uses. |
| Rarity tiers | 128 templates, four rarities, affixes and legendary effects. [Collection](screens/1280-collection.png) | 5 | Frame materials, filtering and tier power evidence. |
| Balance | Prior sims show substantial roster spreads and smart-policy dominance. [Team](screens/1280-team.png) | 5 | Controller-specific reruns and gear-tier comparison. |
| Invitations | Earned stamp pull, exact odds and pity appear in Invitations. [Invitations](screens/1280-invite.png) | 5 | Ceremony, ten-pull access and visible history. |
| NFT-value limits | Utility.tsx Relics panel shows local design caps and effort conditions. [Relics](screens/1280-relics.png) | 6 | Consistent binding labels and help. Preserve read-only Fuji code. |
| Original identity | Original cafe models, yarn enemies and research-backed item loops. [Hub](screens/1280-hub.png) | 6 | Layered cafe scenery and skill shapes matching their names. |

REFERENCE: docs/design/cardrpg/RESEARCH-ADDENDUM-AUTO.md; apps/web/src/game/cardrpg/depth/assets.ts; apps/web/src/game/squad/turn3d/post.ts; reports/cardrpg-depth/sim/roster-broad.json

Source audit identifies 48 total skills including 12 ultimates. The brief's separate counts of 48 plus 12 overlap. Testing will cover all 48 actual skills and every authored enemy. The implementation preserves that catalogue.

Fresh path evidence includes 45 screen captures at three sizes, with zero console errors, remote requests or storage writes. Those path fixtures use explicit unlock shortcuts to inspect later chapters and equipment. The timing runs start from the untouched starter account. Detailed source/timing evidence is in README.md.

## Lane A checkpoint after I caps and gear balance
REFERENCE: ../items/CHECKPOINT.md, ../memory/STATE.md, coord/cardrpg-big/OWNERSHIP.md on ai/codex-cardrpg-big-sync

| Brief point | Current status | Evidence and next owner |
| --- | --- | --- |
| Effects and motion | Starter20actions/30motion pairs and31effect recipes/465pairs verified. Nine cats and enemy/boss coverage pending | ../motion/variety.json, ../effects/verified/uniqueness.json. Lane B |
| Sharp images |2/10crop targets pass. Remaining8miss | ../sharpness/README.md. Lane B |
| Layout, scale and facing |Stage78.889%viewport,2745poses with0overlap/crop, maximum facing55degrees. Scale band partial | ../layout/README.md. Lane B |
| Turn clarity and lag |Fully automatic controls, first/repeat castMAX33.4/16.8ms. M pageMAX250.1ms exceeds100ms | ../meta/PERFORMANCE.md. Lane B |
| Features beyond battle |Ten destinations plus Prepare/Result,33screen captures pass | ../meta/screens/checks.json. Lane A narrow-collection follow-up |
| Equipment |384model/template visibility cases pass, paper doll and transactions verified | ../meta/gear/summary.json. Lane A |
| Item organisation |Five inventory categories, source/rate/sink table and local collectible help implemented | ../../../docs/design/cardrpg/ITEM-TIERS.md, ../items/screens/checks.json. Lane A |
| Rarity tiers |Four frame styles,12legendary geometries. Maximum single legendary9.63%of bare starter display power | ../items/BALANCE.md. Lane A tier separation continues |
| Balance |21/48adjacent tier steps improve,27tie.45-day heavy/casual earnedMAX2.17765×. Encounter length under existing-stat probes | ../items/summary.json, ../items/PLAN.md. Lane A |
| Invitations |Existing earned-only odds/pity. Ceremony/history preparation has11passing UI tests, wiring pending G | ../invitations/PLAN.md. Lane A, B2 entrance API requested |
| NFT-value limits |Two deterministic designs,25cap tests and2UItests pass.12real-click captures,0errors,0remote requests | ../items/CHECKPOINT.md. Lane A |
| Original identity |Existing research reused, original cafe assets and one-page auto addendum | ../../../docs/design/cardrpg/RESEARCH-ADDENDUM-AUTO.md. Both lanes within owned assets |

Scores will be reassessed during the sequential four-perspective review, using final integrated evidence. The initial scores above describe the baseline.
