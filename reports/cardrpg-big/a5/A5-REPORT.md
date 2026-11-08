Luồng mở đầu đã có đặt mèo, mở lời mời, chọn trang bị và đọc manh mối boss.
Boss ngày 7 thắng sau một gợi ý cụ thể trong ca chơi đã ghi hình; 90 tài khoản mô phỏng đạt mục tiêu TRAIN.
Hush đã được sửa để không biến lượt hồi máu thành đòn đánh hoặc ghi nhận hồi máu không có thật.
Cân bằng trang bị, một số mèo, nhịp thưởng 30 phút và hiệu năng khởi động vẫn còn thiếu hoặc chưa đạt.
Đây là báo cáo tiến độ A5, chưa phải nghiệm thu; mọi PR vẫn là draft, chưa merge hay deploy.

# A5 checkpoint — acceptance remains open

Runtime source: `e14d320ed` (eligible reserve advice). Six source checks and the exact OFF digest pass; [source-bound closure](e1-crew-advice-band/audit.json). Hush correction remains unchanged. This report separates historical evidence from current-source TRAIN diagnostics. Bots are proxies, not a human playtest. Fresh acceptance seeds20001–20500 remain UNUSED; old10001–10500 are contaminated.

## Play experience and progression

|Target|A4 / H0 before|Latest measured A5 evidence|Status and scope|
|---|---|---|---|
|First fight ≤25s|H0 original opening retained|12.775–12.999s; later anchored regression13.067–13.139s|PASS, three widths|
|Place, equip and invite by3min; scouted map by5min|Developer controls and form preparation|Placement/invite/equip19.590–26.939s; map41.862–49.171s|PASS, automated clicks without reading time|
|Meaningful choice offers,0–5/30/60min|17 /75 /98|Opening includes placement, paid crafting and route choices; full30/60min not repeated|NOT VERIFIED for elapsed A5 session|
|Rewards / celebrations,0–5/30/60min|8/18/18 rewards;4/6/6 celebrations|Stars and discoveries work; full cadence not measured|NOT VERIFIED:3–5min target|
|Combat dead time reduced ≥40%|128.642 /896.670 /1886.883s; max30min reward gap775.271s|No comparable full-session receipt yet|NOT VERIFIED|
|Player controls, copy and navigation|Six visible developer buttons; verbose forms|dev=1 gating, keyboard/click placement, filtered equipment actions|C1 functional PASS; wording is not retention evidence|
|Named result, available retry, forecast|Generic result advice|Named contributions; one available change;20-seed worker, CPU1 max56.8ms on boss route|E1 functional PASS; advice can worsen a retry|
|Day7 real-click x1 boss|H0 defeat52.368s|Victory64.921s; same route loses with the old plan|PASS, one paired earned fixture on anchored source|
|Day7 casual / regular first-two wins|10/30 /14/30 after early E2|26/30 /28/30 after fresh45day anchored replay|TRAIN PASS; latest Hush preserves90saved-input wins|
|Heavy first win ≤95%; advice available|17/30; three unavailable suggestions overall|28/30 first wins;24/24losses receive advice|TRAIN PASS; heavy advised0/2 vs no-advice2/2 retained|
|Legendary by7≥35%, by14≥70%; style medians differ|Regular6.7% /10%; all medians day33|Anchored reward gates pass; casual/regular/heavy median6/5/5|TRAIN PASS; not a fresh cohort on Hush22|
|Chosen reward regular≤21, casual≤35; heavy uncensored|All styles censored by45|Anchored medians casual10, regular9, heavy9; none censored|TRAIN PASS|
|Earned heavy/casual ≤3×|Maximum2.726×|Anchored maximum2.253546× across currencies/paid draws|TRAIN PASS|
|Conditional invitation CDF ≤1pp|0.640337pp|0.456811pp, three banners×10,000accounts|PASS on changed reward rules|

