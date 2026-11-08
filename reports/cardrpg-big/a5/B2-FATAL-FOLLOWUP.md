# A5 B2 — shield follow-up after fatal reflection

Status: source correction verified; broader balance work remains open.

The TRAIN diagnostic exposed a crash when Velvet, the last living cat, used Stolen flame with 4 HP against Kettle Knight. Reflection defeated Velvet during the hit; the later energy-to-shield effect then tried to shield a missing ally. The V4 effect now skips that follow-up when no living recipient remains. Its normal 12-shield result and legacy energy behavior remain unchanged. No saved field or event schema changed.

The regression failed before the fix and passed afterward. The captured automatic replay and every legal action resolve without mutating the source preview; the fatal replay correctly ends in defeat. See [exact replay checks](b2/fatal-followup/checks.json) and [closure audit](b2-guard/audit.json), bound to source `db69140eb06a4625d9ec22a977c36444540bd56d`.

All six source checks passed on their first attempt: typecheck, lint, 1,746 web tests, 1,135 rules tests (2 expected failures and 11 skips retained), 421 E2E tests, and application build. OFF remains exact across 165 cells / 8,250 routes; baseline-v1 and the 13 historical simulation files are unchanged. Logs include the original lock waits; no timing improvement is claimed.

The accompanying TRAIN diagnostics rejected Scent valuation and both Soot rear-mark trials. The original set fixture cannot exercise Emberfelt's Scald identity: all 3,200 reproduced outcomes match, but the starter trio has no Scald skill. Neither support-kit trial is adopted. See [Soot evidence](B2-SOOT-KIT.md), [fixture audit](B2-FIXTURE-CALIBRATION.md), and [support diagnosis](B2-SUPPORT-KITS.md).

B1/B2 numeric gates, display calibration, 30-minute cadence, startup and Z acceptance remain open. Fresh seeds 20001–20500 are unused. The public offline demo awaits the Z rebuild. This is a draft source checkpoint, with no merge or deployment.
