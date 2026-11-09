Đã triển khai Skills V5: Burn, Bleed, Bitter, nhiều mục tiêu và bốn phản ứng; trận đấu vẫn tự động.
Đã đo chung bản V5 và bản dự phòng trên khối hạt giống mới 20001–20500; mọi lần thử đều được giữ lại.
Kết quả là PARTIAL: các ô MISS bên dưới vẫn chưa đạt, không được thay bằng kết quả kiểm thử mã nguồn.
Bản demo offline riêng giữ nguyên bản A4; hình ảnh mới của lane B chưa được tích hợp.
Mọi PR vẫn là draft, chưa merge hay deploy; nhận diện trạng thái và mức độ vui của người thật chưa được xác minh.

# A5 gates continued through Skills V5

A5 open gates continue inside Skills V5 (reports/cardrpg-big/skills-v5/). Latest combined acceptance uses20001–20500 with both gameplayV4ON/skillsV5ON and gameplayV4ON/skillsV5OFF. [Full V5 report](../skills-v5/V5A-REPORT.md), [registered method](../skills-v5/REGISTERED-METHOD.md), [TRAIN before/after](../skills-v5/S5-REPORT.md). Historical C1 runtime0e1e15180/sixgates/165UIchecks remain unchanged evidence.

|A5 gate|V5 acceptance|V4 fallback|V5 status|
|---|---|---|---|
|Fourth-slot gain≤12pp|38/384 misses; worst48.40pp|58/384 misses; worst87.40pp|MISS|
|Bare-item gain≤12pp|36/2304 misses; worst47.80pp|22/2304 misses; worst60.40pp|MISS|
|Display share≤10%|4.80%|4.80%|PASS|
|Static Spearman≥.6/chapter|0.46/0.34/0.20|0.59/0.52/0.32|MISS|
|Cats55–75%, each top pick|50.70%–78.72%|61.83%–86.82%|MISS|
|Reference fixture median55–60%|32.40%|66.60%|MISS|
|Sets35–75%, leading niche|73.38%–94.35%|79.83%–92.55%|MISS|
|Coherent gain10–25pp|31.20pp|-16.00pp|MISS|
|≥4near-best crews/boss+elite|142/11/34/220/220/220/220|46/66/126/220/220/220/220|PASS|
|Tier comparisons≥44/48,0reversals|37/48; reversals0|46/48; reversals0|MISS|
|Bands≥15pp,no saturation|12/33 misses|0/33 misses|MISS|
|Regular Legendary by7≥35%|100.00%|100.00%|PASS|
|Regular Legendary by14≥70%|100.00%|100.00%|PASS|
|Heavy Legendary median earlier|median day 5.00 heavy / 6.00 casual|median day 5.00 heavy / 6.00 casual|PASS|
|Regular selector median≤21|median day 9.00|median day 9.00|PASS|
|Casual selector median≤35|median day 10.50|median day 11.00|PASS|
|Heavy selector uncensored|0/30 censored|0/30 censored|PASS|
|Every heavy/casual ratio ≤3×|paidPulls 1.30×; fish 1.26×; threads 1.46×; stamps 1.31×; essence 3.31×|paidPulls 1.22×; fish 1.17×; threads 1.36×; stamps 1.23×; essence 2.25×|MISS|
|Casual day-7 win in first two attempts ≥50%|15/30 (50.00%)|20/30 (66.67%)|PASS|
|Regular day-7 win in first two attempts ≥70%|20/30 (66.67%)|24/30 (80.00%)|MISS|
|Heavy day-7 first-attempt win ≤95%|16/30 (53.33%)|29/30 (96.67%)|PASS|
|Every loss has an available improvement|52/54 losses|27/28 losses|MISS|
|Local collectible gain≤3pp|0.00pp|0.00pp|PASS|

[Cadence, startup and natural day7](../skills-v5/S8-REPORT.md): reward gap929.86s **MISS**; dead-time reduction-10.44% **MISS**; first fight14.34s **PASS**; real-click day-7 boss 130.13 s, target 45–90 s: **MISS**. Meaningful offers80 **PASS**.

Default startup bytes **PASS**, task median/max **MISS**; offline size20961816 **PASS**, coldCPU4183.30ms **MISS**. Invitation CDF0.456811pp **PASS inherited** with unchanged odds sources. No new10k-account odds sample claimed.

C1/E1/E2 functional paths: retained dev=1 gating, keyboard placement, pending map action order, stable Home band, available Result advice, named contributions, crew plans and discoveries. [Z pack](../skills-v5/s6/z/summary.json):126captures, overflow0, minimumcontrast1.62 **MISS**. Legacy-look contrast and six fallback/plate overlaps remain **MISS**; default Look V2 contrast6.24:1 **PASS**. Field guide copy is **MISS**; all six route-labelled captures show Prepare, leaving settled map coverage **NOT VERIFIED**. [Review](../skills-v5/s6/visual-review/REVIEW.md). Human recognition/enjoyment **NOT VERIFIED**.

[First-week progression](B3-PROGRESSION.md), [historical opening](E3-FIRST-FIVE-MINUTES.md), [current elapsed opening](../skills-v5/S8-ENGAGEMENT.md), [fresh-eyes](../skills-v5/FRESH-EYES.md), [playtest kit](../skills-v5/PLAYTEST-KIT.md). Historical timings are not substituted for current timing misses.

Legacy OFF 8250 digest `47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3`; fallback A5 battles/routes exact; baseline-v1 and 13 historical sims exact; old-save migration tests PASS. Full source checks and retained failures: [closure](../skills-v5/s6/audit.json).

[Separate offline V5 demo](../../../docs/cardrpg3/skills-v5.html):20961816bytes/SHA4e310b07f9dfb005abdff830d498e8d0f6615553e1710a2ce12eeedad3a3638e. Main A4 index unchanged. [Draft stack](../skills-v5/STACK.md). B live presentation preview remains separate; no merge/deploy/on-chain action. Any later retune needs registered30001–30500.
