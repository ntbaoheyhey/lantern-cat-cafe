# Scalar contour allocation — accepted

CXV50ec14e73 is merged as73bcdbed4. The containment test retains the same arithmetic and tolerance while avoiding a temporary three-number array and callback for every painted pixel. Fourteen focused tests across the contour oracle, layout and class motion pass; production build/typecheck pass. The full5261-test suite preceded this small change and is not described as rerun afterward.

Own production measurement: actual32-second boss play at speed1,1280×720, exact judge URL. Each build/rate produced26 actor actions plus3 status presentations,6 ultimates and171 log events, with zero errors or blocked requests. Browser CPU throttle4 is a stress proxy. CPU times measure render submission, excluding GPU completion.

| Metric | Before normal | After normal | Before4× | After4× |
| --- | ---: | ---: | ---: | ---: |
| Startup max CPU(ms) |70.9|52.9|297.0|183.3|
| Whole-run p95 frame(ms) |16.7|16.8|50.0|50.0|
| Whole-run p99 frame(ms) |16.8|16.8|133.3|100.1|
| Frames over50.5ms |1|0|39|38|

Startup CPU decreased25.4%/38.3%; stressed p95 did not improve. Retain the performance limitation. Index before6ffc6e77d8c5af4039e7772a141b46e8d9e2726fe7a2e58dff5325299a121f60; afterc7ad050fa1980e41721812f0d35e72d9f4e1731594bf11bb7d991beea6cfa6c8. Both were stable across their two rates.

Own portrait audit repeats26 samples across four cases: zero solid/fringe actor pixels inside portrait rectangles. Four new1024×576 body sheets and two new1024×288 benchmark sheets were measured and inspected once. Faces, values and portraits remain readable; wave3 general crowding remains open. This is not an all-effects overlap guarantee. CXV's130 exact bounds/GPU comparisons support its lane evidence; they are not claimed as a second CXI130-case run.

[Machine evidence](evidence/v7-scalar-production.json). Raw captures remain in work/v5/CXI/performance/v7-scalar-{before,after} and body-portraits/v7-scalar-after. Latest green remainsm1.7 until final current-build validation and films.
