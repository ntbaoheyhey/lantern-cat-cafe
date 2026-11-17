# R1 mask regression repair
2026-11-17T08:27:34Z CXI08:17 request reproduced from self-captured current6301 production preview. Button Guard/Spool Ram/Kettle effects hid actor bodies after the R1 mask narrowed globally.
Restored the exact original broad radial mask to the base legacy/procedural canvas. Kept the small eyes/muzzle ellipse only on V5 texture blend passes. All12 currently approved textures use additive passes; their byte approvals remain unchanged. Both masks allocate lazily, reuse and release on disposal.
Fresh local before/after Button Guard and Spool Ram sheets show restored body silhouettes. Four selected hero actions (Mochi basic, Clover/Panko/Soot ultimate) remain readable with the accepted accents. Legacy effects remain large/bright away from bodies; this fixes the regression, not a blanket art approval.
Validation13/13 focused mask/player tests; typecheck0. Logs work/v5/CXV/jobs/r1-mask-tests.log and r1-mask-typecheck.log. Initial test failures were float-exact comparison and overloaded canvas mock typing, corrected without runtime relaxation.

| Evidence | Capture UTC | Runtime / patch | Outcome |
|---|---|---|---|
| R1-mask-production-before | 2026-11-17T08:23:55.334Z–2026-11-17T08:24:00.016Z | 17188a3af4ecc36b06bf58e9597381ab6c9e6c5f; b2e92ba9f84c811794aa124dc17d9635bb0b19e18fe572368e40cc1f503940be | 3 sheets inspected, errors0 |
| R1-mask-local-before | 2026-11-17T08:23:56.549Z–2026-11-17T08:24:00.550Z | 82a6079dd633beab87d2287dec274d3f18aa2723; e01976ab5650836d2d96d9a34ef9750af150645c39dff0b25397f19880ade19b | 2 sheets inspected, errors0 |
| R1-mask-local-after | 2026-11-17T08:24:46.327Z–2026-11-17T08:24:49.903Z | 82a6079dd633beab87d2287dec274d3f18aa2723; 4d249fa940ae82fcb2e8684d6f5d125a8e42ca4a21fe93214f270db50f966225 | 2 sheets inspected, errors0 |
| R1-mask-heroes | 2026-11-17T08:25:47.141Z–2026-11-17T08:25:58.448Z | 82a6079dd633beab87d2287dec274d3f18aa2723; 4d249fa940ae82fcb2e8684d6f5d125a8e42ca4a21fe93214f270db50f966225 | 4 sheets inspected, errors0 |

Each capture.json retains exact URL and new-runtime-file hashes. Production index SHA256 007e464d2d95a3d9d901c7c82aa97ab90d525dd8ea25abedcc0cab7e631cc66a; build source4bb07e05d reported by CXI, checkout17188a3af had advanced while dist stayed unchanged.
Local captures include uncommitted R3 number motion/layout WIP, recorded by fingerprint; those files are not included in the mask repair commit. No production after-merge claim yet.
