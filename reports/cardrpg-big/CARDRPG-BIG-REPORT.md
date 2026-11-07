# Card RPG — baseline v1 · 7/11/2026
REFERENCE: memory/PROMPT.md; COVERAGE.md; integration/F7-GATES.md; video/delivery/audit.json

Đây là baseline v1 để so sánh với đợt LOOK; chất lượng hình ảnh vẫn là phàn nàn chưa giải quyết của bạn.  
Bạn chuẩn bị thẻ, đội hình và trang bị; trận đấu tự chọn toàn bộ kỹ năng và mục tiêu.  
Đã ghép đủ 12 mèo, 13 đối thủ, 86 hành động và toàn bộ phần chơi ngoài trận.  
Cả 10 nhóm chức năng đạt; đã đối chiếu 204 hash ảnh ở ba kích thước màn hình.  
Đã lưu đủ 14 video, giải mã 12.385 frame và review 991 mẫu ảnh theo trình tự.  
Nhân vật còn nhỏ, giữa sân còn trống và nhiều mảng sáng che đội hình; chưa đạt mục tiêu đẹp.  
Mở trang CPU 4× còn MAX 116,7 ms, vượt cổng 100 ms; độ nét chỉ đạt 2/10 mục tiêu cũ.  
Gacha chỉ dùng tem kiếm được; vật phẩm ngẫu nhiên account-bound, Relic chỉ là thiết kế chưa mint.  
Lane LOOK sẽ cải thiện art; A đồng bộ giao diện và tích hợp từng mốc. Bản tích hợp #358 vẫn draft; không deploy hay đẩy main.

## Kết luận và sáu nơi nên xem
REFERENCE: integration/delivery/functional-complete.md; FRESH-EYES.md; docs/cardrpg3/README.md

Bản này chơi được và có đủ bằng chứng chức năng, nhưng chưa đạt yêu cầu hình ảnh/hiệu năng tổng thể. Năm cổng nguồn đã đạt: typecheck, lint, build, 1.730 web/1.020 rules tests và 421 E2E, cộng demo types; rules giữ 2 expected failures/11 skips. Đóng gói baseline chỉ thêm bằng chứng/báo cáo: hash log kiểm tra lại, không nhận là chạy lại test. [Nguồn](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/baseline-v1-source-audit.json), [review bốn vai](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/FRESH-EYES.md).

1. Kỹ năng: Feel lab → Skill gallery; chọn mèo/địch, hành động và Focus stage.
2. Độ nét: Review studio → Before / after → Sharpness; xem crop DPR 1/2.
3. Bố cục/góc mặt: Watch a battle now → camera A/B/C; so nhân vật với sân.
4. Nhịp/khựng: Fight tốc độ 1×, mở Frame meter; phân biệt số đo raw với overhead chụp ảnh.
5. Ngoài trận: Team & cards → Companions → Equipment → Night route.
6. Độ hiếm/giới hạn: Invitations xem odds/pity/history; Collectibles xem effort và cap.

## Mở và chơi
REFERENCE: docs/cardrpg3/{index,baseline-v1}.html; tools/cardrpg-big/build.mjs

Mở trực tiếp `/Users/bao/taskbar-hero-cardrpg-big-delivery/docs/cardrpg3/baseline-v1.html`. Bản chính hiện cùng nội dung ở `/Users/bao/taskbar-hero-cardrpg-big-delivery/docs/cardrpg3/index.html`; Feel lab có trên trang đầu và trong trận. Luồng: Cafe → đội/trang bị → Prepare → Fight tự động → Result → bản đồ. Watch a battle now mở ngay trận chương 1. Demo cũ vẫn ở `docs/cardrpg2/index.html`.

Baseline 23.937.000 byte, SHA-256 `9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3`. Giữ nguyên file baseline khi bản chính nhận LOOK. Video ở [video/delivery](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/video/delivery); mỗi mèo và ultimate 25 s/1×, boss 170,4 s gồm chuẩn bị và kết quả. Boss dùng nút unlock nhìn thấy được để cấp level 10/3 sao; không phải bằng chứng cân bằng đội mới. Video không tiếng; review ảnh mỗi 0,5 s không xác minh chuyển động liên tục hay chất lượng âm thanh.

## Trước và baseline v1
REFERENCE: COVERAGE.md; baseline/COVERAGE.md; integration/delivery; FRESH-EYES.md

