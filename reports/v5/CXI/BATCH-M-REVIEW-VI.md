# Mochi và Clover — bản thử R7, chưa phát hành

Cập nhật 2026-11-18T16:21:01.618137+00:00. Bản xanh hiện tại vẫn là **v5-m1.15**, gồm chín mèo native đã được duyệt. Media được đặt hàng của Mochi/Clover chỉ bật trong bản thử tại [đường desktop](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3); đây là địa chỉ local, không phải link public gửi giám khảo.

R7 dùng source `bf01d462ac32233ab11475605d571aea691f96bf`, index `eb93ee0dbdfb500c3f9aed80acdb134f027d8093240c86b545807a87dc79ce67`. Kiểm tra BOARD trước khi mở vì cổng6301 còn dùng cho nghiên cứu. Artifact xanh được giữ riêng tại `/Users/bao/taskbar-hero-chain/work/v5/CXI/releases/v5-m1.15-dist`.

Đã kiểm tra:

- Sửa đồng bộ socket với frame mà video callback báo đã trình bày. Thử GPU có24mẫu đã khớp; không suy rộng thành bảo đảm mọi frame của toàn trận.
- 3.250 bài kiểm tra web đạt. Hai trận tự nhiên hoàn tất110hành động, rules khớp giữa normal và reduced motion; không thấy lỗi decoder trong mẫu đã ghi.
- CXI tự chụp12ảnh từ8skill hợp lệ ở52mốc; đo cả12 rồi xem đủ12ảnh, mỗi ảnh một lần. Hai mèo có tỷ lệ sân khấu phù hợp trong các ảnh này, không hiện ô video nền đen; các thanh HP/rage được xem không che mặt chính mèo đó.

Thử nghiệm nhãn dưới thân Mochi mới (chỉ wrapper, chưa sửa source):76layout đóng băng và46mẫu/7.296phép so sánh đạt. Pilot Panko mới có57mốc,10đối chứng ảnh hợp lệ,320phép so sánh trong DOM sạch;494kiểm tra frame trình bày và67layout/469nhãn khớp. Kiểm tra mở rộng cho thấy bóng nhãn cần5px thay vì4px; ở775/800ms còn1/3pixel chạm Clover với sai khác RGB trên4. Vì vậy kết luận sạch trong DOM không phải sạch toàn bộ nét vẽ.

Hai ảnh mới do CXI tự chụp ở0/800ms cho thấy nhãn dưới thân đọc được là của Mochi, tách biệt nhãn Clover. Đây chỉ là duyệt cảm giác liên kết trong hai ảnh, không xóa lỗi pixel. Lượt hồi quy riêng đã kết thúc đủ16hành động,1.500mốc hình học và34mẫu ảnh. Rules khớp normal/reduced;1.534layout/10.738nhãn khớp trong0,015581CSSpx. Đối chứng toàn ảnh chỉ đạt33/34: mẫu Panko350ms normal có10pixel thay đổi ở HUD phía trên giữa ảnh khôi phục trước đo và baseline. Lượt đo pixel chưa hợp lệ hoàn toàn; giữ nguyên ảnh và lỗi, chưa phát hành.

Kiểm toán đầy đủ đã xác minh628hash,4.292kiểm tra frame và1.088phép so sánh trong DOM. Các số đếm trong DOM bằng0, nhưng mẫu lỗi đối chứng không được dùng làm chứng cứ sạch. Trong3.264phép so sánh mở rộng, năm mẫu có đối chứng hợp lệ vẫn có bóng nhãn chạm thân Clover với sai khác RGB trên4: ba ultimate và Panko775/800ms. [Kết quả đầy đủ và các tệp gốc](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-staging-full-own-r1-review.json) giữ rõ phần đạt, phần không hợp lệ và phần còn lỗi.

