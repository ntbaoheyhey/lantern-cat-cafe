# A5 B3 — earned invitations and a reachable chosen reward

Phần nhận thưởng đã được đối chiếu lại bằng lệnh chơi thật trên 90 tài khoản mô phỏng.
Legendary từ lời mời đến sớm hơn; phần thưởng tự chọn không còn bị kẹt quá 45 ngày.
Giá đổi, xác suất và giới hạn trên màn hình dùng cùng quy tắc với phần nhận thưởng.
Tiến độ cũ được giữ khi đổi chế độ; không trừ ngược phần thưởng đã kiếm.
Trận boss ngày 7 và cân bằng chiến đấu vẫn chưa được nghiệm thu.

Status: reward source and targeted UI checks PASS; B3 overall remains PARTIAL. Combat remains A4. Fresh combat acceptance seeds20001–20500 remain unused. These bots are proxies, not a human playtest. The clock advances synthetically; this is not 45 elapsed days.

## Reward rules and evidence

Only gameplayV4 changes: shared stamp earn allowance180→360/day; selector60→24 marks; Legendary soft pity41→13 with +7 percentage points per draw; guarantee60→24. Base odds,150-stamp price,30-draw daily limit, independent pity groups, featured guarantee and gear/edition caps stay intact. Existing over-threshold counters guarantee the next draw and retain all earned marks.

The source correction preserves currency already earned when switching OFF. The corrected cohort checks every account-day against the original candidate01, not just the final totals. See [corrected receipts](b3/reward-validation-02/summary.json), [original cohort](b3/reward-confirmation-01/RESULTS.md), and [invitation distribution](b3/invitations-01/RESULTS.md).

| Style | A4 first paid Legendary median | A5 paid Legendary median | A5 chosen median | Censored chosen by45 |
|---|---:|---:|---:|---:|
| Casual |33|6|11|0/30|
| Regular |33|5|9|0/30|
| Heavy |33|5|9|0/30|

Regular paid-Legendary reach:100% by7 and14 (targets35%/70%). Casual:93.3% by7 and100% by14. Separate all-source Legendary observations include owned route gear and selectors; the corrected summary, not the paid-only table, determines those gates.

Heavy/casual earned ratios: fish1.194715, threads1.393872, stamps1.253482, essence2.555856, paid draws1.248143; all≤3. These results use A4 combat and must be remeasured after B1/B2 adoption. They do not establish day7 first-two-attempt victory.

The same earned receipts still expose the combat wall: by the end of day7, all three chapters are cleared by0/30 casual,9/30 regular and26/30 heavy accounts. This is a cumulative-clear observation, not the registered first-two-attempt gate. Better invitations alone have not fixed natural chapter progression.

Three banners each have10,000 accounts×60 actual draws. Maximum conditional-CDF deviation0.456811pp≤1. Original seeds, exact source overlays and failed attempts remain preserved. Fixed-bankroll invitation sampling validates odds, not earned progression.

## First-week route

These are suggested goals, not new calendar locks or guaranteed drops. All tools are available when their existing progress requirements are met. Tomorrow's service and currency allowance reset at the next UTC day; rewards still require the normal actions.

| Day | Goal / already available tool | Earned progress to chase | Tomorrow |
|---|---|---|---|
|1|Place a sturdy cat in front; finish the practice lesson|Free welcome, first route reward|Compare a useful piece; fresh daily allowance|
|2|Equip one piece and compare its changed stats|Gear discovery, capped board reward|Use earned stamps for another invitation|
|3|Open an earned invitation; read next-draw odds|Permanent selector marks|Try a different crew combination|
|4|Try a crew job and standing plan before fighting|A coherent team and journal discoveries|Save a useful loadout|
|5|Save a shift and compare a spare item|Keep the current kit; chase a matching set|Read the boss's visible guide|
|6|Read the next boss's intent before the route|Prepare an affordable upgrade|Challenge the next uncleared chapter|
|7|Challenge the next uncleared chapter|Boss clear and its normal capped rewards|Replay with another crew; fresh daily allowance|

