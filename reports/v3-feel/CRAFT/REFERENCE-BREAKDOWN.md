# Reference deconstruction

Sixteen actions: eight visually inferred basics and eight visually inferred ultimates from both reference videos. Frame n is zero-based, inclusive, sampled at 10 fps. v1 displays x2 and v2 x3. Timing uncertainty is at least 100 ms; observed wall times are not x1 design targets. Layer blend modes are inferred, not recovered engine data.

B08 replaces a mislabelled ultimate follow-up. B01/B07/U05 windows were extended to observe recovery; old windows and corrected phase fields are retained in the source JSON. The prior session inspected the full selection, and the three extended recovery strips were directly inspected on resume.

Sound has not been heard. Waveform analysis cannot establish a listening verdict; 10 fps frames cannot establish +/-33 ms sync. This limitation remains OPEN, never PASS.

Pixel method: positive max-RGB difference within observed effect regions; threshold 0.18 with 0.10/0.26 sensitivity. This estimates changing bright pixels, not isolated alpha. Moving actors, damage text, background changes and compression can contaminate it. Saturation is mean HSV; luminance is p95 linear Rec.709. `../REF-EFFECTS.json` contains every measured value, region and source path. Private sheets are gitignored and never shipped.

## B01 - Sword forward cut

Source v1, 41.4-43.0 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n2 | 41.4-41.7 s |
| anticipation | n3-n4 | 41.7-41.9 s |
| contact | n5-n6 | 41.9-42.1 s |
| followThrough | n7-n8 | 42.1-42.3 s |
| secondContact | n9-n10 | 42.3-42.5 s |
| recovery | n11-n13 | 42.5-42.8 s |
| nextAction | n14-n15 | 42.8-43.0 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| red-white sword crescent | normal/add inferred | red, white | n4-n7 | curves down and right |
| gold contact wedge | add inferred | yellow, white | n5-n7 | expands toward target |
| needle sparks | add inferred | gold | n5-n9 | fan to right |
| green hit fragments | normal inferred | green | n6-n10 | scatter behind target |

Camera: Background fixed; actor runs forward.
Target: Target leans away at n7 and turns red at n9; weapon held high then across body. Extended review: n11 weapon lowers, n12-13 upright, next guard preparation n14-15.
Peak n6 (42.0 s): estimated area 3.83%; sensitivity 2.94-4.85%; directional streaks >= 6; observed action/effect span 1.1 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B01/sheet-01.jpg`.

## B02 - Guard crossing swipe

Source v1, 42.5-43.6 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n2 | 42.5-42.8 s |
| anticipation | n3-n5 | 42.8-43.1 s |
| contact | n6-n7 | 43.1-43.3 s |
| followThrough | n8-n9 | 43.3-43.5 s |
| recovery | n10-n10 | 43.5-43.6 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| blue diagonal blade | add inferred | cyan, white | n6-n8 | bottom-left to top-right |
| curved sweep | add inferred | blue | n6-n8 | clockwise hook |
| impact flecks | normal/add inferred | green, white | n6-n9 | away from contact |

Camera: Fixed background; guard steps toward sword fighter.
Target: Sword fighter red/leaning at n6; two diagonal cuts cross the torso.
Peak n7 (43.2 s): estimated area 4.31%; sensitivity 3.96-4.79%; directional streaks >= 2; observed action/effect span 0.8 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B02/sheet-01.jpg`.

## B03 - Sword double cut

Source v1, 44.1-45.6 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n3 | 44.1-44.5 s |
| anticipation | n4-n5 | 44.5-44.7 s |
| contact | n6-n7 | 44.7-44.9 s |
| followThrough | n8-n8 | 44.9-45.0 s |
| secondContact | n9-n12 | 45.0-45.4 s |
| recovery | n13-n14 | 45.4-45.6 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| red crescent | normal/add inferred | red, white | n5-n8 | downward sweep |
| gold impact wedge | add inferred | gold, white | n6-n10 | fan right |
| green fragments | normal inferred | green | n7-n12 | scatter right |
| second white slash | add inferred | white, red | n10-n12 | cross-body return |

