# CXV — Batch M, 18/11/2026
Ưu tiên hiện tại là làm mèo sống động theo hai clip của bạn thiết kế; đang kiểm chứng thử nghiệm trong bản6310, chưa phát hành bản tích hợp.
Đã sao chép và đối chiếu SHA256 của Mochi/Clover; bản gốc còn nguyên. Mỗi clip10giây/300khung, H.264 không có alpha. CXI phụ trách nền trong suốt, tải tài nguyên và ngân sách; hai bên thống nhất giữ tốc độ gốc1x và mốc chân512đơn vị.
Đã nghiên cứu tài liệu chính thức tiếng Trung/Anh, lập bảng đo đầu/thân/đạo cụ/vải và nhắm mắt. Mochi nhắm mắt lâu hơn kiểu chớp mắt hiện tại. Một số điểm ở đuôi/tai bị che nên kết quả theo dõi bị loại; không coi số đo lỗi là chuẩn.
Panko đã có chuyển động thử trong mã: chu kỳ10giây, chân giữ nguyên, biên chu kỳ khớp, chớp mắt mềm;44kiểm thử và TypeScript đạt. Phim cùng chiều cao224px/tốc độ1x đã đối chiếu. Chế độ giảm chuyển động ổn định; cần hoàn thiện đạo cụ và chuyển tiếp khi thi triển trước khi nhân rộng. Soot bị loại hoàn toàn khỏi BatchM;3833đường dẫn đã có dấu vân tay và sẽ so sánh cả đầu ra mã dùng chung.
Tự nhắc CXV vẫn ACTIVE mỗi15phút, giữ nguyên nội dung. V7 đã hoàn thành vẫn giữ bằng chứng; các thử nghiệm hiệu năng cũ chuyển sauBatchM.
Panko đã nối kỹ năng1giây với trạng thái chờ liên tục: đầu/cuối lưới và ảnh khớp tuyệt đối, mốc cast250/hit550ms được khớp vào va chạm luật350ms. Chiêu cuối2.2giây vẫn giữ nguyên. Đã gửi CXI kiểm tra độc lập; tám mèo còn lại dùng bộ xương khác nên đang nghiên cứu riêng.

M-V2 Mallow thử trên bản sao rig:300frame/10s,không lỗi,hai chân và mối nối mesh đúng0;diện tích tam giác nhỏ nhất0.622. Đã xem4ảnh so sánh227px một lần. Chuyển động còn nhẹ; cần bỏ lắc toàn thân cũ và kiểm tra cast/reduced trước READY.

2026-11-18T05:32:21.924808+00:00 Mallow: idle10giây và cast1giây đã qua kiểm tra6310;31test/TSC0. Chân và đường nối vòng lặp không dịch; hit350ms khớp.55s ở cả hai chế độ. R1cast bị sai attack, R2 đã sửa/đo lại. READY phạm vi motion, chưa phải nghiệm thu bản judge; vùng HUD còn chạm cây đánh trứng.

2026-11-18T05:48:35.367558+00:00 Sorrel: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:52:01.386745+00:00 Biscuit: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:52:22.354429+00:00 Inkcap: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:52:43.124818+00:00 Cinnamon: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:53:09.627435+00:00 Brioche: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:54:05.172722+00:00 Velvet: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:55:30.538141+00:00 Marigold: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.

2026-11-18T05:57:48.284002+00:00 Nhóm7mèo Sorrel/Biscuit/Inkcap/Cinnamon/Brioche/Velvet/Marigold đã qua kiểmtra chuyểnđộng riêng:7phim/28ảnhmới,60test/TSC0,3833đườngdẫn Soot giữnguyên. READY cho CXI tíchhợp; chưanâng thành nghiệmthu judge6301 hay hiệu năng.

2026-11-18T06:21:50.274153+00:00 CXI đã nghiệm thu chuyển động 9 mèo native trên bản production; Soot giữ nguyên. Chẩn đoán CPU 32 trường hợp đạt, tối đa trung vị 0,038617 ms/pose; chưa kết luận FPS. Mochi/Clover, dung lượng và hiệu năng toàn trận còn mở.

2026-11-18T06:26:31.921851+00:00 Clover: điểm hông và tay cầm ấm đã qua theo dõi 300 khung hình, xem mới 4 pha, đổi tọa độ 3000 lần sai số dưới 0,000001. Chưa đạt đầu/tay còn lại/điểm phát hiệu ứng và bản media cuối. Ảnh landing 63.006 B đạt dung lượng nhưng mờ chi tiết, đã yêu cầu AGV sửa.

2026-11-18T06:42:43.917656+00:00 Đã kiểm tra 6 trận production của 9 mèo native: kết quả và chuỗi hành động khớp ở 2 chế độ, không lỗi; 48 ảnh đo, 12 ảnh xem đúng một lần. Khôi phục sổ 4 ảnh đã xem, không mở lại. Hiệu ứng Mallow/Sorrel/Cinnamon/Brioche che thân/đạo cụ; Biscuit có chồng lấn. Chưa nghiệm thu độ rõ hiệu ứng, media Mochi/Clover hoặc ngân sách.

2026-11-18T06:45:21.855595+00:00 Điểm phát hiệu ứng ấm Clover vẫn chưa đủ bằng chứng: vùng gốm có 10 góc theo dõi nhưng tỷ lệ đồng thuận 0,6; kiểm tra mẫu độc lập chỉ 0,7704 và lệch 2,7436 px. Giữ nguyên hông/tay đã đạt, không dùng chuyển động tay thay cho ấm.

2026-11-18T06:47:47.119780+00:00 Ảnh landing R2 108.498 B đã kiểm tra mới ở 1280×720: tốt hơn R1 nhưng chi tiết lông/viền khiên/gạch vẫn bị làm mịn, cần sửa. Tiết kiệm 99.369 B, riêng ảnh này vẫn thiếu 42.417 B so với ngân sách trận 3. Chưa tích hợp.
