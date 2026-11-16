# Bản thử dành cho giám khảo
- Nhánh tích hợp: codex/v4-ship-2026-11-16; chưa triển khai lên mạng.
- Bản âm thanh trước đã chạy30phút; bản sửa healer mới đang đo lại, chưa kế thừa kết luận độ bền.
- Bản ghi boss mới: −16,99 LUFS; khoảng động8,9 LU; đỉnh−1,82 dBTP, đều trong giới hạn.
- Giới hạn sáu nguồn âm/100 ms, giảm nhạc 8 dB và phục hồi âm lượng đã đạt.
- 18/18 lời thoại kết thúc boss đạt mốc ước tính33 ms; toàn bộ âm vẫn có mẫu33,38 ms vượt ngưỡng. Chưa đo độ trễ vật lý.
- Nhận dạng lời thoại đạt 8/12, cần 10/12. Chưa coi âm thanh là đạt toàn bộ.
- 34 trường hợp âm UI/giao dịch không quá 300 ms; 15 kiểm tra âm lượng/tắt tiếng/tải lại đạt.
- Đủ 20/20 hành trình đạt: trung vị battle khoảng 3 giây/2 lần bấm; receipt khoảng 95 giây; 360 receipt đã đối chiếu, không lỗi/popup.
- Bốn bộ đếm Fuji và phục hồi dữ liệu cũ đã kiểm tra; chưa đo giao dịch được tài trợ trên Fuji thật.
- Kinh tế giữ Spool 25% và sức đánh 1,15; E3 còn 16/18. Chưa tạo mốc parity mới.
- Kiểm tra web có2.682trường hợp đạt và bảy lỗi ART không đổi; server, rules, typecheck, bản dựng và đối chiếu ba trận đạt.
- Lịch sử Git:700/3.854 commit; checkpoint gzip1.203/1.332 tệp,1.314 cảnh báo đã đối chiếu. Bổ sung mới9commit/19gzip không có cảnh báo; chưa kết luận toàn bộ lịch sử sạch.
- Production12 đi đủ bảy bước, 18 biên nhận và 60 FPS; tải đến lúc cảnh battle sẵn sàng là27,55MB, vượt8MB. Bốn lượt vào mới cũng xác nhận mức tải này; yêu cầu ART đã cập nhật.
- Gói offline đã chạy đủ hành trình ở cả hai kích thước, không gọi mạng; 1.614 tài nguyên giữ nguyên byte. Mọi giao dịch offline đều ghi rõ mock.
- Phim chuẩn bị 3: 169,83 giây/9,31 MB, có 5 giây Snowtrace thật; −17,86 LUFS/−2,22 dBTP/LRA 5,2 đạt ngưỡng. 53 phụ đề Anh–Việt khớp thời gian; đủ 13 câu thoại.
- Snowtrace được ghi bằng WebKit headless; cảnh báo403 của Chromium được giữ riêng. Nguồn phim/phí RPC đã đối chiếu; kiểm tra nghe/đọc thủ công còn mở. R2 vẫn sau ART18/11.
- Hồi quy hiện còn đúng bảy lỗi ART; server, rules, typecheck, parity probe và build đạt. Báo cáo khoảng131,3MB; chưa đạt toàn bộ G-REPO.
- Class:800lượt quan sát khớp mô hình gốc; thiếu YARN là điểm chặn chính, chưa có căn cứ cho ứng viên mới. Giữ1,15/25% và lỗi16/18.
S11: workshop tối đa 21 từ trong lần đo mới; focus bàn phím 6/6 đạt. Tiêu đề landing đã đạt tương phản 15,27:1 ở hai kích thước; còn bốn lỗi ảnh ART và 32 mẫu tương phản battle chưa xác nhận. Công cụ demo đã bỏ qua thư mục promo; 25/25 chân dung qua HTTP khớp nguồn.
S11 hộp thoại phụ: bản production mới đạt47/47 mẫu, tương phản tối thiểu5,407:1, bàn phím6/6 và lưu12 mức âm lượng đạt. Hồi quy vẫn còn bảy lỗi ART; chưa đạt UI toàn cục.
Modal đạt16/16 ca cô lập nền,6/6 bàn phím,47/47 mẫu UI. Phép đo S8 đã sửa mốc cảnh sẵn sàng và đạt7/7 ca kiểm chứng; đang tiếp tục rà soát lịch sử Git. Không thay đổi âm thanh hay tài nguyên ART.
ART: kiểm tra trước tích hợp1.004tệp, không xung đột; giữ956tệp SHIP và xác nhận77hash A9. Chưa hợp nhất; bảy lỗi ART và ngưỡng tải8MB vẫn mở.
Âm thanh S11: đã sửa bốn healer dùng chime thay va chạm;24/24ca chọn âm,10test và12lượt phát thật đạt. Bản thử90,13s đạt mức tổng−19,47LUFS/7,9LRA/−2,36dBTP; đoạnwave3 còn nhỏ. Đang đo đầy đủ và sẽ chạy lạiproduction; G-AUDIO vẫn mở.