Camera: Fixed background; forward approach.
Target: Opponent bends at n7, turns red at n11, recovers upright at n14.
Peak n6 (44.7 s): estimated area 3.95%; sensitivity 3.00-5.01%; directional streaks >= 6; observed action/effect span 1.1 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B03/sheet-01.jpg`.

## B04 - Guard counter

Source v1, 45.6-46.6 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| anticipation | n0-n2 | 45.6-45.9 s |
| contact | n3-n4 | 45.9-46.1 s |
| followThrough | n5-n6 | 46.1-46.3 s |
| recovery | n7-n9 | 46.3-46.6 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| cyan edge smear | add inferred | cyan, white | n3-n5 | diagonal across target |
| blue crescent | add inferred | blue | n3-n5 | curves behind blade |
| flecks | normal inferred | green | n4-n6 | follow contact vector |

Camera: Fixed background; guard closes then returns.
Target: Red recipient at n4; clear recoil followed by an upright settle n7.
Peak n3 (45.9 s): estimated area 4.89%; sensitivity 4.43-5.38%; directional streaks >= 2; observed action/effect span 1.0 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B04/sheet-01.jpg`.

## B05 - Low gold contact

Source v2, 27.1-28.2 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n1 | 27.1-27.3 s |
| anticipation | n2-n3 | 27.3-27.5 s |
| contact | n4-n6 | 27.5-27.8 s |
| followThrough | n7-n8 | 27.8-28.0 s |
| recovery | n9-n10 | 28.0-28.2 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| white-gold weapon sweep | add inferred | white, gold | n3-n5 | right to left |
| contact rim | add inferred | cream | n4-n8 | vertical arc |
| short gold rays | add inferred | gold | n5-n8 | left fan |

Camera: Fixed field; large lower fighter advances left.
Target: White shield/contact masks the small recipient; recoil cannot be distinguished from ambient animation.
Peak n6 (27.7 s): estimated area 5.36%; sensitivity 3.91-7.62%; directional streaks >= 3; observed action/effect span 0.9 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B05/sheet-01.jpg`.

## B06 - Purple crescent

Source v2, 28.5-30.0 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n2 | 28.5-28.8 s |
| anticipation | n3-n5 | 28.8-29.1 s |
| contact | n6-n8 | 29.1-29.4 s |
| followThrough | n9-n10 | 29.4-29.6 s |
| recovery | n11-n14 | 29.6-30.0 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| violet crescent | add inferred | violet, white | n6-n7 | large arc to left |
| horizontal lance | add inferred | magenta, white | n7-n9 | travels left |
| ground streak | add inferred | purple | n8-n10 | leftward taper |

Camera: Background fixed; dark weapon fighter steps left.
Target: Immunity text obscures lower recipient; no reliable flinch measurement.
Peak n7 (29.2 s): estimated area 26.88%; sensitivity 22.88-30.91%; directional streaks >= 2; observed action/effect span 1.2 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B06/sheet-01.jpg`.

## B07 - Forward weapon streak

Source v2, 38.3-39.8 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n2 | 38.3-38.6 s |
| anticipation | n3-n5 | 38.6-38.9 s |
| contact | n7-n8 | 39.0-39.2 s |
| followThrough | n9-n10 | 39.2-39.4 s |
| recovery | n11-n11 | 39.4-39.5 s |
| nextAction | n12-n14 | 39.5-39.8 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| white approach slash | add inferred | white | n4-n6 | diagonal right |
| gold starburst | add inferred | gold, white | n6-n8 | right-facing fan |
| red contact accent | normal/add inferred | red | n7-n9 | short wedge |

Camera: Fixed field; lower fighter approaches target group.
Target: Gold/red contact n7-8, fragments n9-10, attack returns to rest at n11 before the next focus banner n12. Recipient flinch remains obscured by absorption text.
Peak n7 (39.0 s): estimated area 6.82%; sensitivity 4.80-9.51%; directional streaks >= 4; observed action/effect span 0.9 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B07/sheet-01.jpg`.

## B08 - Sword cut in three-unit fight

Source v1, 76.5-77.6 s, basic (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n3 | 76.5-76.9 s |
| anticipation | n4-n6 | 76.9-77.2 s |
| contact | n7-n8 | 77.2-77.4 s |
| followThrough | n9-n9 | 77.4-77.5 s |
| recovery | n10-n10 | 77.5-77.6 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| red-white sword arc | normal/add inferred | red, white | n7-n8 | down-right |
| gold point impact | add inferred | gold, white | n7-n8 | outward wedge |
| directional flecks | normal/add inferred | green, gold | n8-n9 | rightward scatter |

Camera: Fixed stage; sword fighter crosses to center-right. Other basics overlap this action.
Target: Selected guard turns red at n8; sword arm visibly crosses from high to low.
Peak n7 (77.2 s): estimated area 4.67%; sensitivity 3.66-5.88%; directional streaks >= 5; observed action/effect span 0.7 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/B08/sheet-01.jpg`.

