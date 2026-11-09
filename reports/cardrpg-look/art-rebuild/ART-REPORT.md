R1 PARTIAL: hướng hiện tại là chuyển trực tiếp ảnh Mochi thành model 3D có texture và rig.
TRELLIS.2 đã tạo bản xem nhiều góc, nhưng bước xuất GLB bị hạn mức GPU chặn.
Chưa có mesh để sửa, gắn xương hoặc kiểm tra chuyển động trong trận.
Quyền dùng dịch vụ ngoài đã có; fal chưa kết nối, cần thao tác ở thẻ plugin đã hiện.
Báo cáo này giữ trạng thái thật; chưa hoàn tất R1–R8 hoặc đạt mục tiêu 8.5.

# Art Rebuild — interim PARTIAL report

Draft [#427](https://github.com/ntbaoheyhey/taskbar-hero/pull/427); current step and full receipt in [R1-PARTIAL](R1-PARTIAL.md). This is an interim delivery at an external export/connection dependency, not R8 completion.

## Evidence and decision

- R0 complete, weighted baseline5.9966/10; retained [baseline report](r0/REPORT.md). No R0/S6/M5 work repeated.
- Four original concepts: Mochi, Soot, Button Guard, Yarn Giant. Local procedural and layered-paint candidates remain unaccepted; user rejected stiffness/pasted appearance and requests direct image-to-3D.
- Current decision: investigate direct reconstruction from our Mochi PNG. No final pipeline decision and no four-unit comparative score yet.
- Provider output is six JPEG previews, not a delivered GLB. [Manifest](r1/image-to-3d/manifest.json), [original failure](r1/image-to-3d/receipt.json), [prepared import path](r1/IMPORT-PLAN.md).
- No generated mesh/rig has entered the game. Real-battle motion, front/side/back mesh inspection, retopology and skinning remain pending.
- New concept art:4built-in-generated masters with full prompts/hashes in assets/provenance/look.md. External image-to-3D:1generation with preview;0exported models. No new concept images generated in this continuation.

## Gates

| Gate | Retained result / current reconstruction |
|---|---|
| Beauty rubric | R0=5.9966/10; direct reconstruction NOT VERIFIED; target≥8.5 unchanged |
| Battle/VFX/lineups before-after | R0 retained; reconstructed model after-shots unavailable |
| Parity | Earlier local candidates:5seeds exact,68plan immutability checks; reconstructed runtime NOT RUN |
| Rig and motion | NOT RUN: no exported mesh |
| Faces/contrast/collision/perf | New reconstructed runtime NOT RUN |
| Demo bytes | Retained full30,075,127B; lean21,812,603B; caps40MB/26MB unchanged |
| Native cast/CPU4cold/draws | Inherited16.8ms/183.3ms/147draws; no new acceptance sample |
| Evidence/source masters | Before report: 7,376,847B/7,943,253B; caps120MB/60MB |
| Python inspection tooling | Syntax PASS; valid existing GLB inspected; malformed GLB rejected;7evidence hashes verified |
| Source/E2E | No runtime changes published in this checkpoint; prior candidate receipts do not accept reconstruction |

## Open work

- B-R1-006 export quota:PARTIAL. Fal available but unconnected; plugin already suggested, no duplicate suggestion or paid plan submitted.
- B-R1-005 stiff2.5D and B-R1-004 toy-like procedural result remain open. Source-image appeal cannot pass runtime gates.
- Skeleton-safe cloning and per-rig clip cache are required before introducing the new skinned actor; identified, not implemented.
- Next: obtain GLB→inspect→cleanup/rig→continuous battle-motion review→four-unit decision. Then R2→R4→R5→R3→R6→R7→R8.
- Ownership: canvas and image assets only; shell request already in B-OUTBOX for U. No edits in A/U worktrees, no default flag changes, PR merge or deployment.
- Housekeeping completed previously: M5 reporting5aba0bbaa, integration link-onlyc5712f7c0, R1draft427. See current HANDOFF.md for preserved local WIP.

Look first at the textured side/front views in R1-PARTIAL.md, then the normal-mode geometry image. They demonstrate promising volume, not animation or an accepted runtime asset.
