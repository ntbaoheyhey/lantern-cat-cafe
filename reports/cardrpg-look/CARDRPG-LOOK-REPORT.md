# Báo cáo LOOK — checkpoint L5, còn L7
Đã dựng lại 9 mèo còn lại, 10 đối thủ thường và 3 boss bằng Blender; tổng 25 mô hình Look đã có trong demo.
Đã làm mới 9 chân dung từ chính mô hình đã chọn; bộ 12 chân dung, 48 icon và 4 khung giữ nguyên giao diện dữ liệu.
Đã xem 372 tư thế mới và 6 góc của mỗi mô hình trong 22 turntable; mẫu chụp không chứng minh toàn bộ chuyển động hết va chạm.
22 mô hình mới ở mức “đã cải thiện”; viền mắt, quần áo cứng, chân đơn giản và hơi nước đặc vẫn còn hạn chế.
Typecheck/lint/unit/build qua; E2E có 420 ca qua lượt đầu và 1 ca qua chạy lại, không phải 421 ca qua một lượt.
Demo 31,367,423 byte, vượt 24 MB nhưng dưới 32 MB; còn 632,577 byte dự phòng.
24 lượt thi triển đầu/lặp đạt đỉnh 16.8 ms; tải lạnh được báo cáo riêng.
Chân dung chạy trong Collection/Team; icon và khung có gallery riêng để lane A tích hợp.
Chưa chạy ma trận cuối, 20 trận kiểm tra bộ nhớ hoặc CPU×4 Balanced/Low trên bản L7.

REFERENCE: docs/cardrpg-look/index.html; reports/cardrpg-look/validation/l5/audit.json; reports/cardrpg-look/validation/l5/selection.json; L5-BATCH1-CHECKPOINT.md; L5-BATCH2-CHECKPOINT.md; L5-BATCH3-CHECKPOINT.md; L5-OPPONENTS-CHECKPOINT.md

