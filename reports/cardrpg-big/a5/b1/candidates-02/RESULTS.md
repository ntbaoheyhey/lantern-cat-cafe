# B1 candidate pilot02 results

TRAIN1–50, 31 fixed residual cases. The original pilot01 baseline is reused, not rerun. No acceptance seeds.

|Variant|Worst gain pp|Cells >12pp|Before >=95%|After >=95%|Mean before / after|
|---|---:|---:|---:|---:|---|
|baseline|88|30|0|4|14.19% / 63.55%|
|latched|88|30|0|5|15.23% / 64.19%|
|partial-closing|46|15|0|18|73.35% / 92.19%|
|latched-partial|50|31|0|5|51.42% / 81.23%|

None adopted. Phase latching alone leaves the88pp cliff. Partial closing reduces the worst to46pp, but18of31 after arms reach>=95%: saturation, not closure. The combined version remains50pp with all31cells above12pp.

The phase timing observation concerns consistency between queued intent and later resolution; it does not establish that immediate phase changes are inherently wrong. The user-facing cue and the actual next signature must agree whichever timing rule is selected.

Next isolated TRAIN experiment: value the telegraphed next enemy response when choosing automatic protection. Existing automatic policy evaluates only the party action, so near-lethal advertised damage is not part of its current one-action choice. This is a testable policy hypothesis, not a proven root cause. Keep all previous attempts and saturation counts.
