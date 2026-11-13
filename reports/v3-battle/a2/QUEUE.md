# V3-A2 queue

Only checker PASS permits done. PARTIAL remains unfinished. Scheduled syncs cannot run early.

| Card | Work | State | Evidence / checker lines |
|---|---|---|---|
| G0 | Gate checker and deterministic capture | done | Q1: 18 PASS /0 FAIL; G0/gates.log; browser435/435, units2544/2544, parity PASS |
| R | Measured reference research | done | Q1: 42 PASS /0 FAIL; R/gates.log; browser435/435, units2544/2544, parity PASS |
| F1 | Viewport scale and staggered formation | done | Q1: 40 PASS /0 FAIL; F1/gates.log; browser435/435, units2544/2544, parity PASS |
| F2 | Field clarity | done | Q1: 18 PASS /0 FAIL; F2/gates.log; browser435/435, units2544/2544, parity PASS |
| M1 | Attack choreography | in progress | 30s each: 111/111 hit reactions, min travel .08795, High59.88–60.02FPS. Energy8.052/8.964/9.484 FAIL required15.796; shared E2E9/10. Remains open. |
| M2 | Separate parts and face animation | done | Q1: 17 PASS /0 FAIL; M2/gates.log; browser435/435, units2544/2544, parity PASS |
| V1 | Full-screen distinct ultimate plates | done | Q1: 22 PASS /0 FAIL; V1/gates.log; browser435/435, units2544/2544, parity PASS |
| V2 | Field skills and damage numbers | done | Q1: 29 PASS /0 FAIL; V2/gates.log; browser435/435, units2544/2544, parity PASS |
| V3 | Battle audio cue choreography | done | Q1: 25 PASS /0 FAIL; V3/gates.log; browser435/435, units2544/2544, parity PASS |
| T1 | Battle UI and text diet | done | Q1: 19 PASS /0 FAIL; T1/gates.log; browser435/435, units2544/2544, parity PASS |
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
- [x] P5: Crowd reactions; P5/metrics.json: every living unaffected boss spectator flinches;3 allies cheer; reduced motion and combat snapshots unchanged. Source954414a69; shared E2E9/10.
- [x] P6: All12 cat victory poses, confetti and stars; P6/metrics.json and comparisons. Reduced motion, real rewards/stars, phone layout, type/unit/parity PASS; shared E2E9/10. Source0018a05f8.
- [x] P7: Final-wave contact0.4x for500 real milliseconds at×1/×2/×3; P7/metrics.json and comparison; full-battle parity and pause checks PASS; source9e6c48006; shared E2E9/10.
- [x] P8: Native/touch drag swaps, row preview and snap; P8/metrics.json, comparison and phone captures. HP, seed, rows and enemy stats unchanged; type/unit/parity PASS; shared E2E9/10. Source4d3c27e1c, evidence1ce5fcefa.
- [x] P9: Shield absorption/resist/immunity icons from real log entries; P9/metrics.json and comparison. Exact absorbed22; no combat mutation. Source7f6808420, evidence2a79db332; type/unit/parity PASS, shared E2E9/10.
- [x] P10:86 sheets on25 lossless pages, exact RGBA maxDelta0. High60.00FPS; Low4x50.76–53.01FPS; parity all6 PASS. P10/metrics.json and compare-performance.png; shared E2E9/10 keeps aggregate card open.

## V3SOLO Q0 preservation

Refreshed evidence and P1 trials preserved at 0b13880c3c9a09533233ce19430dd3ae5be559eb. Current baseline: typecheck PASS, full unit PASS, parity PASS; E2E 9/10 with hidden Review Night tips. See Q0/suite.json and Q0/suite-*.log. Stale measurement artifacts remain explicit in ../v3-solo/Q0-A-GATES.json and will be refreshed in Q1; no A card is newly closed.
