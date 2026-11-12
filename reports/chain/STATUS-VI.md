# Trạng thái CHAIN
Đã push mã đã kiểm thử: b67126945 — PR nháp441. Luồng khách → gas → boss → mint → mua/bán/hủy, niêm phong Star Thread, YARN và phí V2 chạy thật trên Anvil. Ba lượt mới đều đạt:24,4 /22,2 /24,9 giây cho toàn bộ giao dịch. 111 kiểm thử hợp đồng, toàn bộ unit/typecheck/lint/build đạt; coverage YARN/Season100%, V2 95,95%. Checkpoint này hoàn tất báo cáo và chứng cứ, không đổi mã triển khai.

Tokenomics có22 nguồn, mô hình52 tuần và biểu đồ; đạt theo giả định, chưa có số nguồn cung tuần từ C2. Giao dịch trang bị chiến dịch thường và bộ phát thưởng định kỳ/điều chỉnh ngân sách tự động còn chưa hoàn tất. H4b/H5 đã quay lại hàng đợi một lần; H7 chưa đủ điều kiện.

Chưa deploy hay phát giao dịch bằng khóa thật. Bạn tự triển khai theo USER-DEPLOY-VI.md rồi chạy smoke Fuji công khai. GitHub CI bị chặn bởi hạn mức thanh toán; kiểm tra tại máy không có nghĩa CI xanh. Chi tiết và bằng chứng: CHAIN-REPORT.md, ACCEPTANCE.md, OUTBOX.md.
