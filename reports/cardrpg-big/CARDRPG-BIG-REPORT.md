# Taskbar Hero · Bản đang kiểm chứng
REFERENCE: memory/PROMPT.md, memory/STATE.md, COVERAGE.md

Game giữ phần sưu tập thẻ, xếp đội, trang bị và bản đồ bên ngoài trận đấu.  
Khi bấm Fight, đội tự chiến đấu bằng bộ điều khiển đã được mô phỏng.  
Sân đấu đã tăng từ 57,120% lên 78,889% chiều cao màn hình 1280×720.  
Giao diện đội, bộ sưu tập, trang bị và năm nhóm vật phẩm đã có bằng chứng kiểm thử.  
Cân bằng hiện có 26/48 bước nâng độ hiếm tăng tỉ lệ thắng, 22 bước còn ngang nhau.  
Mô phỏng 45 ngày cho tỉ lệ tài nguyên người chơi nhiều/chơi ít tối đa 2,1948×.  
Giới hạn sức mạnh hiển thị của một món huyền thoại đạt 9,6306%, trong ngưỡng 10%.  
Độ nét mới đạt 2/10 cặp mục tiêu ở F2, khựng lúc mở trang vẫn còn ở các mốc đã đo.  
Gacha đã có màn lật thẻ, xuất hiện 3D, lịch sử và kết quả vừa màn hình 1024×600.

## Tình trạng bản ghép
REFERENCE: integration/PREPARE.md, integration/RUNNER.md, validation/integration-runner-test.log

Bản ghép a106dfca trong draft #358 đã chứa toàn bộ nguồn hai lane: 12 mèo, 10 địch thường, 3 boss, màn hình ngoài trận và các lab. Demo9a5f6ebb có23.937.000byte. Năm cổng nguồn đạt1.730test web,1.020test luật và421E2E;TypeScript của demo cũng đạt. 258lượt chọn kỹ năng và93mục so sánh/160ảnh giải mã offline không lỗi. Luồng chơi ở3kích thước đã đạt: trận tự động,replay,phần thưởng,lưu/khôi phục15.378byte;27ảnh,0lỗi. Meta39,reveal32,invitation36,design12ảnh đã đạt. Mechanics lab đạt4cấu hình/8ảnh,0lỗi và giữ nguyên tài khoản. Cả10nhóm chức năng đã đạt;đối chiếu204hashảnh.14video và phép đo hiệu năng cuối đang tiếp tục; đây chưa phải nghiệm thu F7.

## Sáu nơi nên xem
REFERENCE: apps/web/src/game/cardrpg/depth/LabEvidence.tsx, demo/PLAN.md

1. Hiệu ứng và chuyển động — Feel lab → Skill gallery, chọn mèo hoặc đòn của địch.
2. Độ nét — Feel lab → Before / after, xem crop DPR 1/2 và số đo F2.
3. Bố cục và góc mặt — Watch a battle now, đổi camera A/B/C, xem overlay F1 trong lab.
4. Nhịp trận và khựng — Fight ở tốc độ 1×, mở Performance để thấy frame lớn nhất và số khựng.
5. Phần chơi ngoài trận — Team & cards → Companions → Equipment → Night route.
6. Độ hiếm và giá trị vật phẩm — Invitations xem odds/pity/history, Collectibles xem giới hạn thiết kế.

## Mở và chơi
REFERENCE: docs/cardrpg3/index.html, tools/cardrpg-big/build.mjs

Bản ghép đang kiểm chứng nằm tại `/Users/bao/taskbar-hero-cardrpg-big-delivery/docs/cardrpg3/index.html`. Mở trực tiếp bằng trình duyệt. Feel lab mở từ trang đầu và trong trận. Đường đi thường là Cafe → đội/trang bị → Prepare → Fight → Result → bản đồ. Watch a battle now mở ngay trận chương 1. Demo cũ vẫn ở `docs/cardrpg2/index.html`.

## Đối chiếu toàn bộ brief
REFERENCE: COVERAGE.md, baseline/COVERAGE.md, memory/STATE.md

