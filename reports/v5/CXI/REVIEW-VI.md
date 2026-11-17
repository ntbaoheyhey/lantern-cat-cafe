# Bản review desktop — v5-m1.8
Mở [game1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.

Ứng dụng `73bcdbed424815382c6cb8a9bcc5a4f32447ce6d`; source quay `f9d0171353e5b19ba141d318477a33c0d6bd81b0` chỉ thêm báo cáo. SHA256 index: `c7ad050fa1980e41721812f0d35e72d9f4e1731594bf11bb7d991beea6cfa6c8`. Tag m1.8 bổ sung bằng chứng, không đổi source ứng dụng.

## Những gì đã đổi

- Chín gói audio giữ nguyên500 file Opus. Đã đối chiếu SHA256 encoded và từng kênh PCM trong Chromium; không thay cue, timing, gain hoặc file gốc. Lỗi gói, integrity, decode và tải treo đều quay về file gốc.
- Giảm khoảng210KB tải lạnh mỗi fixture. Wave3 vẫn vượt260.321B; không tuyên bố tất cả dưới8MB.
- Bỏ cấp phát mảng/callback cho từng pixel khi đo contour: startup CPU70,9→52,9ms bình thường và297→183,3ms khi throttle4×. P95frame4× vẫn50ms.
- Kiểm tra lại26 mẫu portrait: không có pixel nhân vật/viền trong vùng portrait. Blink đã nhận ởm1.7 giữ nguyên. Wave3 vẫn đông.
- Đòn đầu21,131giây gồm17,7giây đọc đủ8thẻ; HP165→119,0lỗi thường. Route detour→receipt9,558giây khi không tính đọc. Recovery chèn lỗi1.139ms/tải treo8.702ms, hai nút nằm trong viewport.
- Full suite5.261 test pass, gồm2.961web, trên ddf02f9d2;11skip/2expected failures. Sau đó scalar có14test liên quan và build/typecheck đạt. Năm bước kiểm tra cuối, gồm3phim, đạt.
- Receipt ghi rõ Fuji/local/no transaction và liên kết contract items. Chưa có giao dịchFuji thật.

## Ba phim đúng build

Gameplay thật1×,1280×720,âm thanh từ browser,mỗi phim30.000giây. Fixture seed71/cấp6 dùng API review có sẵn; bỏ query dev trước khi quay. Không sinh footage hoặc sửa HP/damage/rage/kết quả. Fixture tách khỏi hành trình guest và bằng chứng chain. Chưa xác minh đồng bộ từng frame hoặc nghe chủ quan.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [wave1 ·30giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m18-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m18-final/wave1/contact-1024.jpg) | 2026-11-17T16:42:19.470Z | -2.3 / -22.1 |
| wave3 | [wave3 ·30giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m18-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m18-final/wave3/contact-1024.jpg) | 2026-11-17T16:42:55.041Z | -2.3 / -23.3 |
| boss | [boss ·30giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m18-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m18-final/boss/contact-1024.jpg) | 2026-11-17T16:43:31.571Z | -2.2 / -21.4 |

Cả ba có HP/round tiến triển,0lỗi console/page/HTTP. CXI đo rồi xem mỗi sheet một lần; bốn frame mỗi phim không chứng minh mọi ultimate. [Manifest và hash](evidence/v7-m18-films.json).

## Chưa đạt

- Tải lạnh:wave1=7.696.760B;wave3=8.260.321B;boss=7.774.452B. Wave3 còn vượt260.321B;boss dư225.548B.
- Hiệu năng4× vẫn có spike; không cam kết60fps hoặc máy yếu thật. Spatial0d0e59494 chưa được tích hợp.
- Hosting công khai và fundedFuji là owner-only. [Runbook](NEEDS-USER-VI.md) ghim tagm1.8; chưa có public hash,fee hoặc payer.

Phim lớn ởwork/v5/CXI/films/v7-m18-final/ được git bỏ qua; phim cũ vẫn giữ riêng.
