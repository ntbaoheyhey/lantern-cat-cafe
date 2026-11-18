# V8 Batch M
Cập nhật 2026-11-18T05:16:45.928309+00:00. Panko đã qua16 kiểm tra tập trung và TypeScript;5120 ca so sánh giữ nguyên chuyển động/mesh dùng chung,3833 đường dẫn Soot không đổi. Chưa bật Batch M trên bản đang mở. Mochi/Clover còn kiểm tra viền, vòng lặp, vị trí và dung lượng; sửa đuôi Clover R6 bị loại, R5 chưa được chấp nhận.

2026-11-18T05:47:08.972148+00:00 — Panko đã kiểm tra trên bản production: chân và gốc không trôi trong vòng10giây ở cả hai chế độ; skill350ms khớp mốc.55,ult1100ms khớp1.1. Phim so sánh cùng chiều cao/tốc độ và5ảnh mới đã duyệt. Chưa phát hành vì còn ngân sách tải/hiệu năng. Mallow nhập có giới hạn,16test+typecheck đạt;2464ca so sánh mã dùng chung khớp,3833đường dẫn bảo vệ không đổi.

2026-11-18T06:03:08.988121+00:00 Mallow: chấp nhận idle/cast trên bản production d1192596c; chân và seam=0, hit350ms→.55;4 ảnh mới đã xem,phim10s cùng chiều cao228px. Chưa phát hành: wave3 vượt141046B; chưa kết luận FPS.

2026-11-18T06:16:49.105781+00:00 — Cả9 mèo native (trừ Soot) đã được chấp nhận trong phạm vi idle/cast: chân/seam=0, hit350ms→.55; bộ7 mới có phim10s/300khung cùng chiều cao225–229px và4ảnh/mèo đã xem một lần. Build/typecheck và bộ test đạt; chưa phát hành, chưa khẳng định FPS. Mochi/Clover chưa đăng ký do viền/dung lượng/vòng lặp chưa đạt.

2026-11-18T06:45:01.433086+00:00 — Đã kiểm tra hash bằng chứng trận tự nhiên của CXV: 6 trận thắng, 3 cặp thường/giảm chuyển động có trạng thái và thứ tự sự kiện khớp; không lỗi. Chỉ chấp nhận phạm vi số liệu, không suy ra FPS trên mọi laptop; che khuất hiệu ứng còn mở. Video bốn mặt phẳng H264 giải mã giống nhau trên Chromium/WebKit nhưng chưa đạt sai số; VP9 đạt chất lượng nhưng 1.44MB vượt giới hạn thử nghiệm. Chưa đăng ký Mochi/Clover hay phát hành.

2026-11-18 07:19Z: Mochi bốn mặt phẳng 931.787 byte đạt kiểm tra 300 khung trên Chromium/WebKit; loader đạt64 kiểm tra và đường cũ92 kiểm tra. Chưa đưa vào game: phép đo khung hình sân đấu đọc sai video, đã khôi phục và nhờ CXV sửa đúng phạm vi. Bản local mới901430f2b chỉ thêm hiệu ứng5 ultimate đã nhập, kiểm tra trận mở được/0 lỗi; chờ kiểm tra hình thật, chưa tag.

2026-11-18T07:33:54.918019+00:00 — Bản sửa đo khung video đã nhập đúng3file;80kiểm tra tập trung và TypeScript đạt,3833đường dẫn bảo vệ không đổi. Thử đuôi Clover mới hết gập nhưng còn bóp hình nên chưa chấp nhận; chưa đăng ký media hay phát hành. Bản nháp yêu cầu xuất alpha của AGS đã đủ trường; chỉ để chủ dự án xem.

2026-11-18T07:54:21.891704+00:00 — Bản thử R3 đã sửa mốc ultimate media Mochi/Clover đúng1,1giây;42test tập trung,TypeScript và toàn bộ5465test đạt(5452pass,11bỏqua,2lỗi dự kiến). Mochi thử4hànhđộng/24mẫu ở2chếđộ đúng mốc;3ảnh mới sau khi tách fixture không còn panel boss cũ. Idle Mochi304mẫu/300hash phim được xác minh;chưa đăng ký vào bản chính vì tải lạnh vượt8MB,Clover/sockets/hiệu năng còn mở.

2026-11-18T08:12:21.936836+00:00 Batch M: Đã sửa nền vàng chữ nhật khi Mochi thi triển kỹ năng; 26 mẫu kiểm tra và 2 ảnh mới ở cả hai chế độ đều đạt. Bộ kiểm thử đầy đủ chạy thành công; chưa phát hành vì tải lạnh còn 8,51/8,98/8,58 MB, Clover chưa tích hợp và kiểm tra chuyển động toàn cảnh còn mở.
