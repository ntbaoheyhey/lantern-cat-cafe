# B3 candidate invitation audit

Registered candidate360stamps/24marks/soft13/hard24/+700bp. Each banner uses the original10,000 independent account seeds1–10000,60actual draws/account and a controlled9,000stamp bankroll. No earned-progression or combat-acceptance claim.

|Banner|Accounts|Draws|First Legendary median /p90 /max|Maximum conditionalCDF deviation pp|Gate<=1pp|
|---|---:|---:|---|---:|---|
|standard|10000|600000|16 /19 /24|0.456811|PASS|
|featured|10000|600000|16 /19 /24|0.456811|PASS|
|equipment|10000|600000|16 /19 /24|0.456811|PASS|

All30,000accounts redeem the24markselector after60paid draws and retain36marks. This checks settlement, not earliest reachability. Exactconditional curves, pity buckets, every account seed/digest and ceremony fixtures remain in gacha.json and ceremony-*.json.

Independent receipt checks: `node --test tools/cardrpg-big/a5-b3-receipts.test.mjs` —2PASS. They recompute the CDF from original per-account firstdraws and recompute90account/45day currency andprogression aggregates. No rerun or altered sampling.

Reward cohort uses originalA4combat; see ../reward-confirmation-01/RESULTS.md. Must rerun earnedday7 and45day progression after selected combat changes. No production adoption, gate movement or fresh20001–20500combat sampling.