## U01 - Sword cut-in and double finish

Source v1, 36.2-38.3 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n3 | 36.2-36.6 s |
| focus | n4-n9 | 36.6-37.2 s |
| anticipation | n10-n11 | 37.2-37.4 s |
| contact | n12-n13 | 37.4-37.6 s |
| followThrough | n14-n16 | 37.6-37.9 s |
| secondContact | n17-n19 | 37.9-38.2 s |
| recovery | n20-n20 | 38.2-38.3 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| focus dim and portrait ribbon | normal inferred | black, cyan | n4-n9 | slides horizontally |
| gold-white crescent | add inferred | gold, white | n12-n13 | sweeps right |
| second broad crescent | normal/add inferred | white, amber | n17-n18 | lower sweep |
| gold contact spokes | add inferred | gold | n12-n19 | outward to right |
| green shards | normal inferred | green | n14-n20 | away from target |

Camera: Field dimmed, wide banner; fixed background after banner. Actor approaches. Do not copy approach or banner.
Target: Target red/knocked back after crescents n13–15 and n18–20; final collapse.
Peak n17 (37.9 s): estimated area 9.55%; sensitivity 8.49-11.40%; directional streaks >= 7; observed action/effect span 1.7 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U01/sheet-01.jpg`.

## U02 - Harp healing focus

Source v1, 48.2-50.3 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n3 | 48.2-48.6 s |
| focus | n4-n4 | 48.6-48.7 s |
| anticipation | n5-n7 | 48.7-49.0 s |
| castShape | n8-n10 | 49.0-49.3 s |
| hold | n11-n14 | 49.3-49.7 s |
| contact | n15-n16 | 49.7-49.9 s |
| followThrough | n17-n17 | 49.9-50.0 s |
| recovery | n18-n18 | 50.0-50.1 s |
| nextAction | n19-n20 | 50.1-50.3 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| caster flare | add inferred | gold | n5-n6 | four sharp rays |
| ribbon helix | add inferred | cyan, violet | n7-n10 | winds upward |
| recipient glow | add inferred | purple, green | n15-n17 | opens outward |
| thin floor runes | add inferred | cyan | n15-n18 | under feet |
| vertical healing sparks | add inferred | green | n16-n18 | rise |

Camera: Dim fixed field, no full-screen plate; caster stays in left slot.
Target: Recipients have heal numbers and upright poses; no damage flinch applicable.
Peak n15 (49.7 s): estimated area 12.91%; sensitivity 10.60-15.34%; directional streaks >= 4; observed action/effect span 1.5 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U02/sheet-01.jpg`.

## U03 - Fire column

Source v2, 31.2-33.8 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n4 | 31.2-31.7 s |
| focus | n5-n9 | 31.7-32.2 s |
| anticipation | n10-n14 | 32.2-32.7 s |
| castShape | n15-n16 | 32.7-32.9 s |
| contact | n17-n20 | 32.9-33.3 s |
| followThrough | n21-n22 | 33.3-33.5 s |
| recovery | n23-n25 | 33.5-33.8 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| caster star flare | add inferred | gold, white | n10-n11 | crossed rays |
| green winding leaves | normal/add inferred | green | n13-n14 | spiral up |
| fire silhouette | normal/add inferred | orange, gold | n15-n20 | rises at caster |
| red falling lances | add inferred | red | n16-n19 | diagonal toward enemies |
| contact cores | add inferred | violet, white | n17-n21 | sharp bloom |
| ground flame residue | normal/add inferred | orange | n20-n22 | shrinks |

