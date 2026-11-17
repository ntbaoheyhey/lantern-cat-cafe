# A2 — larger battle framing

R7 corrects the six-enemy contact overlap after R6 fixed horizontal clipping. Cats use0.315viewport-height cores; the boss uses1.5–1.6times that scale. All approved Soot keys reserve a shared asymmetric home envelope. The final posed edge guard uses3.5%, preserving margin for allowed shake. The café keeps its warm palette with lower background contrast.

G-FRAME: PASS for the reviewed scope, using all rendered720p geometry plus10fps real-alpha samples at both desktop sizes and the required900p boss film. Review is limited to30seconds per fixture. This is framing acceptance only; pose/effect/class gates remain with A3–A9. G-REG PASS: default-timeout2642tests/314files; typecheck exit0; all three parity hashes match the baseline. Staged-lane audit PASS:76ART-owned files,8selectedJPGs,7.10MB total tracked ART reports; inherited logs and recorder symlink excluded.

## Evidence

- `final-metrics.json`: six live fixture/size cases,300samples each; exact alpha>=128 union occlusion in current draw order. Four unchanged cases from R6; wave3 uses the chosen wide variant, identical to production slotsv7.
- `film-framing.json`: every rendered frame in the three720p films. Wave1/boss are unchanged R6; wave3 was rerecorded after slotsv7. All numeric failures empty.
- `film-framing-900.json`:900frames from the existing fixed-clock boss recorder; silent. Audio was reviewed separately in the720p recordings.
- `selected/`: eight inspected sheets, each1024pxwide; every available contact window at10fps. The112pxwide frame cells support global staging, not detailed pose or face acceptance.
- `camera-metrics.json`: zoom1, rotation0; peak shake3.117px, only1100–1220ms of ultimates. Reduced-motion behavior is covered by the existing presentation tests.
- `performance.json`: boss median rendered59.88fps, compositor60.00fps; no added bitmap, manifest+418bytes. No competing owned GPU job during that boss capture.
- `source-tree-r6.json` and `source-tree-r7.json` bind recordings to uncommitted source hashes; recorder metadata itself names the base commit.

## Final live bounds

| Fixture | Size | Cat median min | Max deviation | Left min | Right min | Span min | Gap max | Occlusion max |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| wave1 | 1280×720 | 31.03% | 3.05% | 5.46% | 3.50% | 87.49% | 12.61% | 1.51% |
| wave3 | 1280×720 | 31.03% | 3.05% | 5.71% | 3.50% | 88.25% | 0.88% | 4.60% |
| boss | 1280×720 | 31.03% | 3.05% | 5.71% | 3.50% | 87.36% | 7.75% | 1.51% |
| wave1 | 1440×900 | 31.03% | 3.05% | 4.51% | 3.50% | 88.57% | 10.80% | 1.25% |
| wave3 | 1440×900 | 31.03% | 3.05% | 5.09% | 3.50% | 88.94% | -1.14% | 11.10% |
| boss | 1440×900 | 31.03% | 3.05% | 5.09% | 3.50% | 88.73% | 5.28% | 2.94% |

Boss minimum height49.64%vh. HUD bottom band12.00%at720 and10.67%at900. All1800sampled facing signs correct. The fullscreen `.b3-hud` element is an overlay and is not counted as occupied bottom-band height.

## Defect checklist and owners

| Defect | Result / evidence | Owner |
|---|---|---|
| Camera moved | No zoom/pan/rotation; only permitted ultimate shake | A2 pass |
| Facing away | None in inspected strips;0/1800incorrect native-facing signs | A2 pass |
| Uneven cat size / clipped edges | No numeric violations; final-metrics and film reductions | A2 pass |
| Hidden unit >15% | Worst11.10%at900wave3, Crumb strike400ms | A2 pass |
| Unchanged attack silhouette | Other hero units still use legacy poses | A4–A7 |
| Rings / fog / flood | Mochi/Panko yellow rings; Clover green flood; boss pink flood | A4–A7/A9 |
| Faces washed out | Visible during yellow/green field effects | A4–A7/A9 |
| Pasted painting / weak move | Several units still lean in place; larger scale exposes it | A4–A7 |
| Number clutter | Simultaneous numbers overlap bright effects; no new layout collision apparent at overview scale | A9 |
| Class motion | Melee still stays home; healer rules await SHIP S2b | A4–A7 |
| Soot detailed read | Distinct silhouette seen, blind crop score not claimed | A3 |

