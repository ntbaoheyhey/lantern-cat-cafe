# Quality bar: observable acceptance contract

Version 1. No row is optional. A missing measurement/listening/frame observation remains OPEN. A failed manual row defeats numeric PASS. Every verdict must name a real clip and frame index/time, and state what was observed. Criteria are also machine-readable in `quality-bar.json`; automated rows are installed in `check-feel.mjs` for QR and subsequent animation items.

Reference timing ranges below are wall-clock observations at x2/x3 with 100 ms uncertainty. Our precise targets come from F2/F3/F11 and Q1–Q3. The reference cannot prove sub-frame timing, exact hit-stop or uncontaminated alpha. New craft choices (minimum four anticipation frames, three distinct contours, two-frame fades, one-pixel slot return) are conservative pilot design requirements, not claims measured from the videos.

Measure timing and masks from the same captured rendering. A telemetry promise alone cannot pass a pixel/visible criterion. Sound waveform alignment cannot pass a listening row. Intentional one/two-frame contact accents are labelled; all other layers have visible eased entry/exit. No silhouette metric replaces manual judgement.

## Basic attack — 18 checks

Reference: B01–B08: preparation 2–3 reference samples, contact 2–3, recovery 1–4 where visible; 100 ms uncertainty, x2/x3 playback.

| ID | Pass requirement | Evidence method |
|---|---|---|
| B01 | Basic ends at 800 ms +/- one captured frame; no extra lead-in. | pixels+clock |
| B02 | First actual contact at 350 ms +/-33 ms, not only a scheduled marker. | pixels+clock |
| B03 | At least four 30 fps frames show a silhouette-changing wind-up before release. | pixels+clock |
| B04 | Hand/weapon and torso visibly separate wind-up from rest; frame pair named. | manual frames |
| B05 | At least three separately visible layers: preparation, travelling strike, impact/decal. | isolated layer masks + manual |
| B06 | At least three distinct contours; duplicated circles/glows count as one. | manual frames |
| B07 | Peak union effect mask rotational-symmetry IoU <0.8; shape also reads directionally. | isolated masks |
| B08 | Target recoil or support response begins within one 30 fps frame of actual contact. | pixels+clock |
| B09 | Attacker and recipient poses hold 60–90 ms at impact inside the fixed duration. | pixels+clock |
| B10 | A local target/contact flash or authored smear lasts 1–2 frames, without a viewport whiteout. | pixels+clock |
| B11 | Absolute weapon transient-to-observed-contact error <=33 ms; inspect waveform, not just cue schedule. | waveform+frames |
| B12 | Spectral label and waveform onset confirm the weapon sound belongs to this on-screen action. | spectral cue label + waveform + frame reference |
| B13 | Any melee lunge stays <=5% viewport width; ranged root stays planted. | rendered body mask |
| B14 | Actor returns to its original slot within one pixel by 800 ms. | pixels+clock |
| B15 | No effect, number, name or neighbouring body hides a face. | face masks + manual |
| B16 | No unintended one-frame layer pop; entry/exit ease over >=2 frames except the labelled contact transient. | adjacent frame review |
| B17 | Source-to-target travel reads at 1280x720 and in the scaled contact strip. | manual frames |
| B18 | Background registration and stage-root transform remain constant; no basic shake. | pixels+clock |

## Ultimate — 24 checks

Reference: U01–U08: focus 1–7 reference samples, preparation 2–5, contact 2–5, recovery 1–4 where visible; 100 ms uncertainty, x2/x3.

