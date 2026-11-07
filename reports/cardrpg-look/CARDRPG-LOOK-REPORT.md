# Báo cáo LOOK — checkpoint L1, đang tiếp tục
Ba mèo Mochi, Soot và Clover đã được dựng lại bằng Blender với mắt, áo và phụ kiện mới.
Đây là mốc kiểm tra nhân vật; toàn bộ yêu cầu làm đẹp trò chơi chưa hoàn tất.
Mô hình mới giữ bộ khớp cũ, mỗi mèo dưới12.000 tam giác.
Ảnh thẻ được render từ chính mô hình trò chơi, không dùng ảnh tạo sinh.
Đã sửa áo sau lưng, độ ôm của mắt, khiên che mắt và phụ kiện bị lơ lửng.
Soot vẫn thiếu tương phản ở chân và thân; ánh sáng cần được cải thiện tiếp.
Sân quán cà phê, hậu kỳ, hiệu ứng và các nhân vật còn lại vẫn đang chờ các bước tiếp theo.
Bản demo hiện khoảng20,29MB, nhỏ hơn bản gốc23,94MB dù chứa cả hai kiểu hình ảnh.
Điểm dưới đây là tự đánh giá; đã tiếp tục theo yêu cầu và hoàn tất kiểm tra L1.

REFERENCE: docs/cardrpg-look/index.html; docs/cardrpg-look/slice.html; reports/cardrpg-look/CHECKPOINT.md; tools/cardrpg-look/l1-audit.mjs

| User complaint | At L1 | Self-grade /10 | Evidence / remaining work |
|---|---|---:|---|
| Cat quality | Three rebuilt cats, exact named rig |7.5|Original Blender bakes, hero round sheets; plush cheeks/tufts remain|
| Lighting/depth | Token key/rim and material ramp only |5|Soot separation.1096; new shadow/fill/environment work pending|
| Stage richness | Inherited |4|L2 not yet implemented|
| Colour/UI harmony | Tokens shared; A's L0 palette integrated |7|Three hero accessories use ink/cream/honey/mint; saturation target missed|
| Effects quality | Inherited |5|L4 flipbooks/ribbons/scene light pending|
| Sharpness | Smoother silhouette and baked1024maps |7|Hero crop Laplacian355–468; eye read at120px; no new post-stack acceptance|
| Post look | Inherited bloom/focus |5|L3 AO/outline/LUT/tier pass pending|

See CHECKPOINT.md for per-hero measurements, comparisons, limitations and four-lens self-review. Only Mochi/Soot/Clover are hero-slice candidates. Every other unit remains at its inherited tier; the remaining roster is not silently counted as rebuilt.

Current candidate: eadac6b2394d5c4d378afab38dacf1364004e5cdcdf416ab408282b29ac56fb0,20,287,129bytes. L1 motion/art review,6liveA/Btoggles,7coldopens and24first/repeat cast windows are complete. CastMAX16.8ms/100%≤20ms/errors0. Nativehub0.880–0.894s/battle6.777–6.858s; CPU4hub1.628–1.663s/battle8.970–9.099s/pageMAX133.3ms. Defaultstartup11scripts/3522504bytes/686modules,0Three/model. Strict byte parity MISS+4bytes in dormant Vite preload metadata; default dependencies and module set match. Fresh typecheck/lint/unit/build/421E2E PASS; independent audit verifies1,263inputs. Unit totals:1731web/1020rules(+2expectedfail/11skip)/581Supabase/32chain/24auth/16contract. Network/font failures in the first resumed E2E are preserved under validation/attempts; retry421passed. Audit-only176493da leaves runtime b9c521e3 and exact HTML unchanged. No finalmatrix/20battle lifecycle/CPU4 Balanced+Low cast validation has run on this artifact.

Lane A has prepared its portrait adapter; the L1 draft publishes the three-hero contract. Partial manifest: apps/web/src/game/cardrpg/look-assets.json, repository-root paths, mochi/soot/clover at256×320 and512×640. Full9remaining portraits,48icons and rarity plates await L6. No request to change combat rules, currencies or automatic battle behavior.

L2 preparatory café: two scratch renders visually reviewed; round3 bakes completed at49,600tri/3mesh objects. Source,5atlases,GLB and3render rounds are durable under reports/cardrpg-look/memory/l2-prep. Round3 is not yet visually reviewed or wired into the game. L1 draft publication follows this audited checkpoint; L2 runtime remains pending.
