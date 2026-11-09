# R0 honest baseline — agent review

Viewed both equal-scale source lineups, all four 1440 ultimate posters, P16 at1440/1024, the old60-tile peak sheet and five sampled frames from the10s clip. Clip thumbnails support phase observations, not a continuous-motion playtest claim.
The source lineups show uncompressed exported meshes under a neutral rig. Runtime material overrides/packed textures are represented only by the battle posters. This distinction matters: the source enemies retain material colour that the runtime pink override removes.

| Criterion | Weight | Baseline | Observed evidence |
|---|---:|---:|---|
| Cat beauty/appeal |25%|5.0|[lineup](before/cats-lineup.webp): three repeated torso families, small eyes, detached cheek blobs; costumes help but silhouettes repeat.|
| Monster menace/readability |10%|4.0|[hero](before/1440-hero.webp): flat pink body group, weak hostile focal point; source yarn/button details disappear in battle.|
| Skill VFX beauty |20%|6.233|[Soot](before/1440-soot.webp), [Clover](before/1440-clover.webp), [Mallow](before/1440-mallow.webp); retained full audit6.233, thin lantern/glass, small fire.|
| Animation quality |10%|5.5|[clip](before/battle-10s.mp4): broad pose changes visible in sampled frames; stiff prop/body joins. Continuous appraisal remains limited.|
| Stage/light/camera |10%|6.5|[hero](before/1440-hero.webp): coherent cafe but large quiet window/floor, bright lamps compete with faces.|
| Readability |10%|8.5|10newposters0overlap/outside/unplaced; exact delivered runtime retains51Pshots+1194cueframes and98facemasks checks.|
| Performance |10%|8.0|Retained exact-artifact16.8msnative/66.7msCPU4casts,183.3mscold;147draws>130, nonzeroallocations remain.|
| Size/startup/hygiene |5%|5.0|30.075MBfull/21.813MBlean; OFF+3B remains; review capture contains devchrome, judge-mode verification queued R6.|

Weighted score **5.9966/10** under the new art rubric (not comparable to Full Run's different weights). No human acceptance claim. First R1 priorities: monster menace and cat appeal.

Five flaws by region,1440DPR1:
1. Hero foes x920–1360/y450–680: pink overrides collapse value/material structure and eye focus.
2. Hero cats x330–720/y420–700: ball-and-peg limbs, pinched facial space, little fur edge variation.
3. Soot ultimate x1030–1160/y430–570: flat translucent lantern and pale lines lack luminous volume.
4. Mallow ultimate x840–950/y480–630: small isolated flame does not sell an ultimate wave.
5. Clover x340–735/y300–700: three similar rigid panes, black face cutouts and repeated foot rings dominate.

R0 is the unchanged control: no before/after preference can honestly be claimed. R1 addresses flaws1/2 and renderer depth before roster work; R4 addresses3/4/5. Baseline is never beautified retrospectively.
Review corrections completed: port variables checked against actual config before E2E started; source-studio/rendered-game scope explicitly separated;10s clip uses the retained natural capture and exact seed instead of a gallery animation. No existing runtime measurement was replaced.
