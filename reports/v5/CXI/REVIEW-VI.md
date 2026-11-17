# Bản review desktop — v5-m1.6
Mở [bản game 1280×720](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) trong trình duyệt desktop trên máy này. Dùng đủ query string. Đây là preview production local, chưa phải deploy công khai.

Tag phát hành: v5-m1.6; mã ứng dụng được kiểm tra và quay: 6bb96c69d4fd031c5e7a4e5ffe7be26f6d3929eb. Tag gồm thêm báo cáo. SHA256 index.html: ef21e23aa191d7b670782e9e53f0c198c679eb9e11971a1d023e1dfadcaf048f.

## Những gì đã đổi

- Nếu tải màn hình thất bại, café/header vẫn hiện cùng **Reload page** và **Back to café**. Nếu tải quá 8 giây, phần hồi phục gọn thay hình minh họa lớn; cả hai nút nằm trong viewport, không cần cuộn. Không tự reload.
- Thử cố ý chặn file JavaScript: màn hình hồi phục xuất hiện sau 1,138 giây; giữ request chưa trả về: 8,666 giây. Hai đường đều quay lại café; reload khôi phục Route. Đây là thử nghiệm có chèn lỗi, chưa xác định nguyên nhân lần AGS bị kẹt.
- Đòn đầu giảm HP165→119 sau **20,501 giây**, gồm 17,7 giây đọc đủ 8 thẻ/59 từ. Không save sẵn, bỏ hướng dẫn hoặc đổi tốc độ. Route detour→receipt mất 9,864 giây khi không tính thời gian đọc.
- Receipt ghi rõ “Avalanche Fuji testnet / Local battle · no transaction sent” và liên kết hợp đồng items đã deploy. Chưa có giao dịch Fuji thật trong bằng chứng này.
- Typecheck/build thành công; **5.227 test pass**, gồm 2.927 web; 11 skip và 2 expected failure. Các hành trình thông thường không có lỗi console/page/HTTP.

## Ba phim review của đúng build

Gameplay thật chạy 1× tại1280×720, âm thanh thực từ browser, mỗi phim30.000 giây. Fixture seed71/cấp6 dùng API review có sẵn; bỏ query dev trước lúc quay. Đây là fixture review, tách khỏi hành trình guest và bằng chứng giao dịch. Không tạo footage/nhạc bằng AI. Audio/video căn theo đồng hồ thực gần đúng, chưa kiểm chứng đồng bộ từng frame.

| Cảnh | MP4 | Contact sheet | Capture UTC | Peak / mean dBFS |
|---|---|---|---|---|
| wave1 | [wave1 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m16b-review/wave1/wave1-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m16b-review/wave1/contact-1024.jpg) | 2026-11-17T14:58:23.373Z | -2.5 / -22.2 |
| wave3 | [wave3 · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m16b-review/wave3/wave3-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m16b-review/wave3/contact-1024.jpg) | 2026-11-17T14:59:00.803Z | -2.2 / -23.3 |
| boss | [boss · 30 giây](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m16b-review/boss/boss-30s.mp4) | [1024×576](/Users/bao/taskbar-hero-chain/work/v5/CXI/films/v7-m16b-review/boss/contact-1024.jpg) | 2026-11-17T14:59:36.723Z | -2.2 / -21.4 |

Cả ba phim có HP/round thay đổi thật, video+audio, 0 lỗi console/page/HTTP và peak dưới0dBFS. Phân tích tín hiệu chưa thay cho đánh giá nghe chủ quan. CXI đo rồi xem mỗi sheet đúng một lần: nhân vật, HP, đòn đánh và hồi máu hiện đủ; cụm địch wave3 vẫn chật gần HUD. Bốn frame mẫu mỗi phim không chứng minh mọi khoảnh khắc ultimate. [Manifest và hash MP4](evidence/v7-m16b-films.json).

## Các điểm chưa đạt

- Tải lạnh wave1=8.584.126B; wave3=9.145.394B; boss=8.659.811B: cả ba còn vượt8.000.000B. Audio/AVIF chưa được chấp nhận không được tính trước vào tiết kiệm.
- Wave3 còn chật ở phía dưới; Yarn ultimate fan vẫn có nợ thị giác từ bản trước. V-A3 của CXV mới READY, chưa có trong m1.6.
- Public hosting và hash/fee/payer của giao dịch Fuji thật chưa được xác minh. Owner làm theo [NEEDS-USER-VI.md](NEEDS-USER-VI.md); CXI chưa deploy hoặc gửi giao dịch có quỹ.

Mở MP4 trên máy này để xem chuyển động và nghe đủ âm thanh. Media lớn ở work/v5/CXI/films/v7-m16b-review/, được git bỏ qua. Các phim m15/m16 cũ được giữ riêng, không dùng thay cho bằng chứng build này.
