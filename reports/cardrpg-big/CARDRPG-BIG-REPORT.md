Đã nhận chân dung L1 Mochi, Soot, Clover qua adapter đủ cặp 1×/2×; thiếu cặp sẽ dùng hình cũ.\
Nav, HUD và Look A/B hiện trong trận; sân chiếm 74,65–81,21% vùng nội dung ở ba kích thước.\
Đã đưa nút chính lên cùng chân dung ở Collection, Invitations, Team, Equipment, Prepare và Result.\
Cả ba task đạt năm cổng; Task 3 đạt 10 nhóm chức năng, đủ 204 ảnh đúng hash và 27/27 mẫu bố cục.\
Bản bàn giao giữ PR draft; dung lượng 24 MB, startup +4 byte và cold CPU4 >100 ms vẫn chưa đạt.

# Lane A3 · 7/11/2026
REFERENCE: memory/PROMPT-A3.md; a3/task1/CHECKPOINT.md; a3/task2-fixed/CHECKPOINT.md; a3/task3-fixed/CHECKPOINT.md

[Demo HTML](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/docs/cardrpg3/index.html) · đường dẫn: `/Users/bao/taskbar-hero-cardrpg-big-delivery/docs/cardrpg3/index.html`.
Main HTML SHA-256: `32a727afc547520fa65eb8dccf4453d1a78b8d5b3403f5a78d91d265f3c3a06d` · **26.120.329 byte**.
[Draft #358](https://github.com/ntbaoheyhey/taskbar-hero/pull/358). L1 [#361](https://github.com/ntbaoheyhey/taskbar-hero/pull/361) được sao chép 91 file đúng byte, không lấy ancestry để giữ draft B; L2 [#362](https://github.com/ntbaoheyhey/taskbar-hero/pull/362) vẫn riêng, chưa nhận vào bản này.

| Việc | Trước → sau | Bằng chứng |
|---|---|---|
| 1 · L1 | Portrait cũ → cặp 256×320 / 512×640 ở chín bề mặt, bật/tắt LOOK có fallback | [Checkpoint/ảnh](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task1/CHECKPOINT.md); 3 kích thước × DPR1/2, 24 đổi LOOK giữ state; năm cổng đạt |
| 2 · Shell | Nav/HUD/Look bị ẩn → luôn hiện; chỉ khóa điều hướng làm gián đoạn trận | [Ảnh trước/sau](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task2-fixed/shell-contact.png); 7 ca shell/practice/route đạt; năm cổng đạt |
| 3 · Màn hình đầu | Level up/Begin/Equip nằm sâu bên dưới; Invitations thẻ sau chữ → nút cạnh nội dung, thẻ lớn hơn, phần giải thích gọn | [1024](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task3-fixed/layout-1024.png) · [1280](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task3-fixed/layout-1280.png); 27/27 màn ở ba kích thước đạt nút/chân dung trong viewport đầu |

Shell `.dp-app` công bố `--dp-shell-left/top/width/height` theo CSS px; B đọc trực tiếp để đặt Battle trong `.cr-content`.
1024×600: `160/87.09375/864/512.90625`; 1280×720: `184/91.09375/1096/628.90625`; 1440×900: `184/91.09375/1256/808.90625`.
Tỷ lệ sân tương ứng **74,65% / 75,83% / 81,21%**, không overlap/overflow trong Task 2; trận vẫn tự động hoàn toàn.

Task 3: **năm cổng mới đạt** — 1.735 web / 1.020 rules (+2 expected failures/11 skips), 421 E2E; [log và retry](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/validation/a3-task3-fixed.json), [hình học](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task3-fixed/functional.json), [toàn bộ chức năng](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task3-pack/functional.json), [audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task3-fixed/audit.json).
Ảnh trước/sau là Playwright thật; 27/27 màn đạt, 2.631 vùng chữ có 0 lỗi active (min 5,589:1), 9 vùng disabled báo riêng. Collection đo portrait trong grid, Equipment đo portrait tiêu đề; khung 3D riêng còn dưới fold ở màn thấp. Đã sửa thêm đáy thẻ Team602,53→588,53px; lượt pack cũ dừng sau6nhóm, giữ nguyên chứng cứ. Gallery cũ thiếu Python đã retry đạt.
Unit retry sửa assertion câu chữ cũ; E2E idle-clock cũ timeout, retry riêng và toàn bộ421 đều đạt, không sửa logic. Baseline-v1 giữ nguyên **23.937.000 byte**, SHA-256 `9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3`.
Phạm vi A3: không đổi rules/config/contracts/Supabase/wallet/SIWE/Relic/Fuji; không sửa file B ngoài bản sao L1 đã công bố. Không merge, deploy hay push main.

| Cổng chưa đạt / chưa đo lại | Kết quả và giới hạn |
|---|---|
| HTML ≤24 MB | Vượt **2.120.329 byte**; dùng [ngoại lệ tối đa 32 MB gắn hash/ảnh](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/task3-fixed/size-exception.json), không suy ra tải nhanh |
| Startup bằng đúng baseline | T1: 11 JS / 3.522.504 byte / 686 module, **+4 byte**; 0 Three/model/lỗi; chưa coi là parity |
| Cold CPU4 MAX≤100 ms | Baseline116,7 ms, main trước L1 116,5 ms; B L1 standalone133,3 ms. Chưa đo cold main mới; yêu cầu L3 còn mở |
| Hitch Invitations | Task3 CPU4 MAX183,4 ms/p95 16,8 ms,17 frame>25 ms/7>50 ms; L0 200/T1 166,7 ms. Các ca có chụp ảnh vượt100 ms, không thay phép đo cold/cast chuẩn |
| Toàn roster/cast/performance mới | **860 ca chưa chạy**, chỉ B chạy một lần ở LOOK cuối; số cast L1 của B không phải chứng nhận main này |
| Hình ảnh/độ nét tổng thể | Chưa chấm lại art; lịch sử còn8/10 mục tiêu nét, body band24–30%/margin A, VFX che mặt, sân trống/Soot tối và UI chưa đồng nhất;9/11 tự chấm dưới8,5 |
| Cân bằng/nhịp cũ | Boss fixture170,4 s ngoài45–90 s;22/48 tier hòa, level6 bão hòa, set/mèo chênh, một món +34pp; A3 không đổi cơ chế/luật |
| Chứng cứ khác | Âm thanh chưa nghe/chấm;384 socket ca model mới chưa đo lại; collectible global cap chỉ là thiết kế, chưa enforcement |

Chi tiết lịch sử và mọi số đo cũ giữ tại [báo cáo trước A3](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/a3/REPORT-BEFORE-A3.md), [F7](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/integration/F7-GATES.md), [review](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/reports/cardrpg-big/FRESH-EYES.md); không nhận các phép đo đó là chạy lại trên main mới.
B đã công bố [L3 draft#363](https://github.com/ntbaoheyhey/taskbar-hero/pull/363), checkpoint9b1a04a4/runtime71da901f, đã tách allocation; cold CPU4 vẫn133,3 ms và startup+44 byte trên artifact riêng, chưa nhận vào A. Yêu cầu còn: giảm peak cold, giữ shell bounds khi tiếp tục Battle/HUD; sân/palette L2–L3 cần checkpoint tích hợp riêng.
Yêu cầu art còn cho B: L6 icons/frames và các portrait tiếp theo theo manifest cặp đủ; kiểm tra crown của roster/reveal còn lại; xử lý Soot tối/độ nét/VFX/camera, công bố rubric và ma trận860 khi LOOK sẵn sàng.
Ledger: [bản sao báo cáo](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/cardrpg-big/CARDRPG-BIG-REPORT.md), STATE và HANDOFF trên `ai/codex-ui-ledger`; sync chỉ append A-OUTBOX.
