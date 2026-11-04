# SINGLE2 stack B — self-graded (fresh pass)

Head `1eefc3ef6d828b06710c8be18feb08e90b099e3e`. **95/100 PASS**; no unresolved final product defect in scope. Clean exact-head detached checkout; tests first, then full diff and scope review. Full-suite evidence is the once-per-head A run.

**PASS — self-graded (fresh pass), A95/B95**, exact integrated product `1eefc3ef6d828b06710c8be18feb08e90b099e3e`. Both passes ran typecheck, lint, build, script/package units and 1,467 web units. Full Playwright ran once per size on this head: **399/399 at 1280×720 and 399/399 at 1600×900**. Complete changed-spec coverage repeats each spec three times: 246 executions per size per reviewer. Resize burst: 0/40 failures across A/B; strict geometry: 0/36 failures; pinned axe 4.10.3: zero violations in 38 scans per reviewer. The previous four failing accessibility scans and twelve confirmation keyboard failures are now zero.

Both isolated performance passes reached nominal 60 fps, p95 below 20 ms and exactly zero CLS, including cold-font keyboard journeys. Stage effects pass 10/10 per size per reviewer. Final mocked recovery/wallet audit passes 14/14 with no signing or live writes. The entry JS is 143,074 B gzip using Node gzip defaults, +1,471 B (+1.04%) versus the 141,603 B baseline; Phaser remains lazy at 315,728 B gzip. No runtime flag or economy value changed.

Package results retain **two expected failures and eleven inherited skips**; none were added or weakened. Axe reports some incomplete contrast determinations; measured text regressions and native visual review supplement those checks. Accessibility-tree/live-region inspection is automated, not a human screen-reader listening session. These local results do not prove deployed backend source, native gateway behavior, production asset identity or a funded wallet journey.

Native screenshots reviewed: both-size Landing and single-line proof links; Salvage equipped/locked explanations; class Enter/Escape/Cancel; connected HUD; offline, expiry and nonce/API-error states. No clipping, overlap, missing accessible name or unaccounted product console error found. Fixture HTTP errors are retained as expected transport diagnostics, not hidden. The five-point reserve reflects bounded local coverage and source/deployment uncertainty, not an unreported failing assertion.

[Exact commands and failure history](../../../sys/single2/stack-tip-receipts.md). No authorization for release is implied.
