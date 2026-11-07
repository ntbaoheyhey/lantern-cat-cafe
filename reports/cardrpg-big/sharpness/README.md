# F2 image clarity and loading
REFERENCE: ../memory/PROMPT.md, checks.json, metrics.json, crops/diagnostics.json

The automatic battlefield uses four MSAA samples at Medium and High. Render targets track the capped device pixel ratio during same-size monitor changes and viewport resizing. Original shared 1024×1024 felt color/normal tiles use mipmaps and anisotropy 16 on the measured Metal renderer. Six facial states add glossy eyes, highlights, blinking and bounded eye movement. Portraits render directly at 800×960 with native WebP output. The original 48 vector icons have explicit dimensions and a slightly heavier stroke.

## Runtime checks
REFERENCE: checks.json, ../../../assets/provenance/cardrpg-big-surfaces.json, ../../../assets/provenance/cardrpg-big-portraits.json, ../../../assets/provenance/cardrpg-big-icons.json

Six consecutive resize/DPR checks pass, including DPR 1→2 with the same CSS size and DPR 3 capped to 2. Canvas and post target sizes match in every case. Two 1024px textures report mipmaps and anisotropy 16. Three party faces provide nine instanced eye layers. The checked pages record zero browser errors and zero external HTTP requests. Forty portrait/expression renders cover 25 models and the six expressions of Mochi, Soot and Clover. Existing shared renderer callers retain their quality profile through the opt-in automatic-battle flag.

## Baseline crop measurements
REFERENCE: ../baseline/sharpness/diagnostics.json, metrics.json, crops/, tools/cardrpg-big/sharpness.py

The metric is four-neighbour grayscale Laplacian variance on native screenshot pixels. Captures use the original five crop names and dimensions at each DPR. Layout, head direction, lighting, antialiasing and surrounding screen content also affect this measure. The +40% target passes for 2 of 10 crops. Eight crops miss the target.

| Crop | F0 | F2 | Delta |
| --- | ---: | ---: | ---: |
| dpr1-enemy | 8952.6 | 4312.9 | -51.82% |
| dpr1-hero-face | 8762.4 | 4110.0 | -53.10% |
| dpr1-hud-text | 14168.0 | 14168.0 | +0.00% |
| dpr1-portrait | 1081.7 | 1079.7 | -0.19% |
| dpr1-skill-icon | 1138.0 | 5306.7 | +366.30% |
| dpr2-enemy | 4200.5 | 2256.6 | -46.28% |
| dpr2-hero-face | 4517.4 | 2265.9 | -49.84% |
| dpr2-hud-text | 5188.7 | 5188.7 | +0.00% |
| dpr2-portrait | 564.1 | 545.3 | -3.34% |
| dpr2-skill-icon | 453.1 | 2362.0 | +421.26% |

Face crops have a different camera-facing pose and background after F1, and MSAA reduces high-frequency stair-step contrast. Their lower variance remains a missed target. HUD text measures 0% improvement. The portrait has twice the source resolution but its displayed-crop variance falls by 0.19%/3.34%. The icon comparison includes a different surrounding UI after the removal of manual battle cards, so its large variance gain includes composition and background effects. These results establish the displayed crop values only.

All ten before/after pairs and values are embedded under the demo Evidence destination. The native portrait alpha edge follows individual pixels in the exported 800×960 file.

## Rendering and load budgets
REFERENCE: ../../../docs/cardrpg3/build.json, checks.json, tools/cardrpg-big/offline-loader.js

The initial embedded-comparison HTML is 15,952,212 bytes against the 24 MB cap. The 25 GLB files total 15,650,856 against the 16 MB cap. The sampled five-actor frame records 198 calls and 76,506 triangles. Cold7×2 and a marked capture profile are complete in PERFORMANCE.md. Full skill peaks remain pending. Background depth falloff uses the scene depth texture in the final post pass. Eyes use 24×16 sphere detail. Broader geometry and motion work continues in F3.

The offline builder stores compressed assets separately from application JavaScript. Browser streams unpack each asset with visible progress between assets. This removes the previous monolithic synchronous byte conversion. Captured CPU4 MAX falls from F1 1316.5/1466.5 ms to 283.3/283.4 ms. A separate capture-disabled rerun still reaches 333.4/416.7 ms, so the full-session gate fails. PERFORMANCE.md retains all datasets and attribution.

## Validation
REFERENCE: ../validation/f2-initial.json, ../validation/f2-fixed.json

The initial run passed 421 E2E. Typecheck, lint, unit and build failed because the expanded expression helper was passed directly to Array.map, which supplied a numeric index as its boolean argument. An explicit arrow callback fixes that call site. The corrected run passes typecheck, lint, build, 1,646 web units, 903 rules units and 421 E2E. Rules retain two expected failures and eleven skips.
