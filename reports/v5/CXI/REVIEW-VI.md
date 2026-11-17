# Bản review desktop — v5-m1.9
Mở [game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.

Ứng dụng `4ae1c9580f91b816f6860a79420faa4edab59a99`; source quay `32814db72df8ae8821367831c91b19e2dd5d80f5` chỉ thêm báo cáo. SHA256 index: `a7a8c615c0998065c2406a1eecc4c1612aaf868d14757ac7e4f3d10736c9e3b9`. Tag m1.9 bổ sung bằng chứng và tài liệu, không đổi source ứng dụng đã kiểm tra.

## Những gì đã đổi

- Thêm bốn gói giọng nhân vật, nâng tổng lên 13 gói/544 file Opus giữ nguyên. Đã đối chiếu SHA256 encoded và từng kênh PCM trong Chromium; không thay cue, timing, gain hoặc file gốc. Lỗi HTTP, integrity, decode và tải treo đều quay về Opus gốc.
- So với m1.8, tổng tải lạnh giảm 29.510/31.801/31.485 B cho wave1/wave3/boss. Đây là chênh lệch toàn build, gồm cả thay đổi renderer; không gán toàn bộ cho gói voice. Wave3 vẫn vượt 228.520 B.
- Nhận cache trọng số artwork và hoãn tính vertex native bị ẩn; mỗi bước có 910 mẫu motion và 130 ảnh GPU khớp hoàn toàn. Với bước native, CPU median thường 4,9→4,3 ms; khi throttle 4× là 24,6→20,1 ms, frame p95 66,7→50,1 ms. Số hành động ở cặp 4× khác nhau, chưa cam kết 60 fps hoặc máy yếu thật.
- Kiểm tra 26 mẫu portrait native: không có pixel nhân vật/viền trong portrait. Blink đã nhận giữ nguyên; wave3 vẫn đông.
- Đòn đầu 21,078 giây gồm 17,7 giây đọc đủ tám thẻ; HP 165→119, không lỗi thường. Route detour→receipt 10,503 giây khi không tính đọc. Recovery chèn lỗi 714 ms/tải treo 8.664 ms; hai nút nằm trong viewport.
- Full suite thành công: 5.269 passed, 11 skipped, hai expected failures; tổng 5.282 test, gồm 2.969 web. Suite đã bao gồm spatial/native/voice. Build/typecheck và chín bước pipeline đạt; phép so sánh audio tự đối chiếu bị loại và thay bằng m1.8→m1.9 độc lập.
- Receipt ghi rõ Fuji/local/no transaction và liên kết contract items. Chưa có giao dịch Fuji thật.

## Ba phim đúng build

Gameplay thật 1×, 1280×720, âm thanh từ browser, mỗi phim 30.000 giây. Fixture seed71/cấp6 dùng API review có sẵn; bỏ query dev trước khi quay. Không sinh footage hoặc sửa HP/damage/rage/kết quả. Fixture tách khỏi hành trình guest và bằng chứng chain. Chưa xác minh đồng bộ từng frame hoặc nghe chủ quan.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m19-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m19-final/wave1/contact-1024.jpg) | 2026-11-17T17:09:31.717Z | -2 / -22.2 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m19-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m19-final/wave3/contact-1024.jpg) | 2026-11-17T17:10:08.593Z | -2.4 / -23.2 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m19-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m19-final/boss/contact-1024.jpg) | 2026-11-17T17:10:44.475Z | -2 / -21.3 |

Cả ba có HP/round tiến triển, không lỗi console/page/HTTP. CXI đo rồi xem mỗi sheet một lần; bốn frame mỗi phim không chứng minh mọi ultimate. Hash phim đã kiểm lại. [Manifest và hash](evidence/v7-m19-films.json).

## Chưa đạt

- Tải lạnh: wave1=7.667.250 B; wave3=8.228.520 B; boss=7.742.967 B. Wave3 còn vượt 228.520 B; boss dư 257.033 B.
- Hiệu năng 4× vẫn có spike. Spatial/native được chấp nhận trong phạm vi số đo; không cam kết 60 fps.
- Hosting công khai và funded Fuji là owner-only. [Runbook](NEEDS-USER-VI.md) ghim tag m1.9; chưa có public hash, fee hoặc payer.

Phim lớn ở work/v5/CXI/films/v7-m19-final/ được git bỏ qua; phim cũ vẫn giữ riêng.
