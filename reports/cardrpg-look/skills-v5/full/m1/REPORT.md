# M1 — stabilise existing presentation
Khựng khởi động CPU4 giảm còn166,6–200,0ms, đạt ngưỡng220ms ở cả ba lượt đo.
Thời gian vào trận CPU4 còn9,35–10,22giây, đạt giới hạn V0.1+300ms.
Chữ phản ứng và số dùng chung vùng đặt; còn20khung thiếu một cặp chữ/số ở1024px.
Giữ nguyên toàn bộ mẫu lỗi; phần còn thiếu được chuyển sang M2/MX theo giới hạn ba lần sửa.
Chỉ thay trình bày, chưa merge hay triển khai; đã lưu đầy đủ kiểm tra M1 và tiếp tục M2.

Base #415 `f9924699c`; measured artifact SHA256 `de92c9c30e8c51be3a8ba396e425de57b990380a9a1ff59be5a366e46314f6cb`.
Source identity: [source.json](source.json); exact instructions: [full/PROMPT](../PROMPT.txt).
Three.compileAsync traversed invisible pools; compilation now uses bounded object batches, essential status/family preparation, and deferred first-use-safe geometry uploads. Shared cooperative queue measures each slice.
One scene reservation now serves reaction words and DOM numeric stacks. First simultaneous target gets the full reaction, others get ×N. Secondary numbers are smaller; Burn/Bleed/Regen styles stay distinct.

| Gate | Measured result | Status |
|---|---|---|
| Cold native, three runs |33.4/33.4/50.0ms|Recorded|
| Cold CPU4, three runs ≤220ms |166.6/200.0/183.3ms|PASS|
| CPU4 ready ≤11035ms |10095.9/9353.4/10216.1ms|PASS|
| Prewarm slices ≤40ms |51.5ms max, dominated by one texture upload|PARTIAL|
| P5–P14 collision windows |1176frames;0visible overlaps;20P6/1024frames unplaced|PARTIAL|
| Five seeds/base parity |7/17/71/1808/20261108 byte-exact;10fixture plans unmutated|PASS|
| Typecheck/lint/unit/build |Current-source logs retained in gates/*4.log|PASS|
| Cast first/repeat, native1280/1440 + CPU4 |168windows; max16.8ms;125draws/173753tris|PASS|
| Protected faces / text contrast |90masks,0offenders;51shots,min4.618:1|PASS|
| Keyboard/Escape + reduced motion |12cases; ui3 probe focus bug retained, ui4 repaired|PASS|
| E2E |420/421; unchanged idle test passed twice isolated|PASS with recorded flake|
| OFF startup |11loaded chunks same bytes+members;0Three/models|PASS|

Cold details: [cold-summary](cold-summary.json); every sample and trace reference is retained in cold-attempt1/2/3. Async compile wall time is not presented as a blocking frame duration.
Collision receipt: [collide3](collide3/collisions.json.gz); `summarize.mjs` checks every row, including unplaced labels. Previous tail-only reporting missed P6 and was corrected in FIXLOG.
P15 uses the published boss phase fixture at action72/sequence185; old v2 boss text adapter limitation is registered B-M3-001, not silently treated as verified.
All M1 code remains under lookV2; no rule/flag defaults, A-owned files or protected paths changed. No additional texture assets.
Draft [#416](https://github.com/ntbaoheyhey/taskbar-hero/pull/416), source54d3e29b2; all complete rows aggregated in [summary](summary.json).
Continuous [20-second fixture clip](video/M1-after-20s.mp4), [sampled review](video/clip-review.webp), and [fresh-eyes defects](FRESH-EYES.md); clip path verified in the recording receipt.
M1 review retains five concrete defects; top three carry to the already-scoped M2 work after capped M1 attempts. No live claim.

| Self-score criterion | Weight | Score | Evidence / assessment |
|---|---|---|---|
| Skill VFX beauty |22%|4.5|[review](review.webp): many narrow or flat motifs; MX rebuild needed.|
| Status readability |15%|7|[shots](after3/shots.json.gz): visible marks/badges; P4 crowded.|
| Combo/reaction legibility |12%|6.5|[collision windows](collide3/collisions.json.gz): shared lanes; P6 narrow case misses.|
| Multi-target clarity |8%|7|[clip review](video/clip-review.webp): separate target numbers and stagger.|
| Unit/monster readability |8%|4|[P15/P1 review](review.webp): floor separation and boss hierarchy miss.|
| Performance |15%|8|[summary](summary.json): cast/cold pass; texture slice misses.|
| Live integration correctness |15%|2|Fixture only; runnable A branch recorded for M3, no live proof.|
| Size/startup/compatibility |5%|7|29,210,352byte artifact; reduced-motionPASS; [OFF receipt](startup/checks.json).|
Weighted self-score **5.55/10**; user acceptance not claimed. Lowest lines live integration and VFX: preserve M3 integration decision and MX0 baseline audit, then execute M2's explicit readability scope.
