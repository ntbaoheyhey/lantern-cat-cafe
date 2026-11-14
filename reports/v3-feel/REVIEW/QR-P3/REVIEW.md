# QR pilot 3 — REJECTED; three-pilot limit reached

All eleven recorded sheets inspected (132 listed frame views), plus 1280, 1440 and 390 captures. Score 5/10. Best composition so far, but recorded cast freezes, phone stretching and unheard audio prevent acceptance. No production animation code changed during QR.

| Action | Observed behaviour | Heard at impact |
|---|---|---|
| Basic 2.000–2.800 s | f63–67 anticipation; f69/70 comet; f71/72 contact hold; f75–84 settle. | UNVERIFIED |
| Ultimate 4.500–6.700 s | f138–151 focus; f152–167 frozen/repeated cast frames; f168 whole composition + hit; f180–201 fade/residue. | UNVERIFIED |
| Hit 8.500 s | f255 local flash, f258/261 directional recoil/settle. | UNVERIFIED |
| Death 10.800 s | f333–363 fading body and separate fragments; gone by f375. | UNVERIFIED |

| Defect | Verdict / evidence |
|---|---|
| Camera moved/zoomed? | No: floor and windows registered f0–384. |
| Facing away? | No: lantern right, guard sword/face left f0/f71/f333. |
| Unit scale uneven? | Two bodies similar f0/f24; all-unit gate untested. |
| Radial-only effect? | No: comet, ribbon blades, lanterns and pointed fan f71/f174. |
| Pasted PNG? | Rig arm/tail offsets and contact shadow f66/f78; whole ultimate still pops on abruptly f168. |
| Text/layout defect? | YES: focus-390.png stretches art and makes lettering unnaturally narrow; play control overlaps study footer at all widths. |
| Number clutter? | No numbers in this study; production remains unverified. |
| Unmatched sound? | Cannot certify listening; missing cast animation also invalidates the visual mapping of its riser. |
| Face hidden? | No: eyes remain visible f71/f168/f255. |
| Layer pop or frozen motion? | YES: f152–161 repeat scene clock 5072 ms, f162–167 repeat 5114 ms; f168 jumps to 5626 ms. |

60 s actual unnormalised mix: -19.88 LUFS, -6.11 dBTP; maximum two simultaneous sources. Basic/contact transient errors 9.458/7.208 ms. Only those two transients have waveform-to-visible-contact checks. Full listening and all-cue sync remain OPEN. Audio analysis is not a listening pass.

## Quality bar

