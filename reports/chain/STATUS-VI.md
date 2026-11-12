# Trạng thái CHAIN — 12/11/2026

Đã hoàn tất thêm 63 kịch bản mức thưởng/nhu cầu, giữ kết quả 18 giao dịch Fuji do bạn chạy. Bộ test mới nhất đạt: web 2.416, SQL 628, Forge 118, kiểm tra model/công cụ 10; luồng trình duyệt local đạt 19,5 giây. Ba lượt liên tiếp trước đó cũng đạt. Chưa đo được thời gian trên Fuji công khai.

Mức tối đa được thử và đạt cả ba nhóm là 3 YARN/tuần khi giữ nguyên nhu cầu giả định, 0,6 khi nhu cầu giảm một nửa. Ở 10% nhu cầu, dừng thưởng định kỳ vẫn chưa đạt. Đây là thí nghiệm, không phải mức thưởng được đề xuất hoặc đã bật. Mô hình mặc định vẫn CHƯA ĐẠT; không đổi phí, phân bổ hay hợp đồng.

Đã sửa khôi phục ví/gas/voucher và giới hạn HTTP. H4b/H5 còn thiếu nguồn vật phẩm, thưởng có thẩm quyền và dữ liệu cung từ C2; H7 chưa đủ điều kiện. SHA đã kiểm tra nằm ở OUTBOX.md, hướng dẫn tiếp tục ở HANDOFF.md.

Việc bạn làm sau: cập nhật frontend và ba Edge Functions, seed hàng V2, nạp sponsor rồi đo luồng public. Lệnh ở FRONTEND-READINESS-VI.md và USER-DEPLOY-VI.md. CI đang bị billing/spending; Vercel đã báo giới hạn deploy. Codex không đọc khóa, ký giao dịch công khai, deploy hoặc merge.
