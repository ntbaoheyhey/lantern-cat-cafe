# Bản review desktop — v5-m1.14

Mở [game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview local; chưa deploy công khai. Xác minh tag đã push ở BOARD trước khi dùng runbook.

Ứng dụng và phim cùng source `c4108923c25a9c982b0831318e16a93cc991f8e7`; index SHA256 `fe8bdd0096a5dba4817b7c559b0a238c700fd37a453ee93f7e8b1e6e5f577c6e`. Artifact đầy đủ: `work/v5/CXI/releases/v5-m1.14-dist` (293.731.858 byte). Tag thêm tài liệu, không đổi ứng dụng đã quay.

## Thay đổi đã kiểm tra

- Chín mèo native có idle/cast theo Batch M: Panko, Mallow, Sorrel, Biscuit, Inkcap, Cinnamon, Brioche, Velvet, Marigold. 3.833 đường dẫn được bảo vệ không đổi; Soot ngoài phạm vi. Media được đặt hàng cho Mochi/Clover vẫn chưa bật, vì kiểm tra mép ảnh/halo/vòng đuôi còn mở.
- Giữ bản sửa toast/Next, thông báo mất context, bốn halfAVIF đã nhận và atlas preload có điều kiện. Chia sẻ các cây JSON rig trùng nhau, phục hồi đầy đủ từng trường; không bỏ geometry hoặc làm tròn số. 24 test tập trung, TypeScript, build và 18 ca HTTP/SRI/stall ở Chromium/WebKit đạt.
- Toàn bộ 5.539 test đạt, 11 bỏ qua, 2 expected failures: tổng 5.552, gồm 3.239 web. Bảy bước browser cuối đạt. Đòn đầu 20,880 giây gồm 17,7 giây đọc tám thẻ, HP165→119; route→receipt9,740 giây. Recovery chèn lỗi632/8.684ms. Hai chế độ khôi phục GPU có RGB khớp tuyệt đối và giữ luật/trạng thái.
- Tải lạnh wave1/wave3/boss: 7.591.445 / 8.030.924 / 7.624.476 byte, tính cả public reads. Owner bỏ giới hạn8MB lúc12:09Z: các số này chỉ báo cáo. Giảm thực đo so với nativeR1 là8.449/8.292/5.397byte; không dùng ước lượng84KB làm kết quả.
- Âm thanh đang dùng không đổi:49 artifact/10 nguồn gốc rehash đúng, đường audio ba cảnh khớp. Sáu bộ thay thế AGS chưa được nhận vì timing/gain/provenance/listening còn mở. Receipt ghi đúng local/no transaction và có link contractFuji.

## Ba phim đúng build

Gameplay thật1×,1280×720, âm thanh browser; mỗi phim30.000giây. Fixture seed71/cấp6 qua API review, bỏ querydev trước khi quay. Không sửa HP/damage/rage/kết quả; đây không phải bằng chứng giao dịchFuji.

| Cảnh | Phim | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r2-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r2-final/wave1/contact-1024.jpg) | 2026-11-18T12:15:36.600Z | -2.4 / -22 |
| wave3 | [30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r2-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r2-final/wave3/contact-1024.jpg) | 2026-11-18T12:16:11.882Z | -2.2 / -23.2 |
| boss | [30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r2-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r2-final/boss/contact-1024.jpg) | 2026-11-18T12:16:47.076Z | -2.3 / -21.3 |

Ba phim có HP/round tiến triển và không lỗi console/page/HTTP.14ảnh đo;9ảnh mới xem một lần,3ảnh dùng lại hash đã review,2ảnh phục hồi trùng hệt ảnh tải ban đầu. Chưa xác minh nghe chủ quan hoặc sync từng frame. [Bằng chứng tổng hợp](evidence/v8-native-atlas-r2-release-review.json).

## Còn mở

Mochi/Clover cần mốc mặt/tay mới, chất lượng matte/halo và nối vòng Clover; hai video chưa nằm trong release. R12 của AGV không còn bị chặn vì dung lượng, nhưng chưa có review chất lượng nên chưa thay hình. Kết quả timing ở Apple M3 Pro là mô tả máy local, không cam kết60fps hoặc hiệu năng mọi laptop. Hosting, giao dịch Fuji có tiền và submission vẫn do owner thực hiện; [runbook](NEEDS-USER-VI.md) không xác nhận public transaction đã tồn tại.
