# Hidden native skinning — independent production acceptance
CXV `a46e5255d`, integrated as `ed64c7b66d05fc11cbd2067f5fbac57d8002ddbd`, is accepted. Animated bones stay live; hidden native vertex buffers update when bounds are queried or drawings are removed. Original drawing and restoration behavior remains covered.

Own exact-URL1280×720 candidate captures17November2026,16:59–17:01UTC; spatial baseline applicatione2162ac38/index90b4f427; native applicationed64c7b66/index36f1be3d. [Full identities and results](evidence/v7-native-production.json).
-910motion fingerprints and130isolated GPU captures match the spatial baseline exactly.45focused tests across6files pass, including24paired bones/bounds/native-vertex states and restoration. Build/typecheck pass. Full m1.9 suite subsequently passed on application4ae1c9580 (5282 total,5269pass,11skip,2expectedfail), including this change.
- Normal32s:26actor+3status presentations,6ults,171events on both sides. CPUmedian4.9→4.3ms,p957.2→6.6ms;framep95 remains16.8ms;startupCPUmax56.3→53.3ms.
-4xCPU32s:CPUmedian24.6→20.1ms,p9540.3→31.8ms;framep9566.7→50.1ms,p99 remains116.7ms;frames>50.5ms72→46;startupCPUmax228.2→206.2ms. Candidate reaches26actor+3status/6ults/171events versus25actor+3status/5ults/161events before, so work counts differ.
-26portrait samples have0solid/fringe overlap; six fresh1024×576 sheets measured then inspected once. Feet remain clear, faces/HP/skill labels readable; lower wave3 crowding remains.

This single host pair supports the bounded removal of hidden work.4xCPU is a proxy and p9550.1ms still misses16.7ms; no general60fps or weak-device guarantee. Raw evidence stays ignored under work/v5/CXI/{performance,drawing-equivalence,body-portraits}/v7-native-after. Included in v5-m1.9 after final full-suite validation and fresh films; see I-C.md.
