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
Bản ghép cuối, video, kiểm tra lại hình ảnh và báo cáo lane B đang được hoàn tất.

## Tình trạng bản ghép
REFERENCE: integration/PREPARE.md, integration/RUNNER.md, validation/integration-runner-test.log

Nguồn lane A tại35669487 ghép phần vật phẩm, lời mời, bộ sưu tập và Feel lab. Bốn cổng nguồn đạt, gồm1.700test web và988test luật. HTML20.617.021byte. Kiểm thử trình duyệt của từng mốc và bản ghép A đang chờ khóa đo dùng chung. Các số bên dưới ghi rõ mốc đã đo. Tự chấm điểm sẽ dựa trên bản ghép có hình ảnh lane B và bốn lượt xem tuần tự.

## Sáu nơi nên xem
REFERENCE: apps/web/src/game/cardrpg/depth/LabEvidence.tsx, demo/PLAN.md

1. Hiệu ứng và chuyển động — Feel lab → Skill gallery, chọn mèo hoặc đòn của địch.
2. Độ nét — Feel lab → Before / after, xem crop DPR1/2 và số đo F2.
3. Bố cục và góc mặt — Watch a battle now, đổi cameraA/B/C, xem overlay F1 trong lab.
4. Nhịp trận và khựng — Fight ở tốc độ1×, mở Performance để thấy frame lớn nhất và số khựng.
5. Phần chơi ngoài trận — Team & cards → Companions → Equipment → Night route.
6. Độ hiếm và giá trị vật phẩm — Invitations xem odds/pity/history, Collectibles xem giới hạn thiết kế.

## Mở và chơi
REFERENCE: docs/cardrpg3/index.html, tools/cardrpg-big/build.mjs

Bản A đang kiểm chứng nằm tại `/Users/bao/taskbar-hero-cardrpg-big-integration/docs/cardrpg3/index.html`. Mở trực tiếp bằng trình duyệt. Feel lab mở từ trang đầu và trong trận. Đường đi thường là Cafe → đội/trang bị → Prepare → Fight → Result → bản đồ. Watch a battle now mở ngay trận chương1. Demo cũ vẫn ở `docs/cardrpg2/index.html`.

## Đối chiếu toàn bộ brief
REFERENCE: COVERAGE.md, baseline/COVERAGE.md, memory/STATE.md

| Yêu cầu | Trước | Mốc đã đo | Còn phải xác minh |
| --- | --- | --- | --- |
| Kỹ năng có bản sắc | Nhiều động tác và công thức dùng chung | Starter30cặp chuyển động,31hiệu ứng/465cặp ảnh đạt |9mèo còn lại,địch,boss của B |
| Ảnh sắc nét | F0 có crop DPR1/2 |2/10cặp đạt ở F2,icon+366,30/+421,26% |8mục tiêu còn thiếu và ảnh ghép |
| Bố cục,góc mặt | Sân57,120% |78,889%,2.745tư thế0che/cắt,góc mặt≤55° |Dải kích thước nhân vật và mọi model mới |
| Nhịp lượt,khựng | Điều khiển thủ công |F5castMAX33,4/16,8ms,mở trang300ms |Cổng mở trang100ms và B đo lại |
| Phần chơi ngoài trận | Chức năng hiện hữu khó thấy |M33ảnh ở3kích thước |Bản ghép và preview hẹp |
| Trang bị đầy đủ | Nhiều hình cùng họ |384ca model/trang bị,0lỗi |Socket của model mới |
| Vật phẩm đầy đủ | Hệ thống đã có trong luật |5nhóm,tables nguồn/drop/sink |Đi trọn vòng trong bản ghép |
| Tầng độ hiếm | Trần một món10,4575% |9,6306%hiển thị,4khung/12hình huyền thoại |Tác dụng thực chiến lớn ở một số ca |
| Cân bằng tự động | Nhiều ô thắng100% |26/48bước tăng,22hòa,0giảm |Level6bão hòa,độ chênh set/mèo |
| Gacha | Odds và pity đã có |13test ceremony,nguồnG62cb5697 |Browser,3Dentrance và bản ghép |
| Giới hạn collectible | Thiết kế giới hạn đã có |25testbiên,2UI,12ảnh,0lỗi/network |Scope và walkthrough cuối |
| Bản sắc có nghiên cứu |34game được nghiên cứu trước |Tái dùng nghiên cứu,artprocedural có provenance |Đánh giá hình ảnh ghép |

Ảnh và dữ liệu nằm trong `layout/`, `sharpness/`, `motion/`, `effects/`, `flow/`, `meta/screens/`, `meta/gear/` và `items/screens/`.

## Cổng hiệu năng
REFERENCE: flow/PERFORMANCE.md, meta/PERFORMANCE.md, integration/scope/proof.json

