# A5 route, Home and loss decisions

Lựa chọn nhận thưởng được đưa lên trước bản đồ và manh mối boss.
Nâng cấp đội không còn tự đẩy độ khó mặc định của chương chưa thắng lên cao hơn.
Sau khi thua, gợi ý có thể áp dụng nằm ở vùng nhìn đầu tiên và có nút chính rõ ràng.
Bản tích hợp đạt 165 kiểm tra giao diện, 159 ảnh chụp; save chuyển chế độ và bàn phím đã được kiểm tra.
Chưa có kết quả mới về nhịp thưởng, tỷ lệ thắng hoặc cảm nhận người chơi thật.

Source `0e1e15180`, built on draft405. This phase combines the reviewed Route53, Home54 and Result56 prototypes. Combat, currencies, save schema and worker calculations are unchanged.

- Route: pending reward, event, shop, campfire, treasure or completion actions precede map/scouting in V4. A completed V4 run retained after switching the account OFF exposed a real prototype gate bug; effective gameplay mode and the run flag now both gate the new order. Original failure is retained in `c1-route-order/prototype-checks/off-1280-attempt-1.log`.
- Home: uncleared chapters default to band1 or retain the last band selected for that chapter, clamped to the present team ceiling. Explicit choices and active routes persist. The original retained-band fixture reproduces an unwanted2→5 default increase. Its separate TRAIN probe improves22/400 pairs but leaves377/400losses; no boss-wall claim.
- Result: ordinary V4 losses put the available advice beside named contributions and make Apply and retry route, or Open team preparation on worker failure, the primary action. Tutorial, replay, victory and OFF retain their primary behavior. Retry still applies the same public transaction and restarts the route; it does not guarantee a win or jump straight to the boss.

Validation completed on the integrated artifact (165 checks /159 captures, minimum scoped contrast6.193, zero recorded overflow/errors): original six source gates; three flows×ON/OFF×three widths×both looks; keyboard/click parity; exact available-change costs/team/gear; real worker denial fallback; retained-V4 route compatibility after changing the next-run preference. Prototype source/manifests, original failed attempts and revised JSON serialization harness remain preserved. The serialization correction compares the complete JSON state, matching the fixture format; it drops no saved fields.

This is a targeted UI pass, not the last-artifact Z screenshot pack. Home03's723-second reward gap and2.0% combat-deadtime reduction remain MISS. The scripted player upgraded teammates and skipped Result advice; neither a causal UI benefit nor human retention is established. Fresh acceptance20001–20500 remains unused.

Integrated supplement attempt1 stopped before UI samples because it incorrectly expected an active V4 route to become OFF after a preference toggle. The public rule deliberately retains the active route mode. The corrected fixture asserts account preference=false, effective V4=true, unchanged run/battle and the V4 loss layout; a completed retained V4 route remains covered separately by the route OFF fixture. No runtime rule or UI source was changed for this harness correction.

The first retained-active-V4 OFF browser case then timed out waiting for Apply: public result settlement restores effective OFF, so the next-route V4 recommender correctly returns no suggestion. The second harness correction independently verifies the public settlement without sampling battles, checks the existing Open team preparation action, and compares its complete saved state. Both original failure logs remain; source gates/runtime are unchanged.

User pause on2026-11-09: integrated auditPASS, six source gatesPASS (1783web/1192rules/421E2E/build). This phase is saved as a local WIP handoff on top of draft405; no new draft has been opened. ON/OFF artifacts each20,929,841bytes; ON SHA9e25f238ea96ea4df2f59f2a2a77df6ccf29b7eb5733ae8cbb349a14b6c1bb98. OFF8250 evidence reused only after exact rule-source/package guards; baseline and13historical sims exact. Human review covered representative route/Home/Result captures at all three widths; representative Home capture retains the miniature-loading placeholder, without a renderer-readiness claim.
