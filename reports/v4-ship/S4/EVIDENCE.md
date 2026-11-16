# S4 evidence

The final stable batch completed ten fresh profiles at each desktop size, using the same three harness hashes and source `a81bf93ef`. [Final check](final-journeys-1.json) binds every run by SHA-256. No runtime change occurred during the batch.

| Measurement | 1280×720 | 1440×900 | Gate |
|---|---:|---:|---|
| Complete journeys | 10/10 | 10/10 | 10/10 each |
| Median first battle | 2.957 s | 2.9325 s | ≤30 s |
| Median clicks | 2 | 2 | ≤3 |
| Median first receipt | 95.2325 s | 95.190 s | ≤180 s |
| Maximum first receipt | 95.703 s | 95.848 s | ≤240 s |
| Path errors / guest popups | 0 / 0 | 0 / 0 | 0 / 0 |

All 360 captured receipts matched isolated RPC values and wallet history. Geometry/labels/body-copy checks, scoped proof-text contrast and reload recovery passed every run. Eight local screenshots remain in `RUNS/S4-final-1/raw/`; screenshots are supporting local captures, not published clean-clone evidence.

Public Fuji evidence is separate: [four counters and recovery](counter-recovery.json), [55 indexed logs and 30 RPC receipt checks](explorer-snapshot.json). Local timing does not establish sponsored Fuji confirmation latency. The all-screen contrast audit and complete G-PROOF remain open. [Regression](regression-final-1/check.json) has seven known ART failures; other commands passed, and official class parity remains unapproved.

Self-score **8/10**: the measured twenty-journey funnel and receipt/history checks pass; public latency, complete UI coverage, ART compatibility and class baseline remain open.
