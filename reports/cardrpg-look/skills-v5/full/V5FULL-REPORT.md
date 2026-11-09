Đã nối hiệu ứng Skills V5 vào trận tự động thật; 18 hạt giống khớp luật gốc, không sửa luật.
Bộ đo ghi nhận 45/45 ô; 15/17 ảnh là lượt thật, hai ảnh ghi rõ fixture; chưa có thử nghiệm người chơi.
Tung chiêu tối đa 16,8 ms; mở lạnh CPU4 tối đa 183,3 ms; 147 lượt vẽ dùng ngoại lệ 150, chưa đạt 130.
Demo đầy đủ 30,075 MB, bản nhẹ 21,813 MB; sáu ảnh so sánh có SSIM từ 0,994547.
Tự chấm 7,54/10; mỹ thuật 6,233/10, chiều sâu và độ riêng còn hạn chế. Bàn giao PARTIAL với bằng chứng.

# Skills V5 full run — presentation delivery
Presentation-only, one agent, native/headless. Runtime rules/default flags/protected files unchanged; draft PRs only, no merge or deployment. Catalog correction: 48 active cat skills include 12 ultimates; the 60-cat sheet adds 12 passives, plus 26 enemy attack cues.
Read [M4 report](m4/REPORT.md), [repair log](FIXLOG.md), [registered live seeds](LIVE-SEEDS.md), and [M3 preview](m3/REPORT.md). Stack: #409→#413→#415→#416→#418→#419→#421→[#425](https://github.com/ntbaoheyhey/taskbar-hero/pull/425); integration [#420](https://github.com/ntbaoheyhey/taskbar-hero/pull/420) stays **INTEGRATION PREVIEW — not for merge**.
Watch [30 s pitch](m4/videos/pitch-30s.mp4), [20 s natural before](m4/videos/before-20s.mp4) / [after](m4/videos/after-20s.mp4), and [20 s labelled skill reel](m4/videos/skill-reel-20s.mp4). Open [offline demo](../../../../docs/cardrpg-look/v5-live.html) or [lean demo](../../../../docs/cardrpg-look/v5-live-lean.html); guide has 17 examples and explicit fixture labels.

| Self-score criterion | Weight | Score / 10 | Evidence and practical limit |
|---|---:|---:|---|
| Skill VFX beauty |22%|6.2|[After audit](VFX-AUDIT-AFTER.md), [60 peaks](m4/vfx/peak-sheet.webp): more layers, but depth and uniqueness miss.|
| Status readability |15%|8|[1024 key frames](m4/review/repaired-key8-1024.webp): marks/badges agree; some labels remain small.|
| Combo/reaction legibility |12%|7.5|[Coverage](m4/coverage/COVERAGE.md): four reactions rendered; geometric Rupture/Spread motifs remain modest.|
| Multi-target clarity |8%|8|[1440 key frames](m4/review/repaired-key8-1440.webp): staggered impacts and seven natural shape cells.|
| Unit/monster readability |8%|7|[Roster](m4/kettle-fix/roster/roster.json.gz): Yarn/Pantry ≥2×; Kettle 1.997× and pale relief remain partial.|
| Performance with rich VFX |15%|7.5|[Cast/cold receipt](m4/delivery2/measured-summary.json): frame gates pass; 130 draws/zero allocation miss.|
| Live integration correctness |15%|9|[45-cell matrix](m4/coverage/COVERAGE.md): exact hashes, no observed desync; ten original ending probes remain unverified.|
| Size/startup/compatibility |5%|8|[Package](m4/delivery2/full-build.json.gz), [SSIM](m4/delivery2/ssim.json): size passes; OFF entry +3 bytes.|
Weighted **7.54/10**, below target 8.0; these are agent assessments, not user review. [Audit before](VFX-AUDIT.md) → [after](VFX-AUDIT-AFTER.md): mean **4.517→6.233**, below 7.5; all-cue table and worst-half ordering retained. No universal 60-tile uniqueness claim.

| Key P-shot at 1440 DPR1 | Before full run | After M4 |
|---|---|---|
| P1 Burn | [before](m1/after3/shots/1440-P1-burn.webp) | [after](m4/shots/1440-P1-live-P1.webp) |
| P4 Status overflow | [before](m1/after3/shots/1440-P4-overflow.webp) | [after](m4/shots/1440-P4-live-P4.webp) |
| P6 Crumb Burst | [before](m1/before/shots/1440-P6-crumb-burst-three.webp) | [after](m4/shots/1440-P6-crumb-burst-three.webp) |
| P8 Bitter | [before](m1/before/shots/1440-P8-bitter.webp) | [after](m4/shots/1440-P8-live-P8.webp) |
| P10 Rupture | [before](m1/before/shots/1440-P10-rupture.webp) | [after](m4/shots/1440-P10-live-P10.webp) |
| P15 Boss phase | [before](m1/before/shots/1440-P15-yarn-phase.webp) | [after](m4/shots/1440-P15-live-P15.webp) |
| P16 Mochi ultimate | [before](m1/before/shots/1440-P16-mochi-ultimate.webp) | [after](m4/shots/1440-P16-live-P16.webp) |
| P17 Clover greenhouse | [before](m1/before/shots/1440-P17-clover-greenhouse.webp) | [after](m4/shots/1440-P17-live-P17.webp) |
Before images use registered fixtures; after images use live rule replays where available, so differing rosters/events are not pixel-matched A/B evidence. P5/P6 stay fixtures. [Exact case pins](m3/live-cases/index.json) and [DPR2 delivery frames](m4/dpr2) preserve source/action/time.

