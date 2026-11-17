# Bản review desktop — v5-m1.5
Mở [bản game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trong trình duyệt desktop. Preview production đang phục vụ ở cổng6301 trên máy này. Không dùng đường dẫn host trống vì có thể vào giao diện cũ. Đây là preview local, chưa phải deploy công khai.

Mốc xanh v5-m1.5 =6b972c4092b705c6ac27ef4d8ba37c3a9da23a74; ứng dụng đã kiểm tra ở a2cbb3fb4c4062847f8531524934b3b9330b1283. Commit công cụ quay =0d20a53c9; mã game và build không đổi. SHA256 index.html:34c538f01d820b4cb3aa793bbe969db954d8881850155ff6de4c7b0a10a281e6.

## Những gì đã đổi
- Sửa luồng Night route và tách trận luyện tập khỏi tiến trình; receipt có nút quay về khâu chuẩn bị.
- Đòn đầu tiên thấy máu địch giảm sau20,849ms, đã tính17,700ms đọc đủ8 thẻ hướng dẫn/59 từ. Practice Cushion165→119HP; không bỏ hướng dẫn, không chỉnh tốc độ, không dùng save sẵn.66–70giây trước đây đo đến receipt cuối patrol, không phải đòn đầu.
- Receipt ghi rõ “Avalanche Fuji testnet / Local battle · no transaction sent” và có liên kết hợp đồng đã deploy. Chưa có giao dịch Fuji thật trong bằng chứng này.
- Boss hạ xuống240ms, ổn định đến620ms; Binding net gọn hơn quanh mục tiêu và xóa sau1640ms. Loader giữ nguyên ảnh gốc; bỏ inline ảnh catalog tiết kiệm161,522–161,528byte.
- Typecheck/build đều0;5,224test pass, gồm2,924web;11skip và2expected failure.

## Ba phim review
Các phim dưới đây là gameplay thật chạy1× tại1280×720, có âm thanh thực từ browser, mỗi phim30.000giây. Đây là fixture seed71/cấp6 qua API review có sẵn; query dev được bỏ trước lúc quay và captureURL đúng link judge phía trên. Không phải hành trình guest bình thường, không phải bằng chứng giao dịch công khai. Không tạo frame hoặc nhạc bằng AI. Việc căn audio/video dùng mốc thời gian thực gần đúng, chưa kiểm chứng đồng bộ từng frame.

| Cảnh | MP4 | Contact sheet | Thời điểm UTC | Peak / mean dBFS |
|---|---|---|---|---|
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m15-review/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m15-review/wave1/contact-1024.jpg) | 2026-11-17T14:25:46.345Z | -2.4 / -22.2 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m15-review/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m15-review/wave3/contact-1024.jpg) | 2026-11-17T14:26:21.904Z | -2.5 / -23.2 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m15-review/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m15-review/boss/contact-1024.jpg) | 2026-11-17T14:26:57.472Z | -2.1 / -21.4 |

Cả3phim: video1280×720+audio, HP/round thay đổi thật,0lỗi console/page/HTTP; peak đều dưới0dBFS. Kiểm tra âm thanh mới chứng minh có tín hiệu và không clipping, chưa thay cho nghe đánh giá chủ quan. CXI đã xem mỗi sheet một lần: nhân vật/HP/HUD có mặt, có đòn và hồi máu; bố cục wave3 vẫn chật ở cụm địch phía dưới. Manifest nhỏ với hash MP4 và trạng thái: [v7-m15-films.json](evidence/v7-m15-films.json).

## Các điểm chưa đạt
- Cold load wave1=8,583,793B;wave3=9,144,973B;boss=8,659,415B: cả3vượt mục tiêu8,000,000B. Đang chờ12texture AVIF đã duyệt và4bed audio đúng manifest; chưa tính trước khoản tiết kiệm.
- Cụm địch wave3 sát HUD, một số hiệu ứng có thể che hình. Yarn ultimate fan vẫn còn nợ thị giác ở m1.5; contact sheet phim không bao phủ mọi khoảnh khắc ultimate.
- Không có transaction hash/fee/payer thật trên Fuji để chấm phần proof công khai. Chủ repo thực hiện các bước đã chuẩn bị trong [NEEDS-USER-VI.md](NEEDS-USER-VI.md), gồm deploy hosting và giao dịch có quỹ; CXI chưa thực hiện các thao tác đó.
- AGS báo một đường Night route khác nhưng chưa giao đủ click/URL/hash/capture để tái hiện; chưa xác nhận đó là lỗi bản hiện tại.

Mở từng MP4 trên máy này để review chuyển động và nghe âm thanh đầy đủ. File lớn nằm trong work/v5/CXI/films/v7-m15-review/ và được bỏ qua bởi git.
