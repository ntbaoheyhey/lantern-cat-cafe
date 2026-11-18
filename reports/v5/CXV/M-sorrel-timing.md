# Sorrel — Batch M motion proof
Source 85b3c2fb7b39dd943d0de048c30009f36f5a9373; UTC 2026-11-18T05:46:29.649Z; URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1;1280×720, experimental capture. Source/artifact/runtime patch hashes in M-sorrel-native-R1.json.
Character: careful moonlit pour. Quiet staff gesture with a soft head turn and delayed tail/coat movement.

| Channel | Designer Mochi L1 | Sorrel |
|---|---|---|
| Loop / breath |10s total,3.333s dominant |10s/3breaths; root/meshseam0 |
| Head X/Y peak-to-peak |1.84/2.11%H |1.441/1.560%H; reduced0.000/0.359%H |
| Blink |nearclosed600–800ms |180ms close/400hold/320reopen;3.333s spacing,45ms right lag;phase0.22s |
| Face |independent feature motion |eyes1.08px/mouth2.16px parallax |
| Ear / tail follow |lag not anatomically validated |ear51.7/80.5ms;tail138.0/276.0/414.0ms authored lag |
| Tail / prop range X/Y |reference larger; tail track rejected |tail1.179/1.833%H;prop1.453/1.463%H |
| Cloth |soft follow-through |1.44px band-limited sway,lag184.0ms |
| Cast |no supplied designer cast |1s additive:anticipate0–.28,reach.14–.72,hit.47–.71,recoverby1;cue250/550ms |
| Actual rules contact |existing rules retained |800ms action;350ms→clip0.55,bothmodes |
| Feet / handoff |planted-foot target |worldfeet0;directidle/cast endpoints0;actualscenehandoffmesh<.001/root<.001 |

60focused/TSC0;16CPU normal/reduced cases shared across8cats, this cat mintriangle0.71246. Actualcapture0pageerrors and Soot301samples/11mesh snapshots exactly match baseline in bothmodes. Original rigs/weights untouched.
Same-height225px,1×10s/300frame comparison film; SHA256 ebf003032f4a5796913717d04704473222ff4dcb5bad01dae6c3093ffcc24b69.
Reviewed once: comparison-165.jpg; comparison-15.jpg; blink-sheet.jpg; cast-sheet.jpg. Face and limb joins remain stable; long blink closes cleanly, measured cast blends into the green skill effect without a body pop.
Limits: Reference lantern/shield motion remains broader; Sorrel's staff is intentionally restrained. Existing HUD partly overlaps the upper staff/hand. Integrated judge URL acceptance and performance remain CXI gates. This is scoped motion evidence, not a release claim.
