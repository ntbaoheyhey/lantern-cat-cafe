# UI v3 · Living Cafe

Status: **PARTIAL** — U0–U9 delivered; G6 cold-interactive remains below target and final self-score is **8.475/10** (target 8.5). The required single additional improvement pass is complete. Entering sync mode; no merge or deployment. Product defaults OFF.

Base: Lane A S6 `1195b13fa` ([#424](https://github.com/ntbaoheyhey/taskbar-hero/pull/424)), merged with published B integration `c5712f7c0` ([#420](https://github.com/ntbaoheyhey/taskbar-hero/pull/420)) by `d4a8dad8d`. U9 draft [#437](https://github.com/ntbaoheyhey/taskbar-hero/pull/437), published evidence commit `bc48c5da0`. Runtime source `1651d011d018343625f5a44d2ad9365c93fa40b4`; runtimeDirty=false. Art R1 `3ef6f96a6` ([#427](https://github.com/ntbaoheyhey/taskbar-hero/pull/427)) is PARTIAL and excluded. At 2026-11-10 00:04 UTC no newer published A descendant qualifies (S7/S8 are not descendants of S6).

| Phase | Evidence |
|---|---|
| U0 | [56 original captures](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/before/manifest.json), [baseline checks](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u0/checks.txt), draft #428 |
| U1 | [Flag and keyboard shell](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u1/shell-repair.log), draft #429 |
| U2 | [Measured fallback decision](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u2/HOME-DECISION.md), draft #430 |
| U3 | [Sheets/accessibility](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u3-final), draft #431 |
| U4 | [Prepare/Result/Route](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u4-final), draft #432 |
| U5 | [24 battle captures](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u5), [geometry checks](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u5-final/browser.log), draft #433 |
| U6 | [Four recruit beats](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u6), [parity/checks](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u6-gates/checks.txt), draft #434 |
| U7 | [Fresh eyes](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u7-close/FRESH-EYES.md), [36 browser checks](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u7-final/browser.log), draft #435 |
| U8 | [Portable build](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u8-visual/offline.json), [corrected baseline Result](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u8-visual/baseline-repair.json), draft #436 |
| U9 | [421 existing E2E](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/existing-e2e.json), [37 UI checks](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/specs.json), [final verification](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish), [fresh eyes](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/FRESH-EYES.md) |

| Gate | Final evidence | Status |
|---|---|---|
| G1 | [Type/lint/1,867 web tests/build](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish/checks.txt), all exit 0 | PASS |
| G2 | Eleven old destinations mapped; route and reviewer comparison preserved; model counts/pity parity | PASS |
| G3 | Five dock buttons, six distinct primary destinations, at most ten fixed external controls; no old rail | PASS |
| G4 | [24 screen/look axe scans](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish/accessibility.json), zero serious/critical including contrast | PASS |
| G5 | 24 ready/cast samples at 1024/1280/1440, both looks; zero visible plate/HUD intersections | PASS |
| G6 | [Final CPU4 offline](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish/offline.json): interactive 1,358.6–1,358.9 ms vs 223.3 ms; cold frame max 83.4 ms; 60 s idle zero long tasks; zero draws | PARTIAL |
| G7 | [Product entry gzip](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish/bundle.json): 186,195 → 186,248 B (+53 B); lazy UI chunks, far below +60 KB | PASS |
| G8 | [Single-file receipt](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/docs/ui-v3/build.json): 31,203,011 B (31.20 MB), below 40 MB | PASS |
| G9 | [231 protected sources, 53 production-source hashes and recorded OFF/fallback digests](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/compatibility.json) exact; [25 save tests](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/saves.log) | PASS |
| G10 | [Existing 421/421](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/existing-e2e.json), zero failures, retries or skips, matching BASE; final changes confined to lazy U home CSS/offline packaging | PASS |
| G11 | [Four sizes, both looks](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish/specs.json): no horizontal overflow/clipped controls | PASS |
| G12 | [56 final AFTER shots](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/after/manifest.json), zero errors; [both-look contact sheets](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/docs/ui-v3/before-after.html); [fresh eyes](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/FRESH-EYES.md) | PASS |

The full new suite passed 37/37 after the ambient/transport changes; 16 affected first-five/layout/reward checks passed again after the legacy Home portrait scale fix. No test was skipped or disabled. Existing E2E ran at `08057b245`; subsequent source changes are the lazy Home decoration/scale, offline transport and their checks. G9 reuses complete S6 behavioral receipts only after exact protected-source identity, rather than claiming a newly run acceptance simulation.

Navigation counts distinct primary destinations outside the closed utility menu. Relic aliases Bag and the map icon aliases Patrol. Raw fixed controls are separately capped at ten. Reviewer-only Before/after stays behind `dev=1`.

Home uses B's 50 KB stage poster plus current-crew portraits, with original CSS lamps/motes and reduced-motion support. The 3D trial used 77–82 draws but 855–885 ms steady software-GL long tasks. The fallback uses zero draws and zero long tasks over 60 seconds. This is the approved fallback, not a new 3D room. Existing fonts are retained: zero added font bytes.

Offline startup improved from U8 2,141.1–2,191.3 ms to 1,358.6–1,358.9 ms (~37%); all [291 restored assets](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9-polish/asset-parity.json) match exact SHA256 values. The original Lane A 183.3 ms was a cold-frame maximum, not navigation-to-interactive. Both metrics stay separate; the literal 223.3 ms interactive gate remains failed. Cold long-task maximum is 87 ms. Final natural practice takes **13.983 s**, with no network fetches or page errors, using the inherited macOS Metal backend. Software GL missed 25 s in both shells; no speed/rules change was made.

Offline SHA256: `2a7bef0551b40376c8d51fafbd35556e4870ababc08d06de60196d5a3d9c95a5`.

UI seams: **zero**. B renderer/asset paths and gameplay/model/save/chain sources are untouched. Selectors are read-only; the existing model applies rewards, pulls, equipment, saves and fights. Detailed legal odds remain reachable.

| Self-score line | Weight | Before → final | Evidence and limit |
|---|---:|---:|---|
| First five seconds | 25% | 9.0 → 9.0 | Largest Patrol at three sizes, two-click battle, natural win under 25 s; [Home](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/after/1280-on-home.webp) |
| Game feel | 20% | 7.5 → 8.0 | [Before/after](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/contact-on.webp), original ambient lamps and visible crew; scene remains a poster |
| Navigation/parity | 15% | 9.0 → 9.0 | G2/G3; sheets preserve data; utility detail views still contain longer text |
| Battle readability | 15% | 8.0 → 8.0 | G5, [ultimate/status shot](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u5/on-1280-boss-cast.webp); dense art remains B-owned |
| Performance/size | 15% | 7.0 → 7.5 | ~37% startup improvement, 291 exact assets, G7/G8 pass; G6 still fails |
| Compatibility/honesty | 10% | 9.5 → 9.5 | Exact source/digests, 25 save checks, 421 existing E2E, zero seams |

Weighted score: **8.30 → 8.475/10** (8.48 rounded), still below 8.5. The [required one improvement pass](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/u9/SCORE-BEFORE.md) addressed the two lowest lines; no further pass is claimed. These are agent judgments and automated proxies, not claims of human enjoyment or recognition.

Fresh-eyes concerns: (1) noticeable offline cold start, owner U, PARTIAL after bounded repairs; (2) undersized legacy Home portraits, FIXED and [visually rechecked](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/after/1280-off-home.webp); (3) prototype battle art/flat stage, owner B, waiting for a published PASS tip. Current top gaps are cold start, inherited prototype art, and static Home depth. No user action is needed.

Sync polls published A/B refs every ten minutes without model requests, waits fifteen minutes after a qualifying change, then returns the tip for merge and re-verification. Stop conditions: `STOP-UI`, 20 November 2026 18:00 UTC, or a published refresh incorporating both the next A report and B ART-REPORT. No stop condition has fired. See [STATE](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/STATE.md), [HANDOFF](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/HANDOFF.md), and [FIXLOG](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-ui-v3-u9-2026-11-09/reports/ui-v3/FIXLOG.md).