| ID | State | Frame / evidence | Observation |
|---|---|---|---|
| B01 | PASS | basic-01.jpg f60/84/87 | Action is planted and returns to idle by f84; 800 ms envelope. |
| B02 | PASS | basic-contact-01.jpg f70/71 | First contact f71 = 366.667 ms after nominal start; decoded scene clock 372 ms, within 350 +/-33 ms. |
| B03 | PASS | basic-windup-01.jpg f63/64/65/66/67 | Five successive frames show the raised lantern arm and compressed torso before release. |
| B04 | PASS | basic-windup-01.jpg f60/66/68 | Lantern arm opens separately from torso; head counters the lean. |
| B05 | PASS | basic-01.jpg f63/69/72/75 | Preparation glint, travelling comet, contact star and floor splinters are visible. |
| B06 | PASS | basic-01.jpg f66/69/72 | Pointed glint, tapered curved comet and directional splinters have different contours. |
| B07 | PASS | basic-peak-mask.png; basic-contact-01.jpg f71/72 | Peak rotational IoU 0.345639; directional comet and contact fan. |
| B08 | PASS | basic-contact-01.jpg f70/71 | Recipient recoil and flash start on first contact f71. |
| B09 | PASS | basic-contact-01.jpg f71/72/73 | Both contact poses hold for f71/72, then settle at f73; 66.667 ms authored hold. |
| B10 | PASS | basic-contact-01.jpg f71/72/73 | Two lower-body flash frames preserve eyes; no screen whiteout. |
| B11 | PASS | basic-contact-01.jpg f71; audio-measurements.json | Measured transient at 2.357208 s is 9.458 ms from observed video contact. |
| B12 | OPEN | pilot.webm 2.000–2.600 s; mix.wav | Listening perception is unavailable. Waveform evidence does not certify sound identity. |
| B13 | PASS | basic-01.jpg f60–84; measurements.json | Ranged root x stays 245, no lunge or approach. |
| B14 | PASS | basic-01.jpg f60/84/87 | Feet return to the same floor anchor at the end; no lasting displacement. |
| B15 | PASS | basic-contact-01.jpg f71/72 | Faces remain visible above the comet and lower-body flash. |
| B16 | PASS | basic-01.jpg f63–84; basic-contact-01.jpg f69–75 | Glint/comet/residue ease; abrupt contact accent is intentional and local. |
| B17 | PASS | basic-contact-01.jpg f69/70/71 | Comet moves left-to-right from lantern to near surface of guard at strip scale. |
| B18 | PASS | basic-01.jpg f51–99 | Window posts and floor registration are unchanged; no camera motion or shake. |
| U01 | PASS | ultimate-02.jpg f198/201/204 | Residue ends within 2200 ms envelope, then idle; only one pilot actor tested. |
| U02 | PASS | focus-boundary-01.jpg f150/151/152 | Dim and banner visibly end at f152, 566.667 ms after start; decoded clock 571.7 ms is within one 33 ms frame of 600. |
| U03 | FAIL | ultimate-contact-01.jpg f165–168; frame-clocks.json | Contact itself is f168 at 1100 ms, but the cast is not visibly rendered from 600 ms: recorded frames hold old state until the whole effect appears at contact. |
| U04 | PASS | focus-1280.png; ultimate-01.jpg f141/144 | Guard and field darken, caster remains bright; steady-state filter brightness 0.45. |
| U05 | PASS | ultimate-01.jpg f138/141/144 | In-field dim, outline/rim and nearby name visible. |
| U06 | PASS | ultimate-01.jpg f150/168/177 | Raised lantern wind-up and extended release differ; feet stay in place. Missing intermediate cast frames logged separately. |
| U07 | FAIL | ultimate-01.jpg f153–168 | Focus and impact/residue are visible, but separate cast/travel roles disappear during the recorded freeze. Seeked layer masks alone cannot pass this. |
| U08 | PASS | ultimate-01.jpg f174/177 | Hanging lantern roofs/tassels, curved ribbon blades and pointed impact fan are distinct non-radial contour families. |
| U09 | PASS | ultimate-01.jpg f174/177; ultimate-peak-mask.png | Isolated peak union is 28.275825%; same composition visible in film. Alpha-threshold sensitivity 27.674588–28.429579%; before actor occlusion, dim/banner excluded. |
| U10 | PASS | ultimate-peak-mask.png; ultimate-01.jpg f174 | Peak symmetry 0.617075, below 0.8; directional composition. |
| U11 | FAIL | ultimate-01.jpg f167/168/177 | Lantern theme is readable now, but a full-size tableau appears abruptly and hangs in place. Does not read as a strong moving strike. |
| U12 | FAIL | ultimate-contact-01.jpg f165–168 | Peak lines connect source and target, but recorded energy does not visibly travel to recipient before contact. |
| U13 | PASS | ultimate-contact-01.jpg f167/168 | Guard recoil and flash start on first recorded contact f168. |
| U14 | PASS | ultimate-contact-01.jpg f168/169/170 | Contact holds for two frames then settles at f170. |
| U15 | PASS | ultimate-contact-01.jpg f168/169/170 | Two lower-body flash frames; no screen whiteout. |
| U16 | PASS | ultimate-contact-01.jpg f168/169/170 | Soot face and guard eyes/hat remain readable; effects are behind bodies. |
| U17 | PASS | ultimate-contact-01.jpg f168; audio-measurements.json | Transient 5.607208 s differs from video contact by 7.208 ms. |
| U18 | OPEN | pilot.webm 4.500–6.700 s; mix.wav | Callout/cast/contact/tail are scheduled and recorded, but listening identity is unverified; cast visual also stalls. |
| U19 | PASS | ultimate-peak-mask.png; mask-measurements.json | Mean saturation 0.368419 exceeds 80% of estimated reference median; reference extraction caveats retained. |
| U20 | PASS | ultimate-peak-mask.png; mask-measurements.json | p95 linear luminance 0.837783 exceeds 80% of estimated reference median; reference extraction caveats retained. |
| U21 | FAIL | ultimate-contact-01.jpg f167/168; ultimate-01.jpg f180/183 | Fade-out is gradual, but the entire main composition pops in on f168 after a recorded freeze. |
| U22 | PASS | ultimate-01.jpg f135–183 | Window/floor registration unchanged; no plate, scene cut, zoom, pan or walk-up. |
| U23 | FAIL | focus-1280.png; focus-1440.png; focus-390.png | Banner fits numerically and avoids faces, but 390 view stretches all artwork and compresses letters severely. Width/overflow-only probe misses the defect. |
| U24 | PASS | ultimate-02.jpg f201; hit-01.jpg f255 | Ultimate ends before next separate reaction; no overlapping actions. |
| C01 | PASS | idle-01.jpg f0/24/48 | Soft foot shadows anchor both actors and stay attached during idle. |
| C02 | PASS | idle-01.jpg f0–54; measurements.json | Rendered opaque height range 240–248 caster, 234–248 guard exceeds 1.5% amplitude; one-cat study only. |
| C03 | PASS | idle-01.jpg f0/24/48 | Guard and caster rise/settle at different phases. |
| C04 | PASS | idle-01.jpg f0/24/48; basic-01.jpg f66/78 | Tail and lantern arm lag torso and settle; not whole-image translation alone. |
| C05 | PASS | basic-01.jpg f60–84 | Foot anchor stays planted while torso compresses and arm lifts. |
| C06 | PASS | basic-contact-01.jpg f71–75; hit-01.jpg f255/258/261 | Recoil, squash and local flash followed by settle are visible; eyes retained. |
| C07 | PASS | death-01.jpg f333–363; death-02.jpg f375 | Separated armour fragments rise while the body fades, then gradually disappear. |
| C08 | PASS | idle-01.jpg f0; focus-1280.png | Warm coat/armour highlights fit cafe light without erasing original hue/value detail. |
| C09 | PASS | ultimate-01.jpg f141/174 | Gold rim follows caster and recipient contours at the action; no unbounded unit glow. |
| C10 | PASS | idle-01.jpg f0; basic-contact-01.jpg f71; death-01.jpg f333 | Lantern/face toward right; guard weapon/eyes toward left in shown states. Not a roster-wide facing verdict. |
| C11 | PASS | basic-01.jpg f66/72/78; ultimate-01.jpg f150/168 | No detached joint, seam hole, inverted limb or duplicated eye observed in these poses. |
| C12 | PASS | basic-contact-01.jpg f71; ultimate-contact-01.jpg f168; hit-01.jpg f255 | All faces remain visible; no numbers in the study, so production number layout remains unverified. |

