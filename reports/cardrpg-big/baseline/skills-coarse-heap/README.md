# Exhaustive skill timing
REFERENCE: summary.json; ranked.json; tools/cardrpg-big/skill-measure.mjs; tools/cardrpg-big/skill-report.mjs

In progress · 115/610 cases. 0 page errors. Each case opens a fresh context and cold file, clicks the campaign and battle node, then uses the isolated Feel lab fixture. Every raw file includes page-open RAF deltas, long tasks/frames, heap/GPU snapshots, two cast windows and planned/observed duration. First-use fixture setup hides every spell frame until the measured trigger. CPU4 throttles CPU only. Cast duration includes the measurement endpoint polling interval, so it can exceed the authored duration by approximately one RAF.

The catalogue contains 48 skills, including 12 ultimates, and 13 enemies, including 3 bosses. Ten configurations yield 610 cases and 1,220 casts. Low and 2560×1440 use DPR1 CPU1.

| Configuration | Cases | Page MAX ms | First / repeat MAX ms | >25 first / repeat | >50 first / repeat | ≤20 ms % first / repeat |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280×720 DPR1 CPU1 medium | 61 | 366.7 | 16.8 / 16.8 | 0 / 0 | 0 / 0 | 100.00 / 100.00 |
| 1280×720 DPR2 CPU1 medium | 54 | 366.8 | 16.8 / 16.8 | 0 / 0 | 0 / 0 | 100.00 / 100.00 |

## Ranked cases
REFERENCE: ranked.json; ../HITCHES.md; ../trace-attribution.json

Sort by the larger cast MAX, then page MAX. The raw CPU profile identifies decoder, script compilation, scene construction and first program/uniform initialization during page-open spikes. Skill-body effects lack direction registrations in the F0 artifact, which must be considered when comparing these timings with later complete effects. Profile evidence for individual later cast spikes must be captured before claiming their cause.

