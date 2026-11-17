TẠM DỪNG theo yêu cầu “lưu handoff và dừng” lúc 2026-11-17T03:05:55.953333+00:00. Đã dừng riêng nhóm tiến trình snapshot do lượt này tạo; không có job QA của lượt này còn chạy. Xem HANDOFF-QA.md để tiếp tục khi được cho phép.

# V4 QA — 2026-11-17T02:49 UTC
Q2 đã hoàn tất; bảng từng bước ở Q2/RUNBOOK-FINDINGS.md. Chưa deploy hay gửi giao dịch Fuji.
Ba viewport Q1 đi hết 7 chặng, mỗi lượt18receipt local được QA xác minh; bản4b4c4111 chạy lại desktop/phone cũng đạt18receipt mỗi lượt.
Còn2finding SHIP mở: QA-2 tải29,54MB vượt8MB; QA-8 reserve chỉ đủ một ví có thể làm kẹt workshop ở ví thứ hai.
QA-8 candidate WIP: 14/14 ca CLI và bridge Cast PASS độc lập; chưa có commit/build/UI recheck nên vẫn mở. Chi tiết Q2/QA8-CANDIDATE-REVIEW.md.
QA-4đã đóng: phone390px hiện attribution đầy đủ,11mốc layout không overflow/clipping. QA-7đã đóng tại da3323ba: checker và test typography PASS độc lập.
QA-5đã sửa trên ART dfce473f: QA tự chạy2file,13/13test PASS. Chưa kết luận suite đầy đủ trên SHIP hoặc bản merge đã PASS.
QA-6manifest đã PASS tại46e4768b; QA-1tên biến và QA-3ví dụ8Spool→6YARN đã đóng.
Build4b4c4111 gồm7.943file/248.742.717byte; upload Vercel phụ thuộc plan/packaging, chưa xác minh hosted.
Mọi timing là máy dùng chung, chỉ tham khảo. Receipt local không phải bằng chứng explorer Fuji.
Tiếp theo Q3snapshot một commit, scan có redact và thử quick-start; sau đó Q5/Q6 trong khi chờ trigger Q4.
