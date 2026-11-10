Đã tự động hoá Mochi từ ảnh gốc thành model 3D, giảm lưới, gắn xương và đóng gói.
Bản thử nghiệm còn 626.020 byte, 21.938 tam giác, 14 xương; game điều khiển 22 clip.
Đã có clip trận thật 20 giây và 11 tư thế kiểm tra; lỗi kéo méo khi giơ tay cao còn tồn tại.
Công cụ chạy lại tái sử dụng đủ năm bước và kiểm tra hash; không cần bạn tải file hay kết nối fal.
R1 vẫn PARTIAL; chưa nhân rộng đội hình, chưa chốt pipeline hoặc công nhận chất lượng 8.5.

# Art Rebuild — interim PARTIAL report

Draft [#427](https://github.com/ntbaoheyhey/taskbar-hero/pull/427). This is an automation/prototype checkpoint, not R8 completion.

## Result and decision

- Original Mochi image → official TRELLIS.2 → exported textured mesh succeeded through the existing signed-in browser session. No further inference or connection is needed for this source.
- Local five-stage automation: inspect source → attribute-aware simplify → authored skin → meshopt/WebP pack → inspect output. One command and details: [AUTOMATION](AUTOMATION.md).
- Source96,900 triangles/5,369,360B becomes21,938 triangles/626,020B,14joints,2textures. Packed SHA256 `c035cd84f28d5198905799b73786eee9a268fbc14dc1465327c2c433daaeee29`.
- [Source-only rig prototype](../../../assets/source/look-v3/image-to3d/mochi-rig-prototype.glb). File has0embedded animations;22game-authored clips drive it in the local preview.
- [11-pose review](r1/image-to-3d/packed-motion/contact-sheet.webp), [20s natural battle](r1/image-to-3d/film/mochi-generated-20s.mp4), [recording receipt](r1/image-to-3d/film/mochi-generated.json). Clip has no observed ultimate; cast/victory diagnostics expose deformation separately.
- User rejected pasted/stiff2.5D and loose primitives. Direct reconstruction preserves Mochi's real volume and painted identity better, but fused arm/apron/shield stretches in high poses. No pipeline accepted, no roster rollout, no comparative beauty score fabricated.
- B-R1-008 reached3repair attempts. Retain failures; actual surface separation/retopology is required before revisiting. No fourth mask adjustment this milestone.
- R0/S6/M5 complete and unchanged. R0 score5.9966/10; target≥8.5 stays. Four concepts retained; Soot/ButtonGuard/YarnGiant direct meshes not built.

## Validation and limits

| Gate | Observed result |
|---|---|
| Automation | Five stages complete; rerun reuses5/5 with identical hashes; conflicting recipe/output and concurrent writer rejected |
| Geometry |21,938tri;23,635vertices before packing;14joints; maximum normalized weight error1.19e-7 |
| Runtime diagnostic |11poses,22clips,0console errors; pose quality PARTIAL despite technical success |
| Parity |5Bseeds byte-exact across OFF/v2/sculpt/painted/generated;85retained live-plan immutability checks; full A live simulation not repeated |
| Local source checks | Type/lint/unit PASS;1,815web tests; [receipt](r1/image-to-3d/automation-source-checks.json); not visual acceptance |
| Local preview |30,537,821B <40MB; retained live demo30,075,127B; retained lean21,812,603B <26MB |
| Performance | Isolated pose23,846tri/11draws only; no new battle cast/cold acceptance sample |
| Faces/contrast/collision/startup/E2E | New generated pipeline NOT VERIFIED; prior R0 results are not substituted |
| Evidence/source |11,629,797B/13,938,633B;2clips, within120MB/60MB/6clip caps |
| Beauty | Deformation FAIL in cast/victory; source silhouette and face improved; no accepted weighted score |

## Scope and remaining work

- Published source rig, automation scripts, provenance, failed/successful diagnostics and report; unaccepted runtime/candidate files and30.54MBpreview remain local WIP, preserved for continuation.
- Prototype installation requires explicit `--install-preview`; unqualified `--install` is rejected. Tool always reports runtimeAccepted=false/qualityStatus=PARTIAL. It is specific to the inspected Mochi source hash, not a universal autorigger.
- No new concept image, external request, credentials, purchase, default flag edit, A/U worktree edit, PR merge or manual deployment action in this continuation.
- Original simplification failure B-R1-007 retained; attribute-aware simplification restores readable face/texture. All B-R1-008 failures retained.
- Current four-unit R1 decision and R2→R4→R5→R3→R6→R7→R8 remain pending. Next production work must separate fused surfaces before reweighting; do not replace the user's direct-image requirement with rejected billboards.
- Full Run upload/allocations/OFF+3B/draws/Kettle misses stay open. Shell hygiene request is already in B-OUTBOX for U.

Look first at the motion contact sheet, especially cast/victory, then the battle clip. These show an actual animated3D prototype and its remaining limitations.

## Pause clarification — 2026-11-10T01:17:50.106927+00:00
User paused after fal connection. Existing source,626020Bprototype and all earlier runtime evidence remain unchanged. Fal catalog/schema/pricing inspected only; no upload or generation/rigging/segmentation job submitted. A43292Bshape-only local proxy was prepared for possible part analysis; never installed. The current source does not need regeneration. Continue from B-R1-008 when resumed; do not restart R0/S6/M5 or Mochi conversion.
