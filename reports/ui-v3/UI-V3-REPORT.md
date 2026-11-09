# UI v3 · Living Cafe

Status: PARTIAL — U0–U8 implemented and verified; U9 final existing-E2E, score and sync setup remain. No PR merge or deployment. Product defaults OFF.

Base: Lane A S6 `1195b13fa` (#424), merged with published Lane B integration `c5712f7c0` (#420) by `d4a8dad8d`. Art R1 `3ef6f96a6` is PARTIAL, so excluded. No newer published A descendant found at 2026-11-09 23:40 UTC.

| Phase | Evidence |
|---|---|
| U0 | [56 original captures](before/manifest.json), [baseline checks](u0/checks.txt), draft #428 |
| U1 | [Flag and shell checks](u1/shell-repair.log), draft #429 |
| U2 | [Measured fallback decision](u2/HOME-DECISION.md), draft #430 |
| U3 | [Sheets and accessibility](u3-final/), draft #431 |
| U4 | [Prepare/Result/Route](u4-final/), draft #432 |
| U5 | [24 battle captures](u5/), [browser checks](u5-final/browser.log), draft #433 |
| U6 | [Four recruit beats](u6/), [checks](u6-gates/checks.txt), draft #434 |
| U7 | [Fresh-eyes fixes](u7-close/FRESH-EYES.md), [36 browser checks](u7-final/browser.log), draft #435 |
| U8 | [Offline receipt](u8-visual/offline.json), [56 settled captures](after/manifest.json), [fresh-eyes repair](u8-visual/FRESH-EYES.md) |
| U9 | Pending final gates and self-score |

| Gate | Current evidence | Status |
|---|---|---|
| G1 | [Type/lint/1,867 web tests/build](u8-visual/checks.txt) | PASS |
| G2 | Eleven legacy destinations mapped; route and reviewer comparison included; saved counts/pity verified | PASS |
| G3 | Five dock buttons, six distinct primary destinations, ten fixed external controls maximum, no old rail | PASS |
| G4 | [24 screen/look axe scans](u8-visual/accessibility.json), zero serious/critical; chest contrast fixed | PASS |
| G5 | 24 ready/cast samples, 1024/1280/1440, both looks; zero visible plate/HUD intersections | PASS |
| G6 | [Offline CPU4](u8-visual/offline.json): interactive 2,141.1–2,191.3 ms vs 223.3 ms; cold frame max 83.4 ms; 60 s idle zero long tasks, zero draws | PARTIAL |
| G7 | Product entry gzip 186,195 → 186,237 B (+42 B); lazy UI chunks | PASS |
| G8 | Offline single file 31,202,110 B; SHA `e5a63e7e26d7bfe860d60e6a62460a247491fe22c7befadbc7ceda91e6c2d0a6` | PASS |
| G9 | [231 protected sources and recorded OFF/fallback hashes](compatibility.json); [25 save tests](u7/saves.log) | PASS |
| G10 | Published baseline 421/421; complete current run pending | PARTIAL |
| G11 | Home, sheets and Prepare at four sizes, both looks: no horizontal overflow or clipped controls | PASS |
| G12 | [56 AFTER captures](after/manifest.json), [contact sheet](contact-on.webp), [fresh eyes](u8-visual/FRESH-EYES.md); [original U0 Result repair](u8-visual/baseline-repair.json) verified | PASS |

Navigation count means distinct primary destinations outside the closed utility menu; the Relic chip aliases Bag and the map icon aliases Patrol. Raw fixed controls are separately capped at ten. Reviewer-only Before/after stays behind `dev=1`.

Home uses a B-stage poster plus the current crew's portraits. The 3D trial used 77–82 draws but had 855–885 ms steady software-GL long tasks. The fallback uses zero draws and measured zero long tasks over 60 seconds. This is an approved performance fallback, not a claim that the poster is a new 3D room. Existing fonts are retained: zero added font bytes.

The inherited Lane A 183.3 ms value describes a cold frame maximum, not navigation-to-interactive latency. Both metrics are reported separately against the prompt's literal 223.3 ms interactive gate. The final offline practice battle passes naturally in 14.285 seconds using the inherited Metal backend; default software GL missed in both shells. No speed/rules change was made.

UI seams: none. B renderer/asset paths and protected gameplay sources are untouched. Read-only selectors derive presentation; the model still applies rewards, pulls, equipment, saves and fights. One visual source per battle element. New art and its runtime acceptance remain B-owned.

All 37 new browser tests pass ([log](u8-visual/browser-all.log)). Self-score is scheduled after U9 existing-E2E closure; U8 fresh-eyes review is complete. Bot results are proxies; no human enjoyment claim.

Items needing the user: none during this phase. Full repair history is in [FIXLOG](FIXLOG.md).