The Hub displays the suggested goal and tomorrow's two service opportunities / up to360 earned stamps. It promises an allowance and an action, never an automatic Legendary or an unlock that has not been implemented. Scouted route clues and discovery celebrations remain E1/E2 work.

## Open gates

- Reward-cohort gates: see corrected summary; original numeric gates are retained.
- Day7 regular≥70%, casual≥50% first-two-attempt victory; heavy first-attempt≤95%: NOT VERIFIED on selected A5 combat.
- Real-click earned day7 boss45–90s victory: NOT VERIFIED; A4/H0 defeat52.368s remains the comparison.
- Concrete affordable retry advice, post-B1 economy and collectible paired gain: pending E1 / combat adoption.
- Full A5 acceptance, screenshot pack and engagement journey remain Z work. No merge or deploy.

## Reviewed implementation checks

Source 06dc9d3baffe56b633cf8f8290ccbbce1c727aed; measured offline [artifact](b3/artifact/index.html): 20818233 bytes, SHA-256 22ad9eb9d7cae71663218d169814ef4e73f3d35d1c9bf05a7e740e43c01c0049. Public demo is unchanged until Z.

Typecheck, lint,1739 web tests,1113 rules tests (+2 expected failures/11 skipped),421 E2E checks and build PASS. Original typecheck failure (test clone portability) and missing temporary-Python build attempts remain in the original logs; the corrected source passes all six gates.

A public-command account earned24 marks on day11 without injected currency/levels. Real clicks import that earned save, choose once, spend exactly24→0 and leave all pity counters unchanged. Fresh welcome and paid150-stamp draw also pass. Twelve reviewed captures across1280/1440/1024 have zero horizontal overflow, scoped contrast≥4.5 and no page errors or remote requests. The selector heading clears sticky odds; original obscured1024 capture is retained.

Fresh OFF165cells/8250routes matches47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Reviewed CSS-only correction reuses that receipt with exact63 rule-input hashes. Baseline-v1,13 historical sims, author and protected/B-path guards PASS. See [audit](b3/reviewed/audit.json). No combat or full-acceptance PASS is implied.


## Adopted anchored progression, reviewed B3 closure

Source 6c0a045924a591797accd83e334847e5698c3463. All six source gates pass; counts and original logs are in [audit](b3/closure/audit.json). The exact registered formula reduces only bands6–9; bands1–5 and10–50 preserve every enemy stat. Old stored enemyStats keep their replay, no new state field or save version. Fresh OFF165cells/8250routes matches the frozen digest; baseline-v1 and13historical sims are exact.

The same earned H0 day7 loss is imported through the UI, then one available recommendation starts the ordinary retry route. Real x1 boss: VICTORY in 64.921s. The chosen plan changes this exact route from loss to win. This is a single paired fixture. This is one fixture. The independent90account TRAIN replay remains casual26/30, regular28/30 first-two wins, heavy28/30 first wins and24/24available suggestions; the heavy paired advice0/2 versus no-advice2/2 limitation remains.

Opening regression at1280/1440/1024: 1280: practice13.139s,11captures; 1440: practice13.067s,11captures; 1024: practice13.074s,11captures. Zero overflow, scoped contrast≥4.5, no page errors or remote requests. The broader screenshot pack is not repeated here.

[Measured offline artifact](b3/closure/artifact/index.html): 20922529bytes, SHA-256 60407a0bd423386c66d86f50b88d867a3a7fe89bee357836a3da1ae6796432a7. Public demo replacement waits for Z.

Balance is NOT closed: TRAIN50 fourth-slot68/384misses, worst88pp; cat61.75–86.65%, set76.75–92.25%,23/24positive tiersteps and two bandspread misses. The displayed single-piece shares still understate combat impact. Fresh20001–20500 remains unused. The separate pressure-spread diagnostic is not adopted.

Supplemental visual review: the original `retry-prepare.png` captured the brief lazy-loading placeholder. [Ready Prepare](b3/closure/day7-x1/retry-prepare-ready.png) is a separately recorded UI-only capture with the exact same initial battle and standing plan, zero battle actions and zero overflow. The original frame and the failed accessor-serialization attempt remain. [Contact sheet](b3/closure/contact.png) contains all41frames; only the33opening captures carry scoped contrast assertions.
