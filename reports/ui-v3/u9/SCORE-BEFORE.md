# U9 preliminary self-review

Review basis: actual U8 offline Home/Prepare/Result and both contact sheets, all37UIchecks,24axe scans,24battle geometry samples. Existing E2E is running; the existing E2E subsequently passed421/421 without retries/skips. These are automated proxies and the agent's visual judgment, not human preference.

| Line | Weight | Score | Evidence and limit |
|---|---:|---:|---|
| First five seconds |25%|9.0|Largest Night Patrol above fold at3sizes;2click battle;14.285s natural win. Crew portraits remain visually small.|
| Game feel |20%|7.5|Full-window cafe, sheets, recruit beats and reward motion; [Home](pre-improvement-home.webp) still reads as a flat stage with portraits.|
| Navigation/parity |15%|9.0|11destinations mapped; model counts/pity equal;6primary destinations and≤10fixedcontrols. Utility detail views still contain longer content.|
| Battle readability |15%|8.0|0intersections in24samples; ultimate/reaction/damage feedback verified. Dense enemy/status scenes depend on B composition.|
| Performance/size |15%|7.0|31.20MB below40;entry+42B;idle0longtasks/draws0. Coldinteractive2.14–2.19s misses223.3ms.|
| Compatibility/honesty |10%|9.5|231sources/hashreceipts exact;25savemigrationchecks;0ui-seams;allfailuresretained. Full421existing-E2EPASS.|

Weighted score before the additional pass: **8.30/10**. Below8.5 triggers exactly one additional U7-style pass on the two weakest lines: game feel and performance/size. Try a small original lighting/lantern overlay on the approved fallback (no B asset edits), and native base64-to-bytes transport to remove data-URL fetch overhead. Preserve all decoded asset hashes, rerun G1 and affected UI/offline/perf gates. Keep the cold gate unchanged and report the final score even if below target.
