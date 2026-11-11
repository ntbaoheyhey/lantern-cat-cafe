# Illustrated battle art report

> **2026-11-11 USER OVERRIDE:** The puppet delivery below is historical and rejected as the final art direction. D0-D11 now require real3D rigged models,3D VFX and enforced scale. No new-route3D unit is accepted yet; the old8.225 score does not apply to the new rubric. P40 is a superseded checkpoint. See PROMPT-3D-SWITCH-2026-11-11.txt and QUEUE.md.

Taskbar Hero now has 25 original illustrated 2.5D puppets: all 12 cats and 13 enemy IDs, including four boss showcases. Each uses a WebP atlas and a JSON rig cut from the accepted original concept. The existing cafe supplies perspective, contact shadows and lighting. Native 3D sources are preserved as history; the roster uses puppets consistently.

The delivered canvas includes eight semantic motions, closer framing, distinct boss-helper positions through phase three, socket-timed signature VFX, one visible damage/heal number layer, warm cafe lighting and a night window. The portrait manifest links the same art to 25 units and 60 skill icons. Main default remains OFF; the existing `lookV2 + lookArt=v3` flags enable this delivery. A6 owns the DOM screens/HUD and integrates the published B branch. No A6 merge into B, main push, deployment or deletion of original sources occurred.

## Quality and remaining limits

These scores are Lane B visual judgments, not user acceptance or an independent commercial-quality benchmark.

| Rubric | Weight | Score | Evidence and limitation |
| --- | ---: | ---: | --- |
| Concept match and battle appearance | 35% | 8.2 | Every unit retains its concept. Unit fidelity is 8.6–8.8; battle appearance is 7.7–8.0. |
| Motion | 20% | 7.5 | Eight semantic motions per unit; twenty-five units now have authored refinements scoring 7.7. Shared lifecycle poses and rigid joints stay restrained. |
| VFX at x1 | 15% | 8.1 | 49+6 cast audit, original motifs and real moving prop sockets. Spectacle (7.5) still trails readability. |
| Camera, composition and stage | 15% | 8.1 | Closer framing, warm/cool cafe light, Rain Spool spacing and clear three/four-helper phase-three formations. |
| Roster coverage | 10% | 10.0 | All 25 current rules IDs have a valid original rig and atlas. |
| Performance and size | 5% | 8.5 | Warmed cast p95/max 16.8 ms; current combined artifact 38.89 MB. Cold loading is not included in the timing claim. |

The weighted score is **8.225/10 (8.23 rounded)**, below the 8.5 target. Twenty-five units now have accepted authored motion at 7.7: Soot, Spool Ram, Inkcap, Sock Skipper, Cinnamon, Sorrel, Binding Thread, Practice Cushion, Mochi, Clover, Panko, Mallow, Biscuit, Brioche, Marigold, Button Guard, Velvet, Needle Moth, Teacup Healer, Pollen Scout, Crumb Sentinel, Kettle Knight, Yarn Giant, Rain Spool and Pantry Crown. The shared hurt/victory/defeat gestures, sampled eyelid closure and understated ultimate spectacle still limit overall quality. These individual changes do not justify a whole-roster score increase; no score is raised merely because a test passed.

R0's weighted 5.9966 used a different rubric and is not directly comparable. Comparable observations are cat appeal 5.0 → about 7.8 battle appearance; foes 4.0 → 7.7–8.0; motion 5.5 → 7.5; VFX 6.233 → 8.1; stage 6.5 → 8.0. The two comparison posters preserve the historical R0 images. They do not claim the same HUD, camera or exact action frame.

P38: Complete horns and wooden face dip into the strike; all four hooves stay planted while the whole cape and yarn tail recover quietly. 43focused web+16source tests/typecheck/lint PASS;16paired views/8x1 casts/12boss samples and5seed/6mode/102plan parity PASS. Motion7.7/overall8.0; Rigid wooden legs and restrained whole-cape rotation remain; no independent hoof roll. p38/REVIEW.md.

P39: Complete wooden gauntlets gather inward with a delayed opposing hand; crown, cabinet doors and sash stay coherent, both boots planted. 44focused web+17source tests/typecheck/lint PASS;16paired views/8x1 casts/12boss samples and5seed/6mode/102plan parity PASS. Motion7.7/overall8.0; Rigid elbows and a26pixel thumb fringe on the body remain; no cabinet squash. p39/REVIEW.md.