| Yêu cầu | Trước | Mốc đã đo | Còn phải xác minh |
| --- | --- | --- | --- |
| Kỹ năng có bản sắc | Nhiều động tác và công thức dùng chung | Starter đạt 30 cặp chuyển động, 31 hiệu ứng và 465 cặp ảnh |Đủ12mèo/13địch đã ghép,86hiệu ứng/3.655cặp;video1×đang chờ |
| Ảnh sắc nét | F0 có crop DPR 1/2 |2/10 cặp đạt ở F2,icon +366,30/+421,26% |8 mục tiêu còn thiếu và ảnh ghép |
| Bố cục, góc mặt | Sân 57,120% |78,889%,2.745 tư thế có 0 che/cắt, góc mặt ≤55° |Dải kích thước nhân vật và mọi model mới |
| Nhịp lượt, khựng | Điều khiển thủ công |F5 cast MAX 33,4/16,8 ms, mở trang 300 ms |Cổng mở trang 100 ms và B đo lại |
| Phần chơi ngoài trận | Chức năng hiện hữu khó thấy |Bản ghép có39ảnh meta ở3kích thước |Preview hẹp tăng70px;luồng chơi3kích thước đạt |
| Trang bị đầy đủ | Nhiều hình cùng họ |384 ca model/trang bị, 0 lỗi |Socket của model mới |
| Vật phẩm đầy đủ | Hệ thống đã có trong luật |5 nhóm, bảng nguồn/drop/sink |Bản ghép3kích thước đạt;giữ giới hạn cân bằng |
| Tầng độ hiếm | Trần một món 10,4575% |9,6306% hiển thị, 4 khung và 12 hình huyền thoại |Tác dụng thực chiến lớn ở một số ca |
| Cân bằng tự động | Nhiều ô thắng 100% |26/48 bước tăng, 22 hòa, 0 giảm |Level 6 bão hòa, độ chênh set/mèo |
| Gacha | Odds và pity đã có |13 test ceremony;69b994eb có68ảnh,3D entrance và421E2E |1024resultbottom599,375px đạt;reviewvideo bản ghép đang chờ |
| Giới hạn collectible | Thiết kế giới hạn đã có |25 test biên, 2 UI, 12 ảnh, 0 lỗi/network |Scope và12ảnh design bản ghép đạt;counter chỉ trong save |
| Bản sắc có nghiên cứu |34 game được nghiên cứu trước |Tái dùng nghiên cứu, art procedural có provenance |Đánh giá hình ảnh ghép |

Ảnh và dữ liệu nằm trong `layout/`, `sharpness/`, `motion/`, `effects/`, `flow/`, `meta/screens/`, `meta/gear/` và `items/screens/`.

## Cổng hiệu năng
REFERENCE: invitations/PERFORMANCE.md, invitations/recovery-verification.json, integration/scope-header/proof.json

| Cổng | Mốc đo | Kết quả |
| --- | --- | --- |
| Cast MAX ≤50 ms, first/repeat |G 33,4/16,8 ms, 720 ca |Đạt ở G; bản ghép chờ |
| Mở trang/MAX 4× ≤100 ms |Main cold7: native33,3ms/CPU4 116,7ms |Chưa đạt; matrix860đang chờ |
|≥99% frame ≤20 ms ở DPR 1/2 |Bản ghép chưa có bộ số liệu |Chờ |
|4× p95 ≤33 ms |Bản ghép chưa có bộ số liệu |Chờ |
|≤250 draw calls, ≤150k triangles |G 207/93.802 |Đạt ở G; bản ghép chờ |
| Heap/GPU ổn định 20 trận |Main +1.858.320byte; geometry/texture/program tăng0 |Đạt ngưỡng2MiB,0lỗi (B03:24) |
| Flag-off startup tách3D |Static closure2.319.608byte, 0three/modelmodule |Đạt graph toàn nguồn ghép; browser chờ |

G giữ263.056frame từ720ca,4.640frame>25ms/1.330frame>50ms,0lỗi trang;cast>50ms bằng0. Năm profile và toàn bộ mảng raw đã được kiểm tra lại. G fresh unit có1timeout5s;filefocused11/11và421E2Eđạt,không gọi là fullsuite sạch. Header invitation CPU4 có MAX266,7ms trong bài kiểm tra chức năng;không thay thế ma trận hiệu năng riêng.

## Vật phẩm, cân bằng và lời mời
REFERENCE: docs/design/cardrpg/ITEM-TIERS.md, items/ENCOUNTER-BALANCE.md, items/ENCOUNTERS.md, invitations/PLAN.md

Heldout dùng level 1, 50 route mỗi ô. Thứ tự bare/common/rare/epic/legendary có số thắng lần lượt là 0, 33, 40, 48, 50 ở chương 1, 0, 16, 29, 41, 50 ở chương 2 và 0, 4, 11, 33, 49 ở chương 3. Level 6 còn nhiều ô 100%. Độ chênh set lớn nhất 8–92%, mèo 49,15–83,76%. Một món có thể tăng thắng boss 34 điểm phần trăm trên heldout, dù đạt trần power hiển thị.

Mô phỏng 45 ngày với 90 tài khoản cho tỉ lệ heavy/casual ≤2,1948×. Cả ba nhóm còn mục tiêu bộ sưu tập mở. Gacha dùng tem kiếm được, công bố odds, pity và lịch sử. Các kết quả ngẫu nhiên có nhãn Account-bound. Chỉ thiết kế Relic xác định trước, đủ công sức và nằm trong trần mùa/toàn bộ mới có điều kiện collectible. Giao diện ghi Design only - not minted.

## Tự động hóa và phạm vi
REFERENCE: auto/A1.md, auto/A2.md, auto/A3.md, integration/scope/rules-commits.txt, integration/runner-parity.json

