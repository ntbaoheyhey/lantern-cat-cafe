# Taskbar Hero: chuyển art sang 2D Spine do designer vẽ (11/11/2026)

Thay cho quyết định "3D thật" sáng 11/11. Áp dụng cho lane B và cho bạn designer.

## 1. Video cho thấy gì
Video: "How I Animated This Viking Warrior | Spine 2D Workflow" (kênh Hitbox Animations, 30 giây). Mô tả của video ghi công cụ là **Spine 2D + Photoshop**: rig xương, animation idle và attack, quy trình "game-ready".

Cách hiểu của mình:
- Nhân vật vẽ tay kiểu hoạt hình: viền nâu đậm, dày đều, tô 2 đến 3 tông màu (cel), khối tròn, đầu to.
- File Photoshop tách lớp theo từng bộ phận (đầu, râu, tay trên, tay dưới, ...). Sau đó đưa sang Spine, gắn xương (bone) và dùng mesh có trọng số (weights) để bộ phận mềm bị uốn cong, ví dụ râu và cờ phấp phới, chứ không chỉ xoay cứng như rối giấy.
- Kết quả là animation khung xương 2D chạy trực tiếp trong game: nhẹ, mượt, không cần 3D.

Khác với bản 2.5D bạn đã chê: bản đó là ảnh AI cắt mảnh, Codex tự ghép, các mảnh chỉ xoay cứng, và đặt đứng trong phòng 3D. Bản mới do người vẽ, tách lớp để rig ngay từ đầu, có mesh deform, và được dựng trên sân khấu 2D cùng phong cách.

## 2. Quyết định scope
1. **Dừng toàn bộ hướng 3D** (Blender, TRELLIS, model GLB, hiệu ứng 3D). Code 3D giữ lại sau cờ tắt, không xóa.
2. **Mọi mèo, quái, boss là nhân vật 2D Spine.** Bạn designer vẽ lại từ concept của dự án, tách lớp PSD, rig và làm animation trong Spine.
3. **Trận đấu chuyển sang góc nhìn ngang 2D** (đội mèo bên trái, quái bên phải), nền quán cà phê dạng tranh nhiều lớp. Codex tạm dựng nền từ quán 3D hiện có; designer vẽ nền sau nếu kịp.
4. **Hiệu ứng (VFX) là 2D cùng phong cách hoạt hình:** khối màu đậm có viền, vệt chém, tia lửa, vòng sóng. Codex làm phần lớn. Designer chỉ vẽ thêm cho ultimate nếu có thời gian.
5. **Chuẩn kích thước giữ nguyên tinh thần:** mọi mèo cao bằng nhau, độ hiếm không đổi kích thước, boss to gấp khoảng 1,7 đến 1,95 lần mèo.
6. **Art AI hiện có chỉ là placeholder.** Codex chuyển chúng sang dạng Spine để game chạy ngay. Mỗi khi designer giao một nhân vật, nhân vật đó được thay vào.
7. Luật cũ giữ nguyên: chỉ dùng art gốc, không lấy art game khác làm mẫu, ghi nguồn gốc từng asset.

## 3. Ai làm gì
| Designer | Codex (lane B) |
|---|---|
| Vẽ lại nhân vật từ concept, PSD tách lớp | Gắn Spine runtime vào game, sân khấu 2D, camera |
| Rig xương + mesh trong Spine | Chuyển art AI hiện có thành placeholder Spine |
| Animation theo danh sách ở mục 5 | Script nhận file: kiểm tra tên, kích thước, animation, sự kiện |
| (Nếu kịp) hiệu ứng ultimate vẽ tay, nền quán | VFX 2D cho mọi kỹ năng, nối sự kiện `hit` với sát thương |
| | Test kích thước, ảnh so sánh, demo, báo cáo |

## 4. Spec file PSD
- RGB 8-bit, nền trong suốt. Mỗi bộ phận chuyển động là một layer riêng. Phần bị che ở khớp (vai, hông, cổ) phải vẽ thêm phía dưới để khi xoay không bị lủng.
- Rasterize mọi layer style và mask trước khi xuất. Không dùng blend mode đặc biệt.
- Tên layer viết thường, nối bằng gạch ngang, có `l-`/`r-` cho trái/phải: `head`, `r-ear`, `l-arm-upper`, `l-arm-lower`, `l-hand`, `tail-1`, `tail-2`. Biến thể để trong một group: `eye-l` chứa `open`, `half`, `closed`.
- Hướng nhìn: mọi nhân vật vẽ quay sang **phải**, góc 3/4. Quái sẽ được game lật ngược.
- Ánh sáng từ trên bên trái. Viền nâu đậm (không đen tuyệt đối), độ dày khoảng 10 đến 12 px khi mèo cao 1024 px. **Boss dùng cùng độ dày viền tính bằng pixel**, không phóng to viền theo thân.
- Bảng màu: quán cà phê đêm ấm áp, tông teal và mật ong (xem `ART-DIRECTION.md` trong bản đồ art).
- Xuất sang Spine bằng script PhotoshopToSpine chính thức.

