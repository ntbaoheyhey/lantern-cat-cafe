# Trạng thái CHAIN — 12/11/2026

Cốt lõi blockchain đã chạy thật: 18 giao dịch Fuji thành công, ba hợp đồng khớp source. Không cần deploy lại hợp đồng. Đã sửa lỗi ký giao dịch trong smoke và History bỏ sót giao dịch vừa xác nhận. Bản source kiểm thử: `609871a0b`.

Kiểm tra cuối đạt: 2.395 test web, 118 test hợp đồng, các bộ test còn lại, typecheck/lint/build và 3 lượt trình duyệt liên tiếp. Script tạo 3 món giá 1 YARN đã thử trên Anvil; chạy lại không tạo thêm hàng hay nhận lại thưởng tester.

Demo công khai còn cần bạn: cập nhật frontend lên Vercel, chạy script tạo hàng bằng ví mua cũ và nạp thêm 2,5 AVAX test cho ví cấp gas. Số dư lúc kiểm tra là 1,10 AVAX, chỉ đủ khoảng 1 khách mới sau dự trữ và phí. Lệnh đã gom ở [FRONTEND-READINESS-VI.md](FRONTEND-READINESS-VI.md); không cần tạo ví hoặc gửi khóa vào chat.

Kinh tế dài hạn chưa đạt: phát hành/đốt 2,39–2,78 lần, vượt mục tiêu 2. Tự giảm trần thưởng đã có trên chain; thưởng định kỳ chưa bật, còn thiếu nguồn dữ liệu gameplay có thẩm quyền và số liệu từ C2. Chưa thể gọi mô hình này là bền vững. GitHub Actions bị chặn bởi billing/spending; Vercel hiện báo hết lượt deploy, yêu cầu thử lại sau 24 giờ. Chờ quota mở lại trước khi chạy lệnh deploy.
