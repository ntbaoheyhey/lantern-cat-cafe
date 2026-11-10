Đã dừng theo yêu cầu của người dùng lúc 2026-11-10 02:37 UTC; chỉ tiếp tục khi được yêu cầu.
Trạng thái PARTIAL: Q1/Q2/Q4 xong, Q3 và toàn bộ roster/VFX/R8 chưa xong.
Đã có 12 concept mèo với provenance và ảnh đối chiếu; đây là nguồn art, chưa phải 12 runtime.
Mochi/Soot giữ nguyên nguồn đã dựng; Button Guard quota lần1, Yarn chưa chuyển; không tự thử lại khi dừng.
11 prompt quái đã viết; phần còn lại nằm trong QUEUE.md/HANDOFF.md, không có tác vụ nền mới.

## Pause checkpoint — 2026-11-10 02:37 UTC

- Cat concepts: retained the four completed sources, saved eight new built-in originals; source files and complete prompts/provenance are in assets/source/look-v3/concepts, tools/cardrpg-look/art-rebuild/prompts and assets/provenance/look.md.
- Reviewed r2/concepts/cats-concepts.webp at equal displayed height; r2/concepts/CATS-REVIEW.md records five runtime risks. Concept-only approval; no new runtime score.
- Source32MiB/60MB and report evidence74MiB/120MB. Large raw masters remain in ~/art/look-v3/concepts.
- No renderer/gameplay changes in this checkpoint. No runtime type/lint/unit, face/HP, parity or performance rerun was required to save this pause; earlier runtime results below are historical, not validation of unbuilt cats.
- Remaining work and the exact paused state are saved in HANDOFF.md, STATE.md and QUEUE.md. R8 completion is not claimed.

Current receipts: QUEUE.md, r1/roster/SOOT-REVIEW.md, r1/roster/soot-validation.json and AUTOMATION.md. Historical checkpoint below is retained as history.

---

Đã áp dụng hướng tạo ảnh gốc rồi chỉnh và dựng thành hiệu ứng trong trận, ưu tiên cả chiêu cuối.
Bản thử bỏ các hình cửa/cốc/tất hiện thêm cạnh Mochi và phía địch; giữ nguyên model Mochi đã có.
Ánh sáng ra từ khiên, tới mục tiêu đúng nhịp; đã sửa lỗi sáng muộn lúc va chạm.
1.818test qua;72mẫu mặt không bị che;36lượt đo tung chiêu cao nhất16,8ms; kết quả trận giữ nguyên.
R1 vẫn PARTIAL: lỗi tay kéo méo áo/khiên và đội hình đầy đủ chưa xong; chưa công nhận chất lượng8.5.

# Art Rebuild — interim PARTIAL report

Draft [#427](https://github.com/ntbaoheyhey/taskbar-hero/pull/427). This is a VFX pilot checkpoint, not R8 completion.

## Current preview

- [Offline preview](../../../docs/cardrpg-look/v5-art-vfx-preview.html), 30,879,888B; SHA256`077acf36da70a3eff05237d7618e6a28076bae053dd2ea7b5e830e7fee82a0e6`. `lookArt:v3` only in this demo; v2 comparison retained.
- [Four continuous x1 gallery cues](r1/vfx-pilot/film-impact/mochi-vfx-gallery.mp4), [1440shot sheet](r1/vfx-pilot/after-impact/sheet.webp), [1024sheet](r1/vfx-pilot/after-impact-1024/sheet.webp), [review](r1/vfx-pilot/REVIEW.md).
- Built-in-generated four-component RGBA light atlas256,276B; original prompt, hashes and cleanup in provenance. Animated in code with depth/face protection; not generated video or a temporal flipbook.
- Pilot covers Mochi four skills+passive and Sock Skipper/Teacup Healer cues. Duplicate physical prop shapes removed; charge/release follows the shield socket. B-R1-010 fixed held-pose alpha0 by advancing light inside the unchanged impact beat.
- This publishes the opt-in preview renderer and retained comparison candidates so the pilot can be reproduced. Neither rejected painted/procedural candidate nor the current Mochi rig is promoted as accepted production art.

## Existing Mochi source — reused, not rebuilt

- Original concept -> official TRELLIS.2 ->96,900tri/5,369,360B textured mesh; local authored rig pack626,020B/21,938tri/14joints/2textures. Source inference remains complete.
- PrototypeSHA`c035cd84f28d5198905799b73786eee9a268fbc14dc1465327c2c433daaeee29`;0embedded clips,22game clips. [Automation](AUTOMATION.md) reuses5/5exact stages; no fal upload/job in this continuation.
- [11poses](r1/image-to-3d/packed-motion/contact-sheet.webp), [prior20s natural battle](r1/image-to-3d/film/mochi-generated-20s.mp4). B-R1-008 high cast/victory deformation remains PARTIAL after3attempts; real surface separation needed. No fourth mask tweak or roster rollout.

## Validation and limits

| Gate | Observed result |
|---|---|
| Source/offline build | Type/lint/1,818web testsPASS; detailed [receipt](r1/vfx-pilot/validation.json) |
| Parity |5Bseeds exact acrossOFF/v2/sculpt/painted/generated vs retained base;85live-plan immutability checks; no new A held-out sims |
| Faces |72samples with Burn/Mark/Warm across landing/impact/afterglow:0offenders |
| Layout |48fixed shots at1440/1024:0measured overlaps/outside labels; sampled text contrast11.4168 |
| Casts |36first/repeat windows on6cues: native16.8ms,CPU416.8ms,85draws,121,362tri,0pageerrors |
| Heap/overdraw |Earlier cost3:1.5213high overdraw,56programs stable,2lights; sampled allocations nonzero MISS retained; not remeasured after timing-only fix |
| Size |Preview30,879,888B<40MB; retained lean21,812,603B<26MB (new lean not built) |
| Cold/startup/full E2E/full roster |NOT VERIFIED for this pilot; no substitution of R0results |
| Evidence/source |74,245,324B/15,141,527B;5clips under6cap; lossless image repacking preserves exact decoded pixels |
| Beauty |Pilot VFX self-score7.7; no accepted weighted roster score; target>=8.5 remains |

## Scope and next work

- R0/S6/M5 and requested housekeeping complete; do not repeat. Fourconcept masters remain style anchors. User rejects stiff/pasted2.5D and loose primitive approximation, prefers direct image-derived3D and generation-led VFX.
- R1final four-unit decision and R2/R4/R5/R3/R6/R7/R8 remain pending. Mochi uses the user-authorized rigid-module fallback; limited independent arm movement is a known issue, not a roster blocker.
- Original Full Run upload/allocations/OFF+3B/draws/Kettle misses remain open. No default flags, rules, A/U worktrees, shell, PR merge or deploy changed. Shell hygiene request already sent to U through B-OUTBOX.
- No further source conversion is needed for Mochi. Continue from current prototype and generated light; never restart because a remote download URL expires.

Active resume checkpoint 2026-11-10T06:07:08.127885+00:00: internal-browser fallback review and 12s motion film;1822tests/type/lint/buildPASS;5seedexact;96total face samples0offenders,0UI overlaps;demo31777616B. Q3 and Q5 remain PARTIAL; no overall8.5 or full-roster acceptance claimed.

06:35UTC progress:25concept sources complete; Q3full E2E420PASS/1clockflake+2unchangedisolatedPASS. Soot/Clover VFX sources packed; further original VFX sources prepared while provider conversions wait. Source art is not a runtime quality claim.
