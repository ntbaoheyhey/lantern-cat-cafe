# Tư thế chiến đấu — giao cho designer (tùy chọn)
Mochi/Soot/Clover được ưu tiên. Bản designer giao thay thế tư thế Codex, giữ hiệu ứng và gắn lại socket.
K0 idle: tranh đứng hiện tại + thở.
K1 windup: dồn trọng tâm ra sau, rút/nâng vũ khí; bóng dáng phải khác K0.
K2 strike: vươn tay/vũ khí về địch, thân nghiêng/bước tới; đánh dấu đầu vũ khí.
K3 recover (tùy chọn): thả lực, trở về K0.
K4 hit: đầu/thân bật ra sau, mắt nhắm, tai hạ; dùng mỗi lần nhận sát thương.
K5 cast: tư thế tung tuyệt kỹ, tay/vũ khí nâng hoặc đưa tới, áo choàng mở.
K6 ko (tùy chọn): gục; có thể dùng K4 + tan biến.
Mèo nhìn chếch 3/4 sang phải; địch/boss nhìn chếch 3/4 sang trái.
Giữ trang phục, vật dụng, bảng màu, nét viền, ánh sáng và tỷ lệ đầu/thân của runtime.webp.
Mỗi pose cùng canvas với K0; nền alpha thật; không cắt tai/đuôi/vũ khí; cùng đường chân.
Chiều cao opaque ±5% K0; ngoại lệ K4/K5 ghi rõ. Chân lệch <=3px khi hiển thị ở sân.
Đòn thường 800ms: K1 trước50ms, giữ tới270ms; smear270–330ms; K2 từ330ms.
Chạm350ms: giữ hình60–90ms, K2 tới500ms; hồi về K0 trước800ms. Không cross-fade.
Mục tiêu: K4 giữ120–200ms, chớp trắng1–2 frame, lùi6–12px rồi trở lại.
Tuyệt kỹ2200ms: tập trung0–600ms; K1→K5 khoảng300ms; tung600–1100ms.
Chạm1100ms; hồi K5→K0 trước2200ms. Không đi tới địch để tung chiêu.
Socket tư thế bổ sung (giữ bones intake root,hip,head,hp-anchor,vfx-origin,main-hand,off-hand): feet (điểm chân), hand (tay phát), weaponTip (đầu vũ khí), faceBox (x,y,w,h).
Tọa độ socket theo pixel canvas, gốc trên-trái; báo cả leftFoot/rightFoot nếu có hai điểm chân.
Giao vào /Users/bao/art/designer-inbox/<unit-id>/; giữ source/, export/, notes.txt, preview.mp4.
Spine4.2: source/*.spine; export/<unit-id>.json hoặc .skel + .atlas + trang PNG.
Animation/attachment dùng tên idle,windup,strike,recover,hit,cast,ko tương ứng K0–K6.
Nếu giao tranh rời: export/poses/K0-idle.png,K1-windup.png,K2-strike.png,K4-hit.png,K5-cast.png.
K3-recover.png,K6-ko.png tùy chọn; export/poses/poses.json ghi canvas,baseline,socket từng pose.
Nếu giao PNG sequence: tiếp tục sequence.json theo contract intake sẵn có; ghi ánh xạ K0–K6 trong notes.txt.
Không dùng ảnh tham khảo game khác làm đầu vào; chỉ dùng art gốc của dự án.
Không cần chờ designer để tiếp tục; khi giao sẽ kiểm tra qua intake hiện có.
