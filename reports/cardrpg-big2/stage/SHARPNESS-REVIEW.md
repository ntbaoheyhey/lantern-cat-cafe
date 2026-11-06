# B3 · sharpness limits and camera evidence
REFERENCE: before/diagnostics.json; after/diagnostics.json; sharpness/checks.json; sharpness-metrics.json; layout/measurements.json

The cumulative +40% edge-variance target passes only 2/10 crops (skill icons at DPR1/2). Eight misses remain. The pinned B3 change raises face-crop variance by 10.71%/8.27% relative to B2c, but does not turn these into passes. No blur repair or slice-quality claim is inferred from this metric.

| Crop | F0 → B3 change | B2c → B3 change | Observation / remaining limit |
|---|---:|---:|---|
| dpr1-hero-face | -25.30% | +10.71% | 64×64 CSS crop (128×128 native at DPR2); hero surfaces 1024², anisotropy16, 4×MSAA. Main face is procedural geometry. Contrast improved; more texture pixels do not change the projected face size. Camera/lighting differ from F0, so variance is not an isolated resolution comparison. |
| dpr1-enemy | -51.24% | +0.20% | Same 64×64 CSS crop; silhouette and smooth shading fill different pixel areas than F0. Correct target dimensions and MSAA verified. No controlled evidence that larger textures recover the target; the visual/metric gap remains. |
| dpr1-hud-text | +0.00% | +0.00% | Unchanged native CSS text, 131×33 CSS pixels, byte-identical crops between B2c/B3. Renderer texture/DPR changes cannot sharpen DOM text. Larger type or different typography would change composition and is A-owned. |
| dpr1-portrait | +22.20% | +0.00% | 800×960 original asset displayed at181×145 CSS; DPR2 capture362×290, no bitmap upscaling. F0 used a different186×217 home composition. These are not equivalent crops; the reported gain is descriptive, not a resolution repair. A owns card layout. |
| dpr1-skill-icon | +356.62% | +0.00% | 44×44 CSS /88×88 DPR2 crop. Inherited original asset improvement retains a >40% cumulative gain; B3 leaves it unchanged. |
| dpr2-hero-face | -29.11% | +8.27% | 64×64 CSS crop (128×128 native at DPR2); hero surfaces 1024², anisotropy16, 4×MSAA. Main face is procedural geometry. Contrast improved; more texture pixels do not change the projected face size. Camera/lighting differ from F0, so variance is not an isolated resolution comparison. |
| dpr2-enemy | -45.51% | +0.14% | Same 64×64 CSS crop; silhouette and smooth shading fill different pixel areas than F0. Correct target dimensions and MSAA verified. No controlled evidence that larger textures recover the target; the visual/metric gap remains. |
| dpr2-hud-text | +0.00% | +0.00% | Unchanged native CSS text, 131×33 CSS pixels, byte-identical crops between B2c/B3. Renderer texture/DPR changes cannot sharpen DOM text. Larger type or different typography would change composition and is A-owned. |
| dpr2-portrait | +7.66% | +0.00% | 800×960 original asset displayed at181×145 CSS; DPR2 capture362×290, no bitmap upscaling. F0 used a different186×217 home composition. These are not equivalent crops; the reported gain is descriptive, not a resolution repair. A owns card layout. |
| dpr2-skill-icon | +410.53% | +0.00% | 44×44 CSS /88×88 DPR2 crop. Inherited original asset improvement retains a >40% cumulative gain; B3 leaves it unchanged. |

## Rendering evidence
REFERENCE: sharpness/checks.json; after/diagnostics.json

Six resize/DPR transitions passed:1280×720 DPR1/2/3,1440×900 DPR2,1024×600 DPR1,then1280×720 DPR1. DPR3 is deliberately capped at2. At1280×720 the stage is1280×568 CSS pixels; backing/post targets are1280×568 atDPR1 and2560×1136 atDPR2. All targets match;4×MSAA,1024² felt colour/normal maps,mipmaps and anisotropy16 are present. Zero runtime or external-request errors.

These measurements rule out the observed mismatched backing-target or undersized portrait hypotheses. They do not establish a physical impossibility of improving the artwork. Better small-scale facial contrast, composition and sculpt detail remain useful work; an unmeasured sharpening filter is not counted as a fix.

## Camera choices
REFERENCE: layout/measurements.json; layout/1280-close-mochi-1.png; layout/1280-wide-mochi-1.png; layout/1280-far-mochi-1.png

A / portrait, B / balanced and C / stage are selectable. The existing B default is retained because it keeps more stage margin than A while preserving more projected character detail than C. This is a presentation choice for review, not user approval of the scale.

Across405 sampled frames(135 per preset,three sizes), all presets have zero HUD/model overlap,cropping,face occlusion or missing plates. Worst facing55.000000006° is numerical epsilon at the55° clamp. Full-body height including poses/accessories ranges A21.56–50.89%,B19.37–45.73%,C17.36–40.97%; all miss the24–30% target. A minimum horizontal margin6.19% also misses8%; B10.64% and C14.73% pass. Boss maximum47.25/42.46/38.05% passes55%. Peak230draws/95,774triangles stays within250/150k.

This stress sample includes motion and six-unit fixtures; it must not be presented as an idle-only body-scale distribution. Individual raw unit rectangles and face angles are retained. The narrow24–30% band and scene art remain open review items.