L5 source `c5048bee`, artifact `1171b9ecddafc0f8c015d79989cb1bbeedc85be382e2055dce6ad8d008215b26`, 31,367,423bytes/1913 hashed inputs. Stacked on [L6 draft371](https://github.com/ntbaoheyhey/taskbar-hero/pull/371), accepted A3`daba7d7c`. L5 publication reference is recorded in memory/STATE.md after the remote tip is verified. Historical L1–L6 readings retain their original artifacts.

| User complaint | Before → current | Self-grade/10 | Evidence / limit |
|---|---|---:|---|
|Cat quality|Blocky roster →12 original sculpted cats;13 rebuilt opponents|7|[Panko](rounds/roster/panko/round-3/comparison.png),[Yarn](rounds/opponents/yarn-giant/round-4/comparison.png);3 look-slice/22 improved|
|Lighting/depth|Flat fill →key/rim/ramp/contact shading|6.5|L3 face checks;dark coat separation remains weak|
|Stage richness|Sparse tabletop →cafe textiles/ceramics/plants/night window|6.8|L2 four Blender/three runtime rounds;uniform shelves/shades remain|
|Colour/UI harmony|Muddy field →teal/honey palette and12 matching portraits|7|[Refreshed portraits](rounds/art/portraits/packed-round-5/portraits-dark.png);A owns icon/frame wiring|
|Effects quality|Thin effects →6 original atlases/ribbons/impact lights|6|L4 distance minimum.6030→.6530;1162 strict pair decreases remain|
|Sharpness|Flat maps →baked detail and1x/2x art|6.8|L1hero1024/L5colour512/detail256;fine grain softens after reviewed compression|
|Post look|Incomplete stack →bloom/grade/focus/vignette/grain/SMAA tiers|7|Compact AO;not full shadow maps/GTAO/TAA|

Self-grades are personal judgments, not acceptance metrics. All22 selected models have2+ viewed authoring rounds; hero slice had3+. Per-round five-flaw reviews and correction evidence are retained. [Cat poses](validation/l5/phase-cat-poses/REVIEW.md),[opponent poses](validation/l5/phase-opponent-poses/REVIEW.md),[fresh-eyes art review](validation/l5/ART-REVIEW.md) document limitations.

| Validation | L5 measured result |
|---|---|
|Source|Type/lint/unit/build exit0;1761web/1020rules/581Supabase/32chain/24auth/16contract;2expectedfail/11skip inherited|
|E2E|420 passed initially;1 unchanged-source focused retry passed. Not one clean421-case run;original logs in[receipt](validation/l5/source-gates.json)|
|Rigs|22 raw+22 packed exact pivot audits;all within triangle limits;9cat36clip/198trajectory comparisons;not collision proof|
|Visual coverage|66 stills/3desktop sizes;216cat+156opponent poses;1056 turntable frames audited/132 angles personally reviewed|
|Art/UI|72 images×3gallery sizes;6actualUI configs/180 decodes/24 account-preserving toggles;0errors/remote|
|First/repeat|24 High/DPR1 windows;MAX16.8ms;minimum100.00%frames≤20ms;0errors|
|Cold7|NativeMAX33.3ms;CPU4MAX133.3ms|
|Flag-off startup|3,522,593bytes;0Three/model modules;exact parity delta+93bytes|
|Size|31,367,423bytes;24MB miss;≤32MB allowance supported by[size evidence](validation/l5/size-justification.json)|
|Final-only|860 valid action/config cases across25owners/86actions/10configs;20battle lifecycle;CPU4Balanced/Low remain UNRUN|

Load-to-Hub native900.6–918.9ms/CPU4 2255.7–2287.3ms; battle-ready native6283.1–7344.1ms/CPU4 8709.7–9681.9ms. Cold page maxima include opening; active-cast windows measure a different interval. No causal attribution from these small samples.

L5 adds4,974,831HTML bytes versusL6. Embedded asset bytes: flipbooks 1,416,492; atelier-models 6,642,384; portraits 6,672,036; atelier-stage 1,998,112; classic-models 2,867,752; textures-and-other 8,042,804; icons 20,280. Three-model matched compression saved1,256,540HTML bytes with6runtime pairs SSIM≥.978488 and0CSSpx bounds delta;22-model counterfactual size was not measured. Fine texture grain is softer. Full-resolution raw sources remain available for portraits; L1hero resolution unchanged.

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

Measured gate misses:

- Original 24MB target exceeded; visual justification for up to32MB recorded.
- Exact startup byte parity: +93 bytes.
- Cold-open max 133.29999999999995ms exceeds historical117ms ceiling.
- Historical L4 strict effect uniqueness:1162/2211 pair distances decrease,worst−.122392341;absolute threshold checks pass. This remains unresolved.
- Final L7 matrix/lifecycle20/CPU4Balanced+Low are unrun. L4 peak107calls/118752tri is historical and does not prove current full-roster peak cost.

Visual limits: raised eye rims, rigid cloth/props, angular feet/tails, weak Rain Spool eyes, solid Teacup steam, coarse Yarn strands and overly friendly bosses. The L5 separate art-gallery footer still has obsoleteL6 text claiming nine inherited models; current manifest/images are correct. Copy correction is staged forL7, preserving immutableL5 evidence.

Portable L5 evidence: 3440files/1,018,720,566bytes; local-only originals: 1278files/2,096,889,266bytes, individually hashed in evidence-inventory.json. Portable set includes all author rounds, turntables,66phase stills,all motion sheets and each action at36%. Intermediate GLBs/pilotHTML/raw poses and4.8GB historicalL4frames stay local; no full-raw publication claim.

Lane A can consume the unchanged portrait/skill icon/frame keys; all12 portraits now come from original selected models. A4P1/P3/P4 optional presentation requests remain open and unadopted; A owns meta UI, icon/frame wiring and merged delivery report. L7 adds viewer/gallery/video/final measurements next. No shared/protected/rules edits, merge/deploy/main push, subagents or generative calls; native macOS, no B Docker jobs.
