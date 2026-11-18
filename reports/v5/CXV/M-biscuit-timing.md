# Biscuit — Batch M motion proof
Source 85b3c2fb7b39dd943d0de048c30009f36f5a9373; UTC 2026-11-18T05:47:51.964Z; URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1;1280×720, experimental capture. Source/artifact/runtime patch hashes in M-biscuit-native-R1.json.
Character: steady shield brace. Compact guard breath and head lean retain Biscuit's shield-first stance; the observed head range is smaller than the designer's expressive turn.

| Channel | Designer Mochi L1 | Biscuit |
|---|---|---|
| Loop / breath |10s total,3.333s dominant |10s/3breaths; root/meshseam0 |
| Head X/Y peak-to-peak |1.84/2.11%H |1.207/1.676%H; reduced0.000/0.385%H |
| Blink |nearclosed600–800ms |180ms close/400hold/320reopen;3.333s spacing,45ms right lag;phase0.35s |
| Face |independent feature motion |eyes0.96px/mouth1.92px parallax |
| Ear / tail follow |lag not anatomically validated |ear54.0/84.0ms;tail144.0/288.0/432.0ms authored lag |
| Tail / prop range X/Y |reference larger; tail track rejected |tail1.149/1.580%H;prop0.278/0.902%H |
| Cloth |soft follow-through |1.17px band-limited sway,lag192.0ms |
| Cast |no supplied designer cast |1s additive:anticipate0–.28,reach.14–.72,hit.47–.71,recoverby1;cue250/550ms |
| Actual rules contact |existing rules retained |800ms action;350ms→clip0.55,bothmodes |
| Feet / handoff |planted-foot target |worldfeet0;directidle/cast endpoints0;actualscenehandoffmesh<.001/root<.001 |

60focused/TSC0;16CPU normal/reduced cases shared across8cats, this cat mintriangle0.60386. Actualcapture0pageerrors and Soot301samples/11mesh snapshots exactly match baseline in bothmodes. Original rigs/weights untouched.
Same-height227px,1×10s/300frame comparison film; SHA256 8686d98f65988a011ec271d880a2f6e04c58f02cc19e2bf5cf923e94efbe95a2.
Reviewed once: comparison-165.jpg; comparison-15.jpg; blink-sheet.jpg; cast-sheet.jpg. Blink strip shows a gradual full closure and reopening. Hand, apron and shield joins remain coherent in the two selected idle extremes and cast samples; the shield gesture leads cleanly into the golden guard effect, and the shield-value text stays readable.
Limits: Existing health/status HUD crosses the upper shield; the contact flare briefly covers lower body detail. Four static reviews plus measured temporal geometry do not establish continuously watched film or integrated gameplay acceptance. Integrated judge URL acceptance and performance remain CXI gates. This is scoped motion evidence, not a release claim.
