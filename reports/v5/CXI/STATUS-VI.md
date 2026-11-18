# V8 Batch M
Hiện tại 2026-11-18T15:56Z: chín mèo native vẫn ở v5-m1.15; media Mochi/Clover R7 chưa phát hành. Hai ảnh mới0/800ms đã duyệt nhãn dưới thân thuộc Mochi trong phạm vi mẫu. Hồi quy16hành động/1.500mốc/34mẫu có rules và1.534layout khớp, nhưng chỉ33/34đối chứng hợp lệ; năm mẫu hợp lệ còn bóng nhãn chạm Clover. Pilot quan sát HUD tự ổn định đã đạt10/10đối chứng, giữ nguyên lỗi lượt cũ và lỗi đồ họa. Chưa đạt phát hành; còn seam/viền/halo/laptop thường. Byte chỉ báo cáo; sáu callout thay thế vẫn bị loại. Cổng6301 đã trả quyền lúc15:52:29Z; đang đo khoảng hở của Clover trên dữ liệu đóng băng.

2026-11-18T05:47:08.972148+00:00 — Panko đã kiểm tra trên bản production: chân và gốc không trôi trong vòng10giây ở cả hai chế độ; skill350ms khớp mốc.55,ult1100ms khớp1.1. Phim so sánh cùng chiều cao/tốc độ và5ảnh mới đã duyệt. Chưa phát hành vì còn ngân sách tải/hiệu năng. Mallow nhập có giới hạn,16test+typecheck đạt;2464ca so sánh mã dùng chung khớp,3833đường dẫn bảo vệ không đổi.

2026-11-18T06:03:08.988121+00:00 Mallow: chấp nhận idle/cast trên bản production d1192596c; chân và seam=0, hit350ms→.55;4 ảnh mới đã xem,phim10s cùng chiều cao228px. Chưa phát hành: wave3 vượt141046B; chưa kết luận FPS.

2026-11-18T06:16:49.105781+00:00 — Cả9 mèo native (trừ Soot) đã được chấp nhận trong phạm vi idle/cast: chân/seam=0, hit350ms→.55; bộ7 mới có phim10s/300khung cùng chiều cao225–229px và4ảnh/mèo đã xem một lần. Build/typecheck và bộ test đạt; chưa phát hành, chưa khẳng định FPS. Mochi/Clover chưa đăng ký do viền/dung lượng/vòng lặp chưa đạt.

2026-11-18T06:45:01.433086+00:00 — Đã kiểm tra hash bằng chứng trận tự nhiên của CXV: 6 trận thắng, 3 cặp thường/giảm chuyển động có trạng thái và thứ tự sự kiện khớp; không lỗi. Chỉ chấp nhận phạm vi số liệu, không suy ra FPS trên mọi laptop; che khuất hiệu ứng còn mở. Video bốn mặt phẳng H264 giải mã giống nhau trên Chromium/WebKit nhưng chưa đạt sai số; VP9 đạt chất lượng nhưng 1.44MB vượt giới hạn thử nghiệm. Chưa đăng ký Mochi/Clover hay phát hành.

2026-11-18 07:19Z: Mochi bốn mặt phẳng 931.787 byte đạt kiểm tra 300 khung trên Chromium/WebKit; loader đạt64 kiểm tra và đường cũ92 kiểm tra. Chưa đưa vào game: phép đo khung hình sân đấu đọc sai video, đã khôi phục và nhờ CXV sửa đúng phạm vi. Bản local mới901430f2b chỉ thêm hiệu ứng5 ultimate đã nhập, kiểm tra trận mở được/0 lỗi; chờ kiểm tra hình thật, chưa tag.

2026-11-18T07:33:54.918019+00:00 — Bản sửa đo khung video đã nhập đúng3file;80kiểm tra tập trung và TypeScript đạt,3833đường dẫn bảo vệ không đổi. Thử đuôi Clover mới hết gập nhưng còn bóp hình nên chưa chấp nhận; chưa đăng ký media hay phát hành. Bản nháp yêu cầu xuất alpha của AGS đã đủ trường; chỉ để chủ dự án xem.

