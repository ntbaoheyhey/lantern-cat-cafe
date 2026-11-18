# Danh sách kiểm tra gửi cho Designer (Batch M)

## 1. Định dạng & Thông số
- Định dạng: H.264 MP4 (Alpha channel hỗ trợ qua Mask hoặc WebM).
- Kích thước: Đề xuất 256px chiều cao (chiều rộng tùy theo tỉ lệ).
- Tỉ lệ khung hình: 30 FPS.
- Thời lượng: 10 giây (yêu cầu lặp lại liền mạch - Seamless Loop).

## 2. Yêu cầu chuyển động
- Không lặp lại 10s: Vui lòng tách Idle (2-3s) và Skill-cast (1s).
- Chuyển động: Phải giữ được sự mềm mại (soft/slow) của các layer (tóc, vải, phụ kiện).
- Sự kiện animation: Cần đánh dấu frame quan trọng cho Skill-cast (Anticipation, Cast, Hit, Recover).

## 3. Lưu ý kỹ thuật
- Tránh viền đen (black fringe) do nền đen cũ gây ra khi xử lý alpha.
- Đảm bảo điểm neo (anchors) cố định.
