# L1 — Three original hero sculptures
REFERENCE: docs/cardrpg-look/slice.html; tools/cardrpg-look/blender/{author,render}.py; validation/l1/checkpoint-audit.json

The hero slice is visually improved; the overall game's look is still in progress. Mochi7, Soot5 and Clover6 use original Blender geometry and baked 1024px colour, AO, roughness, curvature and tangent-normal atlases. Each retains the original named transform hierarchy and uses under12k triangles. Portraits are actual game-model renders at1024×1280, delivered256×320/512×640. Three48-frame turntables are included in the offline slice.

| Hero | Triangles | Animated draw meshes | Visual rounds | Self-grade /10 |
|---|---:|---:|---:|---:|
| Mochi | 11,750 | 17 | 7 sculpture +2 runtime motion | 7.5 |
| Soot | 11,764 | 17 | 5 sculpture +2 runtime motion | 7.0 |
| Clover | 11,744 | 17 | 6 sculpture +2 runtime motion | 7.5 |

Matched camera before/after: [Mochi](validation/l1/after/comparisons/1280x720-unit-mochi.png), [Soot](validation/l1/after/comparisons/1280x720-unit-soot.png), [Clover](validation/l1/after/comparisons/1280x720-unit-clover.png). [120px read](validation/l1/after/readability-120px.png), [18-angle orbit](validation/l1/turntable-current.png). Earlier rejected cloth, eye, backcoat and motion rounds remain under rounds/. Newest motion sheets are validation/l1/poses/.

| Actual1280px crop metric | Mochi | Soot | Clover |
|---|---:|---:|---:|
| Laplacian variance |467.91|355.09|458.02|
| Mean luminance separation |.2404|.1096|.3201|
| Connected-edge fraction |.9883|.9882|.9935|
| Subject/background saturation |.8244|.6047|.6548|
| Full screenshot SSIM against classic |.9150|.9177|.9186|

These projected crop metrics include some background. They quantify the change; they do not prove artistic quality. Soot misses the Bible's.18 separation target; background saturation still exceeds all subject averages. Outline width is only a dark-region proxy; a new silhouette outline is not implemented yet. Density maps are available beside the source GLBs.

The motion review rejected candidate3204ebad because Mochi4's shield crossed an eye and small equipment utensils floated beside paws. The current atelier-only retarget keeps that shield outside the face, and selected weapon colours/rarities appear on wrist seals. Original combat timing and classic visuals are unchanged. All12clips/30required distinct-trajectory pairs pass. Six samples per clip and source-bound turntable samples are visual evidence, not continuous collision proof.

Remaining visible limitations: bead-like ear fluff, broad plush cheek lobes, segmented tail bends, weak fur/cloth detail at battle distance, Soot's dark feet, inherited flat stage lighting and inherited effects. The game still needs the L2–L4 passes. Remaining9cats,10enemies and3bosses remain inherited. Full portrait/icon contract is not ready.

Fresh-eyes self-review: first-time player—friendlier expressions and visible hands; art director—shared facial construction and insufficient dark-body separation; VFX director—models now need softer scene contact and stronger light response; skeptical3-minute judge—hero improvement is visible, overall premium-diorama target is not achieved.

Current candidateeadac6b2 is20,287,129bytes versus23,937,000 baseline (3,649,871bytes saved,15.25%). Both classic and atelier remain embedded. No32MB exception is needed. Measured on exact eadac6b2:7 cold opens,24 first/repeat cast windows, zero page errors. Native hub0.880–0.894s; battle-ready6.777–6.858s. CPU4 hub1.628–1.663s; battle-ready8.970–9.099s; pageMAX133.3ms. Native pageMAX33.4ms, at least99.945%frames≤20ms. All24cast windowsMAX16.8ms,100%≤20ms. Throttled whole-page opening peaks remain a limitation; this is not the Balanced/Low cast gate.

Real live A/B at1024×600,1280×720,1440×900:6toggles total, account equality, old renderer disposal and0errors. Offline slice checks all three widths with no overflow, loaded image sizes, three turntables and a functioning72%wipe. Default app startup is11scripts/3,522,504bytes/686modules with0Three/model modules and0errors. Strict byte parity misses by4bytes: only dormant Vite preload metadata changed; default dependency list and loaded module set match (flag-off/startup-diff.json). Fresh typecheck/lint/unit/build and421E2E pass; independent checkpoint audit verifies1,263inputs and all saved receipts. The first resumed E2E had23network/font failures; original logs and contexts remain under validation/attempts. Runtime b9c521e3 is unchanged; audit-only176493da rebuilt exactly the same eadac6b2 HTML. Final lifecycle20/CPU4 Balanced+Low/fullmatrix remain unrun.
