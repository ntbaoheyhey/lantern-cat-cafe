V4 ART — 2026-11-16T23:01:48.883215+00:00
A10 truyền ảnh vẫn MỞ sau khi vượt khung 2 giờ; A11 tiếp tục kiểm chứng rồi sửa bố cục.
Runtime ae96b7d85 dùng alpha kết hợp khi tải GPU, giữ mipmap và Panko nguyên kích thước.
2.689 kiểm thử web trong 320 tệp đạt; typecheck, 46 kiểm thử tập trung và 12 cảnh trình duyệt đạt.
Bốn ảnh đã xem được ghi nhận; không mở lại. Mochi/Clover hết mảnh viền lỗi; Soot hơi mềm hơn.
Đối chứng ảnh gốc xác nhận vòng quanh mắt/mõm Panko là halo lọc ảnh, không phải kính bị mất.
Panko giữ khuôn mặt đúng; Binding/Yarn còn rõ hình và chất liệu chính.
Bố cục 900p giữ nguyên, gồm lỗi bảng tên che một phần Mochi đã có.
Ba phim 30 giây có âm thanh đã quay xong; 2.700 marker khớp. Chưa nghiệm thu hình ảnh.
Ba hash F6 khớp baseline; 131 đường dẫn thay đổi đúng phạm vi; parity-latest giữ nguyên.
Dự toán 7.966.311 byte chưa phải kết quả đo production; SHIP vẫn thất bại 27,55 MB/8 MB.
FPS trung vị 60,24 / 60,24 / 59,88; đang quay 900p, sau đó xem hành động ở 10 fps.
Còn 42 khung clipping/đè HUD, bảng tên Panko và cụm số wave3.
Hai thử bố trí trên sáu cảnh đã xong; chọn cách tránh HUD/khuôn mặt để kiểm chứng chuyển động, chưa cài vào runtime.
Reduced-motion, rung liên tục, class cuối, activation và tỷ lệ thời gian vẫn mở.
A11: đã xem84/84sheet hành động và3/3sheet900p; lưu biên nhận theo100hash runtime không đổi.
Ba cửa sổ cuối bị cắt vẫn giữ nguyên hạn chế; chữ sátHUD/banner chạm chân dung/cụm số dày còn mở.
Tiếp theo: kiểm chứng vị trí nhãn qua các thời điểm kề nhau và42khung lỗi cũ; chưa cài sửa vào runtime.
