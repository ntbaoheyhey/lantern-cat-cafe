# Bản review desktop — v5-m1.15

Bản nativeR3 đã qua các cổng phát hành, source `b9b6f172824a7daa4ba95836081cade7c472ffb6`, index `fedad6e26829f235b1a6dcda2cfc30aa7d4a90f17df9f8ab7f925352a32d265b`. Tag đã được push nguyên tử và xác minh từ xa: release59f5f3c57,tagobject226cc4425; xem evidence/v8-m115-publication.json. Artifact đầy đủ: `/Users/bao/taskbar-hero-chain/work/v5/CXI/releases/v5-m1.15-dist` (293,767,093 byte). Preview6301 có thể chuyển sang thử nghiệm Mochi/Clover sau khi xuất bản; luôn đối chiếu BOARD.

Mở [game1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3). Đây là preview local; chưa deploy công khai.

- LandingR12 đã được duyệt3ảnh desktop+3chi tiết và fallback gốc; bản này có đúng hash2ad09491f. Bản native giữ9mèo BatchM; Soot ngoài phạm vi,3.833đường dẫn bảo vệ không đổi.
- Mochi/Clover commissioned chưa bật. R5 giữ matte318×390 và300frame/10giây, nhưng nối đuôi Clover vẫn lỗi và hình chữ nhật HP/body của đội hai media chưa đạt. Không dùng các bản thử làm bằng chứng phát hành.
- Bộ test kế thừa từ R4 có5.543đạt+11bỏqua+2expected=5.556. Nguồn ứng dụng/test/package/assets trùng chính xác, chỉ landingAVIF thay đổi; không tuyên bố chạy lại. Bảy bước browser mới đều đạt.
- Đòn đầu21,163giây gồm17,7giây đọc8thẻ; route→receipt9,766giây. Recovery từ chối640ms/stall8.707ms; hai chế độ khôi phụcGPU có RGB trùng tuyệt đối.
- Tải lạnh wave1/wave3/boss7.626.520/8.065.984/7.661.355byte; chỉ báo cáo, không có giới hạn8MB. Âm thanh59artifact/hash không đổi, đường âm thanh3cảnh khớp; chưa nhận6callout thay thế.
- Receipt ghi rõ local/no transaction và dẫn hợp đồngFuji. Chưa có giao dịchFuji thật, triển khaihosting hay nộp bài.

Ba phim gameplay thật1×,1280×720, mỗi phim30giây với âm thanh browser. Fixture seed71/cấp6 qua API review rồi bỏ querydev; không sửa HP/damage/rage/kết quả. Không phải bằng chứng chain; tín hiệu âm thanh đã đo, chưa nghe chủ quan hoặc xác nhận đồng bộ từng frame.

| Cảnh | Phim | Contact sheet | Capture UTC | Peak/mean dBFS |
|---|---|---|---|---|
| wave1 | [Phim](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r3-final/wave1/wave1-30s.mp4) | [Sheet](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r3-final/wave1/contact-1024.jpg) | 2026-11-18T13:05:32.058Z | -2.6/-22.2 |
| wave3 | [Phim](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r3-final/wave3/wave3-30s.mp4) | [Sheet](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r3-final/wave3/contact-1024.jpg) | 2026-11-18T13:06:07.182Z | -1.6/-23.2 |
| boss | [Phim](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r3-final/boss/boss-30s.mp4) | [Sheet](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v8-native-r3-final/boss/contact-1024.jpg) | 2026-11-18T13:06:42.156Z | -2.1/-21.4 |

Sáu ảnh mới đã xem đúng một lần; tám ảnh recovery/context khớp hash đã xem trước nên không mở lại. Bằng chứng: [nativeR3 release](/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-native-r3-release-review.json).
