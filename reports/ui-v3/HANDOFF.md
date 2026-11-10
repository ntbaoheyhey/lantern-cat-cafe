# Demo integration handoff

Current milestone **U9**: `codex/cardrpg-ui-v3-u9-2026-11-09`, stacked on U8 draft [#436](https://github.com/ntbaoheyhey/taskbar-hero/pull/436). Runtime source `1651d011d018343625f5a44d2ad9365c93fa40b4`; publication link is added after draft creation. Status PARTIAL because G6 and self-score remain below target; all other gates pass.

Enable with `?ui=v3` or `VITE_UI_V3=1`; product defaults OFF. `?ui=legacy` overrides the demo default. Review tools require `?dev=1` in either shell. Under the shared timing lock, run `BIG_SKILLS_V5=1 node tools/ui-v3/build.mjs` after `df -h ~`. Open `docs/ui-v3/index.html` directly. Receipt: 31,203,011 B, runtimeDirty=false, SHA256 `2a7bef0551b40376c8d51fafbd35556e4870ababc08d06de60196d5a3d9c95a5`.

Base A S6 `1195b13fa` (#424), B published integration `c5712f7c0` (#420). Art R1 `3ef6f96a6` is PARTIAL and excluded. Never take our old renderer snapshot over a newer accepted B renderer. B-owned paths take B; adapt `ui-v3/BattleHudV3.tsx` and scoped CSS to its DOM. There are no B-file ui-seams.

Owned code: `apps/web/src/game/cardrpg/ui-v3/**`; shell integration in `depth/App.tsx`; developer gating in `player-mode.ts`; V5 glossary presentation in `Pages.tsx`; reviewer fixture in `Utility.test.tsx`. Proposal/demo/reports/harness are under `docs/proposals/ui-v3`, `docs/ui-v3`, `reports/ui-v3`, `tools/ui-v3`. No rules/model/save/chain changes. Preserve wallet-off read-only Fuji copy.

Demo checklist: Home → Night Patrol → Prepare → Fight → Victory → Next; Cats/Journal; Team; Bag/Gear/Materials/Relics; Recruit four beats and Odds; Events; Route; menu Field guide/export/import; Relic · Fuji visible outside battle; Escape/focus; `ui=legacy`; dev tools absent without `dev=1`.

G1 PASS (1,867 web tests), 421/421 existing E2E, 37/37 new browser checks plus 16 affected rechecks after final portrait CSS, 24 axe scans clean, zero overlap in 24 battle samples, 231 protected sources/production digests exact, 25 save tests pass. All 291 offline asset hashes match. G7 +53 B. Offline natural fight 13.983 s. G6 PARTIAL: CPU4 full interactive 1,358.6–1,358.9 ms vs 223.3 ms; 60 s idle zero long tasks/draws. Score 8.475/10 after the one required extra pass. No gate changes.

Sync mode begins after U9 publication. Remaining owner-U concern is cold packaging/startup; B owns prototype art and a performant true 3D Home renderer. Read [UI-V3-REPORT](UI-V3-REPORT.md) for receipts and exact limits.
