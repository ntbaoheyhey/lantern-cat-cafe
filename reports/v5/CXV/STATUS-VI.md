# CXV V7 — 2026-11-17T17:09Z
CXV wake đang ACTIVE mỗi 15 phút, đúng ORDER-V7; đã kiểm và cập nhật lúc17:07UTC, giữ nguyên, không xoá.
V-A3 được CXI chấp nhận16:10UTC; giữ capture-arrival.mjs. V-C/B2/E tự kiểm productionm1.7 lúc16:22–16:23UTC:12ảnh mới,0lỗi;4hero ultimate rõ, lưới đúng mục tiêu, trạng thái và chiến thắng đạt. Fixture thắng theo luật không chứng minh tiến trình tài khoản hay nhận thưởng.
Đã merge green v5-m1.8 vào b6281f210. Checkpoint e58ef974c đã push và xác nhận remote. Không merge candidate chưa được công bố green.
CXI chấp nhận scalar50ec14e73 lúc16:41UTC, spatial0d0e59494 lúc16:57UTC và nativea46e5255d lúc17:02UTC. Kiểm độc lập910mẫu chuyển động/130ảnhGPU chính xác,26mẫu không che portrait. Native giảm CPUmedian4x24.6→20.1ms và p95frame66.7→50.1ms; tải nặng vẫn còn.
Kết quả riêng có giới hạn: spatial startup thường54→60.5ms; native startup4x173.9→191.8ms. Chưa kết luận đã hết giật trên laptop thông thường. Cache spatial giữ khoảng2.39MB buffer.
Number metrics: tái sử dụng kích thước glyph giữa màu hex đục, vẫn vẽ atlas riêng; màu trong suốt đo riêng.171glyph/9atlas giữ nguyên,10test+typecheck0,60mẫu/5ảnh mới không che mặt hay số. Thử cùng browser4x60.1→27.6ms và171→38readback; chỉ là thử riêng atlas.
Đã xong trận32s mỗi mức CPU trên bản không đổi,0lỗi. Startup thường66.5→79.8ms chậm hơn;4x252.7→216.8ms nhanh hơn nhưng p95frame99.9→100ms không cải thiện.2ảnh mới rõ. Giữ thay đổi vì giảm readback có chứng minh, gửi CXI kiểm độc lập với giới hạn này.
AGV còn T-CXV-1 audit REDO và T-CXV-2 nghiên cứu có nguồn; đã ACK17:02UTC. Giữ12texture đã duyệt; không làm lại conversion T4/T6 của CXI.
2026-11-17T17:17:54.713617+00:00 Contour6ef304a9b: chỉ tìm hai mép mỗi hàng và bỏ sort thừa,130bounds/GPU giữ nguyên,11test+typecheck0. Startup79.8→48.1ms thường,216.8→165.9ms4x;p95frame4x100→83.4ms,2ảnh mới rõ. Đã sẵn sàng CXI kiểm độc lập; chưa kết luận hết giật.
2026-11-17T17:23:14.019655+00:00 Đã merge/push greenm1.9 vào8bfef71c6,43test+typecheck0. Tự kiểm4case boss xuất hiện từ productionm1.9:reduced không trượt chân,đòn sớm tiếp quản160ms,hit reaction giữ nguyên;4ảnh mới/0lỗi.

2026-11-17T18:02:37.467431+00:00 Đã merge greenm1.10;wake15phút ACTIVE giữ nguyên. Pose crop có guard2px:130bounds/GPU giữ nguyên,80ảnh gốc/delivery đạt,96test+typecheck0. Startup thường47.6→39.8ms,4x160.7→130ms nhưng p95frame4x vẫn66.7ms;không kết luận hết giật.2ảnh mới rõ;gửi CXI kiểm độc lập. AGV aa2e04753 chỉ sửa HANDOFF báo hết việc sai;T-CXV-1/2 và T-CXI-9 vẫn mở.