| Cổng | Mốc đo | Kết quả |
| --- | --- | --- |
| CastMAX≤50ms,first/repeat |M33,4/16,8ms,720ca |Đạt ở M,bản ghép chờ |
| Mở trang/MAX4×≤100ms |Mpage250,1ms,cold4×233,3ms |Chưa đạt |
|≥99%frame≤20ms ởDPR1/2 |Bản ghép chưa có bộ số liệu |Chờ |
|4×p95≤33ms |Bản ghép chưa có bộ số liệu |Chờ |
|≤250drawcalls,≤150ktriangles |M207/93.802 |Đạt ở M,bản ghép chờ |
| Heap/GPU ổn định20trận |M20navigation khác bài đo20trận |Chờ B |
| Flag-off startup tách3D |Staticclosure2.319.565byte,0three/modelmodule |Đạt graphA,browser chờ |

M giữ265.761frame,4.989frame>25ms và1.367frame>50ms từ mở trang. Cast>50ms bằng0. Mọi cổng ghép cuối phải gắn với đúng HTML/hash và dữ liệu thô.

## Vật phẩm, cân bằng và lời mời
REFERENCE: docs/design/cardrpg/ITEM-TIERS.md, items/ENCOUNTER-BALANCE.md, items/ENCOUNTERS.md, invitations/PLAN.md

Heldout level1,50route mỗi ô,thứ tự bare/common/rare/epic/legendary. Chương1 đạt0/33/40/48/50win. Chương2 đạt0/16/29/41/50. Chương3 đạt0/4/11/33/49. Level6còn nhiều ô100%. Độ chênh set lớn nhất8–92%,mèo49,15–83,76%. Một món có thể tăng thắng boss34điểm phần trăm trên heldout,dù đạt trần power hiển thị.

45ngày,90tài khoản,các nguồn tài nguyên có tỉ lệ heavy/casual≤2,1948×. Cả ba nhóm còn mục tiêu bộ sưu tập mở. Gacha dùng tem kiếm được,công bố odds,pity và lịch sử. Các kết quả ngẫu nhiên có nhãn Account-bound. Chỉ thiết kế Relic xác định trước,đủ công sức và nằm trong trần mùa/toàn bộ mới có điều kiện collectible. Giao diện ghi Design only - not minted.

## Tự động hóa và phạm vi
REFERENCE: auto/A1.md, auto/A2.md, auto/A3.md, integration/scope/rules-commits.txt, integration/runner-parity.json

Người chơi chọn ba mèo,hàng và trang bị trước trận. Bộ điều khiển tự dùng toàn bộ kỹ năng đã mở. Trong trận có tốc độ,pause,skip,camera,sound. Thời lượng chương1 ước tính bằng kế hoạch trình diễn có trung vị51,411s training và53,569s heldout.48/50và44/50nằm trong45–90s. Bằng chứng wall-clock đang chờ.

Diff luật nằm trong `cardrpg/depth`,gồmA1–A3,cân bằngI,sửa save và hook runner được addendum yêu cầu. Các đường dẫn live/chain được bảo vệ có0thay đổi. Hash logic và panel đọc Fuji bằng nhau. Runner mặc định khớp300route/900encounter. So sánh đầy đủ autoExtrasON/OFF chờ checkpointB. Các tùy chọn thử nghiệm giữ mặc địnhOFF.

## Lane B delivered
REFERENCE: coord/cardrpg-big/B-OUTBOX.md trên nhánh ai/codex-cardrpg-big-sync

B đã báo các nguồn mèo,địch,stage,audio và lab đang được kiểm chứng. Thông báo18:13UTC ngày6Nov chuyển các matrix sau sang khóa theo từng cấu hình. MatrixB1 đang chạy,MAXmở trang300ms là số tạm thời. Phần này sẽ nhận số headline và đường dẫn bằng chứng từ CHECKPOINT được công bố.

## Các điểm còn thiếu và tự chấm
REFERENCE: memory/STATE.md, COVERAGE.md, demo/PLAN.md

Các cổng đang thiếu gồm khựng mở trang,8mục tiêu độ nét,dải kích thước nhân vật,tầng trang bị ởlevel6,chênh lệch set/mèo,tác dụng thực chiến của một món,wall-clock encounter,3Dentrance gacha,ON/OFFsims và kiểm chứng bản ghép. Video12mèo,boss,ultimate và bốn lượt fresh-eyes chờ hình ảnh ghép. Mỗi lượt phải ghi5điểm yếu,sửa phần nghiêm trọng rồi chấm lại.

11mục tự chấm đang chờ review gồm hiệu ứng,độ nét,bố cục/góc mặt,nhịp/khựng,cảm giác chơi,sân trống,tự động hoàn toàn,phần ngoài trận,trang bị/cân bằng,gacha và giới hạncollectible. Mục tiêu là8,5/10mỗi mục. Bản báo cáo bàn giao sẽ ghi điểm thực tế và từng cổng thiếu.

## Draft PR
REFERENCE: memory/STATE.md

F0#333,A#334,F1#335,F2#336,F3#337,F4#338,F5#339,M#340,I#341 đều là draft. G,Mfollow-up,F7 và integration chờ các cổng trình duyệt trước khi công bố. Báo cáo và STATE sẽ được chép sang ledger ở bước bàn giao.
