# V7 F — Yarn coverage, pose-cache and lower formation
Candidate milestone READY; broader ordinary-play/lower-spec acceptance remains open.

Yarn fan1180x472→860x268 (58.6% less maximum rectangular area); release1280–1760ms. Native350ms basic and1100ms ultimate contacts, hit-stop, targets and face protection preserved. Normal/reduced12-sample captures show socket error0; alpha1 at1100,.4067 at1550,0 active meshes at1760. No new images or draw calls.

Profile found repeated opacity-contour construction when K0/K1/K4 textures replace one another on the same geometry. Store per-geometry WeakMap<Texture,contour> instead of only the latest texture; keep live vertex transforms. Regression test alternates two different alpha contours, translates the geometry, and verifies accurate bounds without UV rescanning. Weak keys preserve collection after resource disposal.

Own Apple M3 Pro,Metal Chromium,1280x720,DPR1 repeated2200ms boss-ultimate presentation,2s warmup+12s measured per mode (not patrol throughput):
| run | normal p95 frame / p99 submit | 4xCPU p95 frame / p99 submit | 4xCPU frames>50.5ms |
|---|---|---|---|
| original |16.8 /25.5ms|83.4 /113.1ms|27|
| smaller Yarn |16.7 /25.4ms|100.0 /110.4ms|27|
| +contour cache |16.7 /4.9ms|33.4 /21.7ms|0|
Normal runs each721samples,zeroframes>33.5ms. CPU throttle is a stress proxy, not a different physical laptop; CPU submission excludes GPU completion. Improvement attributed to cache, not the Yarn size change. Cached run report2026-11-17T15:22 under V7-F-performance-cache; exact timestamps/hashes in each report.

Isolated Yarn RGBA audit alpha>.5 at1100ms109533pixels; zero face-interior/portrait pixels across sampled contacts/release. At1550 all opacity below.5;1760effect gone. These are projected footprint measurements, not body-occlusion claims (rear effect draws behind actors).
Lower wave3 Spool Ram/Kettle Knight feet moved.94→.86stageheight. Core-box/portrait overlap9877/109px→0/0; bottom620/619px vs portraittop636.8. Persistent seats retain survivors. This does not close every placement debt: Panko core-box overlap479px remains; boss basic posed core also intersects the strip. Conservative rectangles do not prove painted-pixel obstruction; inspect before broad changes.

Validation:22focused tests passed across Yarn,sequence,ground-impact,opaque-bounds,stage-layout; web typecheck EXIT0 after fixing test mock overload annotation. Own fresh normal/reduced Yarn sheets15:23:53/15:24:18UTC plus wave3 15:23:23UTC,zeroerrors,1024px review sheets inspected once. Runtime source81ef11fb4+patch6aab6eda8157665b1348ed5e048517a08302166f3f157f8da8cff505978a1c33 with untracked test hashes in reports. Candidate URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1.
Evidence /Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/films/V7-F-{final-normal,final-reduced,coverage-r2,performance-before,performance-after,performance-cache,profile}/. No production acceptance claimed.
