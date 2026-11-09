R1 PARTIAL: đã tự động chuyển trực tiếp ảnh Mochi thành mesh 3D và tải GLB.
Xuất thành công trên phiên TRELLIS đã đăng nhập; file 5,37 MB, 96.900 tam giác, hai texture.
Đã xem sáu góc và bản không texture trong Blender; hình khối đầy đủ, chưa có xương/animation.
Không cần kết nối fal cho bước Mochi này; tiếp theo xử lý mesh, rig và thử chuyển động trong trận.
Báo cáo này giữ trạng thái thật; chưa hoàn tất R1–R8 hoặc đạt mục tiêu 8.5.

# Art Rebuild — interim PARTIAL report

Draft [#427](https://github.com/ntbaoheyhey/taskbar-hero/pull/427); current step and full receipt in [R1-PARTIAL](R1-PARTIAL.md). This is an interim source-model delivery, not R8 completion.

## Evidence and decision

- R0 complete, weighted baseline5.9966/10; retained [baseline report](r0/REPORT.md). No R0/S6/M5 work repeated.
- Four original concepts: Mochi, Soot, Button Guard, Yarn Giant. Local procedural and layered-paint candidates remain unaccepted; user rejected stiffness/pasted appearance and requests direct image-to-3D.
- Current decision: investigate direct reconstruction from our Mochi PNG. No final pipeline decision and no four-unit comparative score yet.
- [Exported source GLB](../../../assets/source/look-v3/image-to3d/mochi-source.glb), [browser receipt](r1/image-to-3d/browser-automation.json), [six-angle neutral review](r1/image-to-3d/browser-review/contact-sheet.webp). Original quota failure and preview manifest retained unchanged.
- No generated mesh/rig has entered the game. Front/side/back mesh inspection completed; real-battle motion, retopology and skinning remain pending.
- New concept art:4built-in-generated masters with full prompts/hashes in assets/provenance/look.md. External image-to-3D: two completed generation previews (original export failed, user-requested signed-in export succeeded); one exported source model. No new concept images generated in this continuation.

## Gates

| Gate | Retained result / current reconstruction |
|---|---|
| Beauty rubric | R0=5.9966/10; direct reconstruction NOT VERIFIED; target≥8.5 unchanged |
| Battle/VFX/lineups before-after | R0 retained; reconstructed model after-shots unavailable |
| Parity | Earlier local candidates:5seeds exact,68plan immutability checks; reconstructed runtime NOT RUN |
| Rig and motion | NOT RUN: exported mesh has0skins/0animations |
| Faces/contrast/collision/perf | New reconstructed runtime NOT RUN |
| Demo bytes | Retained full30,075,127B; lean21,812,603B; caps40MB/26MB unchanged |
| Native cast/CPU4cold/draws | Inherited16.8ms/183.3ms/147draws; no new acceptance sample |
| Evidence/source masters | Approximately7.9MB/13.3MB after source/review; caps120MB/60MB |
| Python inspection tooling | Syntax PASS; valid existing GLB inspected; malformed GLB rejected;7evidence hashes verified |
| Source/E2E | No runtime changes published in this checkpoint; prior candidate receipts do not accept reconstruction |

## Open work

- B-R1-006 export quota: resolved for Mochi via the authorized signed-in workflow. Fal remains unconnected but is no longer required for this step; no paid plan submitted.
- B-R1-005 stiff2.5D and B-R1-004 toy-like procedural result remain open. Source-image appeal cannot pass runtime gates.
- Skeleton-safe cloning and per-rig clip cache are required before introducing the new skinned actor; identified, not implemented.
- Next: inspected GLB→cleanup/rig→continuous battle-motion review→four-unit decision. Then R2→R4→R5→R3→R6→R7→R8.
- Ownership: canvas and image assets only; shell request already in B-OUTBOX for U. No edits in A/U worktrees, no default flag changes, PR merge or deployment.
- Housekeeping completed previously: M5 reporting5aba0bbaa, integration link-onlyc5712f7c0, R1draft427. See current HANDOFF.md for preserved local WIP.

Look first at the Blender six-angle contact sheet in R1-PARTIAL.md, then the exported source GLB. They demonstrate promising volume, not animation or an accepted runtime asset.
