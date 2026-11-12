# CHAIN outbox

READY 609871a0b2b6c0a8b54846ade7ef0c609154ee2d

Tested implementation for C2 integration. This checkpoint covers the Fuji judge/token/market loop; ordinary campaign authority and economic acceptance remain open. Evidence-only commits may follow this SHA.

- User-run public Fuji smoke PASS: 18 confirmed receipts. Deployed V2 runtimes/configuration match the local artifacts; no contract redeployment is required.
- Guest SIWE, gas drip, starter boss, Relic mint, arbitrary-price AVAX/YARN listing/buy/cancel, paid Star Thread sealing/recovery and asset migration. New features remain behind flags.
- Separate lifetime-once TesterClaim signatures; deployed automatic season reduction includes tester emissions and actual YARN burns. Routine reward issuance is not enabled.
- Fixed the smoke client's local signing account and stale-head History/listings. Locked Anvil accounts prevent RPC signing from hiding regressions. Existing locale/worker fixes keep full tests stable.
- Final units PASS: web2395, rules1352, SQL597, chain32, auth24, API16, scripts11; 8 diagnostic/model checks PASS. Forge118; new-contract line coverage100%/100%/95.95%; type/lint/production and demo builds PASS.
- Three fresh browser runs2/2 each (21.8s/17.8s/23.3s full loops), Anvil smoke18 receipts, drip/move checks and retry-safe3-listing seed dry-run PASS. No CHAIN test skips. Local times do not prove public two-minute acceptance.
- Corrected16-scenario token model: monetary conservation PASS, implemented-sink economic gate FAIL (2.39–2.78 emission/burn). Future forge/cosmetic sinks are separate; no forced pass or fee/allocation change.
- C2 still needs authoritative campaign/weekly/rank receipts and measured weekly rare/Epic supply. Read REQUESTS-TO-C2.md; CHAIN changes no C2 battle stats or drop tables. H4b/H5 requeued once; H7 gated.
- User operations: deploy prepared frontend to existing host, seed V2 from existing smoke buyer, replenish sponsor and measure public route. FRONTEND-READINESS-VI.md groups the commands. Public keys/signing/deployments remain user-owned.
- Source pushed. Remote CI check131051679521 is blocked by billing/spending; both Vercel integrations report deployment rate limited, retry in24h. Read REMOTE-CHECKS.json. Readiness is local-green, not remote-green.

PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/441
Report: CHAIN-REPORT.md; full matrix: ACCEPTANCE.md; user operations: FRONTEND-READINESS-VI.md.
