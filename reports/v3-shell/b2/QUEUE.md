# V3B2 queue

Revision 2, 13 November 2026. A card is done only with all checker PASS lines below its entry.

- [x] G0 — done (self-score 8/10 for acceptance tooling; production quality not yet scored)
- [x] R — done (self-score 8/10; spectral proxies explicitly qualified)
- [ ] S1 — in progress
- [ ] S2 — todo
- [ ] S3 — todo
- [ ] S4 — todo
- [ ] V — todo
- [ ] U1 — todo
- [ ] U2 — todo
- [ ] U3 — todo
- [ ] U4 — todo
- [ ] S5 — todo
- [ ] S6 — todo
- [ ] S7 — todo
- [ ] E1 — todo
- [ ] E2 — todo
- [ ] E3 — todo
- [ ] E4 — todo
- [ ] E5 — todo
- [ ] T1 — todo
- [ ] C1 — todo
- [ ] E6 — todo
- [ ] P — todo
- [ ] SY1 — todo
- [ ] SY2 — todo
- [ ] SY3 — todo

Syncs interrupt the active card at 16 / 18 / 19 November, 12:00 UTC.

## Polish backlog

- [ ] P1 — todo
- [ ] P2 — todo
- [ ] P3 — todo
- [ ] P4 — todo
- [ ] P5 — todo
- [ ] P6 — todo
- [ ] P7 — todo
- [ ] P8 — todo
- [ ] P9 — todo
- [ ] P10 — todo
- [ ] P11 — todo

## G0 evidence

PASS G0.inventory: measured 24; required every required card has gates and thresholds

PASS G0.tests: measured 14; required passing test + SHA-256-verified log

Checks: tests/g0-unit.log, tests/g0-types.log, tests/g0-suite.log. Full local suite passes; 2 expected failures and 11 existing skips in game rules remain explicitly reported.

## R evidence

PASS R.windows: measured 10; required >= 10 measured windows with all metrics, or logged videos missing
PASS R.candidates: measured 766; required >= 120 candidate files with licence URLs
PASS R.levers: measured 10; required >= 8 new economy levers with file:line
PASS R.report: measured 8146; required nonempty reports/v3-shell/b2/RESEARCH-B2.md

Checks: tests/r-analysis.log (5), tests/r-types.log, tests/r-suite.log. Full local suite passes; 2 expected failures and 11 pre-existing skips remain disclosed. No reference audio was saved.
