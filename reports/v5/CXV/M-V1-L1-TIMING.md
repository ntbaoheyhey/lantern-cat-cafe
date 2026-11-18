# Designer L1 timing tables — CXV
UTC 2026-11-18T04:38:28.434331+00:00
Source: two commissioned10s/300frame clips; copies and hashes in M-V1-source-study.json. Longedge640. Values below are projected pixel tracking, not Live2D parameter values. Ranges are peak-to-peak. Period is strongest1–4 harmonic of10s, not proof of a shorter seamless loop. Minimum uncertainty±1frame/±.25px; occlusion error can be larger.

## mochi
| Channel | X/Y range % opaque H | Dominant component s / energy | X delay vs body / correlation | Evidence / limitation |
|---|---|---|---|---|
| body | 3.64/0.07 | 3.333 / 0.73 | not established | 24 tracked points; extremaF[88, 117]; seamXY[-0.03799999877810478, -0.004000000189989805]px |
| head | 1.84/2.11 | 3.333 / 0.82 | not established | 7 tracked points; extremaF[18, 141]; seamXY[0.07500000298023224, 0.2680000066757202]px |
| nose | 2.39/0.18 | 3.333 / 0.28 | not established | 7 tracked points; extremaF[182, 25]; seamXY[-0.367000013589859, -0.03200000151991844]px |
| earLeft | 14.32/3.78 | 3.333 / 0.95 | not established | 15 tracked points; extremaF[32, 187]; seamXY[2.3610000610351562, -0.03200000151991844]px |
| earRight | 11.07/4.63 | 3.333 / 0.98 | not established | 10 tracked points; extremaF[93, 33]; seamXY[-0.5759999752044678, 0.8190000057220459]px |
| hair | 0.01/0.00 | 3.333 / 0.31 | not established | 24 tracked points; extremaF[142, 0]; seamXY[-0.009999999776482582, -0.014000000432133675]px |
| prop | 8.00/18.02 | 3.333 / 0.52 | -166.7ms / 0.812 | 11 tracked points; extremaF[115, 84]; seamXY[-0.27399998903274536, -1.559999942779541]px |
| lantern | 12.68/31.70 | 3.333 / 0.47 | -33.3ms / 0.867 | 24 tracked points; extremaF[115, 83]; seamXY[0.12600000202655792, 0.27300000190734863]px |
| cloth | 6.33/0.48 | 3.333 / 0.69 | 0.0ms / 0.989 | 4 tracked points; extremaF[264, 38]; seamXY[-0.15700000524520874, -0.14000000059604645]px |
| footLeft | 4.96/0.01 | 3.333 / 0.69 | 0.0ms / 0.991 | 9 tracked points; extremaF[172, 38]; seamXY[-0.06300000101327896, 0.02199999988079071]px |
| footRight | 1.94/0.14 | 2.500 / 0.16 | not established | 10 tracked points; extremaF[118, 1]; seamXY[-0.11299999803304672, -0.026000000536441803]px |
| tail | Not established: self-overlap | full10s retained | not established | LK rejected; visible silhouette is clipped; manual F30/90/180/270 checks show changing curl and hand/dress occlusion. |
- left near-closed iris windows: F30–48 (633.3ms), F133–150 (600.0ms), F233–254 (733.3ms). Threshold20% of90th-percentile iris area and visible height<7px. At least±33ms boundary uncertainty.
- right near-closed iris windows: F29–49 (700.0ms), F131–151 (700.0ms), F232–255 (800.0ms). Threshold20% of90th-percentile iris area and visible height<7px. At least±33ms boundary uncertainty.

