# L4 original VFX — audited checkpoint, visual work remains

REFERENCE: validation/l4/checkpoint-audit.json; validation/l4/REVIEW.md; validation/l4/EVIDENCE.md; memory/l4-rebase.json; ../../assets/provenance/look.md

Clean runtime `b5e7c16c` on accepted A3 `daba7d7c`; artifact `fb56cd44b7472b82670bfd8e9712259c036e2aa49d1911c139c4fe2b2641f494`, 23,995,962 bytes. The audit verifies all 1,580 source inputs. Rebase preserved owned runtime bytes; historical L1/L2/L3 receipts keep their original artifact identities.

Six original Blender flipbooks (smoke, steam, flame, sparkle, yarn dust, ribbon), 36 frames each, use transparent atlas borders and exact WebP roundtrips. All six full atlas sheets were inspected after three authored rounds. Runtime adds tapered textured ribbons, depth-faded effects, pooled short point lights, impact distortion and material-specific paper/ceramic/glass/metal surfaces. Lathed cup/teapot/lantern bodies and curved paper preserve existing recipes and pacing. No new combat mechanics.

All 67 recipes captured at six times; all 19 runtime contact sheets personally inspected. Hero material reviews span six pilots, with at least two full-roster rounds. See each immutable round's REVIEW.md for defects and changes. The sampled scenes still show broad pale roofs, weak can shading, layered transparent lantern faces, sparse steam and thin basic attacks. Effect self-grade 6/10; this is not full visual acceptance.

| Check | Observed result |
|---|---|
| Source gates | Typecheck/lint/unit/build/421 E2E pass; 1749 web, 1020 rules, 581 Supabase, 32 chain, 24 auth, 16 contract tests; inherited 2 expected failures/11 skips |
| Recipe identity | 67 recipes/2211 pairs; minimum0.653016622 vs threshold0.16; zero threshold offenders |
| Strict pair preservation | **MISS** 1162/2211 numeric distances decreased; worst−0.122392341 (Clover4/Panko2) |
| Face/overdraw | Zero inner-face, overdraw, empty-effect and browser-error offenders; peak18 vs limit24 |
| Scene cost | Sampled effect peak107 calls/118752 triangles/36 instances; within250/150000/96 limits |
| GPU/prewarm | Six tier/light actions keep89 textures/574 geometries/49 programs stable; zero new programs |
| Impact light |193–582 non-face floor pixels changed in paired light ablations; face deltas below1% |
| Resource ownership |370 observed resources released exactly once; no duplicates; effect root/lights detached |
| Cancellation |Six boundaries pass, including actual atlas upload:159/159/218/298/298/148 resources released once |
| Battle/post |Nine cameras at1024/1280/1440, six live A/B toggles,36 inner-face post samples pass |
| First/repeat |24 cast windows, max16.8ms,100%≤20ms, zero errors |
| Cold7 |Native max50.1ms; CPU4 max183.4ms **MISS** (L3 133.3ms; historical117ms ceiling) |
| Startup |11 scripts/3,522,593bytes/686 modules/zero Three-model; exact bytes **MISS +93** vs original3,522,500 |
| Size |23,995,962bytes;4,038bytes below24MB |
| Final-only gates |25×86×10 matrix,20-battle heap/GPU lifetime and CPU4 Balanced/Low casts **UNRUN** |

Native hub881.5–939.8ms and battle6067.7–6223.9ms; CPU4 hub2243.3–2261.3ms and battle9380.6–9876.8ms. CPU4 DPR1's183.4ms peak precedes hub readiness; overlapping trace events include a MessagePort callback and84.325ms layout. A later133.3ms frame overlaps an anonymous scene-loading timer. These inclusive timings are not additive and do not prove the opening peak is VFX compilation. Next profiling targets are initial Hub mount/layout (A-owned) and the loading timer. See cold-profile.json and the preserved traces.

The old estimatedGpuBytes field counts geometry plus a small allowance, not total GPU memory. Six1536² RGBA8 atlases alone use56,623,104 uncompressed bytes before other resources. Twenty-battle GPU/heap stability remains unrun.

Publication is selective: original contact sheets, metrics/signatures, comparisons, logs, traces and original flipbook rounds are portable. About4.8GB of per-effect raw PNGs remain local, unchanged; evidence-inventory.json identifies omitted files. The file hashes do not substitute for their pixels. No metric threshold changed and no failed pilot was removed.

Next: L6 full portraits/48 icons/rarity plates for A, then L5 roster and L7 galleries/video/final checks. A4 event presentation request is acknowledged; assess its published schema/fixture separately, preserving OFF behavior and action duration. No A4 rules adoption, shared/protected edits, merge or deployment.
