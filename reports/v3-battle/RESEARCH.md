# Battle research — 13 November 2026

R1: Installed three 0.180.0; Spine packages 4.2.120 (pre-existing; no longer imported by browser code). Pin postprocessing 6.39.6 (peer three >=0.168 <0.188) and three.quarks 0.16.0 (peer >=0.165). Latest quarks 0.17.1 requires three >=0.182, so do not upgrade the renderer for it. Use one EffectComposer with RenderPass and a combined EffectPass; quarks is compositor-only initially. Keep painted layers as original art.

R2: [Editor licence](https://en.esotericsoftware.com/spine-editor-license), sections 2.1–2.2, requires a valid Editor licence for runtime integration. The user's explicit decision supersedes the old unresolved NEEDS-USER note. Pilot and all units use our independent three.js cut-out runtime at src/game/rig/cutout.ts. A data-only importer reads the team's own region/weighted-mesh JSON into taskbar-cutout-v1. No Spine runtime source or imports in the demo. Designer binary exports must be exported as JSON first. Existing approved pixels and event names are preserved.

R3: ffmpeg 9.0.2 installed. Chromium Playwright with --use-angle=metal successfully rendered 60 deterministic 1280x720 frames with screenshot readback in 8.013 seconds (7.49 exported fps). This is export throughput, not gameplay FPS. Fixed-clock sampling uses SceneView.fixedTime. Frames stay in memory for this benchmark. Evidence: render-benchmark.json; before-wave1.png. Renderer after cut-out conversion will be measured separately.

R4: Read these open practitioner references (text only; downloaded no art/video): [Riot VFX clarity](https://www.riotgames.com/en/artedu/visual-effects), [ATI anime slam breakdown](https://realtimevfx.com/t/ati-s-sketchbook/17976), [Timing discussion](https://realtimevfx.com/t/how-do-i-make-my-timing-better/17547), [Impact-frame timing](https://www.particlefx.studio/guides/anime-impact-frame). Also read the supplied planner notes sections 0–5 and 9 and inspected the two requested local approved review images.

Rules applied (our implementation decisions):
1. Reserve strongest value contrast for contact; quiet the charge and tail.
2. Establish direction in anticipation, then accelerate into contact.
3. Hold an impact frame exactly one 30fps frame, never a slow inverted fade.
4. Grow the first burst fast, then slow its outer ring/debris.
5. A silhouette/motif must identify the caster before a title is read.
6. Use one main shape per skill; secondary particles support it.
7. Give each element a palette and each unit a camera/motif/target identity.
8. Preserve target positions and HUD visibility when opaque plates play.
9. Bind audio, contact, numbers and hitstop to one presentation clock; rules remain unchanged.
10. Reduced motion removes flash/inversion and halves shake; Short/Off remain available.

Research completed within 90 minutes. No external image was copied, traced, or sent to a generator.