Evidence: [H0](H0-FIRST-SESSION.md), [C1](C1-PLAYER-SCREENS.md), [rewards and first-week table](B3-PROGRESSION.md), [earned retry](B3-DAY7-RETRY.md), [E1](E1-CHOICE-PAYOFF.md), [E2](E2-GOALS-CELEBRATIONS.md), [E3](E3-FIRST-FIVE-MINUTES.md). Choice offers can differ only in HP/action count; they are not98 distinct strategic ideas.

## Balance — old acceptance versus current TRAIN, not paired acceptance

|Gate|A4 heldout500|Current Hush22 TRAIN50|Status|
|---|---:|---:|---|
|Single piece ≤12pp including fourth slot|Worst93.4pp;31outliers|68/384fourth-slot misses; worst88pp|MISS; bare2304cells not rerun|
|Displayed share ≤10%|≤4.80%|≤4.51%|TRAIN PASS alone does not validate impact|
|Display correlation ≥0.6 per chapter|Not registered in A4|0.644 /0.547 /0.432|MISS, chapters2/3|
|Adjacent tiers ≥44/48; zero reversals|46/48;0reversals|23/24TRAIN steps;0reversals|PARTIAL; fresh half unmeasured|
|Bands ≥15pp spread; no saturation|33/33|Two of33 miss|MISS|
|Cats55–75%; each a top pick|31.38–64.66%|61.70–86.61%; each has top-pick cells|MISS|
|Sets35–75%; each declared niche leads|67.03–79.60%|76.75–92.25%; original fixture has ineligible carriers|MISS; revised fixture still diagnostic|
|Crew gain10–25pp|47.73pp|24.67pp|TRAIN PASS in original boss fixture only|
|At least4near-best distinct crews per boss/elite|Not registered|Boss40/76/130; best100%; current elite coverage missing|PARTIAL; saturation limits interpretation|
|Matched-power tolerance ±2%|0.99438–1.00569|Assertions preserved in every registered matched cell|TRAIN PASS|
|Collectible paired gain ≤3pp|0pp,6000encounters|No changed collectible power; current full replay pending|NOT VERIFIED on latest source|

[Root cause](B1-ROOT-CAUSE.md): ordinary main stats dominate28/31original cliffs; isolated set4 gain is zero in the large chapter3 cases. [Fixture diagnosis](B2-FIXTURE-CALIBRATION.md) retains both saturated original scenes and the common calibrated scenes. [Carrier audit](B2-SET-CARRIERS.md) proves Emberfelt's original trio cannot apply Scald. These findings do not relax numeric gates.

[Hush correction](B2-HUSH-ATTRIBUTION.md):144controlled cases PASS;72OFF streams exact. All1,321TRAIN cells are paired with original current16. One Soot/Sorrel/Velvet team falls32→28wins out of50; all other outcome cells are exact. All90previously earned day7 wins/advice/costs remain unchanged, but seven post-route state hashes differ. This is a gameplay timing correction, not only copy.

[Support trials](B2-SUPPORT-KITS.md): eligible gear plus Hush lifts bottom cats; adding rescue rest leaves Cinnamon79.76% and raises crew gain26→27.5pp. Neither the cooldown nor fixture revision is adopted. [Pressure spread](B1-PRESSURE-FOLLOWUP.md) reduces fourth-slot cliffs in500TRAIN seeds but fails other gates and adds predictability cost; rejected. All attempts and negative pairs remain retained.

## Size, compatibility and delivery

P1 lossless artifact20,816,833bytes; later B3 reviewed artifact20,922,529bytes, versus A4's26,215,694. The ≤24MB target passes for those measured artifacts. Default requested JS delta+149,416bytes versus registered main340f88b9 meets+150,000; current-main comparison still needs Z.

P1 default CPU median/max ms:1280CPU1 main295.7/368.1 versus candidate298.0/532.6 MISS;1280CPU4 1047.3/1114.4 versus1006.3/1046.8 PASS;1440CPU1 285.4/293.4 versus303.4/329.2 MISS. Three observations each, none discarded. Offline CPU4 full-opening max266.6ms exceeds120ms: MISS. [Individual observations](P1-SIZE-STARTUP.md).

