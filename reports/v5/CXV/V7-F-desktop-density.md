# Native desktop density coverage

The existing renderer preserves formation and readability at desktop1280x720 with deviceScaleFactor1,1.5,2. All six normal/reduced frozen geometry sets match exactly by actor ID. The initial comparison treated asynchronous Map insertion order as meaningful; its failure remains preserved and reproducibly attributed by verify-desktop-density-probe.mjs. No numeric tolerances or geometry fields were removed.

Six sequential alternating32s ordinary-play trials on native3050ee5ae pass exact action order/initial/final state and zero errors/blocked requests. Shader diagnostics remain enabled;no shader preparation or application overrides. All3764artifact files and four live tool snapshots match. Twelve new captures measured,four1024x576 views reviewed once. Prior frozen probe adds6captures/4reviews.

| Group medians | DPR1 | DPR2 |
|---|---:|---:|
| 1x frame p95 ms | 16.8 | 16.8 |
| 1x intervals >50.5ms | 0 | 0 |
| 1x task elapsed ms | 9250.786 | 9701.074 |
| 4x frame p95 ms | 33.4 | 33.4 |
| 4x intervals >50.5ms | 20 | 17 |
| 4x task elapsed ms | 31820.724 | 31876.365 |
| Drawing-buffer pixels | 921600 | 3686400 |

Keep native quality unchanged. DPR2 increases normal task time about4.9% in this sample but does not degrade framep95;the4x late-count difference is not proof that higher density is faster. CPU4x and emulatedDPR are host-relative coverage,not another physical laptop. TaskDuration is elapsed main-thread time,not exclusive CPU/GPU completion;fixture loading is outside the32s window. Startup/steady/whole-run results and every trial remain in V7-F-desktop-density-production.json.

URL http://127.0.0.1:6312/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3;native3050ee5ae7e14cdd57a6b31b7ecc03405c44eacf;index45f38b9326b12abeb837ca2bcd74a7c998de21c32c30c6064be4508366b34cf0;empty runtime patch. Trials01:40:28–01:47:26UTC18Nov2026. This is local configuration coverage;independent6301acceptance remains pending. FullDPR2 natural battle and density-transition diagnosis follow separately.