| Điểm brief | Trước | Baseline đã đo và ảnh | Chưa đạt |
|---|---|---|---|
| Kỹ năng/chuyển động | Nhiều công thức chung | 86 hiệu ứng/3.655 cặp grayscale; [14 video](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/video/delivery/audit.json) | Mảng sáng phẳng, che mặt; mọi mèo chỉ “improved” |
| Độ nét | Crop F0 DPR 1/2 | F2 icon +366,30/+421,26%; [cổng](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/sharpness/GATES.md) | 8/10 mục tiêu thiếu |
| Bố cục/góc mặt | Sân 57,120% | 78,889%; 2.745 tư thế không cắt/che ở F1; [ảnh](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/path-resume/1440-paused.png) | Band thân 24–30%, margin A và nhóm phía sau |
| Nhịp/khựng | Điều khiển thủ công | Tự động, replay bằng nhau; main cold MAX 33,3/116,7 ms | CPU4 >100 ms; matrix cuối chưa chạy |
| Ngoài trận | Chức năng khó thấy | 39 ảnh meta/3 kích thước; preview hẹp tăng70px; [Team](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/meta/1024-team.png) | Chrome/scene thiếu đồng nhất, cuộn nhiều |
| Trang bị | Nhiều hình cùng họ | 384 ca model,0lỗi ở M; [equip/compare](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/meta/1280-equipment-compare.png) | Socket toàn bộ model mới chưa đo lại384ca |
| Vật phẩm | Luật có nhưng khó thấy | 5 nhóm, nguồn/drop/sink; [bảng](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/docs/design/cardrpg/ITEM-TIERS.md) | Giao diện còn thô |
| Độ hiếm | Legendary10,4575%power | Trần9,6306%≤10%;4khung/12hình legendary | Thực chiến một món +34pp heldout |
| Cân bằng auto | Nhiều ô thắng100% | 26/48 bước tier tăng,22hòa,0giảm; 45ngày≤2,1948× | Bão hòa level6, chênh set/mèo |
| Gacha | Odds/pity có sẵn | 32reveal+36invitation ảnh main; [10pull](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/invitations/1280x720-cpu1-ten-pull-results.png) | Crown crop, trình diễn chưa đẹp |
| Collectible | Thiết kế giới hạn | 25test cap+2UI;12ảnh main; [help](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/designs/1024x600-help.png) | Counter cục bộ, không phải global enforcement |
| Bản sắc gốc | Nghiên cứu34game đã có | Tái dùng nghiên cứu; procedural art có provenance | Cần LOOK cải thiện vật liệu/ánh sáng |

## Hiệu năng và giới hạn bằng chứng
REFERENCE: ../cardrpg-big2/integration/{cold,lifecycle,audio-startup,flag-off}; invitations/PERFORMANCE.md

| Cổng | Số đo có nguồn | Trạng thái |
|---|---|---|
| Page-open/CPU4 MAX≤100ms | Main cold7,13.125rawframes:33,3native/116,7CPU4 | MISS100 |
| CPU4 p95≤33ms | Main cold7:16,8ms | Đạt mẫu cold, chưa phải toàn matrix |
| Cast MAX≤50ms/≥99%≤20ms | G first/repeat33,4/16,8ms;720ca | Lịch sử G; main chưa có matrix |
| Draw≤250/triangles≤150k | G207/93.802; Mechanics main242/116.868 | Mẫu đo đạt; chưa toàn86action |
| Heap/GPU sau20trận | Main+1.858.320byte≤2MiB, GPU tăng0/0/0 | Đạt,0lỗi |
| Sound startup | Main6ca/5.286rawframes,MAX33,3ms; enable226,5–316,7ms | Chức năng đạt; chưa nghe/chấm chất lượng |
| Flag-off không tải3D | 11JS/3.522.500byte,0Three/GLB/lỗi | Đạt browser; graph2.319.608byte là phép đo khác |
| Ma trận toàn roster | 25unit,86action×10config=860ca | Chưa chạy; chỉ chạy final lookV2 bởi LOOK B |

Main cold7 có13,125frame, 101frame>25ms và 17frame>50ms; [tính lại raw](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/delivery/baseline-cold-audit.json). [Cold raw/audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big2/integration/cold/raw-audit.json), [audio raw/audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big2/integration/audio-startup/raw-audit.json), [lifecycle](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big2/integration/lifecycle/summary.json). G lịch sử giữ263.056frames,4.640>25ms/1.330>50ms,MAX316,6ms;cast>50ms=0. Main cold không thay thế G hay matrix. Hàng đợi cũ của B đã nghỉ theo addendum7/11, không còn “chờ video A”.

## Đồ, cân bằng, lời mời và luật tự động
REFERENCE: items/ENCOUNTER-BALANCE.md; items/ENCOUNTERS.md; integration/extras/README.md; auto/A1.md

Heldout level1,50route/ô: bare/common/rare/epic/legendary thắng chương1 là0/33/40/48/50, chương2 là0/16/29/41/50, chương3 là0/4/11/33/49. Đây là fixture theo tier, khác đội starter trong thí nghiệm A1. Chênh set lớn nhất8–92%, mèo49,15–83,76%; một món tăng thắng boss tối đa34ppheldout dù đạt trần power hiển thị.

Mô phỏng45ngày/90tài khoản: heavy/casual≤2,194775696×OFF,≤2,189801700×ON. Extras ON có27/48bước tier tăng so26/48OFF,0đảo chiều/mất lợi thế; tất cả extras mặc định OFF. Gacha dùng tem kiếm được, odds/pity/history công khai, kết quả ngẫu nhiên Account-bound. Chỉ Relic xác định trước, effort-gated, trần mùa/toàn bộ mới collectible-eligible; giao diện ghi Design only - not minted, không cộng battle stats.

