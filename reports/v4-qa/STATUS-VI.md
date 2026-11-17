# V4 QA — 17/11/2026 01:52 UTC (08:52 Việt Nam)
Hai lượt desktop 1440×900 và1280×720 đi hết7chặng, mỗi lượt18receipt local được kiểm tra độc lập; không có lỗi console/network.
Battle đầu~2,7–3,1giây; receipt thưởng đầu~99–102giây; toàn hành trình~3,4phút. Máy dùng chung, chỉ tham khảo.
Hình battle/receipt desktop đọc được; kiểm tra phone390×844 đang chờ tải máy giảm.
Điểm trừ xác nhận: QA-2 tải~29,65MB tại mốc vào battle, vượt ngân sách8MB.
QA-3: runbook ghi rút16Spool→12YARN; UI thực tế gửi claim6YARN theo cap hiện tại. Đã gửi đề nghị sửa lời hướng dẫn.
QA-1 đã đóng: SHIP52aaaba39 bổ sung tên biến và phân loại bắt buộc/tùy chọn; QA tự kiểm tra lại.
Chưa chốt: khả năng sponsor đủ cho2ví mới; đang chuẩn bị lỗi giả lập trên Anvil, không gửi giao dịch Fuji.
Giới hạn fixture QA: build đầu thiếu bước metadata postbuild; sẽ bổ sung sau lượt phone, giữ nguyên bằng chứng ban đầu.
Chưa có URL DEPLOYED; receipt local không phải bằng chứng explorer Fuji công khai. Chưa chấm PASS triển khai/live10/10.