Latest advice source typecheck/lint/web1746/rules1192/E2E421/build PASS; original logs and two expected-failure/eleven skipped rule cases are retained. Latest OFF165cells/8250routes exact digest47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Baseline-v1 SHA9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3 and13historical sims unchanged. THC7/THC12 migrations and THC13 journal are covered by source tests.

Reviewed preview: [B3 game](b3/closure/artifact/index.html), SHA60407a0bd423386c66d86f50b88d867a3a7fe89bee357836a3da1ae6796432a7. It predates the two Hush fixes. [Opening walkthrough](../../../docs/cardrpg3/a5-first-5-minutes.html) uses E3 screenshots/timeline. Public [game](../../../docs/cardrpg3/index.html) and [guide](../../../docs/cardrpg3/gameplay-v4.html) remain A4, SHA067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1 /9dca8fe648d6e101de89ffa02099249327615648989b1207f7e7183c6c0d0482. Z will rebuild and replace them only after review.

Draft stack: [376](https://github.com/ntbaoheyhey/taskbar-hero/pull/376) → [377](https://github.com/ntbaoheyhey/taskbar-hero/pull/377) → [379](https://github.com/ntbaoheyhey/taskbar-hero/pull/379) → [381](https://github.com/ntbaoheyhey/taskbar-hero/pull/381) → [382](https://github.com/ntbaoheyhey/taskbar-hero/pull/382) → [383](https://github.com/ntbaoheyhey/taskbar-hero/pull/383) → [384](https://github.com/ntbaoheyhey/taskbar-hero/pull/384) → [385](https://github.com/ntbaoheyhey/taskbar-hero/pull/385) → [386](https://github.com/ntbaoheyhey/taskbar-hero/pull/386) → [388](https://github.com/ntbaoheyhey/taskbar-hero/pull/388) → [394](https://github.com/ntbaoheyhey/taskbar-hero/pull/394) → [396](https://github.com/ntbaoheyhey/taskbar-hero/pull/396) → [397](https://github.com/ntbaoheyhey/taskbar-hero/pull/397). Hush source closure and remote draft are verified.

B requests remain: automatic-action/crew/formation cues; phase≤400ms and finish≤800ms; exact v1 earned invitation and v2 discovery rendering. A forwards receipts and preserves dev gating; no B checkpoint is adopted. B2 V0–V6 is published through draft395; its separate renderer/performance receipts are not A5 integrated evidence. No B source adopted.

Companion-job copy and eight mode-correct set tooltips pass216paired replays and separateON/OFF three-width checks; [report](C1-COMPANION-JOBS.md). Capabilities are not best-team rankings.

Remaining work: B1/B2 numeric closure and display calibration; fresh registered acceptance and earned cohorts on selected combat; full0–30/60min engagement; last-artifact screenshot pack; startup; guide refresh and fresh-eyes self-review. [Human playtest kit](PLAYTEST-KIT.md) is ready; no human answers or retention claim. Promotion to live and any future on-chain step remain user decisions after review; no such approval is requested at this checkpoint.

[Reserve advice](E1-RESERVE-ADVICE.md): under-level reserves excluded, invalid swaps rejected atomically; earned Mallow1→5 costs250fish/8threads and applies at band5 across three widths/bothlooks. Corrected same-band90save arms are exact (0improved/0worsened); original +6gain is withdrawn. Original24losses retain available advice; both heavy advised retries still lose. Latest artifact20,923,417bytes, SHA4b15da6dbe4701c1383bf296decd30800f582c61e318447fd8f74b952493a665; no startup remeasurement.

[Queued-reply trials33–35](B1-QUEUED-REPLIES.md) are rejected: full-value33/34 saturate364before/384after builds; emergency35 retains96piece misses and makes heavy30/30 first wins. Current-source30minute engagement01 is registered/running; no completed cadence result yet.
