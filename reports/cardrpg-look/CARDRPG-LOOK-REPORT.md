# Báo cáo LOOK — bàn giao B và kiểm chứng bổ sung
Đã hoàn tất phần trình bày B cho hồi chiêu/đội hình, chuyển pha boss và thông báo nhận mèo theo dữ liệu A4.
Đã kiểm tra thao tác trên ba kích thước desktop; không tràn hàng kỹ năng và không thay đổi tài khoản.
Cả 1.770 kiểm thử web và 421 kiểm thử thao tác qua; typecheck, lint và bản dựng cũng qua.
Kích thước mã tải lúc mở ứng dụng đã về đúng 3.522.500 byte; không tải mô hình/Three ở màn hình mặc định.
Clover cải thiện 66/66 so sánh liên quan với L4; vẫn còn 1140/2.211 so sánh giảm so với bản gốc.
24 lượt chiêu mẫu: khung hình chậm nhất 633.3 ms; tám lượt kiểm tra bốn kỹ năng từng chậm tối đa 216.6 ms.
20 trận phát lại: heap tăng 1,116,232 byte; số tài nguyên GPU không tăng. Đây không phải bằng chứng không có rò rỉ.
Demo 31,494,758 byte, trong mức 32 MB đã giải trình; khung hình khi tải lạnh chậm nhất 666.6 ms vẫn vượt mục tiêu.
Phần B đã bàn giao; A còn nối thông báo nhận mèo vào Invitations, icon/khung và tích hợp bản chung. Các hạn chế được giữ rõ dưới đây.

REFERENCE: docs/cardrpg-look/index.html; closure/audit.json; closure/REVIEW.md; closure/CONTRACT.md; validation/l7/audit.json; validation/l7/freeze.json

