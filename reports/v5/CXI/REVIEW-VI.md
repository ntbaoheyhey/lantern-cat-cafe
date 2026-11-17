# Bản review desktop — v5-m1.7
Mở [game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trên máy này, giữ đầy đủ query string. Đây là preview production local, chưa deploy công khai.

Ứng dụng build `0a3c6ab1a`; source lúc quay `be701d072d3e5d8457360a7bf79639277230b354` chỉ thêm báo cáo. SHA256 index: `2fc8f62365123da073fa54eab0683387a3de421788da0ba6e12fa39ea5c837fd`. Tag m1.7 bổ sung bằng chứng, không thay source ứng dụng.

## Những gì đã đổi

- 12 hiệu ứng AVIF tổng337.103 B và bốn ảnh nhỏ106.267 B đã được kiểm tra. Giữ ảnh gốc, alpha và đường fallback; nơi cần ảnh lớn vẫn dùng ảnh lớn.
- Đã sửa đường nối khi Mochi chớp mắt.20 pose GPU giữ nguyên pixel lúc mở và alpha. CloverK5 có62→0 pixel iris khi nhắm kín; nhận xét ban đầu nghi còn mở là đọc sheet nhầm, không cần sửa thêm.
- Vị trí hàng trước phía dưới được nâng21,6 px.26 mẫu không còn pixel nhân vật hoặc viền trong vùng portrait. Wave3 vẫn đông; chưa khẳng định mọi khoảnh khắc đều thoáng.
- Tải màn hình lỗi/chậm giữ café và header, có **Reload page** và **Back to café** trong viewport. Thử chèn lỗi:637 ms; tải treo:8.696 ms. Chưa xác định trace gốc của báo cáo AGS.
- Đòn đầu sau **20,882 giây**, gồm17,7 giây đọc đủ tám thẻ; HP165→119, không có lỗi thông thường. Route detour→receipt mất9,684 giây khi không tính đọc.
- Full suite5.250 test pass, gồm2.950 web;11 skip,2 expected failure; typecheck0 trên69e68a660. Sau đó chỉ đổi ba giá trị vị trí:18 test liên quan và build đều pass. Bốn kiểm tra cuối và ba phim mới đều đạt.
- Receipt ghi rõ Fuji/local/no transaction và liên kết hợp đồng items. Chưa có giao dịch Fuji thật trong bằng chứng.

## Ba phim đúng build

Gameplay thật1× tại1280×720, âm thanh từ browser, mỗi phim30.000 giây. Fixture seed71/cấp6 dùng API review có sẵn; query dev được bỏ trước khi quay. Không sinh footage hoặc sửa HP, damage, rage, kết quả. Fixture tách khỏi hành trình guest và chứng cứ chain. A/V căn theo đồng hồ gần đúng, chưa xác minh từng frame; kiểm tra tín hiệu chưa thay cho nghe chủ quan.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
|---|---|---|---|---|
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m17-final/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m17-final/wave1/contact-1024.jpg) | 2026-11-17T16:11:44.913Z | -2.2 / -22.3 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m17-final/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m17-final/wave3/contact-1024.jpg) | 2026-11-17T16:12:20.768Z | -2.1 / -23.1 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m17-final/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m17-final/boss/contact-1024.jpg) | 2026-11-17T16:12:56.699Z | -1.8 / -21.5 |

Cả ba có HP/round tiến triển, không có lỗi console/page/HTTP. CXI đo rồi xem mỗi sheet một lần. Bốn frame mỗi phim không chứng minh mọi ultimate. [Manifest và hash MP4](evidence/v7-m17-films.json).

## Chưa đạt

- Tải lạnh:wave1=7.909.547 B;wave3=8.469.958 B;boss=7.984.401 B. Wave3 còn vượt469.958 B;boss chỉ dư15.599 B so với8 MB. Không tuyên bố tất cả dưới8 MB.
- Benchmark hiệu năng chỉ đúng phạm vi đo. Chuyển pose khi CPU bị giảm tốc4× vẫn cần tối ưu; không cam kết60 fps hoặc máy yếu thật.
- Hosting công khai và giao dịch Fuji có quỹ là owner-only. [NEEDS-USER-VI.md](NEEDS-USER-VI.md) ghim tag mới. Chưa có public hash, fee hoặc payer.

Phim lớn ởwork/v5/CXI/films/v7-m17-final/, được git bỏ qua. Các phim cũ được giữ riêng.
