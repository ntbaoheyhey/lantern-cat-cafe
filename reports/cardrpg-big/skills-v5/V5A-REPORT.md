Đã triển khai Skills V5: Burn, Bleed, Bitter, nhiều mục tiêu và bốn phản ứng; trận đấu vẫn tự động.
Đã đo chung bản V5 và bản dự phòng trên khối hạt giống mới 20001–20500; mọi lần thử đều được giữ lại.
Kết quả là PARTIAL: các ô MISS bên dưới vẫn chưa đạt, không được thay bằng kết quả kiểm thử mã nguồn.
Bản demo offline riêng giữ nguyên bản A4; hình ảnh mới của lane B chưa được tích hợp.
Mọi PR vẫn là draft, chưa merge hay deploy; nhận diện trạng thái và mức độ vui của người thật chưa được xác minh.

# Skills V5 lane A — PARTIAL acceptance

One registered combined run:500 seeds/cell, **20001–20500**, both configs. TRAIN1–500 remains separate;10001–10500 contaminated;30001–30500/40001–40500 unused. Rules unchanged after the first held-out observation. [Method](REGISTERED-METHOD.md), [TRAIN](S5-REPORT.md), [shipping](s6/on/numeric-gates.json), [fallback](s6/off/numeric-gates.json). Numeric counts: shipping 21PASS/21MISS; fallback 17PASS/25MISS.

|Appendix target|Now reference|Measured prefix180 / full4500; fallback separately|V5 status|
|---|---|---|---|
|Multi-foe damage≥30%|9.1%|32.57% / 32.66%; fallback 9.66 / 9.10|PASS|
|Multi-ally support≥35%|19.4%|29.27% / 29.79%; fallback 19.48 / 19.35|MISS|
|≥2 announced reactions; each ≥40% of its named crew battles|~4.8unannounced|6.52 / 6.70; fallback 0.00 / 0.00; crumb-burst 100.00%, wildfire 98.07%, rupture 100.00%, spread 54.13%|PASS|
|Every cat ≥1 ultimate/normal|2–3% of actions|75.83% / 77.67%; fallback 66.67 / 66.67 battles meet every-cat condition|MISS|
|Normals 8–12 rounds; earned boss 45–90 s|17.3 all-encounter rounds|13.34 / 13.24; fallback 13.18 / 13.21; earned boss 130.13 s MISS; 16/18 fixed/Home bosses within45–90s|MISS|
|Each keyword ≥1/3 battles; cleanse ≥3% support|cleanse 0.1%, old scope|Original probe keywords PASS; named-crew D3 MISS (30/32); cleanse 12.49% / 13.11%; fallback 6.60 / 6.63|MISS|
|4 approved crews within5pp; cats 55–75%|Unmeasured|Named crews MISS; cats 50.70%–78.72%|MISS|
|Cast≤16.8ms; draws≤130; demo+≤1.5MB|16.8ms/115draws|16.80ms/234draws/+31975bytes; inherited renderer|MISS|
|Readability ≥4/5 after 2 fights|Unmeasured|No human answers; ready-scene fallback/HP-plate overlaps 6; [playtest kit](PLAYTEST-KIT.md)|NOT VERIFIED|
|Compatibility; old saves|A5 runtime0e1e15180|Legacy8250 and fallback 180 battles/45 routes exact; save migration tests pass|PASS|

A5 carried gates use the same500 seeds. Values are shipping/fallback, not a claim that either satisfies all gates. Full outcomes, Wilson intervals, paired differences and source hashes remain in each mode’s receipt audit. Paired [fourth-slot](s6/EQUIPMENT-REVIEW.md), [bare-item](s6/BARE-ITEM-REVIEW.md), [boss crew](s6/BOSS-CREW-REVIEW.md), [elite](s6/ELITE-REVIEW.md), [set](s6/SET-REVIEW.md), [tier](s6/TIER-REVIEW.md), and [earned progression](s6/PROGRESSION-REVIEW.md) reviews retain gains, regressions and saturated fixtures.

|A5 gate|V5 measured|Fallback measured|V5 status|
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

