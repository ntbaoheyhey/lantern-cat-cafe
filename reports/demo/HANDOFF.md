# Offline demo handoff

Updated: 2026-11-04. D0–D5 artifacts complete. Draft PR and final demo branch are published; this ledger commit publishes the final report and receipt. One agent; no delegation.

- Deadline: 2026-11-04 13:42 UTC (20:42 Vietnam).
- Worktree: `/Users/bao/taskbar-hero-demo`, branch `ai/codex-demo-2026-11-04`.
- Base stack: `1eefc3ef6d828b06710c8be18feb08e90b099e3e`.
- #270 documentation: `932b6f7e4dcfbd33e4ff81e9bd967d50cab9b6fd`, merged locally.
- D0 head: `7af383e43235d7a3ec8a7f4c31f861d68230dc89`.
- Frozen install passed, pnpm 10.28.0 / Node 24.22.2, 505 packages, 0 downloads.
- Main checkout untouched (pre-existing untracked files preserved). Remote main: `340f88b`.
- Ledger: `/Users/bao/taskbar-hero-ui-ledger`, `ai/codex-ui-ledger` at `10cbae7`; preserve its unrelated untracked files.
- References read: ledger SINGLE2-REPORT, approved redesign, gallery at f5c0a0c, rune single-file demo, apps/web/tools/ui-audit.mjs and effects-test.mjs.
- Runtime has VITE_GAME_V2 stage layout and MockGameApiV2, but standard entry loads remote Google fonts and exposes wallet controls. Offline launcher will isolate env and disable both.
- No merges to main, no deploys, no backend/chain calls, no signatures. #244/#252/#257 untouched; #269 edge source undeployed.
- D1: `pnpm demo` runs strict localhost:5199, rejects busy port, frozen install when missing; separate env-isolated Vite config, blocked wallet transport and no remote fonts. Tour/Boss samples + fresh guest are explicit; local saves are namespaced.
- D1 browser: 25/25 scenario checks at 1280×720 and 1440×900 (scale 2), zero console errors / external requests / wallet requests. Local craft, boss victory, fresh class choice and a natural first reward verified. 8 PNG captures in docs/demo/shots/.
- Units: 1467/1467 existing web tests passed. Initial typecheck and lint passed. Repeat affected checks only after remaining runtime changes; do not reuse these as final-head proof.
- D2: production bundle builds (~3.4 MB). Standard ES-module bundle cannot open via file://; documented CORS/module failure in reports/demo/file-bundle-probe.json. Use self-contained guided screenshot HTML plus included dist served by Python.
- All owned servers stopped: original session 61242, clean-clone process group 3833, production session 87129. Port 5199 is available for the user; no unrelated process was killed.
- D2: self-contained static HTML generated from 8 real screenshots; 34/34 offline file navigation checks pass. Embedded rail hotspots come from measured Playwright boxes. Entire docs/demo currently ~9.2 MB (<25 MB).
- D3: README with top REFERENCE line and DRAFT bilingual/three-minute/rubric/90-second walkthrough complete. Exact class and craft confirmation labels inspected.
- New safety regressions: 6/6 pass. Earlier draft test referenced a non-existent progress field; corrected to assert the actual boss gate. Earlier static check found a long-address overflow; fixed with wrapping and all 34 checks pass.
- Publication guard: Vercel deploymentEnabled=false for ai/codex-demo-2026-11-04 and ai/codex-ui-ledger at both repo and web roots. Schema checked read-only; no deployment/quota probe.
- D4: final runtime web units 1473/1473 (129 files), repository typecheck and lint pass; logs are in reports/demo/. Runtime has not changed since these checks.
- Walkthrough verification found harness/document label mismatches (item accessible name vs visible text, item-detail region, Start Adventure capitalization); corrected without changing gameplay. Failed receipts are retained and must not be counted as passes.
- Static package measured 9,152,836 bytes; static HTML 3,315,929; dist 3,339,319; eight shots + manifest 2,481,149. Re-measure at final publication.
- Source/artifact commit: b241eb6fc2f01f0ffb6ffa72ecf83d05569381c1. All following changes are proof/report metadata only.
- Fresh clone: /private/tmp/taskbar-hero-demo-clean.TgyZFs, initially clean at b241eb6. Frozen install passed in 5.8 seconds, 505 packages, 0 downloads. pnpm demo warm startup 1,897 ms. Deliberately hostile inherited VITE_* placeholders are ignored.
- Fresh-clone browser proof: 29/29 at the two requested sizes; static: 34/34 offline file checks. Zero console errors, external requests or wallet calls. Walkthrough now follows exact accessible button labels.
- Fresh-clone production build passed and reproduced the versioned dist byte-for-byte (no tracked bundle diff).
- Busy-port check exited 1 with clear EADDRINUSE guidance and left the owned active server alive.
- Production bundle: 29/29 browser checks pass; zero console errors, external requests or wallet calls. All receipt details are summarized in reports/demo/VERIFICATION.json.
- Draft PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/274, title "Demo: runnable stack-tip preview (do not merge)", base main, draft true, merged false.
- Source branch push initially received GitHub HTTP 500 / Internal Server Error; a normal retry succeeded. GitHub reports zero deployment records for b241eb6.
- Runtime/artifact source remains b241eb6; this final follow-up changes reports only. Final branch head is recorded by the separately committed ledger DEMO-REPORT.
- Final report: https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/demo/DEMO-REPORT.md.
- Publication handoff: the ledger report records the final evidence commit and remote verification. Runtime work is finished; no merge, deployment or additional feature work is authorized. All owned servers are stopped.

## Final ledger milestone

- Final demo head: `7436dd6468dc4dfc2b78116a009ec9e00ec4a8e0`, confirmed on origin.
- Draft PR #274 remains open, draft and unmerged; its head is the final demo head.
- Final report: `reports/demo/DEMO-REPORT.md`; final PR snapshots and read-only publication receipt are adjacent.
- Main and protected draft heads are unchanged. Source and final demo commit have zero GitHub deployment records.
- Final verification: 1473/1473 web units; workspace typecheck/lint; clean-clone 29/29; production 29/29; static 34/34.
- No runtime changes after tested b241eb6; final demo commit only adds reports.
- User opening command: `cd ~/taskbar-hero-demo && pnpm demo`, then http://localhost:5199. Double-click `~/taskbar-hero-demo/docs/demo/taskbar-hero-demo/index.html`.
- Stop condition reached after ledger publication: no additional cards, tests, deployment or release work. All owned servers are stopped.