## Films

The accepted normal film is an uninterrupted **85.4911 seconds at x1**, with **9 observed cat ultimates**, zero page errors and zero face/HP-label overlap. It uses the legal level-6 showcase account displayed in the then-current A6 shell. It is an excerpt, not a claim of a complete normal-battle outcome; it was retained without recapture.

The accepted boss film is an uninterrupted **136.933333 seconds at x1**, with **13 observed cat ultimates**, zero page errors and zero face/HP overlap. It shows all four phase-three helpers, then three survivors, and reaches a fully painted **Victory** panel held for **1.8 seconds**. The encoded clock differs from the observed clock by only **0.0743 seconds**. The previous loading-screen candidate is retained as a rejected diagnostic; the capture-only repair waits for the actual visible result rather than trusting the model state.

The initial level-1 clips, the old boss excerpt and the first complete boss film are retained as diagnostics. Reviewing the latter revealed that two late summons shared existing helper positions. P15 corrects that issue with stable actor-ID lanes. The initial pair, surviving helpers, boss scale, cat scale and gameplay slots remain unchanged.

The saved speed audit covers Mochi/Soot ultimates and Rain Spool at x1/x2/x3 plus reduced motion. Every beat and the canvas number cue remains sampled, with no face/HP overlap. Recording a film is not a frame-time benchmark. Full 1440×900 masters remain outside Git; the repository carries compact viewing proxies and contact sheets. Selected art-rebuild evidence is 119.82 MB, below its 120 MB budget. The normal film is an excerpt; the boss film includes the complete outcome.

## Validation and budget

Accepted prior work was reused on resume. The roster has valid rig/atlas coverage, cat/enemy comparisons and motion sheets; boss ambience, phase flash and reduced motion were reviewed. P6 passed typecheck/lint, 33 focused tests and the 49+6-cast VFX audit. P7 passed 19 tests, six current-HUD captures and five cast checks. P8 passed the portrait compatibility checks. P12 passed 21 tests, eight paired poses and 12 natural x1 casts including reduced motion.

P15 adds six focused tests and 12 actual rules-resolved phase-three views: Yarn Giant, Rain Spool and Pantry Crown, with three/four live helpers at both 1440×900 and 1280×720. There are no page errors, missing live labels, out-of-canvas units or face/HP collisions. Manual review confirms the helper and boss faces remain identifiable. Five rules seeds match the retained baseline across six art modes; 102 resolved plans remain unmodified. Static views are not playback/performance evidence, and deliberate melee contact is not treated as a silhouette-separation failure.

The current actual combined A6 `d5eab0b1f632fceeef3fad271ae5d7f6778049f7` + B P39 artifact is **38,893,706 bytes**, below the **40,000,000-byte** limit with **1,106,294 bytes** headroom. B embedded assets occupy **24,212,656 bytes**, including retained classic/diagnostic assets. Optional portraits overlap imported assets and are not added to this measured artifact. Film masters and intermediate captures remain outside the game artifact.

P36 artifact is **38,874,898 bytes**, below the **40,000,000-byte** limit with **1,125,102 bytes** headroom. B embedded assets occupy **24,204,604 bytes**, including retained classic/diagnostic assets. Optional portraits overlap imported assets and are not added to this measured artifact. Film masters and intermediate captures remain outside the game artifact.

P14 adds a manually reviewed 16-pose comparison, eight natural x1 casts including reduced motion, 19 focused tests and exact rules parity. Main-hand socket error is zero; local planted-hoof drift is below 5e-16 world units. The existing atlas and rig remain unchanged. Warmed p95 stays at most 16.8 ms. This improves one unit, without changing the overall motion score.

P16 adds 16 paired Inkcap poses, 12 natural casts including reduced motion, 22 focused tests and exact rules parity. Manual review rejected a lowering gesture despite passing counters; the accepted repair raises the actual lantern socket by 0.06946 local world units. Its tail uses independent material uniforms without editing shared geometry. No shader/page/face-HP errors occurred.

P17 reuses the saved 16 Sock Skipper poses, eight natural x1 casts including reduced motion, 23 focused tests and exact parity. The accepted hop is bounded at 0.11 local units; boot/knit seams remain clean and the glove socket stays aligned. No additional draw call or asset is introduced.

