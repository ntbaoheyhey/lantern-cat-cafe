# Illustrated battle art report

Taskbar Hero now has 25 original illustrated 2.5D puppets: all 12 cats and 13 enemy IDs, including four boss showcases. Each uses a WebP atlas and a JSON rig cut from the accepted original concept. The existing cafe supplies perspective, contact shadows and lighting. Native 3D sources are preserved as history; the roster uses puppets consistently.

The delivered canvas includes eight semantic motions, closer framing, distinct boss-helper positions through phase three, socket-timed signature VFX, one visible damage/heal number layer, warm cafe lighting and a night window. The portrait manifest links the same art to 25 units and 60 skill icons. Main default remains OFF; the existing `lookV2 + lookArt=v3` flags enable this delivery. A6 owns the DOM screens/HUD and integrates the published B branch. No A6 merge into B, main push, deployment or deletion of original sources occurred.

## Quality and remaining limits

These scores are Lane B visual judgments, not user acceptance or an independent commercial-quality benchmark.

| Rubric | Weight | Score | Evidence and limitation |
| --- | ---: | ---: | --- |
| Concept match and battle appearance | 35% | 8.2 | Every unit retains its concept. Unit fidelity is 8.6–8.8; battle appearance is 7.7–8.0. |
| Motion | 20% | 7.5 | Eight semantic motions per unit; shared rigid-part gestures remain restrained. Soot's lantern/tail, Spool Ram's planted horn dip Inkcap's raised lantern and Sock Skipper's hop refinements each score 7.7. |
| VFX at x1 | 15% | 8.1 | 49+6 cast audit, original motifs and real moving prop sockets. Spectacle (7.5) still trails readability. |
| Camera, composition and stage | 15% | 8.1 | Closer framing, warm/cool cafe light, Rain Spool spacing and clear three/four-helper phase-three formations. |
| Roster coverage | 10% | 10.0 | All 25 current rules IDs have a valid original rig and atlas. |
| Performance and size | 5% | 8.5 | Warmed cast p95/max 16.8 ms; current combined artifact 38.18 MB. Cold loading is not included in the timing claim. |

The weighted score is **8.225/10 (8.23 rounded)**, below the 8.5 target. Spool Ram now has a clearer horn dip, planted hoof contacts and delayed tail recovery (motion 7.7, overall 7.7). Inkcap now raises its lantern with a clearer open offhand (motion 7.7, overall 7.8); Sock Skipper now has a short hop and forward mitten reach (motion 7.7, overall 7.7); Cinnamon now lifts its serving tray with a restrained cup gesture (motion7.7, overall7.7); Sorrel now tilts its staff around the painted floor tip (motion7.7, overall7.7). Binding Thread and Practice Cushion remain unrefined7.7/7.5rows. Shared gestures, sampled eyelid closure and understated ultimate spectacle remain quality limits. No score is raised merely because a test passed.

R0's weighted 5.9966 used a different rubric and is not directly comparable. Comparable observations are cat appeal 5.0 → about 7.8 battle appearance; foes 4.0 → 7.7–8.0; motion 5.5 → 7.5; VFX 6.233 → 8.1; stage 6.5 → 8.0. The two comparison posters preserve the historical R0 images. They do not claim the same HUD, camera or exact action frame.

## Films

The accepted normal film is an uninterrupted **85.4911 seconds at x1**, with **9 observed cat ultimates**, zero page errors and zero face/HP-label overlap. It uses the legal level-6 showcase account displayed in the then-current A6 shell. It is an excerpt, not a claim of a complete normal-battle outcome; it was retained without recapture.

The accepted boss film is an uninterrupted **136.933333 seconds at x1**, with **13 observed cat ultimates**, zero page errors and zero face/HP overlap. It shows all four phase-three helpers, then three survivors, and reaches a fully painted **Victory** panel held for **1.8 seconds**. The encoded clock differs from the observed clock by only **0.0743 seconds**. The previous loading-screen candidate is retained as a rejected diagnostic; the capture-only repair waits for the actual visible result rather than trusting the model state.

The initial level-1 clips, the old boss excerpt and the first complete boss film are retained as diagnostics. Reviewing the latter revealed that two late summons shared existing helper positions. P15 corrects that issue with stable actor-ID lanes. The initial pair, surviving helpers, boss scale, cat scale and gameplay slots remain unchanged.

The saved speed audit covers Mochi/Soot ultimates and Rain Spool at x1/x2/x3 plus reduced motion. Every beat and the canvas number cue remains sampled, with no face/HP overlap. Recording a film is not a frame-time benchmark. Full 1440×900 masters remain outside Git; the repository carries compact viewing proxies and contact sheets. Selected art-rebuild evidence is 119.80 MB, below its 120 MB budget. The normal film is an excerpt; the boss film includes the complete outcome.