## clover
| Channel | X/Y range % opaque H | Dominant component s / energy | X delay vs body / correlation | Evidence / limitation |
|---|---|---|---|---|
| body | 5.56/2.33 | 3.333 / 0.68 | not established | 24 tracked points; extremaF[110, 261]; seamXY[0.009999999776482582, 0.061000000685453415]px |
| head | 8.68/3.76 | 5.000 / 0.56 | not established | 8 tracked points; extremaF[97, 42]; seamXY[-0.28600001335144043, -0.032999999821186066]px |
| nose | 5.36/3.07 | 5.000 / 0.50 | not established | 5 tracked points; extremaF[92, 42]; seamXY[-0.04600000008940697, 0.03400000184774399]px |
| hair | 9.44/3.25 | 5.000 / 0.60 | not established | 13 tracked points; extremaF[97, 45]; seamXY[-0.2759999930858612, -0.4320000112056732]px |
| prop | 3.26/5.70 | 3.333 / 0.47 | 0.0ms / 0.977 | 15 tracked points; extremaF[73, 181]; seamXY[0.12800000607967377, 0.45500001311302185]px |
| cloth | 15.33/3.89 | 3.333 / 0.68 | 0.0ms / 0.998 | 11 tracked points; extremaF[196, 155]; seamXY[-2.0250000953674316, -0.21199999749660492]px |
| leaf | 1.98/1.67 | 3.333 / 0.78 | 0.0ms / 0.959 | 12 tracked points; extremaF[195, 153]; seamXY[-0.5260000228881836, 0.33500000834465027]px |
| bag | 6.84/3.14 | 3.333 / 0.69 | -33.3ms / 0.999 | 24 tracked points; extremaF[195, 154]; seamXY[-0.15700000524520874, -0.3610000014305115]px |
| tail | Not established: self-overlap | full10s retained | not established | LK rejected; visible silhouette is clipped; manual F30/90/180/270 checks show changing curl and hand/dress occlusion. |
| ears | visible apex X~76/80px,Y~49/35px (ROI-limited) | about5s component | not established | optical corners lost at folds; upper silhouette bounds are descriptive, not stable tips |
- left near-closed iris windows: F18–26 (300.0ms), F166–173 (266.7ms), F203–207 (166.7ms). Threshold20% of90th-percentile iris area and visible height<7px. At least±33ms boundary uncertainty.
- right near-closed iris windows: F17–27 (366.7ms), F163–176 (466.7ms), F202–208 (233.3ms). Threshold20% of90th-percentile iris area and visible height<7px. At least±33ms boundary uncertainty.

## Interpretation and next measurement
The large positive/negative harmonic phases between different axes do not prove mechanical lag. Same-axis correlations support only the listed synchronized channels. Body/head contain independent timing; do not use one sine for every part. Prop and cloth source motion has large projected excursions; retain smaller readable amplitudes for our battle-sized Panko and judge same height/speed before scaling.
Mochi source tail is fully visible atF30 but curls behind the hand atF90/180/270. Clover tip is hidden by dress aroundF90/F180. Occluded parameter amplitude cannot be uniquely recovered from these MP4s; do not invent a number. The experiment uses a bounded trailing spring, marked a design hypothesis.
Smoothness measurement: dominant harmonic energy above is the easing evidence; it does not identify original Bézier controls. Eye closure has a visible hold; source-free Panko trial uses quintic180ms closure/400ms hold/320ms opening, three per10s. No claim that these are original authored keys.

## First-event source eye observations (18 Nov, R1)
Two new measured original-source crop sheets,40 frames,reviewed once; ledger `M-L1-eye-observation-R1.json`. Development samples chosen from prior iris measurements; not heldouts. Both eyes visibly shut at Mochi F36/F38 and Clover F21. Conservative first-full-closure brackets are Mochi (F28,F36] and Clover (F17,F21]; first bilateral reopening brackets are Mochi (F38,F50] and Clover (F21,F27]. Tiny slit states remain uncertain. These are sampled observation brackets, not confidence intervals or continuous closed durations. Exact authored closing onset, parameter minimum and full-open restoration remain null. The sampled first events support bilateral closure; they do not establish a separate wink or describe the remaining cycles. Original near-closed iris intervals above are unchanged.
