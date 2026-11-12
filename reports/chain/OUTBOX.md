# CHAIN outbox

READY e5d1732576df3738f6ced508f5f2e5166074bebe

Tested implementation for C2 integration. This checkpoint covers the Fuji judge/token/market loop and economic sensitivity; ordinary campaign authority and economic acceptance remain open. Evidence-only commits may follow this SHA.

- User-run public Fuji smoke PASS: 18 confirmed receipts. Deployed V2 runtimes/configuration match local artifacts; no contract redeployment required.
- Guest SIWE, drip, starter boss, Relic mint, arbitrary-price AVAX/YARN trade, paid material sealing/recovery and asset migration. Features remain gated.
- Guest signing verifies wallet identity, cleared keys cannot silently regenerate during writes, gas refresh is independent of drip, and expired vouchers retain their nonce on renewal.
- Authenticated CHAIN requests have a 1,024-byte/10-second boundary, strict schemas and fixed recovery messages. No migration or secret change; backend updates remain user-run.
- Deployed season reduction includes tester emissions and YARN burns. The routine issuer remains disabled pending authoritative earning receipts.
- Full units PASS: web 2416, SQL 628, rules 1352, chain 32, auth 24, API 16, scripts 11; diagnostic/model 10; Forge 118. Prior source typecheck/lint/build/Deno checks PASS, unchanged by the simulation extension.
- Three fresh HTTP/recovery browser runs (19.6s/21.1s/16.6s), then budget-card browser 2/2 (loop 19.5s), PASS. Anvil smoke 18 receipts, full asset migration and idempotent seed checks PASS. No new test skips; public timing remains unmeasured.
- Default 16-scenario economics: exact conservation PASS, implemented-sink gate NOT MET (2.39–2.78 claims/burn). 63 additional sensitivity runs do not change default weekly outputs or deployed parameters.
- Largest tested maximum passing all mixes: 3 YARN/week at full assumed demand, 0.6 at half, none at 10%. Finite-grid results are not recommended budgets or measured demand.
- C2 still needs authoritative campaign/weekly/rank receipts and measured rare/Epic supply. REQUESTS-TO-C2.md defines the inputs; no battle stats/drop tables changed. H4b/H5 requeued once; H7 gated.
- User operations: update frontend/Edge Functions, seed V2, replenish sponsor, measure the public route. Commands are in FRONTEND-READINESS-VI.md and USER-DEPLOY-VI.md.
- Source pushed. Remote evidence is in REMOTE-CHECKS.json. GitHub billing/spending prevents CI execution; Vercel has reported rate limits. Local passes do not establish remote-green status.

PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/441
Report: CHAIN-REPORT.md; full matrix: ACCEPTANCE.md.
