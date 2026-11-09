Đã tích hợp trình bày Skills V5 vào trận tự động thật; 18 hạt giống giữ nguyên kết quả.
Bộ đo mở rộng ghi nhận 45/45 ô; 15/17 ảnh dùng lượt thật, hai ảnh vẫn ghi rõ fixture.
Cửa sổ tung chiêu tối đa 16,8 ms; mở lạnh CPU4 tối đa 183,3 ms trên ba lượt.
Bản đầy đủ 30,075 MB, bản nhẹ 21,813 MB; gói nhẹ có SSIM ≥0,994547 trên sáu ảnh.
Hình ảnh tự chấm 6,233/10; chiều sâu, độ riêng và cấp phát vẫn chưa đạt mục tiêu.

# M4 — offline delivery and scoped repair revisit
Presentation-only B stack on #419; separate integration preview #420 uses A runtime6772eb343 / published evidenceb21a91c35. Source rules/default flags/manifests remain unchanged. Full and lean artifacts enable gameplayV4+skillsV5+lookV2 only through offline configuration.

| Gate | Measured result | Evidence |
|---|---|---|
| Cast windows |168gallery+18crowded;native16.8ms;CPU4gallery33.2/crowded66.7ms|[casts](delivery2/casts/casts.json.gz),[crowded](delivery2/crowded-casts/casts.json.gz)|
| Cold 3 native + 3 CPU4 |33.4/33.4/33.3ms;149.9/150.0/183.3ms;ready≤9212.6ms|[cold](delivery2/cold/summary.json.gz)|
| Crowded resources |147draws vs130target;≤163239tris in delivery casts;conditional150ceiling only for B preview|[casts](delivery2/crowded-casts/casts.json.gz)|
| Source checks |B1813/live1865web units;typecheck/lint/build pass;inherited2expected-fail/11skips preserved|[B](b-banner/closure.json),[live](banner-fix/closure.json)|
| Fixed layout |51frames+1194cueframes;1024/1280/1440;0overlap/outside/unplaced including boss banner|[collisions](banner-fix/collide/collisions.json.gz)|
| Faces/contrast/UI |98masks0offenders;min4.618:1;12keyboard/Escape/reduced-motion cases pass|[faces](banner-fix/faces/faces.json.gz),[contrast](banner-fix/contrast.json),[UI](banner-fix/ui/ui.json)|
| Natural rules and coverage |18unique seeds/23retained samples/2091plans;45/45cells observed;exact hashes|[coverage](coverage/COVERAGE.md)|
| Trigger repair |24fixedsamples at3widths;45face masks;48casts16.8native/50CPU4ms;0missing/uncleared/overlap|[triggers](triggers/closure.json)|
| Boss proportions |Yarn2.04055×/Pantry2.06854×;Kettle1.99709× remains below2;all13roster bounds pass|[roster](kettle-fix/roster/roster.json.gz)|
| OFF startup |same11loadedmembers,0Three/model/errors;entry28182→28185B (+3preloadmetadata);literalbytegatePARTIAL|[OFF comparison](off-pair/candidate/checks.json.gz)|
| Guide/lean/DPR2 |3widths:17shots/2fixtures,Escape/dev-gate/nooverflowPASS;6SSIMmin0.994547;8DPR2frames0overlap/unplaced|[guide](delivery2/guide/guide.json),[SSIM](delivery2/ssim.json)|
| E2E |B419/421;idle andsquadclocktests eachpass2/2unchangedisolated;classifiedFLAKY.Live delivery421/421PASS.|[live E2E](delivery2/e2e.log.gz),[B reruns](b-e2e-isolated/closure.json)|
| Films |20s before/after seed791576452;30s Thread pair1 pitch hasRupture+Spread,6multi-target actions,3ultimates;20s reel has12starts atx1|[film receipts](delivery2/measured-summary.json),[pitch](videos/pitch-30s.mp4)|

Source receipt records runtimeDirty=true because integration edits were pending when built. All2930source hashes and291asset hashes match committedliveced2555e0, with the existing25fallback-model aliases resolved; [lineage](delivery2/source-lineage2.json). Artifact full SHA256edd92234d18c0fbf5821baa60716dfe4e148b3d286c9bbde250d89f65905709f;lean662f3bb3caa2d3eb458b69315443d02311e382c5efe31f2cf72e92b90e18d980.

M4 addressed feet clipping, boss subtitle/number collision, and phase-banner/plate collision. Repaired shots retain the same registered action/time; collider now includes real boss banners. Modifier-trigger annotation reads existing matched logs and before-status snapshots only; raw rules/events/amounts/action clocks are unchanged. Original failed measurements are preserved.

Fresh-eyes review retains pale foe relief, thin/similar basics/passive arcs, cramped Yarn summon plates, small Bitter annotations, flat shelter/greenhouse silhouettes. All60cat peaks andSoot/Clover strips were reviewed. Full per-cue audit stays6.233 (before4.517), below7.5;M4 does not infer beauty from layer counts. Three scoped attempts per issue reached;no fourth cosmetic attempt.

Ten original narrow-probe ending records remainNOTVERIFIED;five additive repair replays show0uncleared and do not replace those originals. Renderer submissions and selected frame evidence do not prove recognition by a stranger. No human playtest,zero-allocation,universal uniqueness or A acceptance claim.

| Self-score | Weight | Score | Evidence / limit |
|---|---|---:|---|
| Skill VFX beauty |22%|6.2|[full audit](../VFX-AUDIT-AFTER.md),[peaks](vfx/peak-sheet.webp);depth/uniquenessMISS.|
| Status readability |15%|8|[keyshots](review/repaired-key8-1024.webp);faces/contrast/layout pass,smallmarks remain.|
| Combo legibility |12%|7.5|[coverage](coverage/COVERAGE.md);4reactions observed,small geometric motifs.|
| Multi-target clarity |8%|8|[shots](review/repaired-key8-1440.webp);7shapes observed with stagger.|
| Monster readability |8%|7|[roster](kettle-fix/roster/roster.json.gz);value separation passes,relief/Kettle ratioPARTIAL.|
| Performance |15%|7.5|[cold](delivery2/cold/summary.json.gz);cast/coldpass,147draws andnonzeroalloc retained.|
| Live correctness |15%|9|[coverage](coverage/COVERAGE.md);45/45cells,exacthashes;original10endingsunverified.|
| Size/startup/compatibility |5%|8|[package](delivery2/full-build.json.gz);full30.075MB,OFF+3Bpartial.|
Weighted self-score7.54/10, below8.0. Score is the agent's assessment, not a playtest or user approval. Continue M5 with explicit limits;laneA S6 refresh remainspending.

Film review sampled12frames per clip plus reaction/lastultimate detail frames. Rupture andSpread words are visible in the retained pitch at3.55/29.55s. The reel shows12starts andMarigoldimpact by19.85s, but its lastafterglow is trimmed by the20s limit; no complete12cue lifecycle claim. [Review](review/film-details.webp).

[Asset class bytes](delivery2/asset-classes.json) give full/lean accounting. Review WebP images are q64 at originalDPR/dimensions; [encoding receipt](encoding.json) maps original anddelivered hashes. Original fullresolutioncaptures remain in the raw localmanifest; no measurement was recaptured or dropped.

Natural before/after preserve seed, party, stats and encounter. V4/V5 ON also normalizes the default focus/care plan; [exact setup comparison](delivery2/film-setup-comparison.json) records that third difference. This footage is not an identical-rules parity sample.