P18 adds16paired Cinnamon views,12natural casts,24focused tests and exact parity. Its actual left serving-tray socket lifts0.0380645local units; both sleeves/robe remain clean. The paired artifacts share the latest pinned A6 shell, with unchanged atlases/rigs/draw calls.

P20 closes A6's boss-atmosphere disposal report: each geometry/material/instanced mesh releases exactly once, including motes, even on a second disposal. The existing test now observes each actual resource; four focused tests and typecheck/lint pass. Live drawing is unchanged.

P19 reuses16paired Sorrel views,12natural x1 casts,25focused tests and exact parity. The staff pivots at its source-painted contact with drift below1e-15; shoulders and wrist remain continuous. Motion7.7/overall7.7, with no whole-roster uplift.

P36 preserves Kettle Knight complete handle/spout/fingers and repairs tabard/boot ownership. Spout lift/release, delayed gauntlet brace and quiet lid pass two-size/x1/boss phase review;41web+14source tests,16views/8casts/12boss samples/type/lint/parity. Motion7.7/overall7.9; bounded shoulder-fringe fallback retained; p36/REVIEW.md.

P35 repairs Crumb Sentinel shield/gauntlet/chest/tabard ownership. Complete shield brace, delayed fist jab, quiet lid and planted boots pass both-size/x1 review;40web+13source tests,16views/8casts/type/lint/parity. Motion7.7/overall7.8; rigid shoulders retained; p35/REVIEW.md.

P34 repairs Pollen Scout wing/leaf/boot and complete basket-handle ownership. Basket presentation, hanging-hand response, restrained wing draw and planted boots pass both-size/x1 review;39web+12source tests,16views/8casts/type/lint/parity. Motion7.7/overall7.8, rigid wings and tiny neck fringe retained; p34/REVIEW.md.

P33 repairs Teacup Healer spoon/finial/brass-arm and ceramic/boot ownership. Complete spoon blessing, open-palm rise, quiet lid and planted boots pass both-size/x1 review;38web+11pipeline tests,16views/8casts/type/lint/parity. Motion7.7/overall7.8, rigid elbows retained; p33/REVIEW.md.

P32 repairs Needle Moth needle/wing/abdomen/boot ownership and painted joint pivots; bounded wing draw, complete needle lead and planted feet stay coherent at both battle sizes.37web+10pipeline tests,16views/8casts/type/lint/parity pass; motion7.7/overall7.8. Rigid wings and tiny source-edge fringes remain; p32/REVIEW.md.

P31 repairs Velvet whole needle/ribbon ownership and cape/feet/tail borders, plants the actual tip and presents its open palm with delayed head/tail recovery.36web+9pipeline tests,16views/12casts/type/lint/parity pass; motion7.7/overall7.9. Tiny source fringe and rigid ribbon are retained; p31/REVIEW.md.

P30 repairs Button Guard chest/needle/shield/boot ownership, gives its whole needle a lead with shield brace and planted boots, and places both sockets on real opaque art.35web+8pipeline tests,16pairedviews/8casts/type/lint/parity pass; motion7.7/overall7.8. Historical PNG evidence is losslessly recompressed with pixel/metadata equality and archived originals; p30/REVIEW.md.

P29 repairs Marigold source ownership and adds a whole gold-pot lift/pour with real spout/palm sockets.34web+7pipeline tests,16pairedviews/12casts/type/lint/parityPASS; motion7.7/overall7.8. A small sleeve fringe remains under the bounded free-paw fallback; p29/REVIEW.md records the source repairs and limit.

P28 repairs only Brioche basket/sleeve/scarf/tail ownership and adds a basket pendulum with an open-palm lift. The offline builder supports an optional interior hole so the dress inside the handle stays with body.33web+6pipeline tests,16views/12casts/type/lint/parityPASS; motion7.7/overall7.8. Formation partly obscures basket; full limits in p28/REVIEW.md.

P27 repairs Biscuit shield/spatula ownership and the actual offHand shield socket; bounded brace/upward sweep with head/tail recovery.32web+5pipeline tests,16views/12casts/type/lint/parityPASS; motion7.7/overall7.8. Source3 reused after correcting a transparent test sentinel; full provenance and limits in p27/REVIEW.md.