| Case and raw frames | Page MAX ms | First / repeat MAX ms | First / repeat duration ms |
| --- | ---: | ---: | ---: |
| [1280x720-dpr2-cpu1-medium-mochi-1](1280x720-dpr2-cpu1-medium-mochi-1.json) | 366.8 | 16.8 / 16.8 | 1130.0 / 1135.2 |
| [1280x720-dpr1-cpu1-medium-enemy-pantry-crown](1280x720-dpr1-cpu1-medium-enemy-pantry-crown.json) | 366.7 | 16.8 / 16.8 | 1529.3 / 1534.0 |
| [1280x720-dpr1-cpu1-medium-mochi-1](1280x720-dpr1-cpu1-medium-mochi-1.json) | 366.7 | 16.8 / 16.7 | 1135.4 / 1132.0 |
| [1280x720-dpr1-cpu1-medium-clover-3](1280x720-dpr1-cpu1-medium-clover-3.json) | 366.7 | 16.7 / 16.8 | 1136.3 / 1130.5 |
| [1280x720-dpr1-cpu1-medium-biscuit-2](1280x720-dpr1-cpu1-medium-biscuit-2.json) | 366.7 | 16.8 / 16.8 | 1125.8 / 1133.4 |
| [1280x720-dpr1-cpu1-medium-cinnamon-2](1280x720-dpr1-cpu1-medium-cinnamon-2.json) | 366.7 | 16.8 / 16.8 | 1130.5 / 1132.7 |
| [1280x720-dpr1-cpu1-medium-enemy-button-guard](1280x720-dpr1-cpu1-medium-enemy-button-guard.json) | 366.7 | 16.8 / 16.8 | 1247.2 / 1254.3 |
| [1280x720-dpr1-cpu1-medium-enemy-yarn-giant](1280x720-dpr1-cpu1-medium-enemy-yarn-giant.json) | 366.7 | 16.8 / 16.8 | 1532.7 / 1533.4 |
| [1280x720-dpr1-cpu1-medium-enemy-rain-spool](1280x720-dpr1-cpu1-medium-enemy-rain-spool.json) | 366.7 | 16.8 / 16.8 | 1398.5 / 1399.9 |
| [1280x720-dpr2-cpu1-medium-soot-2](1280x720-dpr2-cpu1-medium-soot-2.json) | 366.7 | 16.8 / 16.8 | 1130.8 / 1131.8 |
| [1280x720-dpr2-cpu1-medium-sorrel-3](1280x720-dpr2-cpu1-medium-sorrel-3.json) | 366.7 | 16.8 / 16.8 | 1131.8 / 1131.9 |
| [1280x720-dpr1-cpu1-medium-soot-3](1280x720-dpr1-cpu1-medium-soot-3.json) | 366.6 | 16.8 / 16.8 | 1130.1 / 1133.4 |
| [1280x720-dpr1-cpu1-medium-mallow-4](1280x720-dpr1-cpu1-medium-mallow-4.json) | 366.6 | 16.8 / 16.8 | 1371.7 / 1359.7 |
| [1280x720-dpr1-cpu1-medium-sorrel-1](1280x720-dpr1-cpu1-medium-sorrel-1.json) | 366.6 | 16.8 / 16.8 | 1133.4 / 1128.4 |
| [1280x720-dpr1-cpu1-medium-velvet-4](1280x720-dpr1-cpu1-medium-velvet-4.json) | 366.6 | 16.8 / 16.8 | 1363.9 / 1365.2 |
| [1280x720-dpr1-cpu1-medium-marigold-3](1280x720-dpr1-cpu1-medium-marigold-3.json) | 366.6 | 16.8 / 16.8 | 1132.4 / 1130.5 |
| [1280x720-dpr1-cpu1-medium-enemy-needle-moth](1280x720-dpr1-cpu1-medium-enemy-needle-moth.json) | 366.6 | 16.8 / 16.8 | 1251.3 / 1251.5 |
| [1280x720-dpr1-cpu1-medium-sorrel-3](1280x720-dpr1-cpu1-medium-sorrel-3.json) | 366.6 | 16.8 / 16.8 | 1135.8 / 1132.7 |
| [1280x720-dpr1-cpu1-medium-enemy-binding-thread](1280x720-dpr1-cpu1-medium-enemy-binding-thread.json) | 366.6 | 16.8 / 16.8 | 1181.5 / 1183.8 |
| [1280x720-dpr1-cpu1-medium-mochi-4](1280x720-dpr1-cpu1-medium-mochi-4.json) | 350.1 | 16.8 / 16.8 | 1368.9 / 1366.1 |
| [1280x720-dpr1-cpu1-medium-panko-4](1280x720-dpr1-cpu1-medium-panko-4.json) | 350.1 | 16.8 / 16.8 | 1360.9 / 1366.0 |
| [1280x720-dpr1-cpu1-medium-sorrel-4](1280x720-dpr1-cpu1-medium-sorrel-4.json) | 350.1 | 16.8 / 16.8 | 1366.2 / 1366.1 |
| [1280x720-dpr1-cpu1-medium-enemy-practice-cushion](1280x720-dpr1-cpu1-medium-enemy-practice-cushion.json) | 350.1 | 16.8 / 16.8 | 1249.8 / 1248.3 |
| [1280x720-dpr2-cpu1-medium-mochi-3](1280x720-dpr2-cpu1-medium-mochi-3.json) | 350.1 | 16.8 / 16.8 | 1132.8 / 1130.7 |
| [1280x720-dpr2-cpu1-medium-cinnamon-3](1280x720-dpr2-cpu1-medium-cinnamon-3.json) | 350.1 | 16.8 / 16.8 | 1134.2 / 1132.0 |
| [1280x720-dpr2-cpu1-medium-brioche-2](1280x720-dpr2-cpu1-medium-brioche-2.json) | 350.1 | 16.8 / 16.8 | 1123.6 / 1133.7 |
| [1280x720-dpr2-cpu1-medium-clover-1](1280x720-dpr2-cpu1-medium-clover-1.json) | 350.1 | 16.8 / 16.8 | 1132.6 / 1131.7 |
| [1280x720-dpr2-cpu1-medium-inkcap-4](1280x720-dpr2-cpu1-medium-inkcap-4.json) | 350.1 | 16.8 / 16.8 | 1364.2 / 1367.3 |
| [1280x720-dpr2-cpu1-medium-enemy-spool-ram](1280x720-dpr2-cpu1-medium-enemy-spool-ram.json) | 350.1 | 16.8 / 16.8 | 1397.6 / 1400.7 |
| [1280x720-dpr1-cpu1-medium-mochi-2](1280x720-dpr1-cpu1-medium-mochi-2.json) | 350.0 | 16.8 / 16.8 | 1136.8 / 1131.9 |
| [1280x720-dpr1-cpu1-medium-mochi-3](1280x720-dpr1-cpu1-medium-mochi-3.json) | 350.0 | 16.8 / 16.8 | 1135.6 / 1131.7 |
| [1280x720-dpr1-cpu1-medium-soot-2](1280x720-dpr1-cpu1-medium-soot-2.json) | 350.0 | 16.8 / 16.8 | 1134.8 / 1132.2 |
| [1280x720-dpr1-cpu1-medium-soot-4](1280x720-dpr1-cpu1-medium-soot-4.json) | 350.0 | 16.8 / 16.8 | 1367.4 / 1363.2 |
| [1280x720-dpr1-cpu1-medium-clover-2](1280x720-dpr1-cpu1-medium-clover-2.json) | 350.0 | 16.8 / 16.8 | 1130.0 / 1131.3 |
| [1280x720-dpr1-cpu1-medium-mallow-3](1280x720-dpr1-cpu1-medium-mallow-3.json) | 350.0 | 16.8 / 16.8 | 1135.1 / 1130.0 |
| [1280x720-dpr1-cpu1-medium-sorrel-2](1280x720-dpr1-cpu1-medium-sorrel-2.json) | 350.0 | 16.8 / 16.8 | 1133.8 / 1130.5 |
| [1280x720-dpr1-cpu1-medium-biscuit-1](1280x720-dpr1-cpu1-medium-biscuit-1.json) | 350.0 | 16.8 / 16.8 | 1129.8 / 1133.7 |
| [1280x720-dpr1-cpu1-medium-biscuit-4](1280x720-dpr1-cpu1-medium-biscuit-4.json) | 350.0 | 16.8 / 16.8 | 1366.5 / 1367.0 |
| [1280x720-dpr1-cpu1-medium-cinnamon-4](1280x720-dpr1-cpu1-medium-cinnamon-4.json) | 350.0 | 16.8 / 16.8 | 1364.2 / 1365.5 |
| [1280x720-dpr1-cpu1-medium-brioche-1](1280x720-dpr1-cpu1-medium-brioche-1.json) | 350.0 | 16.8 / 16.8 | 1135.8 / 1131.4 |
| [1280x720-dpr1-cpu1-medium-brioche-4](1280x720-dpr1-cpu1-medium-brioche-4.json) | 350.0 | 16.8 / 16.8 | 1361.4 / 1367.0 |
| [1280x720-dpr1-cpu1-medium-velvet-1](1280x720-dpr1-cpu1-medium-velvet-1.json) | 350.0 | 16.8 / 16.8 | 1134.3 / 1130.8 |
| [1280x720-dpr1-cpu1-medium-marigold-4](1280x720-dpr1-cpu1-medium-marigold-4.json) | 350.0 | 16.8 / 16.8 | 1363.8 / 1366.5 |
| [1280x720-dpr1-cpu1-medium-enemy-spool-ram](1280x720-dpr1-cpu1-medium-enemy-spool-ram.json) | 350.0 | 16.8 / 16.8 | 1402.9 / 1398.9 |
| [1280x720-dpr1-cpu1-medium-enemy-teacup-healer](1280x720-dpr1-cpu1-medium-enemy-teacup-healer.json) | 350.0 | 16.8 / 16.8 | 1254.1 / 1246.5 |
| [1280x720-dpr1-cpu1-medium-enemy-kettle-knight](1280x720-dpr1-cpu1-medium-enemy-kettle-knight.json) | 350.0 | 16.8 / 16.8 | 1367.8 / 1365.1 |
| [1280x720-dpr1-cpu1-medium-enemy-pollen-scout](1280x720-dpr1-cpu1-medium-enemy-pollen-scout.json) | 350.0 | 16.8 / 16.8 | 1247.2 / 1248.7 |
| [1280x720-dpr2-cpu1-medium-mochi-2](1280x720-dpr2-cpu1-medium-mochi-2.json) | 350.0 | 16.8 / 16.8 | 1131.2 / 1133.1 |
| [1280x720-dpr2-cpu1-medium-mochi-4](1280x720-dpr2-cpu1-medium-mochi-4.json) | 350.0 | 16.8 / 16.8 | 1364.8 / 1364.3 |
| [1280x720-dpr2-cpu1-medium-clover-2](1280x720-dpr2-cpu1-medium-clover-2.json) | 350.0 | 16.8 / 16.8 | 1132.5 / 1132.4 |
| [1280x720-dpr2-cpu1-medium-panko-2](1280x720-dpr2-cpu1-medium-panko-2.json) | 350.0 | 16.8 / 16.8 | 1124.1 / 1132.6 |
| [1280x720-dpr2-cpu1-medium-mallow-3](1280x720-dpr2-cpu1-medium-mallow-3.json) | 350.0 | 16.8 / 16.8 | 1132.0 / 1132.5 |
| [1280x720-dpr2-cpu1-medium-mallow-4](1280x720-dpr2-cpu1-medium-mallow-4.json) | 350.0 | 16.8 / 16.8 | 1366.3 / 1365.3 |
| [1280x720-dpr2-cpu1-medium-sorrel-4](1280x720-dpr2-cpu1-medium-sorrel-4.json) | 350.0 | 16.8 / 16.8 | 1358.2 / 1365.3 |
| [1280x720-dpr2-cpu1-medium-biscuit-1](1280x720-dpr2-cpu1-medium-biscuit-1.json) | 350.0 | 16.8 / 16.8 | 1130.0 / 1133.1 |
| [1280x720-dpr2-cpu1-medium-biscuit-2](1280x720-dpr2-cpu1-medium-biscuit-2.json) | 350.0 | 16.8 / 16.8 | 1133.3 / 1129.7 |
| [1280x720-dpr2-cpu1-medium-biscuit-3](1280x720-dpr2-cpu1-medium-biscuit-3.json) | 350.0 | 16.7 / 16.8 | 1129.3 / 1133.0 |
| [1280x720-dpr2-cpu1-medium-cinnamon-1](1280x720-dpr2-cpu1-medium-cinnamon-1.json) | 350.0 | 16.7 / 16.8 | 1135.6 / 1131.6 |
| [1280x720-dpr2-cpu1-medium-cinnamon-2](1280x720-dpr2-cpu1-medium-cinnamon-2.json) | 350.0 | 16.8 / 16.8 | 1126.9 / 1129.4 |
| [1280x720-dpr2-cpu1-medium-cinnamon-4](1280x720-dpr2-cpu1-medium-cinnamon-4.json) | 350.0 | 16.8 / 16.8 | 1356.5 / 1367.7 |
| [1280x720-dpr2-cpu1-medium-brioche-1](1280x720-dpr2-cpu1-medium-brioche-1.json) | 350.0 | 16.8 / 16.8 | 1128.3 / 1130.8 |
| [1280x720-dpr2-cpu1-medium-brioche-4](1280x720-dpr2-cpu1-medium-brioche-4.json) | 350.0 | 16.8 / 16.8 | 1362.3 / 1367.6 |
| [1280x720-dpr2-cpu1-medium-marigold-3](1280x720-dpr2-cpu1-medium-marigold-3.json) | 350.0 | 16.8 / 16.7 | 1133.8 / 1129.4 |
| [1280x720-dpr2-cpu1-medium-enemy-button-guard](1280x720-dpr2-cpu1-medium-enemy-button-guard.json) | 350.0 | 16.8 / 16.7 | 1252.7 / 1247.9 |
| [1280x720-dpr2-cpu1-medium-enemy-needle-moth](1280x720-dpr2-cpu1-medium-enemy-needle-moth.json) | 350.0 | 16.8 / 16.8 | 1251.5 / 1249.9 |
| [1280x720-dpr2-cpu1-medium-enemy-teacup-healer](1280x720-dpr2-cpu1-medium-enemy-teacup-healer.json) | 350.0 | 16.8 / 16.8 | 1246.7 / 1248.6 |
| [1280x720-dpr2-cpu1-medium-enemy-kettle-knight](1280x720-dpr2-cpu1-medium-enemy-kettle-knight.json) | 350.0 | 16.8 / 16.8 | 1366.6 / 1363.2 |
| [1280x720-dpr1-cpu1-medium-inkcap-3](1280x720-dpr1-cpu1-medium-inkcap-3.json) | 349.9 | 16.8 / 16.8 | 1130.6 / 1135.5 |
| [1280x720-dpr1-cpu1-medium-cinnamon-3](1280x720-dpr1-cpu1-medium-cinnamon-3.json) | 349.9 | 16.8 / 16.8 | 1126.7 / 1132.4 |
| [1280x720-dpr1-cpu1-medium-marigold-1](1280x720-dpr1-cpu1-medium-marigold-1.json) | 349.9 | 16.8 / 16.8 | 1131.9 / 1132.9 |
| [1280x720-dpr1-cpu1-medium-enemy-crumb-sentinel](1280x720-dpr1-cpu1-medium-enemy-crumb-sentinel.json) | 349.9 | 16.8 / 16.8 | 1247.0 / 1248.5 |
| [1280x720-dpr2-cpu1-medium-soot-1](1280x720-dpr2-cpu1-medium-soot-1.json) | 349.9 | 16.8 / 16.8 | 1131.9 / 1131.7 |
| [1280x720-dpr1-cpu1-medium-soot-1](1280x720-dpr1-cpu1-medium-soot-1.json) | 349.9 | 16.8 / 16.8 | 1135.3 / 1132.5 |
| [1280x720-dpr1-cpu1-medium-clover-1](1280x720-dpr1-cpu1-medium-clover-1.json) | 349.9 | 16.7 / 16.8 | 1130.8 / 1131.5 |
| [1280x720-dpr1-cpu1-medium-mallow-1](1280x720-dpr1-cpu1-medium-mallow-1.json) | 349.9 | 16.8 / 16.8 | 1134.9 / 1130.2 |
| [1280x720-dpr1-cpu1-medium-inkcap-1](1280x720-dpr1-cpu1-medium-inkcap-1.json) | 349.9 | 16.8 / 16.8 | 1136.7 / 1129.7 |
| [1280x720-dpr1-cpu1-medium-velvet-2](1280x720-dpr1-cpu1-medium-velvet-2.json) | 349.9 | 16.8 / 16.8 | 1132.7 / 1131.5 |
| [1280x720-dpr1-cpu1-medium-enemy-sock-skipper](1280x720-dpr1-cpu1-medium-enemy-sock-skipper.json) | 349.9 | 16.8 / 16.8 | 1198.7 / 1201.3 |
| [1280x720-dpr2-cpu1-medium-panko-3](1280x720-dpr2-cpu1-medium-panko-3.json) | 349.9 | 16.8 / 16.8 | 1132.8 / 1131.3 |
| [1280x720-dpr1-cpu1-medium-mallow-2](1280x720-dpr1-cpu1-medium-mallow-2.json) | 333.4 | 16.8 / 16.8 | 1134.8 / 1130.4 |
| [1280x720-dpr1-cpu1-medium-brioche-3](1280x720-dpr1-cpu1-medium-brioche-3.json) | 333.4 | 16.8 / 16.8 | 1132.2 / 1136.9 |
| [1280x720-dpr2-cpu1-medium-clover-4](1280x720-dpr2-cpu1-medium-clover-4.json) | 333.4 | 16.8 / 16.8 | 1365.2 / 1365.8 |
| [1280x720-dpr2-cpu1-medium-panko-1](1280x720-dpr2-cpu1-medium-panko-1.json) | 333.4 | 16.8 / 16.8 | 1131.5 / 1130.8 |
| [1280x720-dpr1-cpu1-medium-panko-1](1280x720-dpr1-cpu1-medium-panko-1.json) | 333.4 | 16.8 / 16.8 | 1130.0 / 1135.3 |
| [1280x720-dpr2-cpu1-medium-inkcap-1](1280x720-dpr2-cpu1-medium-inkcap-1.json) | 333.4 | 16.8 / 16.8 | 1130.3 / 1132.5 |
| [1280x720-dpr2-cpu1-medium-velvet-1](1280x720-dpr2-cpu1-medium-velvet-1.json) | 333.4 | 16.8 / 16.8 | 1135.1 / 1128.9 |
| [1280x720-dpr2-cpu1-medium-velvet-3](1280x720-dpr2-cpu1-medium-velvet-3.json) | 333.4 | 16.8 / 16.8 | 1130.4 / 1133.7 |
| [1280x720-dpr2-cpu1-medium-velvet-4](1280x720-dpr2-cpu1-medium-velvet-4.json) | 333.3 | 16.8 / 16.8 | 1362.5 / 1364.7 |
| [1280x720-dpr1-cpu1-medium-clover-4](1280x720-dpr1-cpu1-medium-clover-4.json) | 333.3 | 16.8 / 16.8 | 1365.0 / 1368.5 |
| [1280x720-dpr1-cpu1-medium-panko-2](1280x720-dpr1-cpu1-medium-panko-2.json) | 333.3 | 16.8 / 16.8 | 1132.3 / 1131.2 |
| [1280x720-dpr1-cpu1-medium-panko-3](1280x720-dpr1-cpu1-medium-panko-3.json) | 333.3 | 16.8 / 16.8 | 1135.5 / 1129.9 |
| [1280x720-dpr1-cpu1-medium-biscuit-3](1280x720-dpr1-cpu1-medium-biscuit-3.json) | 333.3 | 16.8 / 16.8 | 1130.5 / 1128.9 |
| [1280x720-dpr1-cpu1-medium-inkcap-2](1280x720-dpr1-cpu1-medium-inkcap-2.json) | 333.3 | 16.7 / 16.8 | 1132.6 / 1130.6 |
| [1280x720-dpr1-cpu1-medium-cinnamon-1](1280x720-dpr1-cpu1-medium-cinnamon-1.json) | 333.3 | 16.8 / 16.8 | 1130.4 / 1133.9 |
| [1280x720-dpr1-cpu1-medium-velvet-3](1280x720-dpr1-cpu1-medium-velvet-3.json) | 333.3 | 16.8 / 16.8 | 1134.7 / 1128.7 |
| [1280x720-dpr2-cpu1-medium-soot-3](1280x720-dpr2-cpu1-medium-soot-3.json) | 333.3 | 16.8 / 16.8 | 1130.9 / 1133.8 |
| [1280x720-dpr2-cpu1-medium-soot-4](1280x720-dpr2-cpu1-medium-soot-4.json) | 333.3 | 16.8 / 16.8 | 1364.8 / 1366.2 |
| [1280x720-dpr2-cpu1-medium-clover-3](1280x720-dpr2-cpu1-medium-clover-3.json) | 333.3 | 16.8 / 16.8 | 1131.2 / 1132.6 |
| [1280x720-dpr2-cpu1-medium-mallow-1](1280x720-dpr2-cpu1-medium-mallow-1.json) | 333.3 | 16.8 / 16.8 | 1128.6 / 1130.4 |
| [1280x720-dpr2-cpu1-medium-biscuit-4](1280x720-dpr2-cpu1-medium-biscuit-4.json) | 333.3 | 16.8 / 16.8 | 1360.0 / 1363.9 |
| [1280x720-dpr2-cpu1-medium-inkcap-2](1280x720-dpr2-cpu1-medium-inkcap-2.json) | 333.3 | 16.8 / 16.8 | 1131.1 / 1132.7 |
| [1280x720-dpr2-cpu1-medium-inkcap-3](1280x720-dpr2-cpu1-medium-inkcap-3.json) | 333.3 | 16.8 / 16.8 | 1129.2 / 1131.1 |
| [1280x720-dpr2-cpu1-medium-brioche-3](1280x720-dpr2-cpu1-medium-brioche-3.json) | 333.3 | 16.8 / 16.8 | 1136.8 / 1128.4 |
| [1280x720-dpr2-cpu1-medium-velvet-2](1280x720-dpr2-cpu1-medium-velvet-2.json) | 333.3 | 16.8 / 16.8 | 1128.8 / 1135.6 |
| [1280x720-dpr2-cpu1-medium-marigold-1](1280x720-dpr2-cpu1-medium-marigold-1.json) | 333.3 | 16.8 / 16.8 | 1130.2 / 1132.9 |
| [1280x720-dpr2-cpu1-medium-marigold-4](1280x720-dpr2-cpu1-medium-marigold-4.json) | 333.3 | 16.8 / 16.8 | 1366.5 / 1366.8 |
| [1280x720-dpr2-cpu1-medium-marigold-2](1280x720-dpr2-cpu1-medium-marigold-2.json) | 333.3 | 16.8 / 16.8 | 1131.9 / 1133.8 |
| [1280x720-dpr2-cpu1-medium-panko-4](1280x720-dpr2-cpu1-medium-panko-4.json) | 333.2 | 16.8 / 16.8 | 1361.8 / 1366.9 |
| [1280x720-dpr2-cpu1-medium-sorrel-1](1280x720-dpr2-cpu1-medium-sorrel-1.json) | 333.2 | 16.8 / 16.8 | 1130.9 / 1133.8 |
| [1280x720-dpr2-cpu1-medium-sorrel-2](1280x720-dpr2-cpu1-medium-sorrel-2.json) | 333.2 | 16.8 / 16.8 | 1132.1 / 1130.8 |
| [1280x720-dpr2-cpu1-medium-enemy-sock-skipper](1280x720-dpr2-cpu1-medium-enemy-sock-skipper.json) | 333.2 | 16.8 / 16.8 | 1200.7 / 1200.0 |
| [1280x720-dpr1-cpu1-medium-inkcap-4](1280x720-dpr1-cpu1-medium-inkcap-4.json) | 350.0 | 16.8 / 16.8 | 1369.1 / 1362.1 |
| [1280x720-dpr2-cpu1-medium-mallow-2](1280x720-dpr2-cpu1-medium-mallow-2.json) | 350.0 | 16.8 / 16.8 | 1132.2 / 1132.5 |
| [1280x720-dpr1-cpu1-medium-marigold-2](1280x720-dpr1-cpu1-medium-marigold-2.json) | 349.9 | 16.8 / 16.8 | 1132.0 / 1132.1 |
| [1280x720-dpr1-cpu1-medium-brioche-2](1280x720-dpr1-cpu1-medium-brioche-2.json) | 333.4 | 16.7 / 16.7 | 1132.5 / 1132.4 |
