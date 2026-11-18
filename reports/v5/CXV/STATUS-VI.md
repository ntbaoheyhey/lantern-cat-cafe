# CXV — Batch M: mèo sống động
Cập nhật: 2026-11-18T16:52:19.216528+00:00
Tag xanh v5-m1.15 đã nhập; chín mèo native đã nhận, hai video Mochi/Clover chưa đăng ký production. Soot và capture-arrival.mjs được giữ nguyên.
Ứng viên Clover(-28,+14) chưa đạt:198/1534 bố cục sai giả thuyết dịch cứng;81 chạm vùng tránh thân,117 bỏ fallback cũ.15/33 ca control gốc vi phạm khoảng hở2px,không có giao trực tiếp;chưa đo paint native tại vị trí mới.
Control ban đầu/khôi phục khác32/34 ca,toàn bộ29.719 pixel trong nhãn/HUD;không đủ dữ liệu để kết luận nguyên nhân.Đã chuẩn bị5 ca có ảnh lặp trước che/hiện. Phương án Mochi riêng còn cần capture với Clover native,nhãn/alpha/seam và laptop;chưa sửa app.
R7 đã nhập đúng hai thay đổi nhãn từ93f3637f2: Mochi/Clover dùng neo HP authored, Clover thêm5px.25 kiểm tra tập trung và typecheck đạt; chưa READY nhãn.
Capture R7 nguồn bf01d462a/index eb93ee0d tại6301 hoàn tất14:12:48Z.18 ca attribution đều hợp lệ, nhãn không đè hình của chính mèo; nhưng F297 Clover/F188 Mochi còn17 pixel đuôi chạm huy hiệu Clover. Ba ca status tổng hợp còn208/69/74 pixel giao; đây là stress giả lập, không phải trạng thái luật đã chứng minh.
Hai trận tự nhiên thắng,110 hành động,24 ultimate; luật/trạng thái/log/diễn biến khớp độc lập, không lỗi. Hộp nhãn/thân mèo khác còn giao: Mochi47/48 mẫu, Clover749/766 mẫu (normal/reduced); hộp bao có vùng trong suốt nên chưa suy ra tất cả là che pixel.
P95 khung16,8ms cả hai chế độ trênM3 Pro; chỉ mô tả máy này. Decoder chạy/dừng sau thắng đúng, không callback muộn; không suy ra laptop thường đạt.
R7 vẫn chưa đạt nhãn. Thử dùng toàn hộp thân của mọi mèo bị loại: Clover phải dịch57–160px và đổi phía khi status dài. Đã đo600 frame GPU và chiếu hỗ trợ alpha toàn chu kỳ lên18 cảnh idle:bao hết912.708 pixel đóng góp,không pixel thoát.
Ứng viên dịch Clover(-12,+19) so vớiR7:11 cặp cảnh idle và5 status tổng hợp đều khớp control/không giao pixel;nhãn khác/HUD/canvas không đổi.3 ảnh mới xem một lần;thấy khoảng hở giữa đuôi/huy hiệu.2 chú thích ảnh cũ ghi+5 đã đính chính trong receipt,ảnh gốc giữ nguyên. Chưa sửa mã app;đã trả6301/timing14:26:37Z.
Đã chạy16 hành động hợp lệ/120 mẫu trạng thái: luật khớp,14 ca paint có control chính xác. Mochi che mũ Panko1340/1302 pixel ở basic normal/reduced. Hai ultimate Mallow có control sai13514 pixel góc dưới trái; số0 không được coi là đạt.2 ảnh mới xem một lần;đã trả6301/timing14:38:53Z. Không sửa mã app;state khởi tạo được chỉnh nên không gọi là trận tự nhiên.
Thử nhãn Mochi dưới thân/chân: pilot Panko57 mẫu/10 control đúng/67 bố cục đạt,nhãn khác giữ nguyên;ảnh250ms cho thấy nhãn gắn đúng Mochi. Nhưng bóng đổ nhãn Clover vượt hộp DOM tới5px và còn1/3 pixel>4 ở775/800ms. Giữ FAIL toàn cảnh;nghiên cứu đủ vùng paint trước khi tiếp tục. Chưa sửa mã app.
R6 GPU:648 file,600 tham chiếu,24 khung GPU và168 socket khớp pha0, gồm hai mẫu seeking; phạm vi controlled draw, không chứng minh toàn bộ chơi thường.
Đầu CloverR5/tayR6 đạt24/24 heldout mỗi loại; native sai số decoded tối đa0,728/0,320px. Bằng chứng saiR2/R3/R4 cũ giữ nguyên.
Vòng lặp Clover vẫn REJECT:11,1581 so với trung vị2,2484. Crossfade15frame bị loại:4149 pixel trộn/3434 vùng đuôi-vải và chu kỳ còn9,5s; chưa xuất art. Viền/halo và laptop thường còn mở.
Chủ dự án bỏ giới hạn8MB lúc12:09:40Z; byte chỉ báo cáo. AGV T-M1/T-M2 còn mở. Wake cxv-wake ACTIVE mỗi15phút đã kiểm tra2026-11-18T15:06:01.794381+00:00;pushfce2f47d4 đã xác nhận trên remote.

2026-11-18T16:08:22.459647+00:00 Đã chốt thử nghiệm Clover(-28,+14) và nhãn Mochi dưới thân; bộ đo tính cả bóng đổ, chờ HUD tự ổn định và so control toàn ảnh. Kiểm tra lại67 bố cục cũ đạt nhưng10 ca bóng cũ vẫn FAIL. Đã chuẩn bị10 idle/5 status mới;chưa có lease mới nên chưa capture hoặc sửa app. Wake vẫn ACTIVE15phút.

2026-11-18T17:05:11.922962+00:00: Kiểm tra phương pháp chụp hoàn tất: 50 ảnh xác minh hash, trạng thái ổn định; 4/5 trường hợp đổi pixel sau thao tác ẩn nhãn. Chưa đủ bằng chứng duyệt hình ảnh sản xuất; tiếp tục phạm vi Mochi riêng. Không đổi mã ứng dụng.
