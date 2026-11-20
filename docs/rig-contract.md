# Cut-out rig delivery / Bàn giao rig cut-out

**Runtime:** `taskbar-cutout-v1`, 30 fps, native JSON + unrotated PNG atlas pages. No Spine runtime is bundled. The designer may export Spine 4.2 **JSON** from their licensed editor, then run `node scripts/art/convert-spine.mjs skeleton.json page.atlas rig.json`; binary `.skel`, constraints and rotated atlas regions are not supported. Existing Mochi, Soot and Clover artwork and animation stay intact. All other 22 units use the shared template.

**Runtime:** JSON gốc + atlas PNG không xoay, 30 fps; không đóng gói Spine runtime. Nhà thiết kế có thể xuất **JSON Spine 4.2** bằng bản quyền của mình rồi chuyển đổi bằng lệnh trên. Không hỗ trợ `.skel`, constraint hoặc vùng atlas xoay. Giữ nguyên hình và chuyển động của Mochi, Soot, Clover; 22 nhân vật còn lại dùng mẫu chung.

| Contract / Hợp đồng | Names / Tên |
|---|---|
| Hierarchy / Cây xương | `root → hip → torso → neck → head → ear_l, ear_r, eyes, mouth`; torso → `shoulder_l/r → arm_upper_l/r → arm_lower_l/r → hand_l/r`; hip → `leg_l/r`, `tail_1 → tail_2 → tail_3`; hand_l → `weapon` |
| Sockets / Điểm gắn | `root`, `hip`, `head`, `hp-anchor`, `vfx-origin`, `main-hand`, `off-hand` |
| Clips / Chuyển động | `idle` 1.8s, `attack` .55s, `cast` .6s, `ultimate` 1s, `hit` .25s, `stunned` 1.8s loop, `frozen` timeScale 0, `death` .7s, `victory` 1.8s loop, `enter` .5s |
| Events / Sự kiện | attack: `hit` .29s; cast: `cast` .35s; ultimate: `ult_release` .55s; death: `dust` .55s. Existing authored events retain their timing; battle contact is retimed to deterministic rules. |

Exact part names are in `art/rig-templates/cat.template.json`; enemy variants in `enemy.templates.json`. Export complete pieces with ≥12 px hidden joint overlap, setup pose identical to the approved master, head-to-feet core excluding ears/props. `parts.json` records embedded slots honestly; existing faces/weapons remain embedded where no independent pieces exist. `pivots.json` records overlap-centroid or source-pivot evidence. `style.json` sets amplitude (.7 calm / 1 normal / 1.3 energetic) and `staff`/`sweep` weapon arc. Independent seeded blink intervals are 2.5–5 seconds; blink deformation is visual only.

Tên mảnh chính xác nằm trong hai tệp mẫu trên. Vẽ đủ vùng khuất tại khớp ≥12 px; tư thế gốc phải giống hình đã duyệt; đo lõi từ đỉnh đầu đến chân, bỏ tai và đạo cụ. `parts.json` ghi rõ các chi tiết còn gộp trong hình; không giả nhận là đã tách riêng. `pivots.json` lưu cách tìm khớp; `style.json` chọn biên độ và cung vũ khí. Chớp mắt độc lập mỗi 2,5–5 giây, không ảnh hưởng kết quả chiến đấu.

**QA / Kiểm tra:** `pnpm rig:build --all`; `pnpm rig:qa` with local viewer on port 5990. Each non-designer unit gets 12-frame strips for ten clips, eight extreme poses, rest comparison, event/socket checks, and <1% loop seam. Raw enclosed-alpha pixels after 2px erosion are reported, including deliberate openings; a nonzero result fails the literal gate and is never silently excluded. Review media: `reports/v3-battle/A5/`; pilot copies: `/Users/bao/Desktop/TaskbarHero-REVIEW/`.

Mỗi rig có dải 12 hình cho 10 chuyển động, 8 tư thế cực hạn, so sánh tư thế gốc, kiểm tra sự kiện/điểm gắn và sai lệch nối vòng <1%. Đếm cả khoảng trống có chủ ý sau co biên 2 px; nếu còn pixel thì ghi rõ chưa đạt, không che kết quả. Clip mẫu đã được người dùng cho phép tự duyệt.
