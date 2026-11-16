# Bản thử dành cho giám khảo
- Nhánh tích hợp: codex/v4-ship-2026-11-16; chưa triển khai lên mạng.
- Âm thanh đã chạy liên tục 30 phút, lặp lại 18 trận; không lỗi trang hay cắt lời thoại.
- Bản ghi boss: -16,97 LUFS; khoảng động 8,9 LU; đỉnh -1,53 dBTP, đều trong giới hạn.
- Giới hạn sáu nguồn âm/100 ms, giảm nhạc 8 dB và phục hồi âm lượng đã đạt.
- Còn một lời thoại kết thúc boss trễ 40,67 ms so với giới hạn 33 ms.
- Nhận dạng lời thoại đạt 8/12, cần 10/12. Chưa coi âm thanh là đạt toàn bộ.
- 34 trường hợp âm UI/giao dịch không quá 300 ms; 15 kiểm tra âm lượng/tắt tiếng/tải lại đạt.
- Đủ 20/20 hành trình đạt: trung vị battle khoảng 3 giây/2 lần bấm; receipt khoảng 95 giây; 360 receipt đã đối chiếu, không lỗi/popup.
- Bốn bộ đếm Fuji và phục hồi dữ liệu cũ đã kiểm tra; chưa đo giao dịch được tài trợ trên Fuji thật.
- Kinh tế giữ Spool 25% và sức đánh 1,15; E3 còn 16/18. Chưa tạo mốc parity mới.
- Kiểm tra web có 2.677 trường hợp đạt và bảy lỗi thuộc phần ART; server, rules, typecheck, bản dựng và phép đối chiếu ba trận đạt.
- Lịch sử Git: 700/3.854 commit; gzip: 947/1.332 tệp. Đã sửa lỗi truyền dữ liệu và quét tiếp; 1.314 cảnh báo đã đối chiếu, chưa kết luận toàn bộ lịch sử sạch.
- Production đã đi đủ bảy bước, 18 biên nhận và 60 FPS; tải 26,4 MB trước trận vượt mức 8 MB, đang chờ ART sửa phần tài nguyên.
- Gói offline đã chạy đủ hành trình ở cả hai kích thước, không gọi mạng; 1.614 tài nguyên giữ nguyên byte. Mọi giao dịch offline đều ghi rõ mock.
- Phim chuẩn bị 2: 164,83 giây/9,34 MB; âm lượng −17,87 LUFS, đỉnh −2,22 dBTP, LRA 5,2 đạt ngưỡng. 52 phụ đề Anh–Việt khớp thời gian; đủ 13 câu thoại.
- Snowtrace đã mở được bằng trình duyệt tích hợp; còn thiếu video biên nhận Fuji và kiểm tra nghe/đọc. R2 vẫn sau ART18/11.
- Hồi quy hiện còn đúng bảy lỗi ART; server, rules, typecheck, parity probe và build đạt. Báo cáo khoảng 112 MB; chưa đạt toàn bộ G-REPO.
- Class:800lượt quan sát khớp mô hình gốc; thiếu YARN là điểm chặn chính, chưa có căn cứ cho ứng viên mới. Giữ1,15/25% và lỗi16/18.
S11: workshop tối đa 21 từ trong lần đo mới; focus bàn phím 6/6 đạt. Còn bốn lỗi ảnh ART và 36 mẫu chưa xác nhận tương phản. Công cụ demo đã bỏ qua thư mục promo; 25/25 chân dung qua HTTP khớp nguồn.
