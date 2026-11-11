# Báo cáo lane C — bản đang cập nhật ngày 11/11/2026

Đã hoàn thành C0–C7, C9 và C10. Demo offline 29,21 MB; cả hai lần full E2E đều 421/421. Pipeline, sân 2D và VFX đã có bằng chứng chạy được, nhưng gameplay chưa đạt các mục tiêu về thua đầu, độ căng trận thường và độ dài boss trong tài khoản click thật. C11 đã có lượt 30 phút sạch và điểm tự chấm mới nhất 7,79/10; bản này chưa phải báo cáo chốt ngày 20/11.

Nền A6 `ef4aee790` (gồm Q54 và B `d5c34d233`) được giữ. Nhánh `codex/cardrpg-c-2026-11-11`, [draft PR #439](https://github.com/ntbaoheyhey/taskbar-hero/pull/439), checkpoint C10 `8423c409d`, C11 tiếp tục trên cùng nhánh. Không merge/deploy hoặc đổi contract/Supabase. Bản 3D vẫn được giữ sau cờ OFF. Fuji Relic chỉ đọc, cap +8% không đổi.

## Thay đổi có thể xem

| Trước lane C | Hiện tại | Bằng chứng |
|---|---|---|
| Puppet cũ; chưa có contract nhập Spine | Official spine-threejs 4.2.120, cache dữ liệu, state riêng từng actor, mix 0,15 s; designer → placeholder → puppet, thêm PNG fallback | `DESIGNER-SPEC.md`, `ASSET-SLOTS.md`, `assets/cardrpg-look/spine/slots.json` |
| Chưa có đường nhập layered PSD vào runtime | 25 placeholder / 206 clip; Mochi revision 2 từ 117 layer, 33 xương, atlas PMA 1024, cao 512 | `C4-RECEIPT.md`, `C8-RECEIPT.md`, `spine/c8-r2/` |
| Sân cũ và hiệu ứng chưa có contract Spine | Cafe 2D ba lớp, bóng mềm, sockets giữ mặt/HP; 74 skill / 18 status; cut-in, dim, zoom tối đa 1,10 và phase boss | `C6-RECEIPT.md`, `C9-RECEIPT.md`, `shots/c9/` |
| Q55 ảnh Bag tràn; Q56 vật tư khó đọc | Ảnh nằm trong cột, vật tư nền giấy rõ chữ; ba hành động đầu có mục tiêu/phần thưởng/chỉ tay | `C7-RECEIPT.md`, `shots/c7/` |
| Kết quả Recruit ở 900p giữ scroll, mất hàng đầu | Reset scroll về 0, focus tiêu đề, thấy đủ 10 phần thưởng và nút tiếp tục; Field Guide dùng biểu tượng status và giải thích ultimate đúng | `C11-SCREEN-SCORES.md`, `shots/c11-recruit-fixed/`, `shots/c11-guide/` |
| Chưa có demo lane C | `docs/cardrpg-c/index.html`, player 25 nhân vật, gallery VFX, video trọn trận thường/boss x1, hướng dẫn tiếng Việt | `C10-RECEIPT.md`, `docs/cardrpg-c/build.json` |

## Gameplay: mô phỏng và click thật là hai phép đo riêng

A6 dùng 500 seed 60001–60500. Lane C dùng đúng 500 seed mới 70001–70500, chia ba vòng, mỗi seed chỉ chạy một lần. Bảng sau là vòng C cuối gồm 250 tài khoản (70251–70500). Không làm vòng tuning thứ tư; các vòng trước và hash rules nằm trong ledger.

| Chỉ số mô phỏng | A6 đã lưu | C vòng cuối | Mục tiêu / kết luận |
|---|---:|---:|---|
| Thua đầu, trong tài khoản có thua | 10,37 phút | 11,61 phút; 17/250 không thua | 12–20 phút: chưa đạt |
| Có 1–3 thua trong 30 phút | 45,8% | 88% | ≥60%: đạt |
| Thắng retry theo lời khuyên | 47,76% / 1.698 retry | 83,67% / 398 retry | ≥70%: đạt trong mô phỏng |
| HP cuối trận thường thắng | 98% | 94% median | 55–80%: chưa đạt |
| Trận thường | 27,15 s median | 34,50 s median; 46,24 s p90 | Median 20–35 s: đạt |
| Boss | 70,93 s median | 69,16 s median; 82,16 s p90 | Median 45–90 s, p90≤110 s: đạt |
| Ultimate mỗi mèo / trận thường | Chưa đều | Median 1; 74,19–96,36% đạt 1–2 lần | Chưa đạt đều mọi trận |
| Độ đa dạng đội | Giữ gate A6 | 30/32 đội cách đội đầu ≤5 điểm; cat phổ biến nhất 40% top 20 | Đạt trong tập thử, không chứng minh toàn bộ 220 đội |

Đây là timeline x1 được tính từ rules, không phải thời gian browser hoặc cảm nhận người chơi. Bot mô phỏng tự equip đồ kiếm được và tính retry cùng seed từ đầy máu; driver UI chỉ mua một level mỗi route và làm lời khuyên nhìn thấy. Không gộp hai nhóm để công bố một tỷ lệ chung. [Số C5](C5-NUMBERS.md), [biên nhận và giới hạn](C5-RECEIPT.md), [báo cáo A6 giữ lại](../cardrpg-a6/A6-REPORT.md).

Run browser A6 giữ lại: 1.800,70 s, 26 thắng / 2 thua, thua đầu 5,38 phút; thường 31,12 s median, boss 90,35 s median / 184,70 s p90; HP thường 99%. Không chạy lại run đó.

Run C đầu đủ 1.800,60 s: 12 thắng / 4 thua, thua đầu 10,14 phút; thường 41,49 s median, boss 198,17 s median / 203,90 s p90; HP thường 100%. Driver lặp Today’s tasks, có can thiệp Close/Patrol qua nút thật và bỏ lỡ tên Enhance +N. Giữ nguyên `first-session.json` và `checks/session-interventions.json`; không coi đây là nghiệm thu sạch. Video demo lấy hai trận đầu trước lỗi driver: thường 36,30 s và Yarn Giant 62,34 s, x1, chỉ cắt đầu/cuối, không tăng tốc.

Run C sạch dùng tài khoản riêng, từ 07:57:39 đến 08:27:39 UTC, đủ **1.800,25 s**. Có **15 thắng / 4 thua**, thua đầu **6,56 phút**, HP cuối trận thường thắng **100% median**; không lỗi hoặc stall được ghi nhận. 13 trận thường: **54,33 s median / 69,31 s p90**. 6 boss: **170,77 s median / 215,89 s p90**. Bốn boss chương 3 lần lượt 215,89 / 170,77 / 179,76 / 156,65 s, lần cuối thắng. Các mục tiêu về độ dài trận, thua đầu và HP chưa đạt. Một trận thường còn đang chạy lúc hết 30 phút được loại khỏi thống kê trận hoàn tất. 47 lần ghi nhận thưởng, khoảng cách median 6,48 s / tối đa 221,17 s.

Hồi phục sau thao tác nhìn thấy: **2/4** lần có trận sau tại đúng chapter/node; lời khuyên đã so sánh xong là **1/1**, fallback được bấm trong khi còn “Comparing crew changes…” là **1/3**. Mẫu quá nhỏ để kết luận tỷ lệ chung, và route mới có seed mới. Snapshot chỉ đọc cho thấy 12 món đồ đã kiếm được nhưng Sorrel chưa được trang bị sau khi thay Soot; bot mô phỏng tự equip đồ mỗi route. Không gộp hai phép đo hoặc tuyên bố gear là nguyên nhân duy nhất. Các trận đầu ghi nhận 1–2 ultimate mỗi mèo; về sau có 2–5, chưa đạt đều mục tiêu.

Sau khi giữ nguyên đủ 30 phút, C11 chặn nút fallback trong lúc advisor còn so sánh; nút trở lại dùng được khi có kết quả hoặc hết timeout 8 s. Điều hướng về cafe vẫn dùng được. Browser phát hiện thêm thông báo discovery đóng sẽ clone battle và khởi động lại advisor; đã dùng nội dung encounter/run/node để giữ đúng một worker mỗi trận, test cả pending/kết quả/timeout. Sáu ảnh hai cỡ đã xem, không overflow/ảnh lỗi/browser error. Đây là sửa UI, chưa có bằng chứng làm tăng tỷ lệ hồi phục. Không đổi rules/giá/enemy budget và không làm vòng tuning thứ tư. [Số gốc và phương pháp](C11-SESSION-NOTES.md), `first-session-clean.json`, `checks/first-session-clean-analysis.json`. Frame delivery có recorder nên không thay cho benchmark renderer riêng.

C11 tiếp tục làm rõ auto-equip: hiện lợi ích **Free · +641 Power · owned gear** trên fixture riêng lấy đội/đồ từ run đã lưu. Click ở Cats, Team và Bag tại hai cỡ cho đúng +641, đúng bản đồ trang bị từ command, không trừ currency. Route đang chạy vẫn khóa; hết đồ tốt hơn có lời giải thích. Đã xem 10 ảnh, không overflow/ảnh hỏng/browser error; 9 test focused và workspace typecheck/lint đạt. Giữ nguyên raw account, rules và điểm tự chấm; không coi đây là chứng minh tăng hồi phục.

## Hình ảnh, hiệu ứng, pipeline và kích thước

Đã xem baseline 31 màn × 2 cỡ (62 ảnh), 12 ảnh Recruit sửa, 2 ảnh Field Guide và 4 ảnh battle; điểm từng màn ở `C11-SCREEN-SCORES.md`. Các điểm này là tự đánh giá từ ảnh, không phải nghiên cứu người chơi. Điểm checkpoint đầu **7,745/10, làm tròn 7,75**; sau nền cafe vẽ mới là **7,79/10**, chưa đạt 8,5. Gameplay 5,8 (20%), mười phút đầu 8,0 (15%), battle 8,2 (15%), VFX 7,9 (15%), pipeline 8,7 (15%), hình thức 8,2 (10%), ổn định/hiệu năng/dung lượng 8,9 (10%). Điểm thấp nhất vẫn là gameplay; giữ đúng giới hạn ba vòng tuning.

Cat có chiều cao bằng nhau bất kể rarity: 512 unit, on-screen 26,26–27,20% canvas, chênh 3,6%; boss 47,28% canvas, không đè party/HP. Small 461, standard/elite 614, boss 922 unit. C6 kiểm tra 552 ca hiệu ứng ở x1/x2/x3 và hai cỡ; không thiếu hiệu ứng, rơi pool hoặc đè nhãn. Pool 256, impact 2 frame, hitstop 60 ms chỉ ở presentation. C9 kiểm tra 72 ultimate / 12 phase / 4 entrance, 44 ảnh đã xem.

Lần đo offline độc lập C6: ultimate nhiều draw nhất (Marigold 4), Chromium/Metal trên máy này, x1 sau warm-up, 240 frame mỗi cỡ; p95 khoảng 16,8 ms, tối đa 61 lệnh vẽ gộp ở sweep. Đạt ngân sách 33 ms / 150. Không suy rộng thành benchmark mobile. Không phát hiện job PSD nặng khi đo. `shots/c6/offline.json` lưu số gốc.

**Nhân vật designer đã nghiệm thu: 0/25. Placeholder: 25/25.** Mochi pilot là bản dẫn xuất PSD, không phải art cuối; 24 nhân vật khác dùng layer nguyên gốc của B. Nguồn Mochi tự báo PARTIAL ở khớp/đuôi/mắt; [PASS/FIX hiện tại](spine/mochi/PASS-FIX-VI.md) giữ rõ giới hạn. Chất lượng art designer được báo riêng, không đưa vào điểm tự chấm. Inbox chưa có Spine/PNG/Cubism cuối; license, tool/version và số lượng bàn giao nằm ở `NEEDS-USER.md`.

## Kiểm tra và bàn giao

Hai lần full E2E trước C10 và trước C12: **421/421**, không skip/fail/flaky; receipts trong `checks/e2e-before-c10.json` và `checks/e2e-before-c12.json`. Workspace typecheck/lint và test liên quan từng mục đạt; C11 mới nhất có 26 test focused đạt (16 advisor, 5 Recruit, 5 guide/settings). Hai full E2E trước đó bao gồm sửa Recruit/Field Guide nhưng đi trước sửa pending-action của advisor; không coi chúng là lần chạy trên mọi thay đổi C11 mới nhất. Một lệnh C9 đã chạy rộng 2.068 test: 2.066 đạt, hai kỳ vọng level 6 cũ được sửa theo C5 rồi chạy focused đạt; không che lần thất bại đó.

Demo hiện tại **29,21 MB** (gồm manifest; bộ media29.206.796byte), mở trực tiếp từ file. Offline QA: 25 unit / 206 clip, 12 ảnh tại 1280×720 và 1440×900, không overflow/ảnh lỗi/browser error/HTTP; hai video decode và phát x1. `CHAY-DEMO.md` có 8 dòng và lệnh `pnpm` chạy game cục bộ. Raw video dài nằm ngoài git; evidence trong repo vẫn dưới 120 MB.

Phần còn làm: checkpoint C11 đã kiểm tra 6 ảnh advisor tại hai cỡ, tiếp tục sửa điểm thấp từ ảnh; tiếp nhận designer khi có file, làm filmstrip/ảnh battle/PASS-FIX và retime VFX; cập nhật báo cáo 20/11 06:00 UTC rồi cải thiện tiếp tới hard stop 20/11 12:00 UTC.

C11 nền cafe: dùng một tranh gốc không nhân vật, ba lớp parallax, giữ fallback procedural khi đang tải/ảnh lỗi. Kiểm tra decode chậm/retry/dispose, reduced motion và ảnh hai cỡ đều đạt; 11 test focused/typecheck/lint. Đã xem capture cuối, đường nối kính không còn thấy. Offline mới p95 16,8/16,7 ms, tối đa60draw, mask mặt/HP không bị vẽ đè; không lỗi browser/HTTP. Hai video chiến đấu gốc giữ nguyên và được ghi rõ quay trước cập nhật nền. Chi tiết `C11-STAGE-RECEIPT.md`; không coi là cải thiện gameplay hay full E2E mới.

C11 impact: gallery giữ scene.paused để tự điều khiển clock, khiến counter cũ giữ tia chạm sau khi hết particle. Đã đổi expiry theo clock chung; giữ pause thật và reset khi đổi action. 60ca source +60ca offline tại hai cỡ/x1–x3/motion variants đạt;16ảnhcuối đã xem,11testfocused và typecheck/lint cuối đạt. Lần compiler đầu thiếu guard null được lưu, không che lỗi. Đo cuối p95 16,7ms hai cỡ,60draw,0maskfailures/HTTP/error;demo29.208.188byte. Điểm7,79không đổi. Chi tiết `C11-IMPACT-RECEIPT.md`.
