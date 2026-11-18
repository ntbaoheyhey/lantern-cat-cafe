# CXV — Batch M: mèo sống động
Cập nhật: 2026-11-18T09:09:21.941811+00:00
Ưu tiên là Mochi/Clover từ clip của bạn thiết kế, chín mèo còn lại có idle/cast cùng phong cách. Bản gốc giữ nguyên; Soot hoàn toàn ngoài phạm vi.

Chín mèo Panko, Mallow, Sorrel, Biscuit, Inkcap, Cinnamon, Brioche, Velvet, Marigold đã được CXI nghiệm thu riêng phần chuyển động trên production. Có phim so sánh cùng chiều cao/tốc độ, chân và điểm nối vòng giữ nguyên. Sáu trận thắng tự nhiên có luật khớp giữa hai chế độ; kiểm tra khả năng đọc năm chiêu cuối cũng đã đạt.
Mochi: idle 304 mẫu/300 khung và cast 290 mẫu/280 khung đã được CXI kiểm tra độc lập. Bản R4 hết khung vàng khi focus; chuyển từ cast về idle không nhảy. 16 ảnh cast mới đã xem đúng một lần.
Màn hình mừng thắng đã sửa và được CXI nghiệm thu độc lập trên R5: 140 mẫu, khôi phục WebGL đúng toàn bộ ảnh. Trận tự nhiên R2 thắng ở cả hai chế độ, mỗi trận 47 hành động/19 chiêu cuối, luật khớp và không lỗi. Còn hai lỗi: video trận ẩn vẫn chạy sau thắng, và chân dung Yarn Phase2 che chiêu cuối Mochi. Đã đẩy hai bản sửa: 00903a3e3 tạm dừng video khi cảnh ẩn, ccb209d07 nhường chân dung Phase2 cho hành động trong 160 ms. Kiểm thử đạt 42 và 24 ca, TypeScript đạt; CXI đang tích hợp R6 để kiểm chứng trận thật.
Clover: mốc hông và tay cầm đã đạt. Các phép theo dõi đầu/vòi ấm còn thiếu bằng chứng; không thay bằng chuyển động cổ tay. CXI còn xử lý vòng lặp và tài nguyên trước khi quay phim idle/cast cuối cùng.
Ngân sách chưa đạt: Mochi R5 tải 8.508.596 / 8.975.543 / 8.584.317 byte ở ba trận thử, đều vượt 8 MB, chưa có Clover. Hai mèo chưa được đăng ký phát hành; tag xanh vẫn v5-m1.13.
AGV: landing R6 bị loại ở bước số liệu, tệp thực 242.887 byte lớn hơn bản đang dùng 35.020 byte. Bảng timing độc lập còn số liệu giữ chỗ, chưa được nhận; vẫn giữ hai nhiệm vụ đang làm.
3.833 đường dẫn Soot và capture-arrival.mjs giữ nguyên. Bản tự nhắc cxv-wake được giữ nguyên. Công việc V7 tiếp tục sau Batch M; các bằng chứng cũ còn trong Git và báo cáo riêng.
