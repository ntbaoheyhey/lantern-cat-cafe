# A5 E2 — route stars and moments worth keeping

Mỗi điểm trên đường đi có ba mục tiêu rõ ràng để thử lại.
Mốc sao và khám phá mới có thẻ ăn mừng ngắn, có thể bỏ qua.
Nhật ký giữ lại khám phá; phần thưởng chỉ nhận một lần và giữ giới hạn ngày.
Trang nhà làm rõ việc tiếp theo, giờ phục vụ và điều chờ đợi ngày mai.
Nhịp thưởng 30 phút và cân bằng chiến đấu vẫn cần nghiệm thu riêng.

Status: E2 functional checks PASS. Source cffa5b878c26f664a8282a53a09a8146c2d1c1ef; combat remains A4. Acceptance seeds20001–20500 are unused.

## Player behavior

- Combat stars: win, nobody falls, finish within6/8/10rounds for battle/elite/boss. Other stops: finish, all cats at half HP, a four-mark crew job. Best individual badges persist across visits; replay never creates a second identity for the same chapter/band/position/kind.
- First crew threshold, four-piece set, rank, Legendary and star tier record a discovery. The DOM card lasts at most1.2s, skips immediately and respects reduced motion. Journal acknowledgment never grants another reward.
- Stars3/9/18 offer capped30stamps/20threads/40stamps. A reward fully blocked by a cap remains claimable tomorrow; a partial claim clearly previews the actual amount and settles once.
- THC13 persists the journal; prior THC7/THC12 saves migrate quietly without invented earned events. Both modes remain readable.
- One primary Home action remains above the fold. Tonight's goal, next star, service and tomorrow are visible; route and daily-board details stay below.

## Measured evidence

Earned route: 15stars. Actual claims: stars-3 {"stamps":30}; stars-9 {"threads":10}. The20thread nominal reward became10 because only10daily allowance remained; the original browser assertion incorrectly expected uncapped140total and is retained. Source currency values were correct.

Three desktop widths, nine captures each, both looks: zero horizontal overflow and scoped contrast>=4.5. Minimums 1280:4.760, 1440:4.760, 1024:4.760. New Home action, Prepare goals, skipped/reduced-motion discovery, visited stars, exact capped claims and persistent Journal are real-click checked. Full screenshot pack remains Z.

Typecheck/lint/web1743/rules1130(+2expectedfail/11skip)/E2E421/build PASS. Original import-order failure in gear visuals was fixed by deferring A-owned discovery catalog reads; original logs/artifact remain. All gate logs and provenance: [audit](e2/reviewed/audit.json).

Post-stars economy:90accounts/4050days, actual commands, serialized save roundtrip every day, daily caps and once-only claims checked. All-source first Legendary and selector:

|Style|Legendary median day|Selector median day|Selector censored|
|---|---:|---:|---:|
|casual|6|11|0|
|regular|5|9|0|
|heavy|5|9|0|

Earned heavy/casual ratios: paidPulls 1.244444x; fish 1.196253x; threads 1.387974x; stamps 1.248459x; essence 2.580314x. Gate results: regularLegendaryDay7 PASS; regularLegendaryDay14 PASS; heavyEarlierThanCasual PASS; regularSelectorBy21 PASS; casualSelectorBy35 PASS; heavySelectorNotCensored PASS; ratiosAtMost3 PASS. Raw daily receipts and independent calculations are retained; this does not establish the separate day7 two-attempt gate.

Fresh OFF165cells/8250routes digest47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3 exact. Baseline-v1 and13historical sims exact; no B/protected edits or new runtime dependency. [Artifact](e2/artifact/index.html): 20920957bytes; SHA-256 8996413dc6201c568a7fdd3040acaeb7b8ac5f9cc1bee64d02138ed7134f04ed. Public demo remains unchanged until Z.

Exact version1 invitation receipt forwarding reaches the existing optional SceneView boundary; B renderer is not adopted, so no3D rendering claim. Version2 discovery request is in A-OUTBOX2026-11-08T08:35:01Z. No merge, deployment, wallet use or on-chain issuance.