## Validation and budget

Accepted prior work was reused on resume. The roster has valid rig/atlas coverage, cat/enemy comparisons and motion sheets; boss ambience, phase flash and reduced motion were reviewed. P6 passed typecheck/lint, 33 focused tests and the 49+6-cast VFX audit. P7 passed 19 tests, six current-HUD captures and five cast checks. P8 passed the portrait compatibility checks. P12 passed 21 tests, eight paired poses and 12 natural x1 casts including reduced motion.

P15 adds six focused tests and 12 actual rules-resolved phase-three views: Yarn Giant, Rain Spool and Pantry Crown, with three/four live helpers at both 1440×900 and 1280×720. There are no page errors, missing live labels, out-of-canvas units or face/HP collisions. Manual review confirms the helper and boss faces remain identifiable. Five rules seeds match the retained baseline across six art modes; 102 resolved plans remain unmodified. Static views are not playback/performance evidence, and deliberate melee contact is not treated as a silhouette-separation failure.

The actual combined A6 `e94713b8be307350ab6035e7f9fec445992a86c6` + B artifact is **38,185,390 bytes**, below the **40,000,000-byte** limit with **1,814,610 bytes** headroom. B's embedded asset share is **23,545,868 bytes**, including retained classic/diagnostic assets. Optional portrait variants overlap imported assets and are not added to this measured artifact. A6 should rerun the existing size guard when changing its selected imports. Film masters and intermediate captures are outside the game artifact.

P14 adds a manually reviewed 16-pose comparison, eight natural x1 casts including reduced motion, 19 focused tests and exact rules parity. Main-hand socket error is zero; local planted-hoof drift is below 5e-16 world units. The existing atlas and rig remain unchanged. Warmed p95 stays at most 16.8 ms. This improves one unit, without changing the overall motion score.

P16 adds 16 paired Inkcap poses, 12 natural casts including reduced motion, 22 focused tests and exact rules parity. Manual review rejected a lowering gesture despite passing counters; the accepted repair raises the actual lantern socket by 0.06946 local world units. Its tail uses independent material uniforms without editing shared geometry. No shader/page/face-HP errors occurred.

P17 reuses the saved 16 Sock Skipper poses, eight natural x1 casts including reduced motion, 23 focused tests and exact parity. The accepted hop is bounded at 0.11 local units; boot/knit seams remain clean and the glove socket stays aligned. No additional draw call or asset is introduced.

P18 adds16paired Cinnamon views,12natural casts,24focused tests and exact parity. Its actual left serving-tray socket lifts0.0380645local units; both sleeves/robe remain clean. The paired artifacts share the latest pinned A6 shell, with unchanged atlases/rigs/draw calls.

P20 closes A6's boss-atmosphere disposal report: each geometry/material/instanced mesh releases exactly once, including motes, even on a second disposal. The existing test now observes each actual resource; four focused tests and typecheck/lint pass. Live drawing is unchanged.

P19 reuses16paired Sorrel views,12natural x1 casts,25focused tests and exact parity. The staff pivots at its source-painted contact with drift below1e-15; shoulders and wrist remain continuous. Motion7.7/overall7.7, with no whole-roster uplift.

## Integration and provenance

- Runtime: `apps/web/src/game/squad/turn3d/look-puppet.ts`, `look-puppet-rig.ts` and `look-puppet-formation.ts`.
- Puppet assets: `assets/cardrpg-look/v3-puppets/` (one atlas/rig pair per unit).
- Shared portrait manifest: `assets/cardrpg-look/v3-portraits/manifest.json`, version 4.
- Canvas owns visible damage/crit/heal/shield/KO totals; the DOM labels remain accessible. A6 retains its top/bottom HUD envelopes and cut-in overlay.
- Original provenance: `assets/provenance/look.md`, concept receipts and per-unit puppet receipts. No other game's art, rig or animation was copied or used as a generation reference. This continuation used local scripts and the existing original assets, with no new image generation, paid service or account.

Evidence: [roster scores](PUPPET-SCORES.md), [VFX](p6/REVIEW.md), [stage](p7/REVIEW.md), [portraits](p8/REVIEW.md), [budget](p15/budget/budget.json), [Soot motion](p12/REVIEW.md), [Spool Ram motion](p14/REVIEW.md), [Inkcap motion](p16/REVIEW.md), [Sock Skipper motion](p17/REVIEW.md), [Cinnamon motion](p18/REVIEW.md), [Sorrel motion](p19/REVIEW.md), [initial boss composition](p13/REVIEW.md), [phase-three formation](p15/REVIEW.md), [films](p10/REVIEW.md), and [A6 handoff](B-OUTBOX.md).

No user-only blocker is known. Motion refinement continues after the core report; completion of this report is not a stop under the user's non-stop instruction.