## Contact-window register

Expected keys: Soot K1→K2→K0 on basic, K1→K5→K0 on ultimate, K4 on damage. Other heroes still use procedural windup/contact/recovery. Actual coarse shapes were inspected; labels here do not substitute for G-READ. Boundary portions outside30seconds were not watched or counted as available.

### wave1

| Action | Impact(s) | Actor | Type | Available contact frames |
|---|---:|---|---|---|
| 0 | 0.438 | mochi | basic/status | 9/9 |
| 1 | 1.438 | soot | basic/status | 9/9 |
| 2 | 2.322 | clover | basic/status | 9/9 |
| 3 | 3.222 | panko | basic/status | 9/9 |
| 4 | 4.105 | foe-0-button-guard | basic/status | 9/9 |
| 5 | 5.021 | foe-3-needle-moth | basic/status | 9/9 |
| 6 | 5.921 | foe-1-sock-skipper | basic/status | 9/9 |
| 7 | 6.805 | foe-2-teacup-healer | basic/status | 9/9 |
| 8 | 7.255 | round status | basic/status | 9/9 |
| 9 | 8.005 | mochi | basic/status | 9/9 |
| 10 | 8.905 | soot | basic/status | 9/9 |
| 11 | 9.821 | clover | basic/status | 9/9 |
| 12 | 11.771 | panko | ultimate | 9/9 |
| 13 | 13.438 | foe-0-button-guard | basic/status | 9/9 |
| 14 | 15.088 | foe-3-needle-moth | ultimate | 9/9 |
| 15 | 16.638 | foe-1-sock-skipper | basic/status | 9/9 |
| 16 | 17.521 | foe-2-teacup-healer | basic/status | 9/9 |
| 17 | 17.971 | round status | basic/status | 9/9 |
| 18 | 19.471 | mochi | ultimate | 9/9 |
| 19 | 21.787 | soot | ultimate | 9/9 |
| 20 | 24.087 | clover | ultimate | 9/9 |
| 21 | 25.654 | panko | basic/status | 9/9 |
| 22 | 26.571 | foe-0-button-guard | basic/status | 9/9 |
| 23 | 27.554 | foe-3-needle-moth | basic/status | 9/9 |
| 24 | 28.470 | foe-1-sock-skipper | basic/status | 9/9 |
| 25 | 29.354 | foe-2-teacup-healer | basic/status | 9/9 |
| 26 | 29.821 | round status | basic/status | 5/9 |

### wave3

| Action | Impact(s) | Actor | Type | Available contact frames |
|---|---:|---|---|---|
| 0 | 0.429 | mochi | basic/status | 9/9 |
| 1 | 1.313 | soot | basic/status | 9/9 |
| 2 | 2.213 | clover | basic/status | 9/9 |
| 3 | 3.113 | panko | basic/status | 9/9 |
| 4 | 4.013 | foe-0-kettle-knight | basic/status | 9/9 |
| 5 | 4.913 | foe-3-crumb-sentinel | basic/status | 9/9 |
| 6 | 5.829 | foe-1-spool-ram | basic/status | 9/9 |
| 7 | 6.712 | foe-4-needle-moth | basic/status | 9/9 |
| 8 | 7.629 | foe-2-pollen-scout | basic/status | 9/9 |
| 9 | 8.529 | foe-5-teacup-healer | basic/status | 9/9 |
| 10 | 8.979 | round status | basic/status | 9/9 |
| 11 | 9.729 | mochi | basic/status | 9/9 |
| 12 | 10.629 | soot | basic/status | 9/9 |
| 13 | 11.529 | clover | basic/status | 9/9 |
| 14 | 13.179 | panko | ultimate | 9/9 |
| 15 | 14.729 | foe-0-kettle-knight | basic/status | 9/9 |
| 16 | 15.629 | foe-3-crumb-sentinel | basic/status | 9/9 |
| 17 | 16.545 | foe-1-spool-ram | basic/status | 9/9 |
| 18 | 17.445 | foe-4-needle-moth | basic/status | 9/9 |
| 19 | 18.329 | foe-2-pollen-scout | basic/status | 9/9 |
| 20 | 19.229 | foe-5-teacup-healer | basic/status | 9/9 |
| 21 | 19.679 | round status | basic/status | 9/9 |
| 22 | 21.195 | mochi | ultimate | 9/9 |
| 23 | 23.495 | soot | ultimate | 9/9 |
| 24 | 25.795 | clover | ultimate | 9/9 |
| 25 | 28.112 | panko | ultimate | 9/9 |
| 26 | 29.678 | foe-0-kettle-knight | basic/status | 7/9 |

