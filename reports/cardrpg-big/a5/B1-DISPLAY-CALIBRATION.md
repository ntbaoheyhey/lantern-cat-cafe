# Shared display calibration36

All 320 prospectively registered positive/nonnegative HP, attack, defense and utility weight combinations were measured against the existing384 fourth-slot TRAIN1–50 cells. The original displayed shares reconstruct exactly from6,400 actual gear rolls. This diagnostic performs **zero new combat simulations** and uses no acceptance seeds.

|Model|HP / attack / defense / utility weights|Spearman chapters1 /2 /3|Maximum piece share, including+12|
|---|---|---|---:|
|Current formula|0.2 / 2 / 1.5 / 1|0.644 / 0.547 / 0.432|4.509%|
|Best registered candidate|0.1 / 1 / 0.75 / 0|0.629 / 0.498 / 0.506|3.722%|

No registered model reaches Spearman≥0.6 in all three chapters while keeping piece share≤10%. Reject this finite family; this does not prove every possible contextual score is impossible. The best model also discards utility and reduces chapter1/2 correlation, so it is not adopted as an improvement. All320 scores remain in the receipt.

The current rawPowerV4 formula also determines actual item main stats through gearMainV4. Replacing it to improve a display metric would silently alter combat and the matched-power budget. No such change is made. A later contextual display proposal must be isolated from those mechanics and validated on full TRAIN500 and the untouched acceptance block.

[Prospective method](b1/display-calibration-36/REGISTERED-METHOD.md) · [all models and features](b1/display-calibration-36/results.json) · [independent reconstruction audit](b1/display-calibration-36/audit.json). Original balance misses remain open; no gate is relaxed.