|Other inherited gate|Measured|Status|
|---|---|---|
|First fight won≤25s|14.34s|PASS|
|30 min reward gap≤300s|929.86s; Home03 723s|MISS|
|Combat dead time−40%|-10.44%; Home03 2.0%|MISS|
|≥5 meaningful offers at 30 min|80; fixed-policy proxy|PASS|
|Default loaded JS +≤150k; CPU no worse|1280/CPU1: 149485bytes/PASSmedian/MISSmax; 1280/CPU4: 149485bytes/MISSmedian/PASSmax; 1440/CPU1: 149485bytes/MISSmedian/MISSmax|MISS|
|Offline≤24MB; coldCPU4≤120ms|20961816bytes;183.30ms|MISS|
|Three widths/both looks; contrast≥4.5|126captures;0overflows;Look V2 ON min6.24:1 (PASS); OFF min1.62:1 (81 scan failures)|MISS|
|Fallback strip clears visible HP plates|6 overlaps across four of six ready-scene captures (1280/1024; both looks)|MISS|
|Conditional invitation CDF ≤1 pp|Earlier0.456811pp; seven unchanged source inputs checked|PASS inherited; no new odds sample|

Addendum D3 **MISS**, D4 **MISS** (10/12 cats), D5 **PASS**. [Per-cat skills, per-crew keywords/reactions/shapes and P-shot seeds](s6/on/DESIGN-REPORT.md). Self-score **6.16/10**, target 8: **PARTIAL**; Variety in play 7.14 at 30%; Balance gates 5.00 at 30%; Fight pacing 2.59 at 20%; Compatibility/honesty 10.00 at 20%. [Evidence/arithmetic](S6-SELF-SCORE.md). Next-phase priorities: Fight pacing; Balance gates. B04:56MX reporting request adopted: mochi skill2 0.44% (MISS against5%floor); panko skill2 0.35% (MISS against5%floor); the full D4 upper limit remains60%. Exact TRAIN replays found these skills legal but passed over; no acceptance retune was made for presentation.

Delivery self-review: [147 captures reviewed](s6/visual-review/REVIEW.md); in-game Field guide still uses legacy wording/rules (**MISS**), while the Companions glossary and standalone guide use V5 copy. All six night-route captures show Prepare, so settled route-map screenshot coverage is **NOT VERIFIED**. No repeated pack or replacement sample.

Source checks: type/lint/1785web/1262rules/build PASS; E2E420PASS/1clockFAIL in the original full run, unchanged failed test1/1PASS in isolation. Details and original failures in [closure](s6/audit.json). Source checks never override numeric misses. [S8](S8-REPORT.md), [fresh-eyes self-review](FRESH-EYES.md), [guide](../../../docs/cardrpg3/skills-v5-guide.html). Bot/proxy results do not establish human enjoyment.

Compatibility SHA256: OFF `47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3`; fallback battles `c29ec7d2cfb9fbd46aa32b363ade8bc84b3100d558bb646aa4ea04b80f49d031`; fallback routes `b85feeb659f013dfd1817d452d233d6c48f8f3e1402e4c5625bf760e49341540`. Baseline-v1 and13historical sims are exact.

[Offline demo](../../../docs/cardrpg3/skills-v5.html): 20961816bytes, SHA256 `4e310b07f9dfb005abdff830d498e8d0f6615553e1710a2ce12eeedad3a3638e`. Build source d498f97a98f257b2822723f276adf8de7a866040; main index.html remains A4. [Delivery lineage](s6/delivery.json).

Remaining: combat distributions, named-crew gaps, reference-fixture calibration and static display need a new TRAIN candidate. Policy horizon, Black cup55→85 and320display fits remain rejected. Cinnamon’s approved ally splash and no-casualty team ultimate are implemented; unresolved keyword/skill-use gates remain explicit in the design table. Any retune after acceptance must use a newly registered30001–30500 block.

B [DRAFT420](https://github.com/ntbaoheyhey/taskbar-hero/pull/420) is a separate live integration preview. Its published natural cue coverage and presentation measurements are not A acceptance evidence; the original130-draw target remains unchanged. [Presentation boundary](B-PRESENTATION-BOUNDARY.md). No B-owned/protected edits, new runtime dependencies, model helpers, desktop control, merge or deployment.

Draft stack and phase publication receipts: [STACK.md](STACK.md).