Người chơi chọn ba mèo, hàng và trang bị trước trận. Bộ điều khiển tự dùng toàn bộ kỹ năng đã mở. Trong trận có tốc độ, pause, skip, camera, sound. Thời lượng chương 1 ước tính bằng kế hoạch trình diễn có trung vị 51,411 s training và 53,569 s heldout. 48/50 và 44/50 nằm trong 45–90 s. Năm ca trình duyệt đo 46,5327–57,2778 s, cả năm replay trùng kết quả. Các ca có 0 lỗi HP hoặc vượt ngân sách hành động.

Diff luật nằm trong `cardrpg/depth`, gồm A1–A3, cân bằng I, sửa save và hook runner được addendum yêu cầu. Các đường dẫn live/chain được bảo vệ có 0 thay đổi. Hash logic và panel đọc Fuji bằng nhau. Runner mặc định khớp 300 route/900 encounter. So sánh autoExtras ON/OFF đã chạy đủ50seed training và heldout, cùng90tài khoản trong45ngày. Số bước tăng tier là26/48OFF và27/48ON,0bước mất lợi thế hoặc đảo chiều. Tỉ lệ tài nguyên tối đa2,194775696×OFF và2,189801700×ON. Bảng ở integration/extras/README.md. Các tùy chọn thử nghiệm giữ mặc định OFF.

## Lane B delivered
REFERENCE: coord/cardrpg-big/B-OUTBOX.md trên nhánh ai/codex-cardrpg-big-sync

B1 tại 7006f109/draft342 có 720 ca, 0 lỗi, cast MAX first/repeat 33,4/16,8 ms, page MAX 150 ms native và 300 ms CPU4. B2c tại 4b2d5df0/draft347 đã bổ sung cả 9 mèo còn lại, 48 clip GLB/336 cặp bắt buộc và 76 hiệu ứng/2.850 cặp grayscale đạt ngưỡng. Cold7 của B2c đo page MAX 133,3 ms, post-interactive MAX 83,3 ms và p95 16,8 ms. Cổng mở trang 100 ms còn thiếu. B3 đạt405mẫu camera có0cắt/che, giữ8mục tiêu độ nét còn thiếu, coldCPU4MAX116,6ms. B5 có18.000trận biến thể và3.600tham chiếu, defaultOFF khớp toàn trạng thái. B4 có79bufferâm thanh hữu hạn/khác nhau và4ca thao tác, nhưng bật âm thanh lần đầu133,5ms và coldCPU4MAX183,3ms. E1/E2 bổ sung6địch,12clip/30cặp bắt buộc và78hiệu ứng/3.003cặp grayscale. ColdCPU4MAX lần lượt116,7/133,3ms. E3/E4/boss và wrapper đã ghép:25unit/86action,86hiệu ứng/3.655cặp grayscale. B xác nhận15video standalone24s và20replay có0tăng geometry/texture/program;đây là artifact734d301c,còn main9a5f6ebb đang đo lại. Ma trận lịch sử710ca chưa hoàn tất được giữ trạng thái thiếu. Matrix860ca cuối vẫn chờ videoA. Bằng chứng ở `../cardrpg-big2/cats/batch3/CHECKPOINT.md` và `../cardrpg-big2/performance/b1-skills/`.

## Các điểm còn thiếu và tự chấm
REFERENCE: memory/STATE.md, COVERAGE.md, demo/PLAN.md

Các cổng còn thiếu gồm khựng mở trang100ms,8mục tiêu độ nét,dải kích thước nhân vật,tầng trang bị ởlevel6,chênh lệch set/mèo,tác dụng thực chiến của một món,và bằng chứng trên toàn bản ghép. Kết quả gacha hẹp và nút Feel lab che thẻ đã được sửa/kiểm chứng. Mochi có25svideo/50frame lấy đều toàn clip ởmốc trước. Đã xem tuần tự qua4vai và ghi20điểm trong FRESH-EYES.md;video12mèo,boss,ultimate cùng lượt chấm lại vẫn chờ bản ghép đủ hình ảnh. [F7 acceptance](integration/F7-GATES.md).

11 mục tự chấm đang chờ review gồm hiệu ứng, độ nét, bố cục/góc mặt, nhịp/khựng, cảm giác chơi, sân trống, tự động hoàn toàn, phần ngoài trận, trang bị/cân bằng, gacha và giới hạn collectible. Mục tiêu là 8,5/10 mỗi mục. Bản báo cáo bàn giao sẽ ghi điểm thực tế và từng cổng thiếu.

## Draft PR
REFERENCE: memory/STATE.md

F0 #333, A #334, F1 #335, F2 #336, F3 #337, F4 #338, F5 #339, M #340, I #341, G #344, M follow-up #345 và F7 preparation #348 đều là draft. B đã công bố #342,#343,#346,#347,#349,#350,#351,#352,#353,#354,#355,#356,#357. Integration #358 đã mở draft trên #332;nguồn đã đạt,nội dung/hình ảnh/hiệu năng đang nghiệm thu. Báo cáo và STATE sẽ được chép sang ledger ở bước bàn giao.
