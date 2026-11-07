# Báo cáo LOOK — L3 đã kiểm chứng, tiếp tục L4
Ba mèo Mochi, Soot và Clover đã được dựng lại bằng Blender; ảnh thẻ lấy từ chính mô hình trò chơi.
Quán cà phê có cửa sổ đêm, rèm, đèn giấy, cây, đồ gốm, sách, bàn trà và thảm có đường may.
L3 thêm ánh sáng tạo khối, phản chiếu, bóng tiếp xúc, bloom, bảng màu theo chương và khử răng cưa.
Hậu kỳ giữ vùng mắt/mặt rõ; 36 mẫu kiểm tra và ba mức chất lượng đã qua trên bản kết hợp hiện tại.
Đã nhận khung giao diện của Lane A: điều hướng và HUD vẫn hiện ở cả ba kích thước màn hình.
Sáu lần đổi Look trong trận giữ nguyên tài khoản/trận đấu; sáu trường hợp hủy tải đều dọn tài nguyên đầy đủ.
Demo22,58MB; năm kiểm tra mã nguồn đã qua,24lượt thi triển đầu/lặp đều đạt tối đa16,8ms, không lỗi.
Thân Soot còn chìm, lọ trên kệ lặp, chụp đèn thiếu vân; hiệu ứng kỹ năng và phần lớn dàn nhân vật vẫn là bản cũ.
Điểm bên dưới là tự đánh giá; bộ chân dung/icon đầy đủ và các kiểm tra cuối toàn trò chơi chưa hoàn tất.

REFERENCE: docs/cardrpg-look/index.html; docs/cardrpg-look/slice.html; reports/cardrpg-look/L3-CHECKPOINT.md; reports/cardrpg-look/validation/l3

| User complaint | Current L3 | Self-grade /10 | Evidence / limitation |
|---|---|---:|---|
| Cat quality | Three original Blender cats, named rig, fitted gear |7.5|Each<12ktri,72reviewedposes;9cats remain inherited|
| Lighting/depth | Analytic environment, form ramp, contact shadow, compact depth AO |6.5|Three visual rounds; Soot projected-box separation.0506 vs L2.0524 misses.18proxy|
| Stage richness | Authored room, fabrics, ceramics, plants, original night window |6.8|4Blender/3runtime stage rounds; shelf mirroring/paper fibre remain|
| Colour/UI harmony | Teal/honey battle HUD, chapter LUT, A's retained shell |7|9camera cases at1024/1280/1440; no overflow or shell overlap|
| Effects quality | Stage steam/dust/shafts; old skill compositions |5|L4 flipbook/ribbon/light pipeline only prepared, no new skill VFX accepted|
| Sharpness |1024hero/2048stage maps; face-protected focus/bloom |7|36component samples pass; SMAA lowers whole-crop edge energy, not claimed as sharper|
| Post look | Threshold/knee bloom, grade, restrained focus/vignette/grain, SMAA |7|High/Balanced/Low checked; compact AO, no GTAO/TAA/full shadow maps claim|

Current exact artifact:02ffd9cb351fba4984dffac98036a2853bde5fe06e0a1ce503ceccc53655cb70,22,578,111bytes; source71da901f rebased onto acceptedA4d525a8a. All1,301source hashes still match the clean runtime build. L1 draft361 and L2 draft362 retain their historical artifact receipts; their branch chain is reconciled onto acceptedA4d525a8a before L3 publication (mapping in memory/l3-rebase.json). L3 audit passes all1,301inputs.

| Validation | Current receipt |
|---|---|
| Source gates | Typecheck/lint/unit/build/421E2E pass;1740web/1020rules/581Supabase/32chain/24auth/16contract;2expectedfail/11skips retained |
| Actual battle cameras |3sizes×3presets; no clipping/overflow/errors; sample106draws/101148tri |
| Live A/B and leaving |6toggles preserve battle/account; replaced scenes disposed;20/20stage resources released in each of3leave-table cases |
| Post components |36inner-face samples/0offenders; warm High/Balanced/Low123textures/552geometries/52programs unchanged |
| Loading cancellation |6boundaries;0/21/167/0/186/294resources fully released; context/canvas cleanup pass |
| Startup L3 | Fresh11scripts/3,522,544bytes/686modules/0Three-model; strict parity+44bytes MISS versus original3,522,500 (L2 was+4) |
| Cold7 /24casts L3 | Cold7 complete: nativeMAX33.4ms,CPU4MAX133.3ms MISS; all24cast windowsMAX16.8ms/100%≤20ms/errors0 |
| Offline size |22,578,111bytes,1,421,889bytes below24MB |
| Final-only checks |25×86×10matrix,20battle lifetime, CPU4Balanced/Low casts UNRUN |

Embedded bytes by class (base64 gzip payload, excluding loader/code/evidence): ateliermodels1,901,124; atelierstage1,998,272; classicmodels2,867,752; portraits4,068,016; textures/other8,046,172; icons20,280. Full raw/gzip counts in docs/cardrpg-look/build.json.

L2 historical performance:24castsMAX16.8ms/100%≤20; complete cold7 nativeMAX33.4ms/CPU4MAX166.6ms MISS. Rejected233.4ms decode,199.9ms HTML.decode and interrupted333.3/250.0ms plus timeout retained. L3 splits constructor/resize/decorations: CPU4peak133.3ms vsL2 166.6; native hub894.2–918.7ms/battle6742.9–7719.0ms, CPU4hub1693.5–1699.7/battle8832.4–8992.4ms. Slower1440DPR2ready7719ms retained; no general load-time improvement claim. L3 original Classic cancellation295/294 was a harness counting the shared Three.Sprite geometry; diagnostic kept and ownership corrected, not described as a new engine leak fix.

| Unit group | Delivered tier |
|---|---|
| Mochi/Soot/Clover |look-slice; three-plus reviewed rounds, actual-model portraits |
| Remaining9cats |inherited unchanged; L5 pending |
|10enemies/3bosses |inherited unchanged; L5 pending |

Lane A has adopted the published L1 portrait contract. Future skills[id].icon1x/2x contract confirmed; remaining9portraits/48icons/rarity plates await L6. A shell request is satisfied by accepted4d525a8a and freshly verified in B. B engine-slicing request5e2cd90f is implemented and measured; CPU4cold peak remains133.3ms. Remaining order L4→L6→L5→L7; original25×86×10 final matrix runs only after the L7 source is ready. No combat/rule/package/lockfile changes, merge/mainpush/deploy, subagents or generative calls.