P26 repairs only Mallow ownership and adds a whole-whisk forward sweep with restrained mitten/head/tail response.31web+4pipeline tests,16pairedviews/12casts/type/lint/parityPASS;38371818B,headroom1628182B,Bembedded23728100B. Tiny source-fringe limit remains documented; motion7.7/overall7.8, no whole-roster uplift.

P25 repairs Panko’s whole rolling-pin/mitten ownership and detached chin strips before adding a bounded baker strike and loaf-shield brace.30web+3pipeline tests,16pairedviews/12naturalcasts/type/lint/parityPASS; current combined artifact38280606B, headroom1719394B, Bembedded23636972B. Original and intermediate sources remain preserved; no whole-roster score uplift.

P24 gives Clover a held teapot lift followed by a release-beat tip, with coherent glass/sleeve/collar overlap. 29 focused tests, 16 paired views, 12 natural x1 casts and parity pass in refreshed A6 5badf4428. The actual combined artifact is 38,193,062 bytes with 1,806,938 bytes headroom; B embedded assets remain 23,549,548 bytes.

P23 gives Mochi a forward/up shield raise with head/paw/tail response.28focused tests,16pairedviews/12natural x1casts and parity pass; no asset or draw-call increase, motion7.7/overall7.8.

P22 adds restrained whole-pillow compression/release and a mitten jab for Practice Cushion. Its broad face seam remains coherent and both boot contacts stay planted;27focused tests,16pairedviews/8natural x1casts and parity pass. Original rig/atlas and whole-roster score remain unchanged.

P21 adds a forward knot reach and planted feet for Binding Thread, with corrected original arm partitions and opt-in opaque-alpha overlap. Two pipeline regression tests and26webtests pass;16pairedviews/8x1casts show clean arms without old floating fragments. Other atlas/rig assets remain unchanged.

## Integration and provenance

- Runtime: `apps/web/src/game/squad/turn3d/look-puppet.ts`, `look-puppet-rig.ts` and `look-puppet-formation.ts`.
- Puppet assets: `assets/cardrpg-look/v3-puppets/` (one atlas/rig pair per unit).
- Shared portrait manifest: `assets/cardrpg-look/v3-portraits/manifest.json`, version 4.
- Canvas owns visible damage/crit/heal/shield/KO totals; the DOM labels remain accessible. A6 retains its top/bottom HUD envelopes and cut-in overlay.
- Original provenance: `assets/provenance/look.md`, concept receipts and per-unit puppet receipts. No other game's art, rig or animation was copied or used as a generation reference. This continuation used local scripts and the existing original assets, with no new image generation, paid service or account.

Evidence: [roster scores](PUPPET-SCORES.md), [VFX](p6/REVIEW.md), [stage](p7/REVIEW.md), [portraits](p8/REVIEW.md), [budget](p39/budget/budget.json), [Soot motion](p12/REVIEW.md), [Spool Ram motion](p14/REVIEW.md), [Inkcap motion](p16/REVIEW.md), [Sock Skipper motion](p17/REVIEW.md), [Cinnamon motion](p18/REVIEW.md), [Sorrel motion](p19/REVIEW.md), [Binding Thread motion](p21/REVIEW.md), [Practice Cushion motion](p22/REVIEW.md), [Mochi motion](p23/REVIEW.md), [Clover motion](p24/REVIEW.md), [Panko motion](p25/REVIEW.md), [Mallow motion](p26/REVIEW.md), [Biscuit motion](p27/REVIEW.md), [Brioche motion](p28/REVIEW.md), [Marigold motion](p29/REVIEW.md), [Button Guard motion](p30/REVIEW.md), [Velvet motion](p31/REVIEW.md), [Needle Moth motion](p32/REVIEW.md), [Teacup Healer motion](p33/REVIEW.md), [Pollen Scout motion](p34/REVIEW.md), [Crumb Sentinel motion](p35/REVIEW.md), [Kettle Knight motion](p36/REVIEW.md), [initial boss composition](p13/REVIEW.md), [phase-three formation](p15/REVIEW.md), [films](p10/REVIEW.md), and [A6 handoff](B-OUTBOX.md).

No user-only blocker is known. Motion refinement continues after the core report; completion of this report is not a stop under the user's non-stop instruction.
