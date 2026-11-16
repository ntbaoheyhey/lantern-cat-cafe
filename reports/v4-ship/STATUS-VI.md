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
- Kiểm tra web có 2.663 trường hợp đạt và bảy lỗi thuộc phần ART; server, rules, typecheck, bản dựng và phép đối chiếu ba trận đạt.
- Quét toàn bộ lịch sử git vẫn chạy; chưa kết luận lịch sử sạch.
- Production đã đi đủ bảy bước, 18 biên nhận và 60 FPS; tải 26,4 MB trước trận vượt mức 8 MB, đang chờ ART sửa phần tài nguyên.
- Gói offline đã chạy đủ hành trình ở cả hai kích thước, không gọi mạng; 1.614 tài nguyên giữ nguyên byte. Mọi giao dịch offline đều ghi rõ mock.
- Phim chuẩn bị:152,83giây/9,32MB,47phụ đề Anh/Việt;18biên nhận thật trên Anvil đã xác minh. LRA4,8<5 còn lỗi.
- Snowtrace đã mở được bằng trình duyệt tích hợp; còn thiếu video biên nhận Fuji và kiểm tra nghe/đọc. R2 vẫn sau ART18/11.
- Bản clone sạch còn bảy lỗi ART; báo cáo khoảng 84,6 MB, ảnh lịch sử đã giữ nguyên trong kho cục bộ.
- Class:800lượt quan sát khớp mô hình gốc; thiếu YARN là điểm chặn chính, chưa có căn cứ cho ứng viên mới. Giữ1,15/25% và lỗi16/18.
S11: đã rút gọn 7 bước workshop xuống tối đa 25 từ và thêm nền chữ rõ hơn. Đang chờ kiểm tra lại production; còn lỗi trả focus ở đăng nhập và ảnh Binding Thread thuộc ART.
