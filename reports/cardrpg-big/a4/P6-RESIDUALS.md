# P6 residual map

Read-only residual map from the complete registered train and heldout receipts. Threshold >12 percentage points exactly matches acceptance. Counts describe sampled cells, not item prevalence among real players. No new seeds, battles or gameplay edits.

| Sample | Single-piece cells above12pp /2688 | Bare-build cells where both lose /2304 |
|---|---|---|
|train|31|2244|
|heldout|31|2232|

The all-loss bare-build cells cannot establish that an item is harmless. The coherent-kit extension supplies an informative comparison by adding the fourth slot to an existing three-piece set.

## Recorded heldout outliers
| Piece | Carrier / chapter | Wins before → after /500 | Paired gain | Maximum displayed share |
|---|---|---|---|---|
|bellsteel-charm-legendary|mochi / 3|30 → 497|93.4pp|2.986%|
|hearthloom-charm-legendary|mochi / 3|11 → 478|93.4pp|3.040%|
|bellsteel-charm-epic|mochi / 3|30 → 490|92.0pp|2.568%|
|hearthloom-outfit-legendary|mochi / 3|27 → 477|90.0pp|3.300%|
|bellsteel-outfit-legendary|mochi / 3|68 → 496|85.6pp|3.192%|
|bellsteel-outfit-epic|mochi / 3|68 → 492|84.8pp|2.641%|
|hearthloom-relic-legendary|mochi / 3|48 → 457|81.8pp|3.542%|
|hearthloom-charm-epic|mochi / 3|11 → 400|77.8pp|2.303%|
|hearthloom-outfit-epic|mochi / 3|27 → 398|74.2pp|2.399%|
|hearthloom-relic-epic|mochi / 3|48 → 391|68.6pp|2.711%|
|bellsteel-charm-rare|mochi / 3|30 → 369|67.8pp|1.840%|
|bellsteel-outfit-rare|mochi / 3|68 → 381|62.6pp|1.870%|
|bellsteel-relic-legendary|mochi / 3|192 → 495|60.6pp|3.355%|
|bellsteel-relic-epic|mochi / 3|192 → 490|59.6pp|3.003%|
|bellsteel-relic-rare|mochi / 3|192 → 477|57.0pp|1.876%|
|hearthloom-relic-rare|mochi / 3|48 → 322|54.8pp|1.811%|
|bellsteel-relic-common|mochi / 3|192 → 426|46.8pp|1.508%|
|bellsteel-charm-common|mochi / 3|30 → 250|44.0pp|1.475%|
|bellsteel-outfit-common|mochi / 3|68 → 282|42.8pp|1.506%|
|crumbweave-weapon-legendary|soot / 1|67 → 268|40.2pp|2.275%|
|hearthloom-charm-rare|mochi / 3|11 → 204|38.6pp|1.746%|
|hearthloom-outfit-rare|mochi / 3|27 → 218|38.2pp|1.813%|
|hearthloom-relic-common|mochi / 3|48 → 229|36.2pp|1.514%|
|hearthloom-charm-common|mochi / 3|11 → 121|22.0pp|1.486%|
|crumbweave-weapon-epic|soot / 1|67 → 170|20.6pp|1.698%|
|hearthloom-outfit-common|mochi / 3|27 → 130|20.6pp|1.512%|
|crumbweave-charm-legendary|soot / 1|152 → 245|18.6pp|1.958%|
|crumbweave-relic-legendary|soot / 1|91 → 179|17.6pp|2.135%|
|crumbweave-relic-epic|soot / 1|91 → 178|17.4pp|1.538%|
|crumbweave-weapon-rare|soot / 1|67 → 148|16.2pp|1.315%|
|emberfelt-weapon-legendary|soot / 1|9 → 77|13.6pp|2.957%|

## What this establishes
- All31 heldout outliers occur in the registered fourth-slot comparison: Hearthloom12, Bellsteel12, Crumbweave6 and Emberfelt1. They affect Mochi24cases and Soot7cases. These are sampled cells, not31 distinct items or a player incidence rate.
- Filling the missing slot changes the main stat, rolled affixes, any unique behavior and the four-piece set threshold together. The paired result establishes their combined effect; it does not isolate which component caused the gain.
- Hearthloom links an ally on Defend; Bellsteel grants Riposte and Shelter; Crumbweave adds detonation shield; Emberfelt adds first-Scald healing. These interactions are implemented in equipment-v4.ts and battle.ts. A small additive display estimate does not bound the effect of survival thresholds or automatic target choices.
- Two heldout cells tie at93.4pp: Hearthloom Legendary charm11→478wins and Bellsteel Legendary charm30→497wins. Their maximum displayed contributions are about3%, which is a clear calibration failure despite meeting the separate10% display-share limit.

## Next tuning experiment, not executed here
On training fixtures, separate main-stat/affix/unique changes from the set-threshold change and inspect the first divergent automatic decision. Compare event counts and survival across the whole paired sample before attributing causality. The previous bounded-defense pilot had384 identical outcome digests; its non-improvement remains evidence against repeating that exact patch.
Because heldout results are now visible, any tuning informed by this map must be labelled heldout-informed. Register a new, explicitly named unused seed block before the next acceptance sample, as GAMEPLAY-V4 section9 requires. Do not reroll10001–10500 or promote these residuals as a passing balance result.

Raw source paths and SHA-256 digests: [residual-map.json](p6/residual-map.json). Full acceptance and utility diagnostics: [P6 balance](P6-BALANCE.md). Reproduce this read-only map with `python3 tools/cardrpg-big/a4-p6-residuals.py`.
