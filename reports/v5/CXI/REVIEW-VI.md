# Bản review desktop — v5-m1.11
Mở [game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.

Ứng dụng `7ed0ce4f06d93251a4f44a7bd2a9884e8b4df37e`; source quay `dd020e520c4beed53910cd10aabc5a8b21ae177e` chỉ thêm tools/báo cáo. SHA256 index: `af3adbe2645ec7e1c2e001abe83db6f789e02474b296485a157fdaf8d572cecf`. Tag bổ sung tài liệu và bằng chứng, không đổi ứng dụng đã kiểm tra; trạng thái remote xem BOARD.

## Những gì đã đổi

- Đọc trực tiếp các bộ ba Float32/Float64 thông thường khi tính bounds; giữ đúng thứ tự tính và fallback getter cho định dạng khác. 65 bounds độc lập, 130 production bounds/root/GPU, 910 motion và 130 GPU riêng đều khớp.
- 45 block xen kẽ ở CPU 4× cho mỗi fixture: tỉ lệ median candidate/baseline 0,715 wave3 và 0,689 boss; median block 17,1→12,3 / 19,4→14,0 ms. Đây là chi phí tính bounds riêng, chưa chứng minh FPS tăng.
- Full suite có 5.317 passed, 11 skipped và hai expected failures; tổng 5.330, gồm 3.017 web. Build/typecheck và cả chín bước kiểm tra đạt.
- 13 gói / 544 Opus giữ nguyên encoded byte và PCM 48 kHz từng kênh. Paths 485/487/484 khớp m1.10. Bốn kiểu lỗi quay về Opus gốc; không đổi cue, timing, gain, original hoặc AGS manifest.
- Đòn đầu 20,828 giây gồm 17,7 giây đọc tám thẻ; HP 165→119. Route detour→receipt 9,817 giây không tính đọc. Recovery chèn lỗi 634 ms / tải treo 8.712 ms; các nút trong viewport. Không lỗi ở hành trình thường.
- Receipt ghi rõ local/no transaction và liên kết contract items Fuji. Chưa có giao dịch Fuji thật.

## Ba phim đúng build

Gameplay thật 1×, 1280×720, âm thanh browser, mỗi phim 30.000 giây. Fixture seed 71 / cấp 6 qua API review có sẵn; bỏ query dev trước khi quay. Không sinh footage hoặc sửa HP/damage/rage/kết quả. Fixture tách khỏi hành trình guest và bằng chứng chain. Chưa xác minh đồng bộ từng frame hoặc nghe chủ quan.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m111-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m111-final/wave1/contact-1024.jpg) | 2026-11-18T02:39:24.698Z | -2.0 / -22.2 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m111-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m111-final/wave3/contact-1024.jpg) | 2026-11-18T02:39:59.423Z | -2.0 / -23.2 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m111-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m111-final/boss/contact-1024.jpg) | 2026-11-18T02:40:34.116Z | -2.3 / -21.3 |

Cả ba có HP/round tiến triển, không lỗi console/page/HTTP. CXI đo rồi xem mỗi sheet một lần; bốn frame mỗi phim không chứng minh mọi ultimate. Hash phim đã kiểm lại. [Manifest](evidence/v7-m111-films.json). [Kịch bản 327 từ / 180 giây dự kiến](DEMO-SCRIPT-VERIFIED.md) chưa phải voiceover hoặc phim dựng hoàn tất.

## Chưa đạt

- Tải lạnh: wave1=7.667.563 B; wave3=8.228.802 B; boss=7.744.933 B. Wave3 vượt 228.802 B; boss dư 255.067 B. So với m1.10, static response tăng 198 B; biến thiên public reads được tính đầy đủ vào tổng.
- CPU median thường/4× 4,1→4,0 / 19,5→18,6 ms; frame p95 giữ 16,8/50 ms. Startup max xấu đi 47,6→50,4 / 167,3→173,4 ms; long frames 4× 37→38; max interval 200,1→216,7 ms. Không cam kết 60 fps.
- Hosting công khai và funded Fuji là owner-only. [Runbook](NEEDS-USER-VI.md) ghim m1.11; chưa có public hash, fee hoặc payer.
- AGS T1/T2/T3/T5/T7/T8 vẫn mở; audio bị từ chối chưa được tích hợp. AGV T9 chưa có bốn sibling đúng yêu cầu. CXV DPR đang chờ review riêng.
