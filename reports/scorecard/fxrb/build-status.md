STATUS: IN-PROGRESS

FXRB builder handoff, 2026-11-01. Branch `ai/codex-fxrb`, [PR #243](https://github.com/ntbaoheyhey/taskbar-hero/pull/243). Base `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`; reviewed HEAD `3d4e556ce9be2de1fbd8178bb5a4c49714a6ec7f`. `origin/main` already merged. pnpm 10.28.0, Node v24.22.2. No source or test edits were necessary in this card; evidence/report changes only. No score, push, main merge or live action.

- Resize repeat: **120 passed**, exit 0, `--repeat-each=20 --workers=1`; both specs at 1280×720 and 1600×900, both continuous themes. [Raw output](logs/04-resize-repeat20.log).
- Root cause: resize reaches a queued Phaser scene before `scale` is injected, and `relayout()` throws on `scale.height`; the reused active-scene guard prevents this, then CREATE applies the latest size.
- Focused unit tests: **22 passed**, exit 0; web typecheck and frozen install exit 0. [Units](logs/03-focused-unit.log), [typecheck](logs/08-web-typecheck.log), [install](logs/02-install.log).
- Three scratch mutations detected: guard removed → 1 unit failure plus 2/20 browser failures; CREATE layout omitted → 2 unit failures; width +1 → all 6 resize cases fail. Each mutation test command exits 1. Tests unchanged; patches and raw output in [logs](logs/). All production mutations reverted with byte-for-byte checks; restored unit control: **22 passed**, exit 0.
- Restored focused browser control: **18 passed, 2 failed**, exit 1. Resize, redraw (including reduced motion), desktop HUD and classic smoke pass. Original mobile HUD checks fail at 138px/214px versus 88px. The wrapped `.hud-left` exceeds the clipped 70px shell header; legacy `.hud-bar__layout` rules match no element. Prerequisite: an out-of-zone shell/HUD fix preserving every assertion. [Measured geometry and failures](logs/22-restored-focused-browser.log).
- Link checker: exit 1, one missing `docs/proposals/tbh-index-research/` reference from `docs/proposals/rune-skill-system/README.md:4`. Owning documentation work must restore/correct it; coordinator supplies same-day main comparison. [Raw output](logs/10-links.log).
- Historical socket error was not reproduced in 120 current cases; cause remains NOT VERIFIED. Earlier red results are retained, not converted to passes. The old report's “excluded mobile cases” language is corrected.

All browser commands used `CI=true SCREENSHOTS=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= E2E_PORT_CLASSIC=4310 E2E_PORT_V2=4311 E2E_PORT_SERVER=4312 E2E_PORT_API=4313`; existing config builds v2 with flag 1 and empty backend env. No skips, retries, longer timeouts or weakened checks. No source changes outside the reused `StageScene` fix; its source/test paths are justified Tier 2 in [the full report](../../fxrb.md).

NOT VERIFIED / reserved to coordinator: T3 complete e2e; fresh exact-commit full verify including workspace tests/build/lint/typecheck, explicit classic build, Deno drift/imports, bundle/main-link comparison and verify-pr; UI-wide reference/keyboard/contrast/audit/effects and production-config smoke; independent grading; pushed report, merge, post-merge main/live. Mobile failures remain red prerequisites and do not authorize skipping any test.

Full command table and exits: [reports/fxrb.md](../../fxrb.md). Raw logs (trailing whitespace normalized): [logs/](logs/). Candidate remains unmerged and unpushed for coordinator review.

Scoped secret scan: zero hits. Scratch copies removed after restoration; ports 4310–4313 clear. Exact changed-file inventory and branch diff statistics: [scope snapshot](logs/26-scope-diff-stat.log).