Historical L7 source `c754dbba`, artifact `39645d319c264bac0c1011d0e5370de335281ebf6e1df64de67978e34bcb4133`, 1937 hashed inputs. Stacked on [L5 draft374](https://github.com/ntbaoheyhey/taskbar-hero/pull/374), accepted A3 `daba7d7c`; no A4 runtime adoption. Publication reference is recorded in memory/STATE.md after verification. L1–L6 measurements below retain their original artifacts.

Verdict: B implementation, targeted validation and handoff are complete with measured misses and visible limitations. This is not an all-gates-pass or premium-art claim. Personal art scores below remain from L5; closure changes presentation, startup imports, label allocation and the Clover greenhouse silhouette.


## Closure checkpoint — current artifact

Source `8ba0a3879`, artifact `7e092b1a18b2a4af1dcdcc51e6a24f38bc5e674580d2ecddca33c3de306aff34`, 1944 source hashes verified before/after. [Audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/reports/cardrpg-look/closure/audit.json) · [personal review](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/reports/cardrpg-look/closure/REVIEW.md). Original860cases/1720casts were not repeated or overwritten.

| Targeted check | Current measured result |
|---|---|
|Presentation|1024×600,1280×720,1440×900;12 skill rows; phase400ms/finish432ms inside1173ms action; receipt dedup/cancel/account invariance;12 focused tests|
|Startup|3,522,500bytes/11scripts;0Three/model modules/requests;all loaded chunk byte counts/module memberships and normalized entry/preload branches match;8/11scripts binary-identical|
|Cast checks|24hero windows max633.3ms, minimum90.16%≤20ms;8 targeted CPU4 windows max216.6ms/p9583.3ms. The eight pre-change targeted windows peaked at16.8ms; no causal stall-fix claim|
|Cold7|Hub native 925.2–1039.2 ms / CPU4 2834.2–2906.8ms;ready native 6388.4–7184.9 ms / CPU4 10244.6–10264.7ms;peak666.6ms. Targeted gallery page max716.7ms, separate from casts|
|Lifecycle|20natural replays/21snapshots;heap+1,116,232bytes;GPU geometries/textures/programs unchanged;within2MiB tolerance, not literal flatness|
|Effects|6fresh captures/15pairs;minimum0.787730;no absolute/face/overdraw offenders. Incremental Clover row compared with66 retained L4 rows:66improved/0new decreases;1140/2211original-baseline decreases remain, not a fresh full-effect run|

Current missed/unverified gates: Original24MB target exceeded; existing32MB visual allowance applies. Cold7 maximum666.6ms exceeds historical117ms ceiling. Natural-playback cold samples also have post-ready gaps up to400.0ms; minimum96.37%of post-ready frames<=20ms. These default-quality samples are separate from fixed-tier gallery casts. 1440x900-dpr1-cpu4-medium-panko-1/first: max133.3/p9516.8ms. 1440x900-dpr1-cpu4-medium-cinnamon-4/first: max100.0/p9516.8ms. 1440x900-dpr1-cpu4-medium-brioche-4/first: max133.3/p9533.3ms. 1440x900-dpr1-cpu4-medium-velvet-1/first: max216.6/p9583.3ms. Hero first/repeat50ms limit missed in8/24windows; maximum633.3ms. Hero High/DPR1 99%frames<=20ms missed in11/24windows; minimum90.16%. Separate registered ABBA current-artifact windows: 1/4 exceed 50 ms; 2/4 miss 99% coverage at 20 ms; peak 183.4 ms. These are additional observations, not substitutes for the 24 hero windows. Literal heap flatness not established: final growth1116232bytes; tolerance and GPU results separately reported. Original effect-pair non-regression still missed: 1140/2211 distances decrease; incremental unchanged-row reuse, not a fresh full-effects run. Exclusive whole-machine timing isolation not established; shared-lock leases and suspended/closed browser handoffs do not prove that no external load existed. Historical L7 misses remain valid. Registered Clover1 ABBA first/repeat: 1-before:83.3/16.8ms; 2-after:50.0/183.4ms; 3-after:16.8/16.8ms; 4-before:99.9/16.8ms. This small comparison does not clear any failed window or establish a causal patch/driver diagnosis. See closure/COLD-REVIEW.md for GPU-wait evidence. Art scores below are unchanged.

[1024 cooldown layout](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/reports/cardrpg-look/closure/presentation/reviewed/1024-cooldowns.png) · [bounded boss cue](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/reports/cardrpg-look/closure/presentation/reviewed/1280-boss-phase.png) · [Clover effect](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/reports/cardrpg-look/closure/effects/reviewed/clover-runtime-1.png). Receipt smoke is B's renderer with A fixtures, not A's live Invitations. Original failed layout/fixture/effect pilot attempts are preserved.

| User complaint | Before → current | Self-grade/10 | Evidence / limit |
|---|---|---:|---|
|Cat quality|Blocky roster →12 original sculpted cats;13 rebuilt opponents|7|[Panko](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/rounds/roster/panko/round-3/comparison.png),[Yarn](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/rounds/opponents/yarn-giant/round-4/comparison.png);3 look-slice/22 improved|
|Lighting/depth|Flat fill →key/rim/ramp/contact shading|6.5|[L3](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/L3-CHECKPOINT.md):36 face checks; historical Soot separation .0524→.0506, below .18 target|
|Stage richness|Sparse tabletop →cafe textiles/ceramics/plants/night window|6.8|[L2](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/L2-CHECKPOINT.md):50,272 stage triangles/4 meshes;4 Blender/3 runtime rounds; repeated shelves remain|
|Colour/UI harmony|Muddy field →teal/honey palette and12 matching portraits|7|[Refreshed portraits](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/rounds/art/portraits/packed-round-5/portraits-dark.png);A owns icon/frame wiring|
|Effects quality|Thin effects →6 original atlases/ribbons/impact lights|6|L4 distance minimum.6030→.6530;1162 historical strict decreases; closure reduces this to1140 through66 Clover improvements|
|Sharpness|Flat maps →baked detail and1x/2x art|6.8|L1hero1024/L5colour512/detail256;fine grain softens after reviewed compression|
|Post look|Incomplete stack →bloom/grade/focus/vignette/grain/SMAA tiers|7|[L3](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/L3-CHECKPOINT.md):12-sample depth AO,16³ LUTs/3 tiers;no full shadow maps/GTAO/TAA|

Self-grades are personal judgments, not acceptance metrics. All22 selected models have2+ viewed authoring rounds; hero slice had3+. Per-round five-flaw reviews and correction evidence are retained. [Cat poses](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l5/phase-cat-poses/REVIEW.md),[opponent poses](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l5/phase-opponent-poses/REVIEW.md),[fresh-eyes art review](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l5/ART-REVIEW.md) document limitations.

The L7 viewer preserves account/screen state, disposes isolated scenes, works offline, and exercises live A/B plus the historical matched wipe. The skill gallery exercises quarter speed and effect-only at all six desktop configurations. Original loading-overlay captures are preserved in validation/l7/attempts/overlay-1; visible readiness was corrected before recapture. Two later harness selector failures (duplicate comparison label and exact speed-label matching) are retained in attempts/selector-1 and selector-2; only UI configurations resumed, with identical HTML and109 verified unit/stage captures retained.

| Validation | Historical L7 measured result (original artifact retained) |
|---|---|
|Source|Five gates passed; demo-tools TypeScript passed; 1761 web tests; inherited rules: 2 expected failures / 11 skips|
|E2E|421 passed in one suite; original logs and any retries retained in validation/l7|
|Viewer|25 models × 4 angles; 9 stage views; 6 desktop configurations; 34 windows; no page errors, remote requests or overflow; account/screen restored|
|Slice first/repeat|24 High/DPR1 windows; max 16.8 ms; minimum 100.00% of frames ≤20 ms|
|Cold7|Native max 33.3 ms; CPU4 max 133.4 ms|
|Final matrix|860 valid cases / 1,720 casts; 25 owners / 86 actions / 10 configurations; actual quality checked per frame; 134,523 cast frames independently recomputed|
|Matrix active-cast maxima|Independent maxima: frame 266.7 ms; 107 draws; 119,127 triangles; excludes page initialization|
|Lifecycle|20 natural replays after a baseline battle; heap delta +641,528 bytes; GPU delta {"geometries": 0, "textures": 0, "programs": 0}; not 20 different encounters|
|Flag-off|3,522,593 startup bytes; 0 Three/model modules; exact byte-parity delta +93 bytes|
|Video|Five silent 25-second gallery recordings at native canvas size; 6 personally viewed samples each; not natural boss fights or timing evidence|
|Size|31,493,122 bytes; 506,878 bytes below 32 MB; original 24 MB target missed|

Load-to-Hub: native 898.5–923.6 ms / CPU4 2230.1–2292.5 ms. Battle-ready: native 6297.4–6379.6 ms / CPU4 8648.0–9581.5 ms. These small cold samples do not establish causal regressions. Active casts measure different intervals.

The supporting audit checks every retained lifecycle snapshot: 537 geometries, 103 textures and 43 programs remain constant across all 21 snapshots. Heap peak growth is 859,844 bytes; final growth is 641,528 bytes, within the harness's recorded 2 MiB tolerance but not exactly flat. The finite run does not prove the absence of leaks. Replay durations are 14.408–14.430 s at 4× speed. [Supporting audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/support-audit.json) also binds the previously recorded visual/video reviews to their files; it does not claim a second personal review. An overly strict RAF/start-marker assertion was corrected and retained in support-audit-initial-assertion.json; raw measurements and budgets were unchanged.

Matrix configurations: High at 1280×720 / 1440×900, DPR1–2, native CPU; Balanced at both sizes, DPR1–2, CPU4; Low at both sizes, DPR1, CPU4. Six actions per shared-lock window. Budgets: first/repeat ≤50 ms; High/DPR1 ≥99% of frames ≤20 ms; CPU4 Balanced/Low p95 ≤33 ms; ≤250 draws / 150,000 triangles. Counts in audit.json preserve each applicable window that misses its budget.

Timing isolation is NOT VERIFIED: A5-H0 kept a headless page alive between shared-lock leases and lane A reported that ambient rendering was not explicitly suspended. The lock serialized active measurement jobs; it does not prove exclusive CPU/GPU use. [Timing context](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/timing-context.json) preserves that disclosure and its source. Numeric budget comparisons remain observations under these conditions; do not infer isolated-device acceptance or causally attribute stalls. No measurements were restarted or discarded.

| Final matrix budget | Missed / applicable cast windows | Worst observed window |
|---|---:|---|
|First/repeat ≤50ms|4/1720|266.7ms; [1440x900-dpr1-cpu4-medium-cinnamon-4/first](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix/config-5/batch-30/1440x900-dpr1-cpu4-medium-cinnamon-4.json)|
|High/DPR1 ≥99% frames ≤20ms|0/344|100.00%; [1280x720-dpr1-cpu1-high-mochi-1/first](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix/config-0/batch-0/1280x720-dpr1-cpu1-high-mochi-1.json)|
|CPU4 Balanced/Low p95 ≤33ms|4/1032|200.1ms; [1440x900-dpr1-cpu4-medium-brioche-4/repeat](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix/config-5/batch-36/1440x900-dpr1-cpu4-medium-brioche-4.json)|
|Peak ≤250draws|0/1720|107; [1280x720-dpr1-cpu1-high-enemy-yarn-giant/first](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix/config-0/batch-78/1280x720-dpr1-cpu1-high-enemy-yarn-giant.json)|
|Peak ≤150,000triangles|0/1720|119,127; [1280x720-dpr1-cpu1-high-enemy-pantry-crown/first](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix/config-0/batch-84/1280x720-dpr1-cpu1-high-enemy-pantry-crown.json)|

[All missed-cast comparisons](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/CAST-PROFILE-REVIEW.md) and [raw profiles](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/cast-profile-audit.json) retain 4 distinct cast windows, each failed budget, exact slowest frame, overlapping long tasks/animation frames, and recorded callback locations. Every failed window has a row and a proposed next diagnostic. Matching scene-loop and Battle tick offsets are checked against the unchanged JavaScript payload and hashed source files; other callbacks remain unattributed. These are analyses of the original records, not new timing runs. Callback locations alone do not identify a costly operation or establish a cause. p95 values above the exact 33 ms threshold remain misses.

[Missed-cast diagnosis](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/cast-diagnosis.json): Panko-1 repeat at Balanced 1440×900/DPR1/CPU4 records a 150.0ms frame and p95 66.7ms. The cast reaches 92 draws / 99,159 triangles; the slowest frame itself records 87 draws / 98,003 triangles. That frame overlaps a155ms long task. Eight recorded long-animation-frame callbacks during this cast map to the scene loop in the exact decoded JavaScript; no long-animation-frame entry spanning the150ms peak was delivered. This identifies the broad rendering callback, not a shader/model root cause. Profile that callback with verified machine isolation; both budget misses remain counted.

[Startup diagnosis](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/flag-off/startup-diagnosis.json): the 93-byte entry delta is exactly generated preload-header and dependency-index growth; normalized entry bodies and default legacy dependency membership match. The two added dormant entries name three.core and BufferGeometryUtils, but neither was loaded in the recorded default startup. Exact byte parity remains missed. Investigate lazy-route chunk/preload generation in a separate build change; this does not explain or excuse cold-frame stalls.

The gallery matrix also records page initialization and readiness. The table below retains those wider intervals; cast-only budgets do not describe startup performance. These are separate observations from Cold7. [Interval audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix-interval-audit.json) recomputes all 860 rows from 569,780 raw frames.

| Configuration (86 cases each) | Full-page maximum | After Hub maximum | After scene-ready maximum |
|---|---:|---:|---:|
|1280×720 DPR1 CPU1 High|33.5ms|33.5ms|16.8ms|
|1440×900 DPR1 CPU1 High|50.1ms|50.1ms|16.8ms|
|1280×720 DPR2 CPU1 High|50.1ms|33.4ms|16.8ms|
|1440×900 DPR2 CPU1 High|50.1ms|33.4ms|16.8ms|
|1280×720 DPR1 CPU4 Balanced|233.4ms|183.4ms|16.8ms|
|1440×900 DPR1 CPU4 Balanced|666.6ms|666.6ms|266.7ms|
|1280×720 DPR2 CPU4 Balanced|233.4ms|100.0ms|33.3ms|
|1440×900 DPR2 CPU4 Balanced|199.9ms|50.1ms|16.8ms|
|1280×720 DPR1 CPU4 Low|183.4ms|66.7ms|16.8ms|
|1440×900 DPR1 CPU4 Low|183.4ms|50.1ms|16.8ms|

Worst full-page frame: [1440x900-dpr1-cpu4-medium-velvet-4](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/validation/l7/matrix/config-5/batch-42/1440x900-dpr1-cpu4-medium-velvet-4.json), 666.6 ms ending at 6624.9 ms; Hub marker 2725.0 ms, scene-ready 13041.3 ms, first cast 13210.1 ms. Entirely before Hub: False; before first cast: True. Overlapping long-animation-frame entries are retained in the interval audit. Anonymous blob callbacks do not identify a source component; trace loading/script evaluation separately before changing VFX.

L7 adds 125,699 HTML bytes over L5 for the isolated viewer and comparison payload. Embedded asset classes (bytes): flipbooks: 1,416,492; atelier-models: 6,642,384; portraits: 6,672,036; atelier-stage: 1,998,112; classic-models: 2,867,752; textures-and-other: 8,042,804; icons: 20,280. L5 three-model matched compression saved 1,256,540 HTML bytes, with six runtime pairs showing SSIM ≥.978488; fine texture grain remains softer. Full raw portrait sources and L1 hero resolution are retained.

| Unit | Tier | Evidence scope |
|---|---|---|
|Mochi / Soot / Clover|look-slice|L1;3+ rounds;unchanged in L5|
|panko|improved|11769tri;24 fresh poses;48-frame turntable|
|mallow|improved|11758tri;24 fresh poses;48-frame turntable|
|cinnamon|improved|11751tri;24 fresh poses;48-frame turntable|
|biscuit|improved|11759tri;24 fresh poses;48-frame turntable|
|inkcap|improved|11756tri;24 fresh poses;48-frame turntable|
|sorrel|improved|11759tri;24 fresh poses;48-frame turntable|
|brioche|improved|11744tri;24 fresh poses;48-frame turntable|
|velvet|improved|11766tri;24 fresh poses;48-frame turntable|
|marigold|improved|11750tri;24 fresh poses;48-frame turntable|
|button-guard|improved|7774tri;12 fresh poses;48-frame turntable|
|sock-skipper|improved|7784tri;12 fresh poses;48-frame turntable|
|spool-ram|improved|7770tri;12 fresh poses;48-frame turntable|
|needle-moth|improved|7784tri;12 fresh poses;48-frame turntable|
|teacup-healer|improved|7783tri;12 fresh poses;48-frame turntable|
|crumb-sentinel|improved|7790tri;12 fresh poses;48-frame turntable|
|pollen-scout|improved|7780tri;12 fresh poses;48-frame turntable|
|rain-spool|improved|7756tri;12 fresh poses;48-frame turntable|
|binding-thread|improved|7778tri;12 fresh poses;48-frame turntable|
|practice-cushion|improved|7786tri;12 fresh poses;48-frame turntable|
|yarn-giant|improved|19762tri;12 fresh poses;48-frame turntable|
|kettle-knight|improved|11884tri;12 fresh poses;48-frame turntable|
|pantry-crown|improved|19548tri;12 fresh poses;48-frame turntable|

Missed or unverified targets (L7 history retained; closure status above):

- Original 24 MB target exceeded; explicit visual justification recorded for up to 32 MB.
- Historical L7 startup +93bytes; repaired in closure to0byte delta. Loaded module/byte counts match, not all binary hashes.
- Cold-open maximum 133.4 ms exceeds the historical 117 ms ceiling.
- Literal retained-heap flatness is not established: final delta +641,528bytes. The recorded 2MiB tolerance passes and GPU object counts remain constant; neither finding proves an absence of leaks.
- Exclusive timing isolation is unverified because A5-H0 retained an unsuspended page between shared-lock leases. Budget numbers remain observations under these conditions.
- First/repeat ≤50ms: 4/1720 applicable cast windows miss the budget.
- CPU4 Balanced/Low p95 ≤33ms: 4/1032 applicable cast windows miss the budget.
- The separate gallery matrix also records a 666.6ms full-page frame before the first cast. This wider interval includes initialization and casts; it is not counted again as an independent cast failure. See interval table and raw profile below.
- Historical L4 strict uniqueness:1162/2211 pair distances decrease,worst−.122392341;absolute separation passes but non-regression remains missed. Next fix: targeted authored per-pair silhouette/palette/timing edits, then comparable captures.

Historical profiles remain in validation/l7/matrix and validation/l7/COLD-REVIEW.md. Closure repairs the startup byte discrepancy, but the new cold traces show GPU token waits and macOS presentation backpressure, including post-ready gaps; they do not establish a source, driver or external-load cause. Further performance work needs isolated GPU/presentation profiling. The registered ABBA comparison retains stalls in both artifacts and cannot establish a causal improvement. Further atlas/model compression requires matched visual review before accepting texture loss.

Visual limits: Static preview review does not establish continuous collision-free animation. Raised eye rims, rigid cloth/accessories and broad smooth backs remain. Stages reuse cafe geometry with chapter palette changes; shelf repetition and empty rug areas remain. Miniatures sit within broad empty viewport margins; short viewports and the historical wipe require vertical scrolling. Tab state contrast is weak; historical thumbnails and tiny baked captions are softer than the native viewer. Historical L4 strict effect-pair regressions remain open; no new continuous VFX quality claim. Wide video composition makes heroes small; pale thin effects blend with rugs. Yarn Giant retains coarse flat pink ribbons and a friendly expression; Clover arches retain a wire-like appearance. Six samples per silent clip can miss fast impact peaks and do not establish continuous animation quality. The obsolete L6 art-gallery footer is corrected in L7. Review samples do not establish continuous collision-free motion. Five videos: [mochi](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/video/mochi/mochi-x1.webm) · [soot](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/video/soot/soot-x1.webm) · [clover](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/video/clover/clover-x1.webm) · [yarn-giant](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/video/yarn-giant/yarn-giant-x1.webm) · [ultimate](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/video/ultimate/ultimate-x1.webm).

L5 portable evidence remains3440files/1,018,720,566bytes;2,096,889,266bytes of local originals individually hashed. L7 publication inventory separates portable receipts/images/videos from intermediate duplicate artifacts. All authoring uses original Blender/procedural parameters; no generative model or external art imported.

Lane A owns icon/frame wiring, exact earned-reveal forwarding through Invitations/CompanionPreview, adoption and merged delivery. B A4P1/P3/P4 renderer work is now implemented and verified against published version1 fixtures; live A meta/combat integration is not claimed. See [contract](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/reports/cardrpg-look/closure/CONTRACT.md). A has not announced adoption of this checkpoint. No A4/A5 rules runtime, shared/protected edits, merge/deploy/main push. Native macOS Apple M3 Pro; no B Docker jobs, subagents or generative calls.

## B2 · Readable Battle
Mèo/quái lớn hơn, HUD chân dung + bốn biểu tượng kỹ năng, nhà kính Clover có kính/khung mật ong; giữ nguyên mỹ thuật quán đêm và luật chiến đấu.
[Report](https://github.com/ntbaoheyhey/taskbar-hero/blob/f4cd0da0b121ff4e30719fbe14e269421f624fe2/reports/cardrpg-look/b2/B2-REPORT.md) · [offline demo](https://github.com/ntbaoheyhey/taskbar-hero/blob/f4cd0da0b121ff4e30719fbe14e269421f624fe2/docs/cardrpg-look/b2.html) · [lean demo](https://github.com/ntbaoheyhey/taskbar-hero/blob/f4cd0da0b121ff4e30719fbe14e269421f624fe2/docs/cardrpg-look/b2-lean.html). Source `f4cd0da0b121ff4e30719fbe14e269421f624fe2` on `codex/cardrpg-b2-v6-2026-11-08`; [draft #395](https://github.com/ntbaoheyhey/taskbar-hero/pull/395), stacked on #393.
Demo SHA256 `7f4d0fcc694915958c0c38ad54c9722ced944b18b82aadc346cdaede43fe7aae`, 29,812,862bytes. Native casts16.8ms, CPU4casts16.8ms; native cold16.8ms. Fresh closure already had16.8ms casts; no claim to cure historical633.3ms spikes.
[Audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/f4cd0da0b121ff4e30719fbe14e269421f624fe2/reports/cardrpg-look/b2/AUDIT.json) retains the missed opponent luminance ≥0.18 and boss height ≥2× targets, plus preview overlaps. Four sourcegates eachphase, five-seed byte parity,421E2E, startup per-chunk bytes/modules parity, five-battle resource observations; exact counts/results in the report. No merged A5/runtime adoption, merge/deploy/mainpush. Original closure index unchanged.
