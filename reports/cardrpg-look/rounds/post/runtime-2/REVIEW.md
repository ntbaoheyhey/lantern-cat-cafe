# L3 runtime round2 — improved, one more pass

Viewed actual1440x900-stage-1-wide from6f95d3fe against rejected round1 and L2, same framing/time. AO speckle is removed; projected face ablations across High/Balanced/Low have36samples/zero offenders, no new GPU allocations on tier switches. No cold/performance acceptance.

Five remaining defects (CSS pixels):
1. Weak foot contact around Soot x405–460/y675–707; the radial shadow texture has a tiny hot core and broad nearly invisible edge. Make an atelier-only broad elliptical contact with a softer directional falloff.
2. Model shading at Mochi cheeks x611–660/y523–552 and Clover face x452–506/y578–609 still gives little side-to-front form. Increase three-band diffuse contrast while keeping face readability and smooth toon transitions.
3. Foreground tea rim x1320–1410/y740–790 is still nearly as crisp as hero faces because near depth falloff starts too far from the plane. Shift gentle near focus transition closer; keep inner face masks unchanged.
4. Lamp halo now visible but restrained; paper shade surface is still almost uniform cream. Accept restraint for now; no blown skin pixels found by component masks.
5. Symmetric shelf/jar staging x355–625 andx1045–1260/y380–420 persists from L2. L3 cannot solve this by post; report unchanged repetition.

Next fixes1–3; keep the stable AO kernel. Provisional post6.5/depth6/lighting6/face clarity7.5. The cancellation harness initially reported one unreleased Classic decoration geometry. Expanded diagnostic2 identifies cafe-candle-halo, a THREE.Sprite using Three.js’s module-wide shared quad. This is a harness ownership error, not a scene-owned resource leak; corrected collection excludes only Sprite geometry and still includes its material. Original failed receipts remain. Cancellation callbacks also stop decoration at slice boundaries; actual corrected rerun is pending.
