# F2 phase self-check
REFERENCE: ../memory/PROMPT.md lines 91–94, README.md, PERFORMANCE.md, checks.json

| Brief requirement | Result | Evidence |
| --- | --- | --- |
| Capped DPR with resize and device-sized MSAA targets | PASS, six cases including same-size DPR switch, DPR3 cap2, four samples | checks.json |
| 8–16 anisotropy, mipmaps and sufficient power-of-two texture resolution | PASS, shared1024 color/normal pair at16× on measured Metal GPU | checks.json, assets/provenance/cardrpg-big-surfaces.json |
| CSS/SVG text and high-resolution original portraits/icons | PASS for inspected crops, 48 native vectors and25 portraits at800×960 | crops/, assets/provenance/cardrpg-big-portraits.json |
| Silhouette rim/fuzz and expressive eyes with six expressions/blink | PASS implementation and40 renders, focused tests cover expression mapping | expressions/, validation/f2-fixed.json |
| Higher-detail bevels, paws, ears, faces | PARTIAL, 24×16 eye spheres implemented, broader geometry deferred to starter F3 | card-face.ts, README.md |
| GLB total≤16 MB and HTML≤24 MB including evidence | PASS at15650856 and15952212 bytes respectively, filmstrips still due F3/F4 | docs/cardrpg3/build.json |
| Every baseline crop improves, target≥40%, DPR1/2 | MISSED,2/10 pass, eight misses individually retained | metrics.json, ../sharpness.json |
| Before/after crops side by side in demo | PASS, all ten pairs embedded under Evidence | SharpnessEvidence.tsx, assets/cardrpg3/evidence/ |
| Explain crop misses | PASS disclosure, pose/composition and AA affect face metric, HUD0%, displayed portrait−0.19/−3.34% | README.md |
| Rerun F0 harness and avoid added hitches | PARTIAL, cold7×2 complete, captured1440 DPR2 MAX rose16.6ms, marked profile identifies capture-related gaps, full-session CPU4 still fails | PERFORMANCE.md |
| Full skill matrix and profiles after phase | NOT YET,610 cases scheduled against frozen F2 artifact | memory/STATE.md |
| Typecheck, lint, unit, E2E and build | PASS,1646 web,903 rules,421 E2E, two expected failures and11 skips retained | validation/f2-fixed.json |

The missed crop gate and pending full matrix are carried into the F2 draft. The phase keeps fully automatic combat and has an empty game-rules diff. Wider geometry and motion proceed with Mochi, Soot, Clover and chapter1 first.