2026-11-18T07:54:21.891704+00:00 — Bản thử R3 đã sửa mốc ultimate media Mochi/Clover đúng1,1giây;42test tập trung,TypeScript và toàn bộ5465test đạt(5452pass,11bỏqua,2lỗi dự kiến). Mochi thử4hànhđộng/24mẫu ở2chếđộ đúng mốc;3ảnh mới sau khi tách fixture không còn panel boss cũ. Idle Mochi304mẫu/300hash phim được xác minh;chưa đăng ký vào bản chính vì tải lạnh vượt8MB,Clover/sockets/hiệu năng còn mở.

2026-11-18T08:12:21.936836+00:00 Batch M: Đã sửa nền vàng chữ nhật khi Mochi thi triển kỹ năng; 26 mẫu kiểm tra và 2 ảnh mới ở cả hai chế độ đều đạt. Bộ kiểm thử đầy đủ chạy thành công; chưa phát hành vì tải lạnh còn 8,51/8,98/8,58 MB, Clover chưa tích hợp và kiểm tra chuyển động toàn cảnh còn mở.

2026-11-18T08:40:07.963404+00:00 — Bản thử R5 đã sửa màn thắng cho Mochi video: 146 mẫu hai chế độ, vòng10giây liên tục và khung đứng khi giảm chuyển động; hai ảnh tự chụp đã xem. Bộ kiểm tra5471 mục thành công theo kỳ vọng (5458 đạt,11 bỏ qua,2 lỗi dự kiến). Chưa phát hành: lượt đầu8.51/8.98/8.58MB đều vượt8MB, chưa có Clover; kiểm tra chơi thường do CXV tiếp tục.

2026-11-18T09:07:08.966183+00:00 — Đã đối chiếu 37 tệp âm thanh với bản R5 đang phục vụ, đúng byte/hash và index. Tải âm thanh đo được 2,22/2,44/2,46 MB; đây chỉ là bằng chứng tải, chưa chứng minh có thể bỏ preload. Bản sửa ngừng video ẩn đã nhập và qua 40 kiểm tra tập trung, chưa dựng R6. Chưa phát hành.

2026-11-18T09:14:37.307271+00:00 — R6 đã ngừng video sân đấu khi mở màn thắng: đồng hồ và bộ đếm frame/drop giữ nguyên ở cả hai chế độ; video màn thắng vẫn chạy đủ vòng10giây.146mẫu và2ảnh mới đạt. Toàn bộ5499kiểm tra thành công theo kỳ vọng(5486đạt,11bỏqua,2lỗidựkiến);chưa có kết luận FPS chung. CXV kiểm tra trận tự nhiên/panelboss;Clover và ngân sách8MB còn chặn phát hành.

2026-11-18T09:32:35.121889+00:00 — R6: kiểm tra độc lập trận thường/giảm chuyển động đạt phạm vi hẹp (1.059 mẫu không che chân dung; bộ giải mã dừng ở kết quả). Tải lạnh 8.509.074 / 8.975.988 / 8.584.766 byte vẫn vượt 8 MB, chưa có Clover nên chưa phát hành. 37 tệp âm thanh và 12 bản gọi tên không đổi; chưa chấp nhận thay thế âm thanh. Landing R9 vẫn làm mịn chi tiết, không dùng.

2026-11-18T09:46:37.353722+00:00 — Kiểm tra độc lập vùng đuôi Clover: khớp1897/1897 và2501/2504 điểm đuôi do CXV đánh dấu,không lẫn1004 điểm váy ở mỗi đầu vòng. Phép xoay cứng cải thiện lõi đuôi nhưng vùng biên/che khuất chưa đủ bằng chứng; chưa chấp nhận vòng lặp hay phát hành.