| Live coverage | Observed / requested | Evidence |
|---|---:|---|
| 8 keywords × apply, tick/trigger, expire/cleanse |24/24|[Matrix with seed, round, action and canvas](m4/coverage/COVERAGE.md)|
| Signature statuses |7/7|Same matrix; active snapshots, not all possible interactions.|
| Reactions |4/4|Crumb Burst, Wildfire, Rupture, Spread observed naturally.|
| Target shapes |7/7|Single, Pierce, Row, Splash, Bounce, All, Multi-hit.|
| Enemy Burn/Bleed/Bitter on cats |3/3|Exact source/target layer submissions and saved frames.|
18 unique registered battles; 23 retained natural samples after five repair deltas; 2,091 plans. Original 38/45 result is retained. Matrix means received→submitted at nonzero alpha→frame→cleared within the probe scope; selected frame review does not establish stranger recognition. Original ten narrow-probe endings remain NOT VERIFIED; later deltas do not replace them.

| Performance / compatibility | Measured | Gate / scope |
|---|---|---|
| Gallery + crowded casts |168+18 windows; native16.8 ms; CPU4 33.2 /66.7 ms|≤16.8 /100 ms PASS; first+repeat at registered profiles.|
| Cold native /CPU4 |33.4/33.4/33.3;149.9/150.0/183.3 ms|Three fresh samples each; CPU4≤220 PASS.|
| Ready |native5702.9–5752.1; CPU48883.9–9212.6 ms|Within B2+1.5 s; recorded environments differ from early historical runs.|
| Draws /triangles |147 /163239|130 MISS; conditional150 only for Yarn plus four threads, justified by cast checks;180k PASS.|
| Labels /faces /contrast |51 fixed+1194 cueframes:0overlap/outside/unplaced;98facemasks:0;min4.618:1|1024/1280/1440; boss banners and floating numbers included.|
| Reduced motion /keyboard |12 fixed cases PASS; guide Escape/dev gate at3widths PASS|No universal device/browser claim.|
| OFF startup |same11loadedmembers;0Three/model/errors; entry28182→28185B|+3bytes generated preload metadata: literal parity PARTIAL, other10counts match.|
| Full /lean bytes |30,075,127 /21,812,603|≤31.5MB PASS; six matched shots SSIM≥0.994547.|
| Source /E2E |typecheck/lint/build PASS;B1813/live1865web units;liveE2E421/421;B419/421+bothclocktests2/2isolatedPASS|Original failures and isolated reruns retained; tests unchanged.|
| Evidence |79137211 bytes;4videos≤30s|≤80MB; raw traces/HTML in hashed local manifest; historic clips have immutable git links.|
[Detailed costs](mx-evidence/opt3/allocation/allocation.json.gz): 600-frame samples Mochi220728/Soot106500/Yarn115280 B after85–93% reduction, still nonzero. Largest recorded warm-up upload slice44.3 ms exceeds40; cold/cast gates nevertheless pass.
Embedded full asset classes: flipbooks176216;atelier models6642384;icons422620;portraits6672036;stage1998112;classic models2867752;textures/other8042804 bytes. JS before gzip2803107; guide imagery1963981 bytes. [Full/lean build receipts](m4/delivery2) give exact accounting and hashes.

FIXLOG: repaired offline boot, shared word/number lanes, legacy labels, live sibling overlay, crowded contact pools, feet clipping, boss subtitle/banner collisions and five missing modifier-trigger pulses. Original misses retained. [M4 visual review](M4-REVIEW.md) records five flaws and the three worst scoped repairs.
PARTIAL after attempt caps: VFX beauty/uniqueness, pale foe relief, Kettle1.997×, sampled allocations,44.3ms slice,OFF+3B. No fourth cosmetic attempt or hidden threshold change. Pitch/reel receipt status: pitch2reactions/6multi-target/3ultimates;reel12starts,lastafterglowtrimmed;4clips20/20/30/20s.
Lane A: published runtime6772eb343/evidenceb21a91c35 plus S8#422 head1d7c6f68e incorporated withzero production delta; S6 DONE #424 head1195b13fa merged into preview; 13 relevant production/build inputs exact ([receipt](refresh/s6-done.json)). Existing M4 samples/demo bytes retained without resampling. Consolidated low-use feedback (Mochi2 0.442%,Panko2 0.353%) was acknowledged by A; no unaddressed B runtime request. A rules/balance/acceptance results remain separate from this presentation evidence.

S6 closure uses A’s published report only: 21PASS/21MISS, self-score6.16, pacing/balance remain partial; B never reran held-out seeds. M5 changes reports only; the prior source/build/E2E/visual receipts above apply to identical production trees. Art Rebuild proceeds independently from #423; no art v3 is included in this delivery.
