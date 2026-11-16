# Bản thử dành cho giám khảo
- Nhánh tích hợp: codex/v4-ship-2026-11-16; chưa triển khai lên mạng.
- Bản healer mới đã chạy liên tục30phút,18lần khởi động lại trận,không lỗi; thời lượng mã hóa đã đối chiếu.
- Bản ghi healer boss:−16,99LUFS; khoảng động8,9LU;đỉnh−1,65dBTP,đều trong giới hạn.
- Giới hạn sáu nguồn âm/100 ms, giảm nhạc 8 dB và phục hồi âm lượng đã đạt.
- Toàn bộ âm vẫn có mẫu ước tính vượt33ms; nhận dạng và đo vật lý còn mở. Không kết luận G-AUDIO đã đạt.
- Bản healer mới nhận dạng lời thoại 7/12, cần10/12; đây chưa phải so sánh có kiểm soát với bản8/12 trước. Kiểm tra nghe còn mở.
- 34 trường hợp âm UI/giao dịch không quá 300 ms; 15 kiểm tra âm lượng/tắt tiếng/tải lại đạt.
- Đủ 20/20 hành trình đạt: trung vị battle khoảng 3 giây/2 lần bấm; receipt khoảng 95 giây; 360 receipt đã đối chiếu, không lỗi/popup.
- Bốn bộ đếm Fuji và phục hồi dữ liệu cũ đã kiểm tra; chưa đo giao dịch được tài trợ trên Fuji thật.
- Kinh tế giữ Spool 25% và sức đánh 1,15; E3 còn 16/18. Chưa tạo mốc parity mới.
- Kiểm tra web có2.690trường hợp đạt và bảy lỗi ART không đổi; server, rules, typecheck, bản dựng và đối chiếu ba trận đạt.
- Lịch sử Git:700/3.854 commit dạng văn bản; gzip đã quét đủ1.332/1.332 tệp,1.314 cảnh báo đã đối chiếu,không phát hiện mới. Phần lịch sử mới và định dạng khác vẫn mở.
- Production15 đạt đủ hành trình ở hai kích thước,36 biên nhận,248 âm tiếp xúc,116 hành động ranged,32 nhịp hồi máu Clover và boss trung vị60FPS; tải30,04MB vẫn vượt8MB.
- Gói offline đã chạy đủ hành trình ở cả hai kích thước, không gọi mạng; 1.614 tài nguyên giữ nguyên byte. Mọi giao dịch offline đều ghi rõ mock.
- Phim chuẩn bị 3: 169,83 giây/9,31 MB, có 5 giây Snowtrace thật; −17,86 LUFS/−2,22 dBTP/LRA 5,2 đạt ngưỡng. 53 phụ đề Anh–Việt khớp thời gian; đủ 13 câu thoại.
- Snowtrace được ghi bằng WebKit headless; cảnh báo403 của Chromium được giữ riêng. Nguồn phim/phí RPC đã đối chiếu; kiểm tra nghe/đọc thủ công còn mở. R2 vẫn sau ART18/11.
- Hồi quy hiện còn đúng bảy lỗi ART; server, rules, typecheck, parity probe và build đạt. Báo cáo dưới150MB; chưa đạt toàn bộ G-REPO.
- Class:800lượt quan sát khớp mô hình gốc; thiếu YARN là điểm chặn chính, chưa có căn cứ cho ứng viên mới. Giữ1,15/25% và lỗi16/18.
S11: workshop tối đa 21 từ trong lần đo mới; focus bàn phím 6/6 đạt. Tiêu đề landing đã đạt tương phản 15,27:1 ở hai kích thước; còn bốn lỗi ảnh ART và 32 mẫu tương phản battle chưa xác nhận. Công cụ demo đã bỏ qua thư mục promo; 25/25 chân dung qua HTTP khớp nguồn.
S11 hộp thoại phụ: bản production mới đạt47/47 mẫu, tương phản tối thiểu5,407:1, bàn phím6/6 và lưu12 mức âm lượng đạt. Hồi quy vẫn còn bảy lỗi ART; chưa đạt UI toàn cục.
Modal đạt16/16 ca cô lập nền,6/6 bàn phím,47/47 mẫu UI. Phép đo S8 đã sửa mốc cảnh sẵn sàng và đạt7/7 ca kiểm chứng; đang tiếp tục rà soát lịch sử Git. Không thay đổi âm thanh hay tài nguyên ART.
ART: kiểm tra trước tích hợp1.004tệp, không xung đột; giữ956tệp SHIP và xác nhận77hash A9. Chưa hợp nhất; bảy lỗi ART và ngưỡng tải8MB vẫn mở.
Âm thanh S11:đã cài144 sprite va chạm và launch/travel cho ranged;168/168 ca thử tốc độ cố định đạt pha/nguồn âm,47 kiểm tra tập trung đạt gồm390 đổi tốc độ. Bộ phát thật168/168ca và production hai kích thước đã đối chiếu;ước tính trễ33,67ms còn vượt33ms,nghe thực tế chưa xác nhận.
