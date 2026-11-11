# Lane C — 11/11/2026

C0–C7, C9, C10 xong; tiếp tục C11 và nhận file C8. Draft PR #439, không merge/deploy. Pipeline25nhân vật/206clip,74skill/18status;0/25export designer cuối, Mochi117layer vẫn là placeholder. License/tool/version nằm trong NEEDS-USER.

C11 sửa vòng đời VFX designer: hai ca browser trước đây tạo WebGL context mới sau khi battle đã đóng; nay không còn. PNG dừng sau frame đang tải, pool cũ được giải phóng khi thay thế thành công, lỗi thay thế giữ pool hợp lệ; dispose gọi lại an toàn.13testfocused/types/lint đạt; bốn ca browser kiểm tra load muộn, render/pause/expiry/reuse đạt. Fixture màu nâu lấy từ test C2, không phải designer/art cuối. Offline hai smoke/mười lần đổi/hai Pause–Play đạt;đã xem bốn ảnh hai cỡ. Demo29.226.225byte,evidence<120MB,điểm7,79giữ nguyên;không đo p95/gameplay mới. Chi tiết C11-VFX-LIFECYCLE-RECEIPT.md.

Gameplay giữ ba vòng/500seed đã dùng. Vòng cuối: thường34,50s/boss69,16s,p9082,16s;88%có1–3thua,hồi phục83,67%;chưa đạt thua đầu11,61phút/HPcuối94%. Click sạch30phút:15thắng/4thua,thua đầu6,56phút,thường54,33s/boss170,77s,hồi phục2/4; mẫu nhỏ, không gộp mô phỏng. Không chạy vòng tuning thứ tư.

Giữ các sửa Bag/onboarding/Recruit/FieldGuide/advisor/gear miễn phí, nền cafe vẽ ba lớp và VFX theo outcome thật. Bốn ca forced-redraw cũ vẫn PARTIAL; Pause/Play thật đạt. Hai fullE2E421test là kết quả trước các sửa C11 mới, không phải toàn bộ head hiện tại.

Tiếp theo kiểm tra kích thước VFX designer theo tọa độ stage; diagnostic lớn giữ ngoài git. Kiểm tra designer mỗi item. Báo cáo20/11 06:00UTC; hardstop20/11 12:00UTC.
