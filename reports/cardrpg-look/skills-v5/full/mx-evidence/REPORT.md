# MX — authored skill effects and measured limits
Đã bổ sung lớp chuyển động và dấu riêng cho 48 kỹ năng chủ động, gồm 12 tuyệt kỹ; 12 nội tại được ghi riêng.
Bốn nhóm mèo có 360 cửa sổ tung chiêu: tối đa 16,8 ms; 240 vùng mặt không bị che.
Tự chấm hình ảnh tăng từ 4,517 lên 6,233; chưa đạt 7,5 và một số nội tại vẫn giống nhau.
Ba lần tối ưu giảm cấp phát 85–93%, nhưng chưa đạt mục tiêu không cấp phát.
Tiếp tục tích hợp trận thật và gói demo; giữ các lỗi và mẫu đo không đạt để đối chiếu.

The catalog has 48 active skills **including** 12 ultimates, plus 12 passives. The sixty-cat sheet contains those 60 real catalog entries, and the enemy sheet covers 26 attack cues. No invented extra skills. Four whole-cat batches retain both review rounds and all failed attempts.
The shared toolkit adds two authored procedural 1024² atlases, instanced sprite curves and tapered trails, ground motifs, pooled impact lights, a tier-gated distortion pass, and visual anticipation/hit-stop/camera envelopes inside the existing action clock. Runtime flag defaults, rules, events and outcomes are unchanged.
[Before audit](../VFX-AUDIT.md), [after audit](../VFX-AUDIT-AFTER.md), [60 cat peaks](cinema3/sheet/peak-sheet.webp), [26 enemy peaks](cinema3/sheet/enemy-peaks.webp), [fresh eyes](FRESH-EYES.md).

| Gate | Result | Evidence |
|---|---|---|
| Five seeds ON/OFF/base | Exact at each batch and optimisation | [parity](opt3/parity/parity.json) |
| Whole-cat first/repeat casts | 360 windows, native/CPU4 max 16.8 ms | [batch receipt](batch-summary.json) |
| Whole-cat resource costs | 60 cues, ≤109 draws, fixed 50 programs | Per-batch cost receipts |
| Faces | 240 whole-cat masks + 90 fixed-shot masks, 0 offenders | Per-batch faces; [fixed faces](opt3/faces/faces.json.gz) |
| Text layout | 1,176 frames, zero overlaps/outside/unplaced on fixture source | [collisions](opt3/collide/collisions.json.gz) |
| Cold load native / CPU4 | 33.3/33.4/33.3 ms / 150.1/183.3/183.3 ms; ready≤9708.4 ms | [six cold runs](opt3/cold/summary.json.gz) |
| Queue slices | max44.3 ms vs40; single upload remains PARTIAL | [cold receipt](opt3/cold/summary.json.gz) |
| Heap allocation | 220728/106500/115280 B per 600-frame isolated sample, not zero | [sample](opt3/allocation/allocation.json.gz) |
| Beauty/uniqueness | 6.233/10 vs target 7.5; repeated passive footglows remain | [full rescore](../VFX-AUDIT-AFTER.md) |

Root typecheck/lint/build passed; E2E **421/421 passed**. OFF startup: zero Three/model modules or requests; startup chunk bytes and membership match M2. The [20 s fixture clip](opt3/video/MX-after-20s.mp4) is uninterrupted gallery playback, not a live-rules battle. Fixed shot resource peaks126draws/163043tris,contrast4.618;12keyboard/Escape and reduced-motion cases pass.

The unchanged StageLayout test timed out in the broad run; both isolated reruns passed. Original full-suite failure and both isolated receipts remain; no timeout or test was changed. The live branch separately exposes a 152-draw fixed frame and a sibling overlay collision, which the gallery cost/fixture collision probes did not cover. Those are M3 issues, not hidden by these fixture passes.
Three-attempt caps leave nonzero sampled allocations, small Soot spark/wick, repeated passive silhouettes, pale-flat monsters, and the existing boss ratio shortfall. M4 revisits monster relief and the weakest cue identities. No human playtest or 7.5 beauty acceptance is claimed.

| Self-score | Weight | Score | Evidence / limit |
|---|---|---|---|
| Skill VFX beauty |22%|6.2|Full after audit; distinct ultimates, repeated passive glows.|
| Status readability |15%|8|Fixed shots and protected-face checks.|
| Combo legibility |12%|7.5|Target words clear; Rupture/Spread still small.|
| Multi-target clarity |8%|8|Staggered impacts in five-frame strips.|
| Monster readability |8%|6|Value threshold passed in M2, surface depth and boss ratio missed.|
| Performance |15%|7.5|Cast gate passes; zero-allocation target misses.|
| Live correctness |15%|6|Parallel M3 measured exact18/18 natural runs;38/45coveragecells and explicit probe gaps.|
| Size/startup/compatibility |5%|8|Closure receipts below; OFF startup bytes/membership match M2.|
Weighted self-score **7.01/10**, an agent assessment. Monster readability and live coverage lead the next work; beauty remains below target.
