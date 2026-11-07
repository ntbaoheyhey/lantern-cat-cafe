# Báo cáo LOOK — checkpoint L6, còn L5/L7
Đã giao12 chân dung từ mô hình thật,48 icon kỹ năng và4 khung hiếm, đủ bản1x/2x.
Ba mèo Mochi/Soot/Clover được dựng lại; chín mèo còn lại vẫn dùng mô hình cũ và được ghi nhãn rõ.
Chân dung đã chạy trong Collection/Team; icon và khung có gallery riêng để lane A tích hợp.
Đã sửa lỗi tải mô hình khi chuyển màn xem trước; kiểm tra lại không có lỗi trình duyệt.
Typecheck/lint/unit/build qua; E2E420 ca qua lượt đầu và1 ca qua chạy lại, không phải421 ca qua một lượt.
Demo26,392,592byte, vượt24MB nhưng dưới32MB; báo cáo có ảnh và bảng dung lượng giải thích mức tăng.
24 lượt thi triển đầu/lặp đạt đỉnh16.8ms; tải lạnh CPU×4 đỉnh133.3ms còn vượt50ms.
Điểm bên dưới là tự đánh giá; chi tiết nhỏ của icon và độ tương phản trên nền sáng vẫn còn yếu.
Chưa xongL5/L7, ma trận cuối,20 trận kiểm tra bộ nhớ và CPU×4 ở Balanced/Low.

REFERENCE: docs/cardrpg-look/index.html; docs/cardrpg-look/art.html; reports/cardrpg-look/L6-CHECKPOINT.md; reports/cardrpg-look/validation/l6/audit.json

L6 source `e71db1d6`, HTML `4696d62cd47cbf28ede7a30f2f661ef8198c46ac50b11f20b75bfd138f5cbdba`, 26,392,592bytes/1844hashed inputs. Stacked on [L4 #368](https://github.com/ntbaoheyhey/taskbar-hero/pull/368), accepted A3`daba7d7c`. Published [draft L6 #371](https://github.com/ntbaoheyhey/taskbar-hero/pull/371), evidence commit `738bb530` (remote verified). Historical L4 evidence remains bound to`fb56cd44`/23,995,962bytes; it is not a new measurement of L6.

| User complaint | Before → current | Self-grade/10 | Evidence/limitation |
|---|---|---:|---|
| Cat quality |Blocky bodies →3 Blender cats/rigs/material maps;12 rendered portraits|7.5|3look-slice;9inherited pendingL5;hero<12ktri |
| Lighting/depth |Flat fill →key/rim/ramp/contact shading and studio portraits|6.5|L3face checks pass;Soot separation proxy.0506 below.18 |
| Stage richness |Sparse tabletop →cafe textiles/ceramics/plants/night window|6.8|L2four Blender/three runtime rounds;uniform shelves/shades remain |
| Colour/UI harmony |Muddy field →teal/honey battle and12 coherent portraits|7|L6six actualUI configurations pass;A owns new icon/frame wiring |
| Effects quality |Thin effects →6original atlases/ribbons/surfaces/impact lights|6|L4minimum distance.6030→.6530;1162strict pair decreases remain |
| Sharpness |Flat maps →1024hero/2048stage textures and1x/2x art|7|Eyes protected;light-background whiskers/tiny icon details weak |
| Post look |No complete stack →bloom/grade/focus/vignette/grain/SMAA tiers|7|Compact AO;not full shadow maps/GTAO/TAA |

Art-specific self-grades: hero portraits7.5; inherited portraits6;48miniatures7;rarity plates6.5. Personally reviewed selected dark/light sheets and actual1x crops. Static lighting plates are not animated foil. Locked card grayscale/question badges are existing A screen behavior. Full review: validation/l6/REVIEW.md.

| Validation | L6 receipt |
|---|---|
| Source |Type/lint/unit/build pass;1751web;1020rules/581Supabase/32chain/24auth/16contract;2expectedfail/11skip |
| E2E |420pass/1legacytimer timeout;exact failed case passes focused retry unchanged. Aggregate421coverage;original failure retained |
| Gallery |12portraits/48skills/4plates;72image decodes×3sizes;0overflow/errors/remote |
| ActualUI |3sizes×2DPR;180portrait decodes/24state-preserving toggles;preview navigation reaches4models ready |
| First/repeat |24windowsMAX16.8ms;100.00%≤20ms;0errors;High DPR1slice |
| Cold7 |NativeMAX33.3ms;CPU4MAX133.3ms **MISS** |
| Flag-off startup |11JS/3,522,593bytes;0Three/model;exact parity **MISS +93bytes** |
| Offline size |26,392,592bytes;original24MB target exceeded;authorized≤32MB justified in size-justification.json |
| Final-only |25×86×10matrix/20battle lifetime/CPU4Balanced+Low **UNRUN** |

Load-to-Hub native875.4–901.1ms/CPU42243.2–2256.1ms; battle-ready native6047.4–6135.0ms/CPU48581.0–8633.8ms. Cold page maxima include initial opening; small cast windows do not erase that miss. Inspect retained cold traces before attributing a causal improvement/regression.

Embedded bytes: flipbooks 1,416,492; atelier-models 1,901,124; portraits 6,443,236; atelier-stage 1,998,112; classic-models 2,867,752; textures-and-other 8,042,804; icons 20,280. Delivered individual art2,835,396bytes; separate gallery6,522,535bytes. Main demo gains2,396,630bytes overL4, chiefly full-resolution portrait variants; icons/plates remain separate for A. No runtime resolution reduction used to pass size.

| Unit group | Delivered tier |
|---|---|
|Mochi/Soot/Clover|look-slice;3+model rounds;third portrait refinement |
|Remaining9cats|inherited models;new2-round studio portraits;L5sculpture pending |
|10enemies/3bosses|inherited models;L4effect improvement only;L5pending |

Inherited L4 measurements:67recipes/2211pairs;0threshold/face/overdraw/error offenders;107calls/118752tri peak;1162strict pair decreases/worst−.122392341 **MISS**. SixGPU/sixcancellations release370resources exactly once with0new programs. Historical coldCPU4183.4ms and startup+93bytes remain recorded. Pale roofs/cans, layered lanterns and sparse steam remain art limitations.

All art originals and L6 capture/log/metric/trace receipts are portable in evidence-inventory.json. Failed HTML binaries and~4.8GB L4 rawframes remain local unchanged, explicitly inventoried. No full raw archive claim. Navigation source fix uses the actor's original scene snapshot; no shared UI/rules edits.

A can consume version2 portraits plus skills[id].icon1x/icon2x and static rarity plates. A4events-v4 schema/P1 andP3 boss fixtures have been read; presentation request remains open, preserving OFF behavior/duration. A owns Hub opening and icon/frame integration. NextL5→L7; inherited art/identity/performance misses remain open. No merge/deploy/main push, subagents or generative calls; native Mac, no B Docker use.
