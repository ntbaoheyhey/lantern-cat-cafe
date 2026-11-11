# Quy trình art/VFX đã được người dùng chọn

Ngày 10/11/2026: ưu tiên prompt tạo ảnh nhân vật hoặc ảnh/video hiệu ứng, chỉnh sửa, rồi dựng thành tài sản thật chạy trong trận. Áp dụng cả chiêu thường và chiêu cuối. Tiếp tục từ tài sản đã có; không tạo lại Mochi.

1. Viết prompt riêng theo vai trò, bộ chiêu và bốn concept master: nét vẽ mềm, viền sáng ấm, hình khối rõ; mắt mèo lớn, mắt địch phát sáng. Concept mới dùng công cụ ảnh tích hợp, không ảnh tham chiếu ngoài. Video là lựa chọn khi có công cụ phù hợp trong phạm vi đã được phép, không phải bước bắt buộc.
2. Kiểm tra nguồn trước khi dựng: chi tiết thừa, hình méo, màu, vùng trong suốt, khoảng trống trong hiệu ứng. Lưu prompt đầy đủ, công cụ, thông số được cung cấp và hash. Ảnh thành phần không được gọi là flipbook chuyển động hay video.
3. Nhân vật: dùng nguồn hình đã chọn để dựng mesh có texture, tách các bề mặt cần cử động, gắn rig và giữ nguyên nhận dạng. Hiệu ứng: làm sạch, tách thành phần hoặc khung hình, đóng atlas rồi dựng chuyển động của hạt, dải sáng, vòm và ánh sáng trong cảnh.
4. Hiệu ứng xuất phát từ bàn tay/đạo cụ thật, bay tới đúng mục tiêu, phát sáng đúng nhịp chạm và tan có chủ đích. Chuyển động ánh sáng không bị giữ ở alpha 0 khi nhân vật dừng tư thế va chạm. Giữ nguyên đồng hồ hành động và kết quả trận.
5. Xem trong trận ở tốc độ x1 và các nhịp tụ lực/di chuyển/chạm/dư sáng; kiểm tra cả bên người đánh và bên nhận. Ánh sáng phải hợp cảnh, không biến thành vật thể rời hoặc mảng ảnh đứng yên. Bảo vệ mặt, bảng máu và số; kiểm tra 1440/1024, reduced-motion, hiệu năng và parity.
6. Chỉ nhân rộng sau khi chuyển động và vẻ ngoài thực tế đạt. Mẫu đẹp không đồng nghĩa model/chiêu đã đạt; lỗi mở và các mẫu thất bại vẫn giữ trong báo cáo.

Bản thử hiện tại: Mochi dùng model đã có, hiệu ứng dùng một atlas RGBA tạo bằng công cụ ảnh tích hợp và chuyển động trong game. Hai địch Sock Skipper/Teacup Healer đã bỏ hình vật thể lặp lại. Chưa có video được tạo bằng model. Lỗi kéo méo áo/khiên của rig vẫn mở; toàn bộ roster chưa đạt.
