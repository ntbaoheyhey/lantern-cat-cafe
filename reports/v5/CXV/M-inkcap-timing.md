# Inkcap — Batch M motion proof
Source 85b3c2fb7b39dd943d0de048c30009f36f5a9373; UTC 2026-11-18T05:49:16.051Z; URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1;1280×720, experimental capture. Source/artifact/runtime patch hashes in M-inkcap-native-R1.json.
Character: buoyant mushroom glyph. Quiet head lean and delayed cape/tail motion suit Inkcap's watchful caster stance; the hand and bottle stay restrained while the cast reaches toward the established projectile moment.

| Channel | Designer Mochi L1 | Inkcap |
|---|---|---|
| Loop / breath |10s total,3.333s dominant |10s/3breaths; root/meshseam0 |
| Head X/Y peak-to-peak |1.84/2.11%H |1.793/1.785%H; reduced0.000/0.411%H |
| Blink |nearclosed600–800ms |180ms close/400hold/320reopen;3.333s spacing,45ms right lag;phase-0.18s |
| Face |independent feature motion |eyes1.32px/mouth2.64px parallax |
| Ear / tail follow |lag not anatomically validated |ear40.5/63.0ms;tail108.0/216.0/324.0ms authored lag |
| Tail / prop range X/Y |reference larger; tail track rejected |tail1.940/1.786%H;prop0.741/1.593%H |
| Cloth |soft follow-through |1.98px band-limited sway,lag144.0ms |
| Cast |no supplied designer cast |1s additive:anticipate0–.28,reach.14–.72,hit.47–.71,recoverby1;cue250/550ms |
| Actual rules contact |existing rules retained |800ms action;350ms→clip0.55,bothmodes |
| Feet / handoff |planted-foot target |worldfeet0;directidle/cast endpoints0;actualscenehandoffmesh<.001/root<.001 |

60focused/TSC0;16CPU normal/reduced cases shared across8cats, this cat mintriangle0.57525. Actualcapture0pageerrors and Soot301samples/11mesh snapshots exactly match baseline in bothmodes. Original rigs/weights untouched.
Same-height228px,1×10s/300frame comparison film; SHA256 6a610498a08f99cf4107fca2e2fc807a1b86ce5dd249981878ab6007a63457e5.
Reviewed once: comparison-15.jpg; comparison-165.jpg; blink-sheet.jpg; cast-sheet.jpg. The selected extremes preserve face and hat silhouette with stable feet. Blink strip shows full closure followed by a soft reopen without a visible eye-edge gap. Cast samples retain coherent shoulder/cape joins and a readable caster silhouette while the projectile travels to the target.
Limits: Existing health/status HUD crosses the raised hand area. The magical hit obscures some target detail at contact; no new claim about the older effect or full-battle readability. Static samples and numeric geometry are separate from continuous-film or integrated acceptance. Integrated judge URL acceptance and performance remain CXI gates. This is scoped motion evidence, not a release claim.
