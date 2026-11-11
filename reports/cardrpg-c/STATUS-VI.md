# Trạng thái lane C
C11: Replay đã sửa và kiểm tra; 124+24 ca browser / 120 ảnh / 86 test / typecheck-lint đạt. Tiếp tục C11/C8; designer cuối 0/25.
C0–C7, C9, C10 đã xong; C8/C11 tiếp tục trên draft PR #439. Có25placeholder/206clip,74skill/18status; designer cuối0/25, license/tool/version còn trong NEEDS-USER. MochiV3 đã vào game/demo,115layer/32xương/333vertex; nguồn artwork PASS nhưng rig vẫn tạm,132hash nguồn không đổi.

C11 sửa guide battle nhận click xuyên xuống nút phía sau: dùng dialog modal thật, chặn đổi speed/Resume/Skip và focus nền khi đang đọc. Đóng bằng nút, Escape hoặc cancel trả đúng trạng thái pause trước đó; Escape khỏi option trả focus về More. 18 test, typecheck/lint đạt; 98 kiểm tra browser qua hai cỡ/hai motion mode, gồm 144 click nền bị chặn, không page error. Đã xem 30 ảnh cuối. Giữ gameplay, demo 29.619.392 byte và điểm 7,79; chi tiết C11-BATTLE-CONTROLS-RECEIPT.md.

Giữ ba vòng/500seed và click sạch30phút:15thắng/4thua, thua đầu6,56phút, thường54,33s/boss170,77s, hồi phục2/4(mẫu nhỏ). Điểm7,79;demo29.619.392byte. Hai fullE2E421/421 có trước sửa C11 mới; bốn forced-redraw cũ PARTIAL. Không dùng fixture mới làm bằng chứng hồi phục.

Tiếp tục C11 và nhận export cuối. Báo cáo20/11 06:00UTC, hardstop12:00UTC; không merge/deploy/đổi server.

C11 Auto-next có đếm ngược 5 giây và nút dừng; đọc Battle details, tab ẩn hoặc discovery giữ timer, đóng/mở lại cho đủ 5 giây. Không tự chọn reward hoặc nhánh route; chỉ tự đánh khi còn đúng một trận và không có lựa chọn. Tower thắng quay về Tower. 33 test focused/typecheck/lint đạt; 68 ca browser + 4 ca Tower chờ tải đạt, đã xem 44 ảnh (40 ảnh cuối), không page error. Một assertion Tower cũ được sửa theo copy đã thay; không nhận full suite xanh trên head hiện tại. Giữ demo/điểm/gameplay và hai account cũ. Chi tiết C11-AUTO-NEXT-RECEIPT.md.

C11 Replay dùng đúng hành động của trận chưa nhận thưởng khi mở từ Settings; không mở bản ghi rỗng hoặc lồng replay. HUD bỏ Auto-next/rank hiện tại, ghi rõ bản ghi và không thêm reward; đoạn dở có tên riêng. X/Escape quay về nơi mở, menu xóa replay mà không settle trận thật. 86 test/8 file, typecheck/lint và 124+24 kiểm tra browser đạt; đã xem 120 ảnh cuối hai cỡ/hai motion mode, không page error. Account và kết quả replay khớp chính xác, Next thật khớp public command. Giữ demo 29.619.392 byte/điểm 7,79 và các mẫu gameplay cũ. Chi tiết C11-REPLAY-RECEIPT.md.
