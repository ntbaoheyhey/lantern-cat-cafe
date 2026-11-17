# Bản review desktop — v5-m1.10
Mở [game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.

Ứng dụng `2ee12c29e9980926b7c75de0111b5c78dbfd24fc`; source quay `1919b4dc1aec216163b8180287db2133edff1d5e` chỉ thêm báo cáo. SHA256 index: `34e015ec12cd08d8edc91a370a5e8ed342fcc254dacf5a6ca4963051b009cfaa`. Tag m1.10 bổ sung tài liệu và bằng chứng, không đổi ứng dụng đã kiểm tra.

## Những gì đã đổi

- Cache đo glyph dùng chung cho màu đục: 171 glyph / 9 RGBA atlas khớp m1.9. Readback 171→38; median dựng atlas ở 4× là 62,4→25,5 ms. Đây là phép đo riêng, không phải FPS.
- Scan contour lấy hai biên mỗi hàng và tận dụng thứ tự có sẵn. 130 bounds/root/GPU thực tế, 910 motion và 130 GPU độc lập khớp. CPU khởi tạo 53,3→47,6 ms thường; 196,5→167,3 ms ở 4×. Frame p95 vẫn 16,8/50 ms; 37 frame >50,5 ms vẫn còn. Chưa cam kết 60 fps.
- Full suite có 5.277 passed, 11 skipped và hai expected failures; tổng 5.290, gồm 2.977 web. Build/typecheck và cả chín bước kiểm tra đạt, gồm so sánh audio m1.9→m1.10 khác nguồn.
- 13 gói / 544 Opus giữ nguyên encoded byte và PCM 48 kHz từng kênh. Bốn kiểu lỗi quay về Opus gốc; không đổi cue, timing, gain, original hoặc AGS manifest.
- Đòn đầu 20,595 giây gồm 17,7 giây đọc tám thẻ; HP 165→119. Route detour→receipt 9,854 giây không tính đọc. Recovery chèn lỗi 636 ms / tải treo 8.677 ms; các nút trong viewport. Không lỗi ở hành trình thường.
- Receipt ghi rõ local/no transaction và liên kết contract items Fuji. Chưa có giao dịch Fuji thật.

## Ba phim đúng build

Gameplay thật 1×, 1280×720, âm thanh browser, mỗi phim 30.000 giây. Fixture seed 71 / cấp 6 qua API review có sẵn; bỏ query dev trước khi quay. Không sinh footage hoặc sửa HP/damage/rage/kết quả. Fixture tách khỏi hành trình guest và bằng chứng chain. Chưa xác minh đồng bộ từng frame hoặc nghe chủ quan.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m110-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m110-final/wave1/contact-1024.jpg) | 2026-11-17T17:42:30.161Z | -2.1 / -22.2 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m110-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m110-final/wave3/contact-1024.jpg) | 2026-11-17T17:43:05.562Z | -1.8 / -23.2 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m110-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m110-final/boss/contact-1024.jpg) | 2026-11-17T17:43:40.978Z | -2.5 / -21.2 |

Cả ba có HP/round tiến triển, không lỗi console/page/HTTP. CXI đo rồi xem mỗi sheet một lần; bốn frame mỗi phim không chứng minh mọi ultimate. Hash phim đã kiểm lại. [Manifest](evidence/v7-m110-films.json). [Kịch bản 327 từ / 180 giây dự kiến](DEMO-SCRIPT-VERIFIED.md) chưa phải voiceover hoặc phim dựng hoàn tất.

## Chưa đạt

- Tải lạnh: wave1=7.669.469 B; wave3=8.228.615 B; boss=7.743.065 B. Wave3 vượt 228.615 B; boss dư 256.935 B. So với m1.9, static response tăng 121 B; biến thiên public reads được tính đầy đủ vào tổng.
- Hiệu năng 4× vẫn có spike; wave3 đông. Các tối ưu chỉ được nhận trong phạm vi bằng chứng.
- Hosting công khai và funded Fuji là owner-only. [Runbook](NEEDS-USER-VI.md) ghim m1.10; chưa có public hash, fee hoặc payer.
- AGS T1/T5/T7/T8 vẫn REDO; không tích hợp audio hoặc lời giới thiệu sai. AGV T9 native AVIF và CXV packed bounds đang chờ review riêng.
