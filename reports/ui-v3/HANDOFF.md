# Demo integration handoff

Current milestone U8: branch `codex/cardrpg-ui-v3-u8-2026-11-09`; source `5a9d2ead6d174ad4461a89fe75ff32525cd1b907`. Draft PR [#436](https://github.com/ntbaoheyhey/taskbar-hero/pull/436), published head `d9264617b`. U9 report/score/full existing E2E is next.

Enable with `?ui=v3` or `VITE_UI_V3=1`; product defaults OFF. `?ui=legacy` overrides the demo default. Review tools require `?dev=1` in either shell. Build the offline demo with `BIG_SKILLS_V5=1 node tools/ui-v3/build.mjs` under the shared timing lock. Open `docs/ui-v3/index.html` directly; no server/network needed. Build receipt: `docs/ui-v3/build.json` (31,202,110 B, runtimeDirty=false).

Base A S6 `1195b13fa` (#424), B published integration `c5712f7c0` (#420). Art R1 `3ef6f96a6` is PARTIAL and excluded. Never take our legacy snapshot over a newer accepted B renderer. B-owned paths must take B; adapt `ui-v3/BattleHudV3.tsx` and scoped CSS to its DOM. There are no B-file ui-seams.

Owned code: `apps/web/src/game/cardrpg/ui-v3/**`, shell integration in `depth/App.tsx`, developer gating in `player-mode.ts`, V5 glossary presentation in `Pages.tsx`, and the reviewer fixture in `Utility.test.tsx`. Proposal/demo/reports/harness live under `docs/proposals/ui-v3`, `docs/ui-v3`, `reports/ui-v3`, `tools/ui-v3`. No rules/model/save/chain changes. Keep wallet-off read-only Fuji copy intact.

Demo checklist: Home → Night Patrol → Prepare → Fight → Victory → Next; Cats/Journal; Team; Bag/Gear/Materials/Relics; Recruit four beats and Odds; Events; Route; menu Field guide and export/import; Relic · Fuji visible outside battle; Escape/focus; `ui=legacy`; dev tools absent unless dev=1.

G1 PASS (1,867 web tests); 37 new browser checks PASS; 24 axe screen/look scans clean; G5 zero overlaps in 24 samples; 231 protected sources exact and the OFF/fallback digests unchanged; G7 default entry +42 B. Offline natural practice 14.285 s. G6 remains PARTIAL: full CPU4 interactive 2,141.1–2,191.3 ms vs the literal 223.3 ms gate; 60 s idle has zero long tasks and Home zero draws. No frame-time substitution or gate change. Existing 421-test suite is scheduled in U9.
