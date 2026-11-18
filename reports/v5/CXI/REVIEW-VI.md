# Bản review desktop — v5-m1.12
Mở [game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.

Ứng dụng `8b8d0b8cad8fcc0feba3110e18de099d89df9e14`; source quay `6cd895e5871e7e79f03623c836fc069e6f977134` chỉ thêm tools/báo cáo. SHA256 index: `ce3d3585df78137adfe8fc34420a1cf2b4be2a2121a9bc74aedcaa077a66be73`. Tag bổ sung tài liệu và bằng chứng, không đổi ứng dụng đã kiểm tra; trạng thái remote xem BOARD.

## Những gì đã đổi

- DPR desktop cập nhật đúng buffer của battle/composer/victory; CSS geometry giữ nguyên. Victory hiện bốn ảnh mèo gốc khi GPU context mất, rồi chỉ hiện canvas sau khi render phục hồi thành công. 35 test tập trung, native probe hai chế độ và full suite đạt; reduced idle không vẽ thêm.
- Các số đo packed dưới đây là bằng chứng riêng từ m1.11; không phải benchmark tổng thể mới của m1.12.

- Đọc trực tiếp các bộ ba Float32/Float64 thông thường khi tính bounds; giữ đúng thứ tự tính và fallback getter cho định dạng khác. 65 bounds độc lập, 130 production bounds/root/GPU, 910 motion và 130 GPU riêng đều khớp.
- 45 block xen kẽ ở CPU 4× cho mỗi fixture: tỉ lệ median candidate/baseline 0,715 wave3 và 0,689 boss; median block 17,1→12,3 / 19,4→14,0 ms. Đây là chi phí tính bounds riêng, chưa chứng minh FPS tăng.
- Full suite có 5.352 passed, 11 skipped và hai expected failures; tổng 5.365, gồm 3.052 web. Build/typecheck và tám bước kiểm tra cuối và build trước đó trên cùng source đạt.
- 13 gói / 544 Opus giữ nguyên encoded byte và PCM 48 kHz từng kênh. Paths 485/487/484 khớp m1.11. Bốn kiểu lỗi quay về Opus gốc; không đổi cue, timing, gain, original hoặc AGS manifest.
- Đòn đầu 21,167 giây gồm 17,7 giây đọc tám thẻ; HP 165→119. Route detour→receipt 9,747 giây không tính đọc. Recovery chèn lỗi 1.138 ms / tải treo 8.676 ms; các nút trong viewport. Không lỗi ở hành trình thường.
- Receipt ghi rõ local/no transaction và liên kết contract items Fuji. Chưa có giao dịch Fuji thật.

## Ba phim đúng build

Gameplay thật 1×, 1280×720, âm thanh browser, mỗi phim 30.000 giây. Fixture seed 71 / cấp 6 qua API review có sẵn; bỏ query dev trước khi quay. Không sinh footage hoặc sửa HP/damage/rage/kết quả. Fixture tách khỏi hành trình guest và bằng chứng chain. Chưa xác minh đồng bộ từng frame hoặc nghe chủ quan.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m112-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m112-final/wave1/contact-1024.jpg) | 2026-11-18T03:14:17.378Z | -2.3 / -22 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m112-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m112-final/wave3/contact-1024.jpg) | 2026-11-18T03:14:52.892Z | -2.1 / -23.2 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m112-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m112-final/boss/contact-1024.jpg) | 2026-11-18T03:15:28.089Z | -1.8 / -21.3 |

Cả ba có HP/round tiến triển, không lỗi console/page/HTTP. CXI đo rồi xem mỗi sheet một lần; bốn frame mỗi phim không chứng minh mọi ultimate. Hash phim đã kiểm lại. [Manifest](evidence/v7-m112-films.json). [Kịch bản 327 từ / 180 giây dự kiến](DEMO-SCRIPT-VERIFIED.md) chưa phải voiceover hoặc phim dựng hoàn tất.

## Chưa đạt

- Tải lạnh: wave1=7.667.601 B; wave3=8.228.854 B; boss=7.745.296 B. Wave3 vượt 228.854 B; boss dư 254.704 B. Xem delta static/public trong bằng chứng; biến thiên public reads được tính đầy đủ vào tổng.
- CPU median thường/4× 4,1→4,0 / 19,5→18,6 ms; frame p95 giữ 16,8/50 ms. Startup max xấu đi 47,6→50,4 / 167,3→173,4 ms; long frames 4× 37→38; max interval 200,1→216,7 ms. Không cam kết 60 fps.
- Hosting công khai và funded Fuji là owner-only. [Runbook](NEEDS-USER-VI.md) ghim m1.12; chưa có public hash, fee hoặc payer.
- AGS T1/T2/T3/T5/T7/T8 vẫn mở; audio bị từ chối chưa được tích hợp; e33 sửa stereo đang chờ native/listening review. AGV T9 chưa có bốn sibling đúng yêu cầu. DPR và victory context-loss đã qua review độc lập; paused-battle context-loss còn mở.
