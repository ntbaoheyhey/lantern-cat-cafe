# Spatial weights — independent production acceptance
CXV `0d0e59494`, integrated as `e2162ac386224d92b047b4bfb5cb6ff881e3cf1b`, is accepted for bounded geometry work reduction. Release remains v5-m1.8 while the next candidate is checked.

Own exact-URL1280×720 captures17November2026,16:52–16:57UTC; baseline application73bcdbed4/indexc7ad050f, candidate applicatione2162ac38/index90b4f427. Full source/index hashes in [evidence](evidence/v7-spatial-production.json).
- Independent910motion fingerprints and130isolated actor-root GPU captures match exactly. Motion includes original vertex buffers, sockets, face corners, feet, reduced motion and pose boundaries. GPU count is CXI's own production run, separate from CXV's130.
- Normal32s battle:26actor actions+3status,6ults,171events each side. Whole-run CPU median5.1→4.9ms,p95 9.3→7.2ms;framep95 remains16.8ms. Startup CPUmax60.5→56.3ms.
- 4xCPU32s battle:25actor actions+3status,5ults,161events each side. CPUmedian26.4→24.6ms,p9544→40.3ms;framep9566.8→66.7,p99133.4→116.7ms;frames>50.5ms84→72. Startup CPUmax235.2→228.2ms. Maximum frame worsened283.3→316.7ms; stress remains open.
- Four fresh portrait cases/26samples have0solid and0fringe actor pixels inside portraits. Eight fresh1024×576 benchmark/body sheets measured then reviewed once; feet stay clear, faces and values readable. Lower wave3 crowding remains.
-17focused tests across3files and production build/typecheck pass; no full-suite-after-spatial claim. Cache lifetime belongs to the drawing and is cleared on disposal. Native follow-upa46e5255d remains unaccepted.

The single paired run supports a modest CPU reduction with exact sampled output; it does not establish fixed60fps or general startup improvement. Raw evidence stays ignored under work/v5/CXI/{performance,drawing-equivalence,body-portraits}/v7-spatial-*.
