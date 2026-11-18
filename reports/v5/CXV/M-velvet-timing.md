# Velvet — Batch M motion proof
Source 1859cb5994badc8b3bfd7bbb64c20aa1fd2fdee9; UTC 2026-11-18T05:53:19.479Z; URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1;1280×720, experimental capture. Source/artifact/runtime patch hashes in M-velvet-native-R1.json.
Character: floating lantern invocation. Velvet's upright breath, slight head turn and delayed cape/tail sway preserve a composed conductor silhouette; the cast extends the free arm while keeping the long prop controlled.

| Channel | Designer Mochi L1 | Velvet |
|---|---|---|
| Loop / breath |10s total,3.333s dominant |10s/3breaths; root/meshseam0 |
| Head X/Y peak-to-peak |1.84/2.11%H |1.871/1.670%H; reduced0.000/0.384%H |
| Blink |nearclosed600–800ms |180ms close/400hold/320reopen;3.333s spacing,45ms right lag;phase-0.12s |
| Face |independent feature motion |eyes1.38px/mouth2.76px parallax |
| Ear / tail follow |lag not anatomically validated |ear58.5/91.0ms;tail156.0/312.0/468.0ms authored lag |
| Tail / prop range X/Y |reference larger; tail track rejected |tail0.673/2.125%H;prop1.040/1.163%H |
| Cloth |soft follow-through |2.16px band-limited sway,lag208.0ms |
| Cast |no supplied designer cast |1s additive:anticipate0–.28,reach.14–.72,hit.47–.71,recoverby1;cue250/550ms |
| Actual rules contact |existing rules retained |800ms action;350ms→clip0.55,bothmodes |
| Feet / handoff |planted-foot target |worldfeet0;directidle/cast endpoints0;actualscenehandoffmesh<.001/root<.001 |

60focused/TSC0;16CPU normal/reduced cases shared across8cats, this cat mintriangle0.56399. Actualcapture0pageerrors and Soot301samples/11mesh snapshots exactly match baseline in bothmodes. Original rigs/weights untouched.
Same-height228px,1×10s/300frame comparison film; SHA256 d99d2e4292786bbd5f1227a2a74d3c456ab977c8bb841429c7b0de6118a3fdc4.
Reviewed once: comparison-255.jpg; comparison-165.jpg; blink-sheet.jpg; cast-sheet.jpg. Selected idle extremes keep the collar, hands and cape joins coherent. Blink samples show a smooth complete closure and reopening. The cast actor remains readable as the existing multi-target ribbons fan outward, with no visible foot slide or sudden body offset in the sampled sequence.
Limits: The health/status HUD overlaps the upper prop; the large target ribbons hide some enemy detail at impact. This review covers Velvet's motion in a fixed experimental scene and does not establish full-battle effect or integrated performance acceptance. Integrated judge URL acceptance and performance remain CXI gates. This is scoped motion evidence, not a release claim.
