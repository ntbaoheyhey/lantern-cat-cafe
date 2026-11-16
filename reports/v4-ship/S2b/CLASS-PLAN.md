# Class implementation plan — selected front35 implementation

Research and current matrix: LEARN/S2b.md, S2b/current-matrix.json, S2b/selected-holdout.json. Product unchanged until the baseline completes.

- Add a required CombatClass union to Cat, Enemy and runtime Actor, with catalog mapping independent of existing role/flavour/crew. Preserve all non-healer identities and stable action clocks.
- Rebuild all healer basics and Marigold's offensive active skill as allied healing/protection; strip hostile and non-restorative effects from all healer modes, not only the V5 overlay. Retain revive as restoration. Teacup must never fall through to a damage basic when suppressed or impaired.
- Route only healer patient selection through the winning deterministic selector. Keep hostile weakest-target and non-healer support selection unchanged. Explicitly handle all-full-health teams and stable ties.
- Guard indirect outgoing damage attributed to healers, including reflected/riposte damage, so the runtime zero-damage assertion covers more than catalog effects.
- Practice Cushion maps to melee (its existing bump is contact). All13enemy rows and12cats are covered. Enemy role `ranger` covers Needle Moth and Pollen Scout; `thread` is ranged.
- Existing UI surfaces: depth/CompanionCard.tsx (shared cards), depth/TeamCollection.tsx, ui-v3/CatDetailsA6.tsx and ui-v3/FormationToolA6.tsx. Add a compact shared icon+text class badge, accessible name, and label in the existing Guide (ui-v3/FieldGuideA6.tsx and guide-a6.ts; replace obsolete Teacup attack prose). Do not edit ART battle presentation files. Scheduled A10 art can replace existing icon-set glyphs after merge.
- Guide copy: Melee — Approaches enemies to strike. Ranged — Attacks from a distance. Healer — Restores health, removes harmful effects and protects allies. Never deals damage.
- Meaningful checks: enumerate every catalog unit; enumerate base and transformed healer kits; exercise normal/suppressed/impaired enemy healer turns; test deterministic patient rules and full-health ties; replay real fixtures; verify first-loss and boss timings; E3–E5; desktop class visibility/overflow; full G-REG; only then record the one new baseline and notify ART.

The first ratio35 probe kept all intended-power fixtures winnable with zero healer damage but increased the seed1 boss to226.5s. No class/timing target is considered passed. Offensive class balancing may be necessary; test its effects on first loss before selecting numbers.

Selected after independent holdout: wounded-front then HP fraction with stable ID tie, basic heal35; Yarn Giant HP1292. No enemy-attack multiplier. Old A6 timings are not current gate evidence.
