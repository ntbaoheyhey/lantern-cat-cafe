# Visual research and baseline audit
2026-11-04 · Base 1eefc3e + docs #270. Desktop only. Candidate, not live.

## Direct audit
Fresh local demo captures at 1280×720 and 1920×1080 are under `docs/visual/img/before-*`. Existing fixture seeds are used; all non-loopback network requests are blocked. Market uses the existing explicitly labeled local mock-wallet fixture, with no transactions. In v2, the progression workflow is craft/equip; there is no separate Upgrade screen. The gear-detail view is labeled accordingly in the comparison, and classic Upgrade is a supplemental capture. Still captures freeze virtual time and CSS animation; moving scenes are assessed separately.

Rubric order: focal point / harmony / readability / depth-light / character appeal / motion-feedback / consistency. These are subjective self-assessments, not user research.

| View | Before scores | Mean | Main issue |
|---|---|---:|---|
| Home / living room | 5 / 6 / 8 / 3 / 6 / 5 / 6 | 5.6 | Cat loses to panel chrome; flat oval lighting |
| Inventory | 5 / 6 / 8 / 4 / 5 / 5 / 6 | 5.6 | Uniform card weight; weak art backing |
| Boss fight | 6 / 6 / 8 / 4 / 6 / 6 / 6 | 6.0 | Tiny arena and little anticipation |
| Forge | 5 / 6 / 8 / 4 / 4 / 5 / 6 | 5.4 | Empty central card with tiny icon |
| Market | 5 / 6 / 8 / 4 / 5 / 5 / 6 | 5.6 | Flat table and generic detail panel |
| Gear detail (v2 upgrade path) | 5 / 6 / 8 / 4 / 5 / 5 / 6 | 5.6 | Selected object needs prominence |
| Relic detail | 6 / 6 / 8 / 4 / 6 / 5 / 6 | 5.9 | Small collectible, minimal rarity language |
| Forge reveal | 6 / 6 / 8 / 4 / 5 / 6 / 6 | 5.9 | Result changes without a strong visual event |

Ten causes of dullness: (1) diffuse concentric ellipses instead of a motivated light; (2) uniformly dark wall/floor; (3) oversized empty display area; (4) small focal art; (5) equal borders around primary and secondary cards; (6) repetitive plum surfaces; (7) no atmospheric foreground; (8) limited expressive idle face; (9) low emphasis on rarity hierarchy; (10) weak physical connection between forge action and result. Existing actors, hit numbers and distinct household bosses are useful foundations, not absent features.

## Principles studied (text only; no asset downloads)
- [SLYNYRD — Color Palettes](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes): shift hue across material ramps and reduce saturation near bright highlights. We author a separate 32-color palette; none is sampled.
- [Pedro Medeiros — Outlines](https://www.patreon.com/saint11/posts/outlines-14106192): use outlines deliberately at low resolution; preserve a strong outside silhouette without outlining every internal cluster.
- [Unity — 2D lighting and mood](https://unity.com/how-to/use-2d-lights-unity-set-mood): separate lighting by depth layer; reserve illumination for the intended subject. Applied as cheap baked layers plus gradients, without adding a renderer.
- [Jan Willem Nijman — The Art of Screenshake](https://www.jwaaaap.com/): feedback layers can transform perceived impact without changing mechanics. Here: capped shake, color-coded numbers, short flash and impact/settle, with a calmer fallback.
- [NN/g — Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): scale, contrast and grouping determine reading order. One visual anchor per screen; smaller secondary borders.
- [Cats Protection — Body language](https://www.cats.org.uk/help-and-advice/cat-behaviour/cat-body-language): relaxed eyes, slow blinks and an upright tail convey a friendly cat. Used for original expressive poses, not anatomical or copied art.

## Ranked work (impact / effort)
1. Layered room + motivated lighting (very high / medium).
2. Mochi portrait + slower expressive idle (high / low).
3. Forge hearth / selected-art staging (high / low).
4. Three surface levels + rarity frames (high / medium).
5. Boss telegraph, chip HP and bounded impact (high / medium).
6. Reward reveal / level ring (medium / low).
7. Chapter mood variations (medium / medium; shared generator).
8. Sparse ambience and foreground drift (medium / low).
Backlog: completely redrawing all monsters, bespoke chapter furniture animation, full HUD counter interpolation, new original audio, human blind preference testing. No balance or contract work is in scope.
