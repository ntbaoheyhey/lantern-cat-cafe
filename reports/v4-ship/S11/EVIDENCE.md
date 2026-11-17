# S11 QA checkpoint —17November2026

Source4b4c41114; production19. No public writes, deployments, ART edits or gate reductions.

| Finding | Result | Evidence |
| --- | --- | --- |
| QA-2 cold transfer | FAIL29,540,609–29,540,708B vs8,000,000B. Lazy Hub saves109,483–109,582B; images/audio unchanged. Four contexts clean and rolled back. | S8/qa-cold-transfer-comparison-1.json; initial-transfer-3/4.json |
| QA-3 runbook | Corrected8Spool ->6YARN +2retained under weekly cap. Runtime unchanged. | USER-DEPLOY-VI.md step5; independent QA/Q2/withdrawal-reproduction.json |
| QA-4 provider attribution | PASS10/10production layouts across390/760/761/1280/1440px, mixer closed/open; zero page errors. At390px right edge351.5<390. Desktop rectangles unchanged. | S11/counter-attribution-1/2.json |
| G-REG | FAIL only the same7ART-owned tests; server742/rules1409/web2701passing; typecheck,3-fixture probe,build exit0. Probe is not approved class baseline. | S11/qa-cold-layout-regression-review-1.json |

Self-score:7/10for the scoped QA corrections. Two small defects fixed and cold transfer improved with source-bound evidence; load budget still fails and needs ART delivery. No overall G-UI/G-REHEARSAL/G-AUDIO/G-CLASS PASS claimed. No new screenshots; image-open budget unchanged.

QA-6: `campaign-manifest --check` nowPASS159sources with independent Git/worktree agreement. Three local databases confirm explicit policy transition and stale-journal rollback; source hash update alone does not grant authority. Evidence `campaign-policy-check-1.json`. Runbook includes exact migration hashes, read-only preflight and the already existing reviewed SQL transaction. Self-score9/10for this scoped fix; hosted policy transition is user-only and existing old campaigns still require a reviewed state migration.
