# Báo cáo LOOK — checkpoint L4, hình ảnh vẫn cần cải thiện
Ba mèo Mochi, Soot và Clover đã được dựng lại bằng Blender; ảnh thẻ lấy từ mô hình trò chơi.
Quán cà phê có cửa sổ đêm, rèm, đèn giấy, cây, đồ gốm, sách, bàn trà và thảm có đường may.
Ánh sáng và hậu kỳ tạo khối, giữ vùng mắt/mặt rõ; HUD vẫn tách khỏi hiệu ứng làm mờ.
L4 thêm sáu bộ ảnh động gốc, giấy cong, đồ gốm/kính, dải sáng, ánh sáng va chạm và biến dạng nhẹ.
Đã chụp67 hiệu ứng, xem đủ19 ảnh tổng hợp; không có lỗi trình duyệt hoặc trường hợp vượt ngưỡng che mặt.
Năm kiểm tra mã nguồn đều qua;24 lượt thi triển đầu/lặp đạt tối đa16,8ms; demo23.995.962byte.
Chưa đạt:1.162 cặp có điểm phân biệt giảm, khởi động tăng93byte, tải lạnh CPU×4 có đỉnh183,4ms.
Mái giấy/bình tưới còn nhạt, đèn lồng trong suốt lộ lớp mặt; chưa đạt trọn mục tiêu chất lượng hình ảnh.
Điểm bên dưới là tự đánh giá. L6 chân dung/icon, L5 dàn nhân vật và kiểm tra cuối L7 vẫn còn việc.

REFERENCE: docs/cardrpg-look/index.html; reports/cardrpg-look/L4-CHECKPOINT.md; reports/cardrpg-look/validation/l4/checkpoint-audit.json; reports/cardrpg-look/validation/l4/REVIEW.md

Runtime sạch `b5e7c16c` trên checkpoint A3 `daba7d7c`; demo SHA256 `fb56cd44b7472b82670bfd8e9712259c036e2aa49d1911c139c4fe2b2641f494`. Audit xác nhận1.580 đầu vào. Nhánh L1/L2/L3 được đối chiếu lại với A3; số đo cũ vẫn gắn với đúng artifact lịch sử, không dùng thay cho L4.

| User complaint | Before → current | Self-grade /10 | Evidence / limitation |
|---|---|---:|---|
| Cat quality | Blocky bodies →3 original Blender cats/rigs/material maps |7.5|Each hero<12k triangles;72 reviewed poses;9 cats still inherited |
| Lighting/depth | Flat fill →analytic environment, form ramp, contact/depth shading |6.5|36 face post ablations pass; Soot separation proxy.0506 still below.18 target |
| Stage richness | Sparse tabletop →authored cafe, textiles/ceramics/plants/night window |6.8|4 Blender/3 runtime stage rounds; mirrored shelves/uniform shades remain |
| Colour/UI harmony | Muddy field →teal/honey battle and A's retained shell |7|9 camera cases/6 live toggles pass;1024 layout is dense |
| Effects quality | Thin/flat effects →6 original36-frame atlases, ribbons, surfaces, impact lights |6|67 recipes, minimum distance.6030→.6530;1162 numeric pair regressions remain MISS; pale paper/cans |
| Sharpness | Flat maps →1024 hero/2048 stage maps, protected eyes/focus |7|36 inner-face samples pass; whole-body edge energy did not improve in L3; no blanket sharpness claim |
| Post look | No complete stack →bloom/grade/focus/vignette/grain/SMAA tiers |7|High/Balanced/Low checked; compact AO, not full shadow maps/GTAO/TAA |

Matched before/after effect sheets and all pilot reviews: `rounds/effects/` and `validation/l4/captures/`. Three original atlas rounds: `rounds/flipbooks/`. All19 phase sheets were personally inspected; sampled frames do not prove continuous-play quality. The large pale Soot3 object is an expanding/fading lantern, not the orange flame. Hero material work spans six pilots, remaining cats have at least two full-roster rounds. Current visuals still require improvement.

| Validation | Current L4 receipt |
|---|---|
| Source gates | Type/lint/unit/build/421E2E pass;1749web/1020rules/581Supabase/32chain/24auth/16contract;2expectedfail/11skip retained |
| Recipe/face/cost |67 effects/2211pairs;0threshold/face/overdraw/empty/error offenders; peak107calls/118752tri/36instances/18overdraw |
| Strict uniqueness |**MISS**1162 pairs decrease, worst−.122392341; fixed threshold remains.16 |
| GPU/prewarm |6 tier/light actions stable89textures/574geometries/49programs;0new programs; light changes193–582floor pixels |
| Teardown |370resources exactly once/0duplicates;6cancellation boundaries release159/159/218/298/298/148; context/canvas/root/lights cleaned |
| Battle/post |3sizes×3cameras,6state-preserving Look toggles,36inner-face samples pass |
| First/repeat casts |24windowsMAX16.8ms/100%≤20ms/errors0; sampled High DPR1 slice, not final matrix |
| Cold7 |NativeMAX50.1ms; CPU4MAX183.4ms **MISS**, up fromL3 133.3ms |
| Flag-off startup |11JS/3,522,593bytes/686modules;0Three/model requests/errors; exact byte parity **MISS +93** |
| Offline size |23,995,962bytes,4,038 below24MB; no size-limit raise |
| Final-only checks |25×86×10matrix,20battle lifetime, CPU4Balanced/Low casts **UNRUN** |

Native Hub881.5–939.8ms/battle6067.7–6223.9ms; CPU4Hub2243.3–2261.3ms/battle9380.6–9876.8ms. The worst183.4ms opening frame precedes Hub readiness and overlaps a MessagePort callback/layout; a later133.3ms frame overlaps an anonymous scene-loading timer. Next best profiling targets: A's initial Hub mount/layout and the loading timer. The CPU4 DPR1 post-ready sample stays≤16.8ms; it does not erase the opening miss. Original traces/arrays are preserved.

Embedded gzip/base64 bytes by class: flipbooks1,416,492; atelier models1,901,124; stage1,998,112; classic models2,867,752; portraits4,064,880; textures/other8,042,804; icons20,280. Full raw/gzip counts in build.json. Six1536² RGBA8 effect atlases alone occupy56,623,104 uncompressed bytes; legacy estimatedGpuBytes is not total GPU memory.

| Unit group | Delivered tier |
|---|---|
| Mochi/Soot/Clover |look-slice; three-plus reviewed model rounds, actual-model portraits |
| Remaining9cats |inherited models; effects improved, L5 sculpture pending |
|10enemies/3bosses |inherited models; covered starter effect variants improved, L5 pending |

Portable evidence includes contact sheets, original metrics/signatures/pair comparisons, source logs, timing traces and Blender atlas rounds. Full per-effect raw PNGs (~4.8GB) remain local unchanged; evidence-inventory.json states exactly what is omitted. This is not a full raw-image archive. No failed pilot or numeric regression is hidden.

A already adopted the L1 portrait contract. L6 must deliver12 portraits/48icons/rarity plates using the confirmed skills[id].icon1x/icon2x keys. A4's Battle.tsx presentation request is acknowledged; published event schema/fixture is still needed before implementation, with OFF behavior and action duration preserved. Hub opening profile is an A-owned follow-up. Next order L6→L5→L7; remaining L4 art/identity misses stay open. No rules/shared/protected changes, merge/main push/deploy, subagents or generative calls.
