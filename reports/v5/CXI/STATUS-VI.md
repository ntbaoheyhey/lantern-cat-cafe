# CXI — desktop 17/11/2026 UTC
Bản xanh v5-m1.9; ứng dụng 4ae1c9580f91b816f6860a79420faa4edab59a99; index a7a8c615c0998065c2406a1eecc4c1612aaf868d14757ac7e4f3d10736c9e3b9.
URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3
Full suite thành công: 5.269 passed/11 skipped/2 expected failures; tổng 5.282, gồm 2.969 web. Build/typecheck và chín bước pipeline đạt; so sánh audio m1.8→m1.9 độc lập đạt.
Audio 13 gói/544 file giữ nguyên encoded byte và PCM native. Không sửa âm thanh gốc hoặc AGS manifest.
Spatial/native đã nhận với motion/GPU khớp hoàn toàn. Native CPU median thường 4,9→4,3 ms, 4× 24,6→20,1 ms; frame p95 4× 66,7→50,1 ms, số hành động khác nhau. Chưa cam kết 60 fps.
Đòn đầu 21,078 giây gồm 17,7 giây đọc tám thẻ; route 10,503 giây; không lỗi thường. Recovery 714/8.664 ms.
Tải lạnh 7.667.250/8.228.520/7.742.967 B; wave3 vượt 228.520 B. I-B còn mở. Portrait 26 mẫu không overlap; blink đã nhận.
Ba phim 30 giây 1× và audio thật, không lỗi; xem REVIEW-VI.md. Chưa xác minh nghe chủ quan hoặc đồng bộ từng frame.
AGS còn T1/T2/T3/T5/T7/T8; T7 outline chưa phải script đầy đủ, T5/T8 audio bị trả REDO. CXV numbermetrics e58ef974c mới READY, chưa tích hợp.
Chưa có giao dịch Fuji thật. Hosting/funded Fuji owner-only; runbook ghim m1.9. Green không đồng nghĩa đạt toàn bộ ngân sách tải hoặc public chain.
