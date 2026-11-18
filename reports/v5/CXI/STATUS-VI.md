# V8 Batch M
Cập nhật 2026-11-18T05:16:45.928309+00:00. Panko đã qua16 kiểm tra tập trung và TypeScript;5120 ca so sánh giữ nguyên chuyển động/mesh dùng chung,3833 đường dẫn Soot không đổi. Chưa bật Batch M trên bản đang mở. Mochi/Clover còn kiểm tra viền, vòng lặp, vị trí và dung lượng; sửa đuôi Clover R6 bị loại, R5 chưa được chấp nhận.

2026-11-18T05:47:08.972148+00:00 — Panko đã kiểm tra trên bản production: chân và gốc không trôi trong vòng10giây ở cả hai chế độ; skill350ms khớp mốc.55,ult1100ms khớp1.1. Phim so sánh cùng chiều cao/tốc độ và5ảnh mới đã duyệt. Chưa phát hành vì còn ngân sách tải/hiệu năng. Mallow nhập có giới hạn,16test+typecheck đạt;2464ca so sánh mã dùng chung khớp,3833đường dẫn bảo vệ không đổi.

2026-11-18T06:03:08.988121+00:00 Mallow: chấp nhận idle/cast trên bản production d1192596c; chân và seam=0, hit350ms→.55;4 ảnh mới đã xem,phim10s cùng chiều cao228px. Chưa phát hành: wave3 vượt141046B; chưa kết luận FPS.

2026-11-18T06:16:49.105781+00:00 — Cả9 mèo native (trừ Soot) đã được chấp nhận trong phạm vi idle/cast: chân/seam=0, hit350ms→.55; bộ7 mới có phim10s/300khung cùng chiều cao225–229px và4ảnh/mèo đã xem một lần. Build/typecheck và bộ test đạt; chưa phát hành, chưa khẳng định FPS. Mochi/Clover chưa đăng ký do viền/dung lượng/vòng lặp chưa đạt.

2026-11-18T06:45:01.433086+00:00 — Đã kiểm tra hash bằng chứng trận tự nhiên của CXV: 6 trận thắng, 3 cặp thường/giảm chuyển động có trạng thái và thứ tự sự kiện khớp; không lỗi. Chỉ chấp nhận phạm vi số liệu, không suy ra FPS trên mọi laptop; che khuất hiệu ứng còn mở. Video bốn mặt phẳng H264 giải mã giống nhau trên Chromium/WebKit nhưng chưa đạt sai số; VP9 đạt chất lượng nhưng 1.44MB vượt giới hạn thử nghiệm. Chưa đăng ký Mochi/Clover hay phát hành.