2026-11-18T10:18:50.245184+00:00: Kênh vòi ấm Clover đã thêm riêng và qua 27 kiểm tra/TypeScript; 1500 mẫu đổi tọa độ sai số tối đa 1,18e-6. Chưa bật Clover: mép ảnh, vòng đuôi, mốc mặt/tay và dung lượng còn mở. Brotli chỉ tiết kiệm 29.651 byte và Chromium hiện tại không hỗ trợ giải nén JS; không đưa vào game. Bản phát hành vẫn v5-m1.13.

2026-11-18T10:40:30.312159+00:00 — Clover Q21 đã chạy trong bản thử cục bộ cùng Mochi: video 817.118 byte, cả gói 897.635 byte; 300 frame ở Chromium/WebKit đạt ngưỡng nén. 26 mẫu hành động và 4 lượt thường/giảm chuyển động đúng trạng thái game, không lỗi console; đã xem đúng 2 ảnh mới. Thanh HP cạnh mặt/ấm đang được đo lại; đuôi nối vòng, matte, mốc mặt/tay và ngân sách còn mở. Chưa phát hành, tag vẫn v5-m1.13. Âm thanh giữ nguyên 49 hash; không chấp nhận thay thế sáu callout.

2026-11-18T10:56:58.744362+00:00 — Đã sửa vị trí thanh HP của Clover: 56 trạng thái kiểm tra không che mặt/vòi ấm/thân hoặc nhãn khác; 2 ảnh mới đã xem. Chưa phát hành: đường viền, nối vòng hoạt ảnh, dung lượng tải và hiệu năng còn chưa đạt.

2026-11-18T11:05:43.124287+00:00 — Thử nghiệm video chia đoạn: 20 trường hợp trên Chromium/WebKit, 60 mẫu ảnh trùng khớp. Chỉ tiết kiệm khoảng260KB khi bắt đầu ở pha thông thường, chưa đủ mức thiếu1.74MB của wave3. Chưa đổi bộ tải, chưa phát hành; tiếp tục kiểm tra atlas hiệu ứng không cần tải.

2026-11-18T11:37:04.906806+00:00 — Atlas R3: 6 lượt/672 mẫu/756 bề mặt hiệu ứng trùng khớp; 5.519 test đạt, 11 bỏ qua, 2 lỗi dự kiến. Tải lạnh 9.199.107/9.638.539/9.227.294 byte vẫn vượt8MB. Đã có4 bản video GOP1s/2s thực tế; chất lượng nén đạt nhưng chia đoạn riêng chưa đủ ngân sách. Chưa phát hành; âm thanh và texture R12 không được thay thế.

2026-11-18T11:53:03.364738+00:00: Bản thử chỉ có 9 mèo native đang chạy ở6301;Mochi/Clover chưa bật trong bản phát hành. Wave1/boss đạt8MB,wave3 còn vượt39.216byte. Đã kiểm chứng lại65khung Clover:điểm nối đuôi vẫn nhảy,không do chân/gốc bị dịch;chưa chấp nhận chất lượng viền/halo. Nghiên cứu nén dữ liệu rig không mất số liệu;chưa tích hợp. Bản phát hành vẫn v5-m1.13.

2026-11-18T12:19:33.429998+00:00 — NativeR2 qua5.552kiểm tra(5.539đạt,11bỏqua,2lỗi dự kiến),7bước browser và3phim thật30giây;đòn đầu20,880giây.9ảnh mới đã xem. Chuẩn bị tagv5-m1.14 cho9mèo native;Mochi/Clover commissioned chưa bật. Owner bỏ8MB nên tải7.591.445/8.030.924/7.624.476byte chỉ báo cáo.

2026-11-18T12:52:08.533839+00:00 — Bản phát hành v5-m1.14 giữ nguyên 9 mèo native. Hai thử nghiệm lấy mẫu Clover đạt300khung trên Chromium/WebKit; bản318×390 giữ nguyên148.824.000byteRGBA, chuẩn bị kiểm tra trong sân đấu. Chưa chấp nhận viền/halo/nối đuôi. LandingR12 đã duyệt hình và đưa vào nguồn; dung lượng chỉ báo cáo.

