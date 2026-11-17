# V4 QA — 17/11/2026 02:20 UTC (09:20 Việt Nam)
Ba viewport đều đi hết 7 chặng, mỗi lượt có 18 receipt Anvil được QA kiểm tra độc lập; không lỗi console/network.
Battle đầu khoảng 2,6–3,1 giây; mốc receipt thưởng 95,6–102,2 giây. Máy dùng chung, chỉ tham khảo.
Ba điểm cần xử lý: QA-2 tải 29,65 MB so với ngân sách 8 MB; QA-5 có 7 test trình bày lỗi; QA-6 manifest campaign lệch source đã commit.
QA-7: kiểm tra typography từ runbook lỗi ở 3 CSS; chưa chứng minh lỗi dễ đọc trên giao diện.
QA-3 đã đóng: hướng dẫn mới ghi đúng 8 Spool → 6 YARN, giữ lại 2. QA-1 tên biến/cơ chế dự phòng đã đạt.
QA-4: SHIP đã sửa CSS cho attribution trên phone; đang chờ QA kiểm tra lại bundle mới.
Đã hoàn tất metadata và build local: 7.942 file, 248,74 MB; chưa xác minh gói upload hoặc gói dịch vụ Vercel.
Kiểm tra deploy đủ 25/25 handler; số 23 trước đó là lỗi bộ phân tích QA, đã sửa.
Chưa chốt quỹ sponsor cho 2 ví; phép thử local chưa khởi chạy thành công, chờ tải máy giảm.
Chưa có DEPLOYED URL; receipt local không phải bằng chứng Fuji. Chưa xác nhận live 10/10.
