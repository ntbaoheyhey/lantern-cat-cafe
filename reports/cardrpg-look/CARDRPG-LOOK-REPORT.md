# Báo cáo LOOK — checkpoint L2, tiếp tục L3
Ba mèo Mochi, Soot và Clover đã được dựng lại bằng Blender; ảnh thẻ lấy từ chính mô hình trò chơi.
Quán cà phê mới có cửa sổ đêm, rèm, đèn giấy, cây, đồ gốm, sách, bàn trà và thảm có đường may.
Ba góc máy giữ đủ đội hình; HUD trận dùng màu xanh teal và vàng mật ong đồng bộ với bộ token.
Đã bỏ điểm giải mã WebP đồng bộ lúc đưa texture lên GPU, giữ nguyên độ phân giải2048px và hình ảnh.
Mười tám ảnh sau bản sửa trùng byte với ảnh đã duyệt; không đánh đổi chi tiết để sửa hiệu năng.
Ánh sáng vẫn đều và thân Soot còn chìm vào nền; đây là việc tiếp theo của L3.
Hiệu ứng kỹ năng, phần lớn nhân vật, bộ icon và hậu kỳ mới chưa hoàn tất.
Demo hiện22,29MB, dưới giới hạn24MB; bảng đo bên dưới chỉ ghi kết quả đã có.
Điểm là tự đánh giá; L2 chưa đồng nghĩa toàn bộ yêu cầu làm đẹp đã đạt.

REFERENCE: docs/cardrpg-look/index.html; docs/cardrpg-look/slice.html; reports/cardrpg-look/L2-CHECKPOINT.md; reports/cardrpg-look/CHECKPOINT.md

| User complaint | At L2 | Self-grade /10 | Evidence / remaining work |
|---|---|---:|---|
| Cat quality | Three original Blender cats, exact named rig, fitted gear |7.5|Each<12ktri,72reviewedposes;9cats still inherited|
| Lighting/depth | Baked stage AO/irradiance, two lanterns, ambient shafts |5.5|Stage still uniformly lit; Soot body separation.1096 at L1; L3 required|
| Stage richness | Authored room, fabrics, ceramics, plants, original night window |6.8|4Blender/3runtime rounds,50,272stage triangles; shelf repetition remains|
| Colour/UI harmony | Teal/honey scoped battle HUD and muted walnut/mats |7|No A meta-screen edits; A owns live battle shell fix|
| Effects quality | New steam/dust/shafts only |5|Skill VFX inherited; L4 flipbooks/ribbons/contact light pending|
| Sharpness |1024hero and2048stage maps, compressed without resizing |7|18/18 PNG parity after decode fix; new face-mask post checks pending|
| Post look | Inherited bloom/focus |5|New L3 SAO/LUT/SMAA drafts are unintegrated and untested|

L2 exact artifact: dac82f01dfefe213fd24c23a1cab04fe785713060fcac70bc03e16264766abf2,22,290,293bytes; source cea0a9df4f24479b965ad926d09f9e0cd5d1740f. L1 published eb568fda, draft361; L2 source-bound audit verifies1,280inputs; draft publication is next. See L2-CHECKPOINT.md and rounds/stage/runtime-3/REVIEW.md for actual comparisons and four-lens review.

| Validation | Evidence |
|---|---|
| Source gates | Typecheck/lint/unit/build/421E2E pass;1733web/1020rules/581Supabase/32chain/24auth/16contract; inherited2expectedfail/11skips |
| Actual battle cameras |3sizes×3presets, no clipping/overflow/errors; sample106draws/101148tri |
| Stage disposal |20/20owned resources released in each of3leave-table cases |
| Live A/B |6toggles at3desktop sizes; model identity/account/oldrenderer checks pass |
| Startup |11scripts/3,522,504bytes/686modules; zeroThree/model modules/requests/errors; strict parity MISS+4bytes |
| Cold7/first-repeat casts | 7cold/24casts/errors0; castMAX16.8ms/100%≤20ms; nativehub.908–.948s/battle6.497–6.623s,CPU4hub1.733–1.843s/battle8.631–9.125s; nativeMAX33.4ms/CPU4MAX166.6ms MISS |
| Offline size |22,290,293bytes,1,709,707bytes below24MB |
| Final-only checks |25×86×10matrix,20battle lifetime, CPU4Balanced/Low casts UNRUN |

Embedded bytes by class (base64 gzip payload, excluding loader/code/evidence): ateliermodels1,901,124; atelierstage1,998,272; classicmodels2,867,752; portraits3,888,484; textures/other8,046,172; icons20,280. Full counts/raw/gzip in docs/cardrpg-look/build.json.

Rejected measurements are retained: first L2 CPU4MAX233.4ms with175.762ms WebP decode; HTML.decode-only probe199.9ms. ImageBitmap two-case probe33.3native/133.3CPU4 had no image change. A subsequent interrupted cold batch measured333.3/250.0ms on its first2cases and timed out on the third; these are not replaced with invented attribution. Complete retryMAX166.6ms overlaps the real battle click97.549ms, with38.164ms sampled in resizeToHost. L3 will address constructor/resize work. See the retained source-bound trace.

| Unit group | Delivered tier |
|---|---|
| Mochi/Soot/Clover |look-slice; three-plus reviewed rounds and actual-model portraits |
| Remaining9cats |inherited unchanged; L5 pending |
|10enemies/3bosses |inherited unchanged; L5 pending |

Lane A may adopt published L1 portraits256×320/512×640 from apps/web/src/game/cardrpg/look-assets.json; repository-root paths. Future skills[id].icon1x/2x contract confirmed, artwork not yet delivered. Remaining9portraits/48icons/rarity plates await L6. Requests open: A sharedApp shell must keep nav/topHUD/Look visible during battle (fad581cf); B accepted constructor/stage allocation request5e2cd90f forL3. No combat, currency, rule, package or lockfile changes; no merge/mainpush/deploy or generative calls/subagents.
