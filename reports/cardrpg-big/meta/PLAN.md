# M presentation plan
REFERENCE: ../memory/PROMPT.md lines119–127, ../baseline/COVERAGE.md, ../../../apps/web/src/game/cardrpg/depth/Pages.tsx

Reuse depthStats, configureTeam, equipmentEffects and the existing gear transactions. One card presentation will serve collection, team, invitation reveals and result highlights. Original procedural rarity frames distinguish linen, blue enamel, violet foil and engraved gold. Existing 2× portraits remain the image source.

Reuse TurnScene for one active preview at a time. Home shows three idling companions. Collection rotates one model and loops an isolated F4 skill fixture. Equipment uses the same sockets and current instance appearance. Lazy preview creation will be measured from page opening. All additional rendering work must pass cold/frame gates.

Team formation supports row drop targets plus keyboard-accessible row selects. The Best team heuristic chooses the highest displayed-power owned cat in each role. Presets are three versioned browser UI preferences, validated against current ownership and applied through configureTeam. They contain team IDs and rows only. Offline presets last for the visit, preserving the existing storage-free demo contract. Blocked storage surfaces an explicit session-only message. Battle state remains authoritative in the existing save.

Inventory groups Equipment, Materials, Consumables, Collectibles and Currencies in its existing destination. Equipment gains rarity filters, sorting, paper-doll slots and stat deltas from the actual equip transaction result. Existing live Relic reading stays in its current panel.

F5 source7e054608 and frozen HTML4536494f remain the independent timing baseline while M is prepared. M validation/build/screenshots wait for the F5 measurement process to finish. M source is excluded from the F5 draft.

## Model equipment verification
REFERENCE: ../../../tools/cardrpg-big/meta-gear-measure.mjs, ../../../apps/web/src/game/squad/turn3d/gear-visuals.ts

Before capture, declare a visible-geometry threshold of at least8 canvas pixels whose RGB channel changes by more than8 when the equipped group is hidden. Sample model angles0 and±1.1 radians at DPR2 with a fixed scene clock and idle pose. Require one passing angle for each of128 templates on each starter model,384 combinations. Record the actual socket, geometry identity, all angle counts and scene budget. Save visible/hidden PNG pairs for each of12 legendary designs on each starter. These use isolated review accounts and do not alter a player save.
