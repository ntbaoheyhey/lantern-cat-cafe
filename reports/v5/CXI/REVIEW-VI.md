# Bản review desktop — v5-m1.13
Mở [game1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.
Ứng dụng `13fb390e9b4007f985577a2e0320f81b464aa11b`; source quay `6fe2a0340483960d112cf06655277c0b0e3a4270` chỉ thêm báo cáo. SHA256 index `1b43effd51f9dc3970af2264468c7549b5c1e900fbd72e5749396940cac9b726`. Tag chỉ bổ sung tài liệu/bằng chứng; xác minh publication ở BOARD.

## Thay đổi và kiểm tra

- Sửa battle đang pause không vẽ lại sau khi GPU context phục hồi. Thông báo mất context chỉ xóa sau một draw thành công; lỗi tài nguyên vẫn giữ. Hai chế độ motion đều đạt năm lần loss/bốn lần restore, kể cả mất lại ngay trong draw, đổi DPR2/chiều rộng và unmount. RGB sau phục hồi khớp hoàn toàn ảnh trước loss; luật/trạng thái pause giữ nguyên.
- 44 test tập trung, build/typecheck và bảy bước pipeline cuối đạt. Full suite: 5.361 passed, 11 skipped, hai expected failures; tổng 5.374, gồm 3.061 web.
- Đòn đầu 20,448 giây gồm17,7 giây đọc tám thẻ; HP 165→119. Route detour→receipt 10,037 giây không tính đọc. Recovery chèn lỗi 635/8.677 ms. Không lỗi trong hành trình thường.
- Audio không đổi từm1.12:13 gói/544Opus giữ encoded byte và PCM48kHz; paths browser m1.12→m1.13 khớp. Không tích hợp audio AGS bị từ chối. DPR/victory fallback và packed bounds đã nhận trước đó vẫn giữ; chưa kết luận FPS tăng.
- Receipt ghi rõ local/no transaction và có link contractFuji; chưa có giao dịchFuji thật.

## Ba phim đúng build

Gameplay thật1×,1280×720, âm thanh browser, mỗi phim30.000giây. Fixture seed71/cấp6 qua API review có sẵn; querydev bỏ trước khi quay. Không sinh footage hoặc sửa HP/damage/rage/kết quả. Fixture tách khỏi hành trình guest và bằng chứngchain.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
| --- | --- | --- | --- | --- |
| wave1 | [30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m113-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m113-final/wave1/contact-1024.jpg) | 2026-11-18T03:41:48.137Z | -2.1 / -22.3 |
| wave3 | [30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m113-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m113-final/wave3/contact-1024.jpg) | 2026-11-18T03:42:24.056Z | -2.1 / -23 |
| boss | [30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m113-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m113-final/boss/contact-1024.jpg) | 2026-11-18T03:42:59.043Z | -2.3 / -21.4 |

Ba phim có HP/round tiến triển và không lỗi console/page/HTTP; hash, stream và duration đã kiểm lại. Tám ảnh đo: 6 xem một lần, 2 cùng hash ảnh đã review nên không mở lại. [Manifest](evidence/v7-m113-films.json). Chưa xác minh nghe chủ quan hoặc sync từng frame. [Kịch bản327từ/180giây dự kiến](DEMO-SCRIPT-VERIFIED.md) chưa phải voiceover/phim dựng hoàn tất.

## Còn mở

- Tải lạnh wave1/wave3/boss: 7.667.824/8.230.950/7.743.499 B. Wave3 vượt 230.950 B; boss dư 256.501 B. Public reads vẫn tính đầy đủ.
- Bằng chứng packed m1.11 chỉ xác nhận chi phí bounds riêng giảm; ordinary timing lẫn lộn và stress/startup còn mở. Không cam kết60fps.
- Toast unlock chạm viền dưới Next; HP boss che một phần thông báo khi chèn GPU loss. Đây là lỗi layout riêng còn theo dõi.
- AGS T1/T2/T3/T5/T7/T8 còn mở; ba thứ hạng giải thưởng và sửa stereo/hash nguồn chỉ được nhận một phần. Bốn halfAVIF của AGV chưa có. Không nhận số benchmark chưa có nguồn.
- Hosting/fundedFuji là owner-only. [Runbook](NEEDS-USER-VI.md) ghim m1.13; chưa có public hash/fee/payer. Green không đồng nghĩa đạt budget hay publicchain.