| ID | Pass requirement | Evidence method |
|---|---|---|
| U01 | Ultimate ends at 2200 ms +/-33 ms; its total is the same for every unit. | pixels+clock |
| U02 | In-field focus ends at 600 ms +/-33 ms. | pixels+clock |
| U03 | Observed contact at 1100 ms +/-33 ms; cast begins at 600 ms. | pixels+clock |
| U04 | Non-caster brightness is 45%; caster and nearby name remain visible. | render buffer + scene state |
| U05 | Dim field, caster outline/rim and local name banner all visible. | manual frames |
| U06 | Wind-up and release are distinct weapon/torso poses; no walk-up. | manual frames |
| U07 | Five visible roles: focus aura, cast shape, travel/area body, impact, residue. | isolated layer masks + manual |
| U08 | At least three non-radial contour families are visible in the composition. | manual frames |
| U09 | Peak effect-alpha union covers 25–60% of viewport; exclude dim/HUD/banner/grade. | isolated masks |
| U10 | Peak mask symmetry score <0.8; no radial-only composition. | isolated masks |
| U11 | Main silhouette reads as a strong, distinctive themed ultimate; identify it in words. | manual frames |
| U12 | Energy originates at caster and reaches the affected group; no unrelated ambient flash. | manual frames |
| U13 | Damage target recoils, or support recipient responds, within one frame of contact. | pixels+clock |
| U14 | Contact pose hold is 60–90 ms inside the 2200 ms envelope. | pixels+clock |
| U15 | Local contact highlight lasts 1–2 frames; no full-frame whiteout. | pixels+clock |
| U16 | Caster and recipient faces remain readable through the effect. | face masks + manual |
| U17 | Measured impact transient is within 33 ms of observed impact. | waveform+frames |
| U18 | Callout/cast/contact/tail waveform onsets and spectral labels map to their displayed causes. | spectral cue label + waveform + frame reference |
| U19 | Mean effect saturation >=80% of estimated reference median; retain estimation caveat. | isolated masks |
| U20 | p95 linear luminance >=80% of estimated reference median; retain estimation caveat. | isolated masks |
| U21 | Layers ease in/out over >=2 frames except the explicit 1–2 frame contact accent. | adjacent frame review |
| U22 | No cinematic plate, scene cut, camera scale/pan or off-slot approach. | pixels+clock |
| U23 | Name fits its box and avoids faces at 1280x720 and 1440x900. | DOM + frames |
| U24 | No next action begins before this ultimate ends; no overlapping ultimates. | pixels+clock |

## Character idle / hit / death — 12 checks

Reference: B02 n6–10, B03 n7/n11/n14, B08 n7–9; reference bodies partly occluded, exact motion amplitudes not recoverable.

| ID | Pass requirement | Evidence method |
|---|---|---|
| C01 | Soft contact shadow visibly anchors every shown unit, without detaching at idle. | rendered shadow mask + manual |
| C02 | Idle body/attachment motion amplitude >=1.5% body height, measured on rendered pixels. | rendered body mask |
| C03 | Separate actors have phase offsets; the squad does not breathe in lockstep. | manual frames |
| C04 | Weapon/tail/ears lag the torso and settle; not just whole-PNG translation. | manual frames |
| C05 | Idle/anticipation keeps feet at the floor; any approved lunge returns to that anchor. | manual frames |
| C06 | Hit shows directional recoil + squash + local flash, with a clear settle. | manual frames |
| C07 | Death fades with visible separated dissolve particles; no single-frame disappearance. | manual frames |
| C08 | Painted body lighting belongs to the field; contours retain their original hue/value structure. | manual frames |
| C09 | Local effect-coloured rim affects the caster/recipient at the action, not an unbounded unit glow. | manual frames |
| C10 | Cats face right and enemies left in idle/attack/hit/death; face/weapon-side table verified. | manual frames |
| C11 | No detached joint, seam hole, inverted limb or double-eye artefact in any key pose. | manual frames |
| C12 | No other unit, HUD element or number covers any face during the sampled states. | manual frames |

## Per-row review record

`id`, `state: PASS/FAIL/OPEN`, measured value (if available), artifact path/hash, frame/time, observed reason. Include all 54 rows in each animation review. Multi-unit acceptance additionally checks the unchanged Q1–Q3 all-unit timing/scale/78-pair IoU/FPS gates. The one-cat pilot proves the method, not those roster-wide facts.

The production section-3 review still requires all three fixtures, all action sheets, private side-by-side reference comparisons, a 60 s audio mix and an honest critique. The pilot uses the same capture and inspection method, plus an isolated sequence for idle/hit/death. Healing response rows must describe the visible support response, rather than inventing a damage recoil.