### boss

| Action | Impact(s) | Actor | Type | Available contact frames |
|---|---:|---|---|---|
| 0 | 0.436 | mochi | basic/status | 9/9 |
| 1 | 1.336 | soot | basic/status | 9/9 |
| 2 | 2.220 | clover | basic/status | 9/9 |
| 3 | 3.136 | panko | basic/status | 9/9 |
| 4 | 4.019 | foe-0-yarn-giant | basic/status | 9/9 |
| 5 | 4.903 | foe-1-binding-thread | basic/status | 9/9 |
| 6 | 5.803 | foe-2-binding-thread | basic/status | 9/9 |
| 7 | 6.253 | round status | basic/status | 9/9 |
| 8 | 6.986 | mochi | basic/status | 9/9 |
| 9 | 7.869 | soot | basic/status | 9/9 |
| 10 | 8.753 | clover | basic/status | 9/9 |
| 11 | 10.386 | panko | ultimate | 9/9 |
| 12 | 12.703 | foe-0-yarn-giant | ultimate | 9/9 |
| 13 | 14.252 | foe-1-binding-thread | basic/status | 9/9 |
| 14 | 15.136 | foe-2-binding-thread | basic/status | 9/9 |
| 15 | 15.602 | round status | basic/status | 9/9 |
| 16 | 17.086 | mochi | ultimate | 9/9 |
| 17 | 19.402 | soot | ultimate | 9/9 |
| 18 | 21.702 | clover | ultimate | 9/9 |
| 19 | 23.252 | panko | basic/status | 9/9 |
| 20 | 24.135 | foe-0-yarn-giant | basic/status | 9/9 |
| 21 | 25.035 | foe-1-binding-thread | basic/status | 9/9 |
| 22 | 25.935 | foe-2-binding-thread | basic/status | 9/9 |
| 23 | 26.385 | round status | basic/status | 9/9 |
| 24 | 27.152 | mochi | basic/status | 9/9 |
| 25 | 28.035 | soot | basic/status | 9/9 |
| 26 | 28.935 | clover | basic/status | 9/9 |
| 27 | 30.568 | panko | ultimate | 0/9 |

## Critique against the private dense reference

1. The larger cast fills the horizontal field instead of clustering at far left.
2. Cats have comparable body scale and distinct costume silhouettes.
3. The boss dominates without reducing the cats to tiny markers.
4. Upper and lower helpers separate from the boss silhouette.
5. Our field retains more space than the reference because the15%occlusion gate is stricter.
6. The six-enemy middle corridor now survives contact poses, not just idle poses.
7. The warm subdued floor competes less with faces than the original rug.
8. The reference has richer attack silhouettes; only Soot has drawn keys here.
9. Yellow and green area effects wash over faces and still need replacement.
10. Movement and projectile timing still need the class-language passes.

## Rejected methods and process honesty

R5 failed edges: left1.53%, right−0.48%. R6 passed resting masks but failed moving occlusion:16.44%720/25.58%900. The wide contact-spacing drill passes4.60%720/11.10%900; high variant fails16.36/26.53%; zigzag passes7.26/13.71%but crowds Panko/the bottom band. `raw/contact-choice.jpg` was inspected once; wide selected. Earlier drill sheets are archived under `raw/drill-sheets/` and never reopened.

A2 exceeded the25%measurement/logging budget; authoring>=50%is not demonstrated. Repeated rest-only checks caused avoidable capture cycles. No time credit is invented. This is a process failure even though final framing passes. The next units will reuse these probes and spend capture time authoring their drawings/effects.

Regression history: initial default-timeout full run2639passed/2UI5stimeouts. Diagnostic20s retry passed35targeted assertions; no production/test configuration changed. Final isolated default-timeout full suite PASS:2642tests/314files,361.84seconds. Initial timeout failures remain recorded; no deadline was relaxed for this final run.

Self-score7/10: strong framing improvement with quantified clearance, but time-split requirement failed. Approximate30%authoring/10%learning/60%measurement+capture+logs/admin; estimates, not activity telemetry.