Pilot sửa cách quan sát HUD đã có10/10đối chứng hợp lệ. Ở350ms, thanh HP boss còn chờ cập nhật dù chưa có animation hữu hạn đang chạy; quan sát tự nhiên cần395,8ms để ổn định. Rules,67layout và320phép so sánh trong DOM đạt;960phép so sánh mở rộng vẫn phát hiện lỗi bóng Clover. Kết quả này chỉ duyệt phương pháp lấy mẫu, không thay thế lượt hồi quy cũ hay duyệt đồ họa. [Biên bản pilot](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-staging-control-pilot-r1-review.json).

**Chưa đạt để phát hành:**

- Nhãn R7 vẫn chưa đạt: pose giữ riêng có17pixel chạm, stress status208/69/74pixel. Wrapper Clover(-12,+19) sạch ở11pose+5status nhưng chưa nhập source. R3 đã sửa cách lấy mẫu:46snapshot/322nhãn khớp trong1/64CSSpx;16đối chứng ảnh đều hợp lệ. Tuy vậy nhãn Mochi chạm Panko ở250ms (1.479pixel cả hai chế độ) và350ms (1.340/1.302pixel). Hai ultimate Mallow sạch chỉ sau khi badgeΣ213 tự hết hạn; không suy ra toàn bộ hành động sạch. Dịch Mochi(0,-53) cũng bị loại vì6mẫu đèHUD. Chưa có R8 hoặc thay đổi source được chấp nhận.
- Viền/halo và nối đuôi Clover chưa được duyệt. Crossfade15frame bị loại vì tạo bóng kép bán trong suốt và rút vòng10giây xuống9,5giây.
- Hiệu năng laptop phổ thông chưa được chứng minh. Trên máyM3Pro đang dùng, số frame video rơi ghi nhận là19/2429 cho Mochi và28/2428 cho Clover; đây là số đo local có chi phí quan sát.
- Sáu callout thay thế vẫn bị loại. 59artifact audio hiện tại giữ nguyên hash; chưa có duyệt nghe chủ quan hay chứng nhận đồng bộ âm thanh/hình ảnh theo từng frame.

Dung lượng chỉ được báo cáo, không chặn phát hành. Chưa có deploy hosting, giao dịchFuji có tiền, đăng ký media sản xuất hoặc liên hệ người thiết kế.

Chủ dự án có thể dùng [bản nháp xin export](/Users/bao/taskbar-hero-chain/reports/v5/CXI/NEEDS-USER-VI.md:88) khi muốn liên hệ bạn: ưu tiên nền trong suốt, vòng đuôi đã sửa trong Cubism; nếu có sẵn thì cung cấp mask theo Part/ArtMesh nhìn thấy. Nhóm không tự tạo phần đuôi bị che hoặc chấp thuận giấy phép thay chủ dự án.

Bằng chứng: [nhãn và110hành động](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-disposition.json), [ảnh mới doCXI chụp](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-own-visual-review.json), [playback local](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-playback-review.json), [audio giữ nguyên](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-audio-review.json), [release xanh](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-m115-publication.json).

Bổ sung chẩn đoán: [vùng bao toàn vòng](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-media-envelope-r1-review.json), [11cặp đối chứng](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-envelope-pair-r1-review.json), [5status mở rộng](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-envelope-expanded-status-r1-review.json). Kiểm tra ngoài nhãn dùng vùng hợp4px; vẫn ghi riêng512pixel thay đổi nằm ngoài DOM chính xác, không gọi đó là không thay đổi ngoài DOM.

Bổ sung mới: [R3 recovery độc lập](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-action-recovery-r3-disposition.json), [8ảnh còn lại](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-own-visual-review-r2.json), [dịch nhãn bị loại](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-action-label-translation-r1-review.json). Chờ hai HUD frame là giới hạn lấy mẫu, không phải bản sửa runtime.

Kiểm tra mới:598hash/56đối chứng/134.456phép đếm tái lập vị trí Clover(-28,+14) duy nhất trên lưới phát triển. Đây chỉ là cơ sở cho pilot render cố định, không phải bằng chứng phát hành. Cần đối chứng toàn ảnh, khoảng hở của cả bóng nhãn, trạng thái idle/status mới và ảnh liên kết nhãn với mèo. Giữ nguyên các lỗi hồi quy cũ; chưa đổi bản6301 hay đăng ký media.
