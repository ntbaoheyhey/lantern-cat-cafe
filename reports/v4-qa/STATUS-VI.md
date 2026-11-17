# V4 QA — 17/11/2026 02:20 UTC (09:20 Việt Nam)
Ba viewport đều đi hết 7 chặng, mỗi lượt có 18 receipt Anvil được QA kiểm tra độc lập; không lỗi console/network.
Battle đầu khoảng 2,6–3,1 giây; mốc receipt thưởng 95,6–102,2 giây. Máy dùng chung, chỉ tham khảo.
Ba điểm cần xử lý: QA-2 bundle mới vẫn tải 29,54 MB so với ngân sách 8 MB; QA-5 có 7 test trình bày lỗi; QA-8 dự toán chỉ một ví có thể làm kẹt workshop.
QA-6 đã đóng tại 46e4768b: QA tự chạy manifest check PASS; chưa xác minh/chạy migration hosted. QA-7 typography vẫn lỗi.
QA-3 đã đóng: hướng dẫn mới ghi đúng 8 Spool → 6 YARN, giữ lại 2. QA-1 tên biến/cơ chế dự phòng đã đạt.
QA-2/QA-4 đang được QA chạy lại trên bundle mới 4b4c4111, gồm desktop và phone; chưa đóng trước khi có kết quả.
Đã hoàn tất metadata và build local: 7.943 file, 248,74 MB; chưa xác minh gói upload hoặc gói dịch vụ Vercel.
Kiểm tra deploy đủ 25/25 handler; số 23 trước đó là lỗi bộ phân tích QA, đã sửa.
QA-8: trên Anvil, quỹ 1,075 AVAX đủ ví đầu nhưng ví workshop bị 503/No gas; đã khôi phục fixture. Không kết luận lỗi Fuji live.
Chưa có DEPLOYED URL; receipt local không phải bằng chứng Fuji. Chưa xác nhận live 10/10.