## 5. Spec Spine
**Kích thước (chuẩn 1,00 = mèo):**
| Loại | Chiều cao vẽ trong PSD (chân đến đỉnh tai/đầu) | Trong Spine (scale nhập 0,5) |
|---|---|---|
| Mèo (cả 12, mọi độ hiếm) | 1024 px | 512 |
| Quái nhỏ | 820 đến 1024 px | 410 đến 512 |
| Quái thường / elite | 1126 đến 1331 px | 563 đến 666 |
| Boss | 1741 đến 1997 px | 870 đến 998 |

- Xương `root` đặt ở giữa hai bàn chân, mặt đất là y = 0.
- **Xương bắt buộc (đúng tên):** `root`, `hip`, `head`, `hp-anchor` (ngay trên đỉnh đầu, để gắn thanh máu), `vfx-origin` (giữa ngực), `main-hand`, `off-hand`.
- **Animation bắt buộc (đúng tên):**
  - `idle`: lặp, 2 đến 3 giây (thở, tai, đuôi).
  - `appear`: 0,5 đến 0,8 giây.
  - `attack`: 0,6 đến 0,9 giây, có event `hit` đúng khung trúng đòn.
  - `skill`: 0,8 đến 1,2 giây, event `cast` và `hit`.
  - `ult`: 1,5 đến 2,5 giây, event `ult-start`, một hoặc nhiều `hit`, `ult-end`.
  - `hurt`: 0,3 đến 0,4 giây.
  - `ko`: 0,8 đến 1,2 giây, giữ tư thế cuối.
  - `victory`: lặp, 1,5 đến 2 giây.
  - Boss thêm `idle-phase2` và `enrage`.
- Giới hạn để game chạy mượt: mèo tối đa khoảng 40 xương và 400 đỉnh mesh; boss tối đa khoảng 80 xương. Tối đa một clipping attachment.
- Xuất: JSON (hoặc .skel), atlas trang tối đa 2048 x 2048, bật premultiplied alpha, padding 2 đến 4 px. Tên file là mã nhân vật: `mochi.json`, `mochi.atlas`, `mochi.png`. Codex sẽ gửi danh sách mã.
- Ghi rõ phiên bản Spine đang dùng (ví dụ 4.2.x). Runtime trong game phải khớp phiên bản major.minor.

## 6. Mỗi nhân vật giao một thư mục
```
<ma-nhan-vat>/
  source/<ma>.psd
  source/<ma>.spine
  export/<ma>.json  <ma>.atlas  <ma>.png
  preview.mp4  (hoặc .gif, đủ mọi animation)
  notes.txt   (phiên bản Spine, công cụ, xác nhận tự vẽ, không dựa art game khác)
```
Bạn (chủ dự án) đặt thư mục vào `/Users/bao/art/designer-inbox/<ma>/` trên Mac. Codex tự kiểm tra và đưa vào game.

## 7. Thứ tự ưu tiên (deadline lane B: 20/11 12:00 UTC, Demo Day 30/11)
1. **Thử nghiệm (càng sớm càng tốt, mục tiêu 13/11):** Mochi, đủ animation. Dùng để kiểm tra cả quy trình trước khi làm hàng loạt.
2. **Đợt 1 (cho demo):** 2 mèo còn lại trong đội demo, 2 quái thường, boss Yarn Giant.
3. **Đợt 2:** các mèo còn lại.
4. **Đợt 3 (nếu kịp):** các quái còn lại, hiệu ứng ultimate vẽ tay, nền quán.
Nhân vật chưa có bản của designer vẫn dùng placeholder.

## 8. Việc chỉ bạn làm được
- **Bản quyền Spine:** mesh và weights (như râu, cờ trong video) cần **Spine Professional**. Bản Essential không có. Spine yêu cầu ứng dụng dùng Spine runtime phải có license Spine Editor. Hãy hỏi bạn designer xem đang dùng bản nào và license đó có áp dụng cho dự án này không. Nếu không, phương án dự phòng là designer xuất từ Spine ra sprite sheet PNG; game chạy được, nhưng file nặng hơn và kém mượt hơn.
- Hỏi designer: làm được bao nhiêu nhân vật trước 20/11, và phiên bản Spine nào.
- Gửi cho designer file này cùng `ART-MAP-lane-B-2026-11-11.md` và thư mục concept `/Users/bao/art/look-v3/concepts/`. Repo đang private.
