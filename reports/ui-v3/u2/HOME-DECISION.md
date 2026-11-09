# Home rendering decision

Use the approved fallback: Lane B's cafe stage rendered once to a 50 KB WebP, with portraits of the actual current crew. Portraits bob gently; reduced motion stops it. Recruit counter, notice board and tips remain keyboard-operable and call existing model operations.

At 1280×720 / CPU4, the headless development-page 3D trial measured 77–82 draws, 4357–5196 ms cold maximum long task and 855–885 ms steady maximum task. Its draw budget passed; CPU responsiveness did not. Retained receipt: perf-3d.json.

Fallback under the same development harness: 0 WebGL draws; 118–139 ms cold maximum task; no long task during the 60-second post-warm-up sample. Navigation-to-visible was 720–793 ms. Retained receipt: perf-fallback.json. Development module-loading time is not a production acceptance result. G6 cold-interactive remains OPEN for the offline build; the threshold stays 223.3 ms.

No B-owned file, rule or save format changed. This poster is a render of repository-owned original art, not an external reference image. Current fonts retained: no new font bytes.