Bộ điều khiển đánh giá một hành động hợp lệ theo trạng thái, ưu tiên cứu đồng đội và kết liễu địch; tie-break ổn định giúp replay xác định và giới hạn công mỗi lượt. Người chơi chỉ chuẩn bị trước Fight. Chương1starter có median51,411s train/53,569s heldout,48/50 và44/50 trong45–90s;5trận browser46,5327–57,2778s,replay khớp. Boss170,4s nêu trên không nằm trong mẫu encounter này. Mẫu encounter heldout riêng có tỷ lệ thắng toàn route ở chương 1/2/3: starter level 1 là 20%/4%/8%, cùng đội nâng level 6 là 100%/90%/100% (50 route mỗi ô). [Chi tiết fixture và thời lượng](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/items/ENCOUNTERS.md). Đây là dấu hiệu progression chưa cân bằng, không phải mục tiêu đã đạt.

## Phạm vi và Lane B delivered
REFERENCE: integration/delivery/scope/proof.json; integration/scope/rules-commits.txt; ../cardrpg-big2/CARDRPG-BIG2-REPORT.md

Nguồn ghép có0thay đổi đường dẫn live/chain được bảo vệ, hash panel/logic đọc Fuji bằng nhau; runner mặc định khớp300route/900encounter. Thay đổi luật A1–A3, I, bugfix và default-off extras được addendum cho phép đã tách commit/sim; không nói toàn diff chỉ có A1–A3. Không đổi save âm thầm, không on-chain.

B cũ cung cấp9mèo còn lại,10quái thường/3boss,stage/audio,wrapper/Mechanics lab và18.000trận biến thể+3.600tham chiếu. #359/7e1b54b0 chỉ thêm315đường dẫn reports/tools;18nhóm chức năng standalone và các phép đo main cold/lifecycle/audio/flag-off ở trên. Không có full matrix cũ hoàn tất. Các nhận xét B về8mục tiêu nét/body band/opening misses vẫn giữ.

## Look lane — yêu cầu hình ảnh còn mở
REFERENCE: memory/PROMPT.md ADDENDUM LOOK 2026-11-07; coord/cardrpg-big/B-OUTBOX.md trên nhánh sync

Trước LOOK là baseline9a5f6ebb với góc rộng, sân trống, bề mặt sáng phẳng và chrome/meta thiếu cùng phong cách với3D. LOOK B sở hữu model Blender,diorama,lighting,post,VFX,portraits/icons; A sở hữu meta restyle từ tokens và tích hợp. Chưa có checkpoint LOOK được nhận vào baseline này; chưa có after hoặc rubric B để chép, tuyệt đối không tự đặt điểm B. Bảng before/after của art và UI sẽ được thêm cùng hash mới, screenshot/contrast và năm cổng+functional pack sau từng lần nhận. Bằng chứng baseline giữ nguyên.

## Tự chấm và những việc chưa sửa
REFERENCE: FRESH-EYES.md; integration/F7-GATES.md; video/delivery/review/observations.json

| Tiêu chí | /10 | Tiêu chí | /10 |
|---|---:|---|---:|
| Hiệu ứng/bản sắc |6,5|Độ nét |5,0|
| Bố cục/scale/facing |6,5|Nhịp/khựng |6,0|
| Cảm giác chơi |6,5|Sân còn trống |5,0|
| Tự động hoàn toàn |9,0|Ngoài trận đầy đủ |7,5|
| Đồ/độ hiếm/cân bằng |6,5|Gacha thú vị/công bằng |7,5|
| Giới hạn collectible |8,5|Mục tiêu mỗi mục |8,5|

Đây là tự chấm có giới hạn, không phải nghiệm thu của bạn.9/11mục dưới8,5. Chưa sửa:8mục tiêu nét,bodyband/margin,các mảng VFX che mặt,sân trống,pacing boss,opening100ms,tier ties/set-cat spread/utility,crop crown và UI cohesion. Worst visual fixes chuyển sang LOOK đúng ownership; không tô lại số baseline. Full matrix cuối chưa chạy; chất lượng âm thanh chưa nghe. [20điểm yếu qua4vai](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/FRESH-EYES.md).

## Draft PR và báo cáo ledger
REFERENCE: DRAFT-PRS.md; memory/STATE.md

[Integration#358](https://github.com/ntbaoheyhey/taskbar-hero/pull/358) là draft trên#332. A:#333–341,#344–345,#348; B:#342–343,#346–347,#349–357,#359. [Danh sách/link từng PR](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/DRAFT-PRS.md). Snapshot GitHub lúc 04:23 UTC ghi #359 closed/merged, merge commit `ef400fc3` trên nhánh integration; nhận định handoff cũ “không merge PR GitHub” không còn đúng. Commit có hai parent, gồm tip bằng chứng `7e1b54b0`; #358 vẫn open/draft. Không có thao tác merge API trong lần tiếp tục này. Báo cáo baseline v1 cùng STATE được sao chép sang ledger `ai/codex-ui-ledger`; các checkpoint LOOK tiếp tục dùng draft PR.
