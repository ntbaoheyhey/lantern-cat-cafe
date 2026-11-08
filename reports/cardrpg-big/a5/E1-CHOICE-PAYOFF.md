# A5 E1 — choices, named results and a useful next try

Kết quả trận đấu đã gọi tên mèo và lượng đóng góp thực tế.
Gợi ý dùng thay đổi đang có, kiểm tra chi phí và chỉ áp dụng một lần.
Dự báo chạy riêng, phản hồi theo đội hình và ghi rõ không đảm bảo chiến thắng.
Đi qua các điểm khác nhau mở từng manh mối của boss.
Boss ngày 7 và cân bằng chiến đấu vẫn chưa đạt nghiệm thu A5.

Status: E1 functional checks PASS. Source 602587b351165bc1935d612cbed7d109d7c38fc0; no combat tuning, save-schema change or new acceptance sampling.

## What a player sees

- Result shows three measured actor/item contributions, row damage and the first fallen cat. Two-piece, four-piece and unique grants cannot be conflated.
- The same earned day7 loss names Clover's790 healing, Soot's707damage and Mochi's244absorbed damage. Rear damage1612/2806=57%; Mochi falls in round6. The full battle is exactly equal to H0.
- Available advice is **Stop their support · Protect**, costing no currency. Applying settles the old route once, rechecks the build and opens the first stop of a fresh route. It never resurrects the old battle or grants an item. Original route settlement rewards stay intact.
- Worker forecast uses20 fixed TRAIN seeds, Risky/Even/Favoured and a named risk. Build changes cancel stale work; returning to an identical build uses a32-entry cache. No win percentage is shown.
- First stop reveals opening; story reveals reach; elite reveals closing. Reviewed real clicks reach boss preparation with3/3known, and the opening clue no longer leaks the closing pattern.

## Measured checks

| Width | Cold build forecast max ms | Scoped minimum contrast |
|---|---:|---:|
|1280|33.1|8.376|
|1440|32.7|8.376|
|1024|32.7|8.376|

CPU4 page-throttle observations: 43.9/19.9/47.2ms elapsed; worker compute 7.0/7.5/17.8ms. These are reported separately from CPU1, not assumed to be calibrated worker slowdown. Boss forecast 56.8ms on the real-click route.

18 reviewed captures across1280/1440/1024: zero horizontal overflow; no page errors/remote requests; exact state/currency assertions after retry. Original18captures and original CPU4 observations remain separate. Full pack is reserved for Z.

Typecheck/lint/1739web/1121rules(+2expectedfail/11skip)/421E2E/build PASS. Original type portability and route-helper failures retained. Original E2E had one unrelated V2 idle-XP fake-clock timeout; unchanged retry passed421. Reviewed results and hashes are in the [audit](e1/reviewed/audit.json).

Fresh OFF165cells/8250routes matches47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Baseline-v1,13historical sims, protected/B-path guards, dependencies and author PASS. Old save coverage remains in the rules suite.

Reviewed [offline artifact](e1/artifact/index.html): 20914389bytes, SHA-256 bdbdb35aa91930644ff2498437fab60f513e27dda6718938bfe59cfe48b3c667. Public demo remains unchanged until Z. This phase does not re-establish P1 startup gates.

## Limits retained

The retry suggestion improves the fixed10-seed check from0/10to1/10; this is not the required≥70%day7gate. B1/B2 combat gates, full progression acceptance, E2/E3 engagement and Z remain open. Result contributions are observations, not proof that one item caused the win. Bot/screenshots are proxies, not a human playtest.

No merge, deployment, B renderer adoption, wallet use or on-chain issuance. Existing version1 B contracts stay unchanged.

## Owned-reserve follow-up

The later [reserve advice report](E1-RESERVE-ADVICE.md) closes real-click eligibility at unchanged challenge difficulty. It retains the original confounded gain and its correction; it does not claim a population win-rate improvement.
