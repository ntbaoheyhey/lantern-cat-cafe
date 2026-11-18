# Mochi và Clover — bản thử R7, chưa phát hành

Cập nhật 2026-11-18T14:22:22.896081+00:00. Bản xanh hiện tại vẫn là **v5-m1.15**, gồm chín mèo native đã được duyệt. Media được đặt hàng của Mochi/Clover chỉ bật trong bản thử tại [đường desktop](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3); đây là địa chỉ local, không phải link public gửi giám khảo.

R7 dùng source `bf01d462ac32233ab11475605d571aea691f96bf`, index `eb93ee0dbdfb500c3f9aed80acdb134f027d8093240c86b545807a87dc79ce67`. Kiểm tra BOARD trước khi mở vì cổng6301 còn dùng cho nghiên cứu. Artifact xanh được giữ riêng tại `/Users/bao/taskbar-hero-chain/work/v5/CXI/releases/v5-m1.15-dist`.

Đã kiểm tra:

- Sửa đồng bộ socket với frame mà video callback báo đã trình bày. Thử GPU có24mẫu đã khớp; không suy rộng thành bảo đảm mọi frame của toàn trận.
- 3.250 bài kiểm tra web đạt. Hai trận tự nhiên hoàn tất110hành động, rules khớp giữa normal và reduced motion; không thấy lỗi decoder trong mẫu đã ghi.
- CXI tự chụp12ảnh từ8skill hợp lệ ở52mốc; đo cả12 rồi xem4ảnh một lần. Hai mèo có tỷ lệ sân khấu phù hợp trong các ảnh này, không hiện ô video nền đen; các thanh HP/rage được xem không che mặt chính mèo đó.

**Chưa đạt để phát hành:**

- Nhãn Clover vẫn đè lên17pixel được vẽ của Mochi ở một pose giữ riêng. Bộ stress status tổng hợp còn208/69/74pixel chạm. Việc đặt nhãn tránh toàn bộ hình chữ nhật đã bị loại vì nhãn nhảy57–160CSSpx, gây khó xác định mèo tương ứng. CXV đang nghiên cứu vùng thực sự có pixel của cơ thể qua cả vòng idle.
- Viền/halo và nối đuôi Clover chưa được duyệt. Crossfade15frame bị loại vì tạo bóng kép bán trong suốt và rút vòng10giây xuống9,5giây.
- Hiệu năng laptop phổ thông chưa được chứng minh. Trên máyM3Pro đang dùng, số frame video rơi ghi nhận là19/2429 cho Mochi và28/2428 cho Clover; đây là số đo local có chi phí quan sát.
- Sáu callout thay thế vẫn bị loại. 59artifact audio hiện tại giữ nguyên hash; chưa có duyệt nghe chủ quan hay chứng nhận đồng bộ âm thanh/hình ảnh theo từng frame.

Dung lượng chỉ được báo cáo, không chặn phát hành. Chưa có deploy hosting, giao dịchFuji có tiền, đăng ký media sản xuất hoặc liên hệ người thiết kế.

Chủ dự án có thể dùng [bản nháp xin export](/Users/bao/taskbar-hero-chain/reports/v5/CXI/NEEDS-USER-VI.md:88) khi muốn liên hệ bạn: ưu tiên nền trong suốt, vòng đuôi đã sửa trong Cubism; nếu có sẵn thì cung cấp mask theo Part/ArtMesh nhìn thấy. Nhóm không tự tạo phần đuôi bị che hoặc chấp thuận giấy phép thay chủ dự án.

Bằng chứng: [nhãn và110hành động](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-disposition.json), [ảnh mới doCXI chụp](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-own-visual-review.json), [playback local](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-playback-review.json), [audio giữ nguyên](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-label-r7-audio-review.json), [release xanh](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-m115-publication.json).