2026-11-18T13:00:45.058553+00:00 — Clover R5 giữ nguyên matte318×390: 696 kiểm tra mốc mặt/tay và10nguồn hiệu ứng đạt;4ảnh sân đấu mới đã xem. Phim đối chiếu300khung/10giây/30fps cao227px hoàn thành;2ảnh đối chiếu đã xem. Nối đuôi vẫn lỗi: MAE 11.158 so với trung vị lân cận 2.248; chưa phát hành media.

2026-11-18T13:09:01.623723+00:00 — NativeR3 đạt7cổng browser mới, đòn đầu21,163giây,3phim30giây và6ảnh mới xem một lần. Chuẩn bị v5-m1.15 với landingR12; bộ5.556kiểm tra được kế thừa vì mã ứng dụng chỉ khác texture đã duyệt. Media Mochi/Clover vẫn chưa phát hành;59hash âm thanh và3.833đường dẫn bảo vệ không đổi.

2026-11-18T13:12:32.940502+00:00 — Đã xác minh phát hành v5-m1.15 trên nhánh và tag từ xa (59f5f3c57): 9 mèo native, landing R12 đã duyệt. Hai media commissioned chưa được bật; khôi phục bản thử R5 để đo phần nhãn HP thực sự che hình. Wake vẫn hoạt động mỗi15phút.

2026-11-18T13:19:51.102134+00:00 — Kiểm tra độc lập log trậnR5: video Mochi bỏ15/2430khung,Clover19/2431khung;không được tuyên bố zero-drop. Mỗi video có8lần nối vòng. Chưa xác nhận hiệu năng laptop phổ thông;đang tách thời gian video thực tế khỏi pha socket trước khi đề xuất sửa loader.

2026-11-18T13:31:23.896989+00:00 — Đã tính độc lập R6:274hash,70trạng thái,1040phép đếm khớp. Ở1/5pha,32pixel Mochi chạm nhãn khiên Clover (7pixel ở ngưỡngRGB>4);thanh HP/rage và nhãn của chính mèo không bị che trong5pha. Đây chỉ là phép đo tạm dừng sauẩn/hiện nhãn;chưa gỡ lỗi seam/matte hay duyệt media vào bảnphát hành.

2026-11-18T13:45:44.320467+00:00 — Phép đo GPU có kiểm soát đã qua: 8 đối chứng, 600 khung tham chiếu native, 24 khung đang chạy nhận dạng duy nhất; 653 tệp được băm lại. CXV tái dựng đúng 168 socket. Pha socket hiện chạy theo currentTime nên có thể lệch lớn trong lúc seek; đang chuẩn bị sửa theo khung đã giải mã. Chưa chứng nhận gameplay tự nhiên, hiệu năng, seam hay chất lượng alpha; media vẫn chưa bật.

2026-11-18T13:59:40.271008+00:00 — Bản thử phaseR6 sửa thời điểm socket theo khung hình video đã giải mã. 3.247 kiểm thử web đạt; 24/24 mẫu GPU khớp chính xác với socket, kể cả khi seek; 600 khung tham chiếu kiểm tra độc lập. Đang kiểm tra vòng đời trình duyệt và hành động hợp lệ. Chưa đưa Mochi/Clover vào bản phát hành vì viền/halo/điểm nối vòng và nhãn vẫn chưa đạt. v5-m1.15 vẫn là bản xanh.

2026-11-18T14:08:00.189344+00:00 — R7 đã cài,3.250web đạt;nhãn mới đang kiểm tra browser theo leaseCXV. Bản phát hành vẫnv5-m1.15;Mochi/Clover chưa đăng ký vì cổng art còn mở.

2026-11-18T14:16:12.501064+00:00 — R7:8skill hợp lệ/52mốc đạt,12ảnh mới đo và4ảnh xem một lần. Nhãn vẫn chạm17pixel tại pose giữ riêng;status stress208/69/74pixel. Khôngpháthành media;native9vẫnv5-m1.15.
