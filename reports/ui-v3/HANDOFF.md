# Demo integration handoff

**Resumed by the user on 2026-11-10 at 05:04 UTC** (“tiếp tục công việc”). The prior [stop receipt](sync/STOPPED.json) is historical; the watcher is running again under the existing ten-minute polling/fifteen-minute settlement rules. [Resume evidence](sync/resume-20261110/SUMMARY.md): first poll found no qualifying new tips. The old pending/ready files refer only to already-integrated M4/M5 tips.

Worktree: `/Users/bao/taskbar-hero-ui-v3`. Latest verified implementation/tooling commit: `a89a78ce0b999452d256156dda04e69913181f18` on `codex/cardrpg-ui-v3-u9-2026-11-09`, draft [#437](https://github.com/ntbaoheyhey/taskbar-hero/pull/437). Stop handoff `4e79e7517` and the resume publication change documentation/evidence only. Latest runtime source and all demo receipts below remain valid.

Current milestone **U9**: `codex/cardrpg-ui-v3-u9-2026-11-09`, stacked on U8 draft [#436](https://github.com/ntbaoheyhey/taskbar-hero/pull/436). Runtime source `1651d011d018343625f5a44d2ad9365c93fa40b4`; draft [#437](https://github.com/ntbaoheyhey/taskbar-hero/pull/437), published evidence commit `bc48c5da0`. Status PARTIAL because G6 and self-score remain below target; all other gates pass.

Enable with `?ui=v3` or `VITE_UI_V3=1`; product defaults OFF. `?ui=legacy` overrides the demo default. Review tools require `?dev=1` in either shell. Under the shared timing lock, run `BIG_SKILLS_V5=1 node tools/ui-v3/build.mjs` after `df -h ~`. Open `docs/ui-v3/index.html` directly. Receipt: 31,203,011 B, runtimeDirty=false, SHA256 `2a7bef0551b40376c8d51fafbd35556e4870ababc08d06de60196d5a3d9c95a5`.

Base A S6 `1195b13fa` (#424), B published integration `c5712f7c0` (#420), plus M5 `440ec2890` (#425). Latest inspected art R1 `404af80f1` is PAUSED/PARTIAL and excluded. Never take our old renderer snapshot over a newer accepted B renderer. B-owned paths take B; adapt `ui-v3/BattleHudV3.tsx` and scoped CSS to its DOM. There are no B-file ui-seams.

Owned code: `apps/web/src/game/cardrpg/ui-v3/**`; shell integration in `depth/App.tsx`; developer gating in `player-mode.ts`; V5 glossary presentation in `Pages.tsx`; reviewer fixture in `Utility.test.tsx`. Proposal/demo/reports/harness are under `docs/proposals/ui-v3`, `docs/ui-v3`, `reports/ui-v3`, `tools/ui-v3`. No rules/model/save/chain changes. Preserve wallet-off read-only Fuji copy.

Demo checklist: Home → Night Patrol → Prepare → Fight → Victory → Next; Cats/Journal; Team; Bag/Gear/Materials/Relics; Recruit four beats and Odds; Events; Route; menu Field guide/export/import; Relic · Fuji visible outside battle; Escape/focus; `ui=legacy`; dev tools absent without `dev=1`.

G1 PASS (1,867 web tests), 421/421 existing E2E, 37/37 new browser checks plus 16 affected rechecks after final portrait CSS, 24 axe scans clean, zero overlap in 24 battle samples, 231 protected sources/production digests exact, 25 save tests pass. All 291 offline asset hashes match. G7 +53 B. Offline natural fight 13.983 s. G6 PARTIAL: CPU4 full interactive 1,358.6–1,358.9 ms vs 223.3 ms; 60 s idle zero long tasks/draws. Score 8.475/10 after the one required extra pass. No gate changes.

Sync mode has resumed at the user's request. Remaining owner-U concern is cold packaging/startup; B owns prototype art and a performant true 3D Home renderer. Read [UI-V3-REPORT](UI-V3-REPORT.md) for receipts and exact limits.

Latest sync R1: additionally merged M5 `440ec2890` (#425), merge `423585913`, tree-identical to prior U9. Source receipt `f13c622a16b441cc1a4912fa44dddcca364ca06b`; offline SHA/size unchanged. Required refresh gates and all37specs pass;421existingE2E/24axe/291assets exact. Natural fight13.758s; cold1,357.2–1,376.0 ms remainsPARTIAL. See [sync/r1](sync/r1/SUMMARY.md). ArtR1still excluded; no nextArefresh.

Watcher repair after R1: accept milestone PASS declared in either art STATE or ART-REPORT, while explicit incomplete current status excludes stale PASS. Seven eligibility cases and G1 pass; [evidence](sync/watcher-repair/SUMMARY.md). Art R1 `8d12c87b2` is still PAUSED/PARTIAL. No runtime/demo changes; the existing integration checklist and SHA remain valid.

Expected missing historical reports are now read quietly; real polling errors remain in `last-error.txt`. [Live poll, G1 and fresh-eyes verification](sync/watcher-quiet/SUMMARY.md) pass. This follow-up changes only watcher stdio handling and evidence.

Continue the running `node tools/ui-v3/sync-watch.mjs` process; do not start a duplicate. Keep the ten-minute polling and fifteen-minute settlement delay. A qualifying tip requires the registered merge rules, G1/G2/G5/G9/G10 and all UI specs, a locked offline rebuild, changed screenshots, reports/PR and ledger updates. Preserve the measured PARTIAL G6 result and 8.475 score; do not repeat U0–U9 or claim a new improvement pass. Ledger publication uses the isolated `/tmp/ui-v3-ledger-resume-20261110` checkout; leave the other ledger worktree untouched.