Camera: Dim field, sliding banner; no apparent background scale shift in field section.
Target: Right group flashes/red silhouettes among numbers as fire travels; bodies partly obscured.
Peak n18 (33.0 s): estimated area 23.59%; sensitivity 20.82-26.72%; directional streaks >= 6; observed action/effect span 2.1 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U03/sheet-01.jpg`, `reports/v3-feel/ref/QR/U03/sheet-02.jpg`.

## U04 - Pink spiral and crossing lances

Source v2, 39.3-43.1 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n1 | 39.3-39.5 s |
| focus | n2-n8 | 39.5-40.2 s |
| anticipation | n9-n12 | 40.2-40.6 s |
| firstContact | n13-n17 | 40.6-41.1 s |
| followThrough | n18-n21 | 41.1-41.5 s |
| cinematic | n22-n28 | 41.5-42.2 s |
| contact | n29-n33 | 42.2-42.7 s |
| recovery | n34-n37 | 42.7-43.1 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| focus banner | normal inferred | cyan, pink | n2-n8 | slides |
| thin pink spiral | add inferred | pink | n13-n16 | wraps vertically |
| wide ribbon tornado | normal/add inferred | pink, white | n17-n21 | grows upward |
| crossed lances | add inferred | magenta, gold | n24-n27 | intersect |
| long contact rays | add inferred | white, gold | n29-n33 | fan out |
| cracked ground and petals | normal inferred | black, pink | n33-n37 | fall and dissipate |

Camera: Full field replacement n22–28; strong whiteout n31; static background cannot be inferred during replacement. Disallowed in our battle.
Target: Left bodies largely occluded by tornado. Ground cracked by n35. Reject this obscuration for our game.
Peak n31 (42.4 s): estimated area 73.54%; sensitivity 72.80-74.16%; directional streaks >= 8; observed action/effect span 3.6 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U04/sheet-01.jpg`, `reports/v3-feel/ref/QR/U04/sheet-02.jpg`.

## U05 - Cyan spear cinematic

Source v2, 46.2-52.0 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n4 | 46.2-46.7 s |
| focus | n5-n9 | 46.7-47.2 s |
| anticipation | n10-n13 | 47.2-47.6 s |
| cinematic | n14-n43 | 47.6-50.6 s |
| contact | n44-n47 | 50.6-51.0 s |
| followThrough | n48-n49 | 51.0-51.2 s |
| recovery | n50-n54 | 51.2-51.7 s |
| nextAction | n55-n57 | 51.7-52.0 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| focus ribbon | normal inferred | cyan | n5-n9 | slide |
| casting cross | add inferred | gold | n10-n11 | four rays |
| spearing diagonal smear | normal/add inferred | cyan, white | n14-n19 | cross-screen |
| giant summon silhouette | normal/add inferred | blue | n20-n24 | enlarges |
| spiral cone and cut | normal/add inferred | cyan, white | n30-n43 | rises then slices |
| field impact pillar | add inferred | cyan, white | n44-n47 | downward |
| debris and crater | normal inferred | brown, grey | n46-n49 | eject then settle |

Camera: Full-screen replacement, enlarged caster, scene cuts and whiteouts n14–43. In-field target pillar resumes n44. Disallowed cinematics; study only impulse spacing.
Target: Enemy silhouettes nearly lost in tall pillar; gold impact visible n45. Collapse/crater n48–49. Extended n50-54: field restored, caster steps back, impact debris fades; new action n55.
Peak n44 (50.6 s): estimated area 8.42%; sensitivity 4.27-13.25%; directional streaks >= 7; observed action/effect span 5.0 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U05/sheet-01.jpg`, `reports/v3-feel/ref/QR/U05/sheet-02.jpg`, `reports/v3-feel/ref/QR/U05/sheet-03.jpg`.

## U06 - Violet white-beast bloom

Source v2, 57.2-59.2 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n3 | 57.2-57.6 s |
| focus | n4-n8 | 57.6-58.1 s |
| anticipation | n9-n10 | 58.1-58.3 s |
| castShape | n11-n12 | 58.3-58.5 s |
| contact | n13-n15 | 58.5-58.8 s |
| followThrough | n16-n17 | 58.8-59.0 s |
| recovery | n18-n19 | 59.0-59.2 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| focus ribbon | normal inferred | cyan | n4-n8 | slide |
| white beast silhouette | normal inferred | white, blue | n11-n19 | rises and opens wings |
| violet star core | add inferred | violet, white | n13-n15 | sharp point bloom |
| orbital ribbons | add inferred | blue, magenta | n14-n17 | cross around body |
| small foot seal | add inferred | mint | n14-n17 | appears under feet |
| blue feather residue | normal/add inferred | blue | n16-n19 | tapers outward |

Camera: Dim fixed field and banner; summon occupies right group.
Target: Healing numbers, no damage recoil applicable; summon wings open after white flare.
Peak n14 (58.6 s): estimated area 24.51%; sensitivity 21.01-30.22%; directional streaks >= 6; observed action/effect span 1.6 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U06/sheet-01.jpg`.