## Honest comparison and next method

1. Reference B01 n5–7 has a readable contact wedge and target reaction; our f71 matches the sequence but the bolt is thinner.
2. Reference U01 n11–14 shows pose-to-arc progression; our f153–167 loses the entire cast progression.
3. The large lantern roofs/tassels at f174 now identify Soot clearly.
4. That theme improvement cannot excuse the abrupt full-size tableau at f168.
5. Peak area 28.28% and symmetry 0.617 meet numeric gates but do not establish attractive motion.
6. The new shared media clock fixes contact audio timing; it does not fix main-thread rendering stalls.
7. Faces remain readable through contact, unlike the first pilot.
8. Separate death particles read in f339–357; preserve that method.
9. Phone aspect distortion shows why a scrollWidth-only test cannot certify layout.
10. Use retained cut-out key poses, static field and direct audio capture, but replace expensive per-frame canvas composition with prewarmed/cached sprites or bounded vector layers and preserve aspect ratio. Verify in production before claiming success.

QR.6 explicitly says: “max 3 pilots, then write the blocker and the best result in STATUS-VI.md and continue with the best method.” Apply that exception now. QR remains OPEN, not done. No fourth same-idea pilot. Q1 may proceed; return to these deficits with the production renderer, and keep all quality thresholds unchanged.
