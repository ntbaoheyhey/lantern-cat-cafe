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