## U07 - Water dragon column

Source v2, 59.2-61.5 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n3 | 59.2-59.6 s |
| focus | n4-n9 | 59.6-60.2 s |
| anticipation | n10-n12 | 60.2-60.5 s |
| castShape | n13-n13 | 60.5-60.6 s |
| contact | n14-n17 | 60.6-61.0 s |
| followThrough | n18-n20 | 61.0-61.3 s |
| recovery | n21-n22 | 61.3-61.5 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| focus ribbon | normal inferred | cyan | n4-n9 | slide |
| dragon summon | normal inferred | cyan, blue | n10-n16 | rises at left |
| cast gate | add inferred | blue, orange | n13-n18 | rotates toward target |
| vertical water spear | add inferred | cyan, white | n14-n18 | drops on right |
| contact stars | add inferred | gold | n15-n18 | rightward fan |
| splash curls and pool | normal/add inferred | blue | n18-n22 | fall, flatten and fade |

Camera: Dim fixed field, banner; no scale change visible after it.
Target: Target inside water column with repeated gold hit flashes; visible silhouette retained intermittently.
Peak n15 (60.7 s): estimated area 29.89%; sensitivity 27.10-33.23%; directional streaks >= 5; observed action/effect span 1.9 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U07/sheet-01.jpg`.

## U08 - Phoenix ground eruption

Source v2, 61.2-63.4 s, ultimate (visual inference).

| Phase | Observed frames | Wall time |
|---|---|---|
| context | n0-n2 | 61.2-61.5 s |
| focus | n3-n8 | 61.5-62.1 s |
| anticipation | n9-n11 | 62.1-62.4 s |
| castShape | n12-n13 | 62.4-62.6 s |
| contact | n14-n16 | 62.6-62.9 s |
| followThrough | n17-n18 | 62.9-63.1 s |
| recovery | n19-n21 | 63.1-63.4 s |

| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |
|---|---|---|---|---|
| focus ribbon | normal inferred | cyan, red | n3-n8 | slide |
| phoenix silhouette | normal inferred | red, orange | n10-n17 | rises and travels left |
| fire seed | add inferred | yellow | n12-n13 | drops toward ground |
| jagged eruption | normal/add inferred | yellow, white | n14-n16 | upward pointed wedge |
| contact rays | add inferred | orange | n15-n17 | fan left and right |
| glowing cracks | add inferred | orange | n16-n18 | spreads along floor |
| smoke residue | normal inferred | grey | n17-n20 | expands then fades |

Camera: Dim fixed field; phoenix floats across center then explosion at left group.
Target: Left bodies lost briefly in explosion; ground cracks persist and smoke falls away n17–20.
Peak n16 (62.8 s): estimated area 32.50%; sensitivity 29.39-35.81%; directional streaks >= 7; observed action/effect span 1.9 s (includes focus/hold where present).
Sound sync: unverified.
Private evidence: `reports/v3-feel/ref/QR/U08/sheet-01.jpg`.

## Ranges and limits

Basic anticipation spans 2-3 reference samples, contact 2-3, recovery 1-5; ultimate focus 1-7 samples, anticipation 2-5, contact 2-5, recovery 1-5. Multiple contacts, cinematic replacement and obscured reactions are identified above. Phase order is transferable; exact timing is not. S01-S08 in sources.json support the pipeline, while R01/R02 provide these observations.

Estimated medians: saturation 0.38740379159526944; p95 luminance 0.9914534564752563. U04 whiteout is retained as an honestly measured extreme, not a recommendation. Our ultimate footprint remains 25-60% regardless of this sample.

Reject reference walk-ups, field replacement, noisy text, action overlap and target-obscuring whiteouts. Retain clear key poses, directional travel, contact contrast and ordered fallout.
