# P1 lossless packing diagnostic 01

Status: PARTIAL. No production adoption. All 18 originally registered browser observations are retained.

The default entry did not request V4 or Three modules before this change; a V4 screen split would not remove its measured overhead. The isolated build encodes existing pixel rows/frames and decodes each monster on first use. All 25 monsters, every catalog field, frame and pixel round-trip exactly in Node; browser renderer parity is still NOT VERIFIED.

Registered main: 340f88b92405ceb6b5421b207307fdbb283b2ca3. Candidate runtime: c4a883e5ea9f3d7e8424d799b2dafc73cc51d8df, plus the registered build-only transform.

| Configuration | Main task ms median / max | Packed task ms median / max | Loaded JS delta | Task result |
|---|---:|---:|---:|---|
| 1280, CPU1 | 491.348 / 530.858 | 538.071 / 552.980 | +148752 | MISS |
| 1280, CPU4 | 794.323 / 805.325 | 773.883 / 776.281 | +148752 | PASS observation |
| 1440, CPU1 | 392.649 / 429.037 | 311.086 / 486.869 | +148752 | MISS |

Each row uses three fresh profiles per build, cache disabled, alternating fixed build order, real onboarding click and five seconds of runtime. Every requested JS chunk is verified against its build inventory. Browsers and local servers close between timing leases. No observation was removed or rerolled.

The byte target passes against the registered baseline (+148,752 <=150,000 bytes), but the small remaining margin and mixed CPU outcomes do not close P1. Default-app timing includes animation and scheduling noise; three observations do not establish statistical equivalence. The 233.4 ms frame gap in packed 1440 run3 remains visible, although the long-task observer reported zero.

All raw task/script/layout values, frame maxima, long tasks and receipt hashes are in summary.json. Current-main comparison, full browser art parity, offline size and offline CPU4 remain pending. Source artwork, runtime rules, production build config and public demo are unchanged.
