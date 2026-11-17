# Bản thử dành cho giám khảo
- Nhánh tích hợp: codex/v4-ship-2026-11-16; chưa triển khai lên mạng.
- Bản monolith trước đây đã chạy30phút/18lần khởi động lại trận/8.012nguồn âm/0lỗi. Đây là bằng chứng lịch sử; chưa thay cho endurance của runtime palette mới.
- Bản ghi boss30phút cũ:−17,00LUFS/8,9LU/−1,74dBTP. Runtime palette mới đã được đo qua hai hành trình; endurance riêng còn cần xác nhận.
- Giới hạn sáu nguồn âm/100 ms, giảm nhạc 8 dB và phục hồi âm lượng đã đạt.
- Toàn bộ âm vẫn có mẫu ước tính vượt33ms; nhận dạng và đo vật lý còn mở. Không kết luận G-AUDIO đã đạt.
- Bản healer mới nhận dạng lời thoại 7/12, cần10/12; đây chưa phải so sánh có kiểm soát với bản8/12 trước. Kiểm tra nghe còn mở.
- 34 trường hợp âm UI/giao dịch không quá 300 ms; 15 kiểm tra âm lượng/tắt tiếng/tải lại đạt.
- Đủ 20/20 hành trình đạt: trung vị battle khoảng 3 giây/2 lần bấm; receipt khoảng 95 giây; 360 receipt đã đối chiếu, không lỗi/popup.
- Bốn bộ đếm Fuji và phục hồi dữ liệu cũ đã kiểm tra; chưa đo giao dịch được tài trợ trên Fuji thật.
- Kinh tế giữ Spool 25% và sức đánh 1,15; E3 còn 16/18. Chưa tạo mốc parity mới.
- Web có2.697 bài đạt và bảy lỗi ART cũ;server742/rules1.409/parity ba trận không đổi. Typecheck/build đạt sau sửa kiểu mảng trong test;log lỗi gốc được giữ.
- Lịch sử Git: đã đối chiếu đủ1.350phát hiện trong phần6.000đối tượng;434mã băm nguồn,876định danh,33đường dẫn cấu hình,3biểu thức/kiểu mã và4địa chỉ hợp đồng công khai. Chưa xác nhận toàn bộ91.187đối tượng hay các phần nhị phân bị loại;hai bộ quét tiếp tục.
- Production16/208805af8 đạt hai hành trình:36biên nhận,248âm tiếp xúc đã giải mã trước,116ranged,32Clover;đội hình trước nhạc4/4,boss60FPS. Tải29,65MB vẫn vượt8MB;đã hoàn nguyên dữ liệu thử.
- Gói offline đã chạy đủ hành trình ở cả hai kích thước, không gọi mạng; 1.614 tài nguyên giữ nguyên byte. Mọi giao dịch offline đều ghi rõ mock.
- Phim chuẩn bị 3: 169,83 giây/9,31 MB, có 5 giây Snowtrace thật; −17,86 LUFS/−2,22 dBTP/LRA 5,2 đạt ngưỡng. 53 phụ đề Anh–Việt khớp thời gian; đủ 13 câu thoại.
- Snowtrace được ghi bằng WebKit headless; cảnh báo403 của Chromium được giữ riêng. Nguồn phim/phí RPC đã đối chiếu; kiểm tra nghe/đọc thủ công còn mở. R2 vẫn sau ART18/11.
- Chọn gói theo đội hình đã qua104/104bước và hai hành trình production. Mức trộn mới−17,72/−17,76LUFS,8,8/8,6LRA,−1,63/−1,95dBTP đạt;giảm nhạc/phục hồi đạt,không ngắt thoại.
- Class:800lượt quan sát khớp mô hình gốc; thiếu YARN là điểm chặn chính, chưa có căn cứ cho ứng viên mới. Giữ1,15/25% và lỗi16/18.
S11: workshop tối đa 21 từ trong lần đo mới; focus bàn phím 6/6 đạt. Tiêu đề landing đã đạt tương phản 15,27:1 ở hai kích thước; còn bốn lỗi ảnh ART và 32 mẫu tương phản battle chưa xác nhận. Công cụ demo đã bỏ qua thư mục promo; 25/25 chân dung qua HTTP khớp nguồn.
S11 hộp thoại phụ: bản production mới đạt47/47 mẫu, tương phản tối thiểu5,407:1, bàn phím6/6 và lưu12 mức âm lượng đạt. Hồi quy vẫn còn bảy lỗi ART; chưa đạt UI toàn cục.
Modal đạt16/16 ca cô lập nền,6/6 bàn phím,47/47 mẫu UI. Phép đo S8 đã sửa mốc cảnh sẵn sàng và đạt7/7 ca kiểm chứng; đang tiếp tục rà soát lịch sử Git. Không thay đổi âm thanh hay tài nguyên ART.
ART: kiểm tra trước tích hợp1.004tệp, không xung đột; giữ956tệp SHIP và xác nhận77hash A9. Chưa hợp nhất; bảy lỗi ART và ngưỡng tải8MB vẫn mở.
Âm thanh S11:đã cài144 sprite va chạm và launch/travel cho ranged;168/168 ca thử tốc độ cố định đạt pha/nguồn âm,47 kiểm tra tập trung đạt gồm390 đổi tốc độ. Bộ phát thật168/168ca và production hai kích thước đã đối chiếu;ước tính trễ33,67ms còn vượt33ms,nghe thực tế chưa xác nhận.
Đã nén37báo cáo parity,khôi phục đúng từng byte,tiết kiệm5,312MB. Lịch sử Git:checkpoint12.000/91.187blob,giữ1.350kết quả cũ,xác minh thêm353hash source;còn14/1.717finding cần rà. Bảy lỗi ART và các gate toàn cục vẫn mở.
