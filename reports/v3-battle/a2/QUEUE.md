# V3-A2 queue

Only checker PASS permits done. PARTIAL remains unfinished. Scheduled syncs cannot run early.

| Card | Work | State | Evidence / checker lines |
|---|---|---|---|
| G0 | Gate checker and deterministic capture | in progress | G0/metrics.json; FAIL G0.e2e measured=1 required=0; 9/10 browser cases pass; old shell tips selector requested from B |
| R | Measured reference research | in progress | R/metrics.json; 40 PASS / 1 FAIL; FAIL R.e2e measured=1 required=0 (shared hidden Night tips); 12 windows, 44 bodies, 33 glyphs, 3 pilots complete |
| F1 | Viewport scale and staggered formation | in progress | F1/gates.log: 38 PASS / 1 FAIL; scale 0.19689–0.20946; occlusion 0; clipping 0; floor min0.51068; FAIL F1.e2e measured=1 required=0 (shared Night tips) |
| F2 | Field clarity | in progress | F2/gates.log: 16 PASS / 1 FAIL; alpha 1.00, persistent bubble frames 0, contrast min42.59/18; FAIL F2.e2e exit1. Full-suite source e502656bd; card remains open |
| M1 | Attack choreography | in progress | 30s each: 111/111 hit reactions, min travel .08795, High59.88–60.02FPS. Energy8.052/8.964/9.484 FAIL required15.796; shared E2E9/10. Remains open. |
| M2 | Separate parts and face animation | in progress | M2/gates.log: 15 PASS / 1 FAIL; faces22/22; zero holes18/22; max79/150px; overlap12/12px; type/unit/parity PASS. FAIL M2.e2e measured=1 required=0 (Night tips). |
| V1 | Full-screen distinct ultimate plates | in progress | V1/gates.log: 20 PASS / 1 FAIL; 13 plates; coverage .65356/.61206; full fill1; edges2; layers11; particles480; SSIM .19967/.55 across78 pairs; 19,269,131/20,971,520bytes. FAIL V1.e2e1/0 (shared Night tips). |
| V2 | Field skills and damage numbers | in progress | V2/gates.log: 26 PASS / 1 FAIL; all36 strips, SSIM .5764/.6; glyph46px, active min.16379/.15, basic min.05220/.05, impacts5.769/3, High59.93–60.05FPS; parity PASS. Shared Night tips E2E9/10 remains open. |
| V3 | Battle audio cue choreography | in progress | V3/gates.log: 23 PASS / 1 FAIL; cues7.30–8.79/4.78 per second; all19 actives and18 ultimate voice phases; unknown0; barks7.5s; all fixture parity PASS; FAIL V3.e2e1/0 (shared Night tips). |
| T1 | Battle UI and text diet | in progress | T1/gates.log: 17 PASS / 1 FAIL; 90 frames max3/8 words; system fonts0; three viewports and3 comparisons; type/unit/parity PASS; FAIL T1.e2e1/0 (shared Night tips). |
| SY1 | Sync at 2026-11-16 12:00 UTC | todo | pending |
| SY2 | Sync at 2026-11-18 12:00 UTC | todo | pending |
| D1 | Final demo after SY2 | todo | pending |
| SY3 | Freeze at 2026-11-19 12:00 UTC | todo | pending |
| P | Ten-item polish backlog | todo | pending |

## Polish items (each needs a separate commit and comparison evidence)
- [ ] P1: Revisit every PARTIAL with a new method
- [x] P2: Second ultimate camera for all12 cats (covers the six most-used): P2/metrics.json;12 browser original/alternate/reduced checks PASS;12 comparison sheets; source770aab169.
- [x] P3: Boss phase cinematic and enrage aura; P3/metrics.json: 2.5s, phases II/III, all 3 boss paintings, static reduced aura, battle reset and unchanged rules PASS; source25de0255a. Shared suite E2E remains 9/10.
- [x] P4: Chapter ambience; P4/metrics.json: 3 chapter palettes,4 sprite kinds, stationary reduced motion, Low29/High91 max particles PASS; source d685ffdf1; type/unit/parity PASS, shared E2E9/10.
- [ ] P5: Crowd reactions
- [ ] P6: Cat victory poses, confetti and stars
- [ ] P7: Slow-motion final wave hit
- [ ] P8: Drag-to-swap formation with snap and row preview
- [ ] P9: Shield/resist/immune number icons
- [ ] P10: Atlas/pool performance and Low at 4x CPU throttle
