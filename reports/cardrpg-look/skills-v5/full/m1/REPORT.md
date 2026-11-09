# M1 — stabilise existing presentation
Khựng khởi động CPU4 giảm còn166,6–200,0ms, đạt ngưỡng220ms ở cả ba lượt đo.
Thời gian vào trận CPU4 còn9,35–10,22giây, đạt giới hạn V0.1+300ms.
Chữ phản ứng và số dùng chung vùng đặt; còn20khung thiếu một cặp chữ/số ở1024px.
Giữ nguyên toàn bộ mẫu lỗi; phần còn thiếu được chuyển sang M2/MX theo giới hạn ba lần sửa.
Chỉ thay trình bày, chưa merge hay triển khai; báo cáo này được hoàn thiện sau các kiểm tra đang chạy.

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
| Casts, faces, shots, E2E, UI, startup |Collection/aggregation in progress|PENDING|

Cold details: [cold-summary](cold-summary.json); every sample and trace reference is retained in cold-attempt1/2/3. Async compile wall time is not presented as a blocking frame duration.
Collision receipt: [collide3](collide3/collisions.json.gz); `summarize.mjs` checks every row, including unplaced labels. Previous tail-only reporting missed P6 and was corrected in FIXLOG.
P15 uses the published boss phase fixture at action72/sequence185; old v2 boss text adapter limitation is registered B-M3-001, not silently treated as verified.
All M1 code remains under lookV2; no rule/flag defaults, A-owned files or protected paths changed. No additional texture assets.
Remaining milestone evidence, fresh-eyes review and scores will be appended before the draft checkpoint.
