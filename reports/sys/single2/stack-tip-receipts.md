# Final stack-tip receipts — integration only, never merge

**PASS — self-graded (fresh pass), A95/B95**, exact integrated product `1eefc3ef6d828b06710c8be18feb08e90b099e3e`. Both passes ran typecheck, lint, build, script/package units and 1,467 web units. Full Playwright ran once per size on this head: **399/399 at 1280×720 and 399/399 at 1600×900**. Complete changed-spec coverage repeats each spec three times: 246 executions per size per reviewer. Resize burst: 0/40 failures across A/B; strict geometry: 0/36 failures; pinned axe 4.10.3: zero violations in 38 scans per reviewer. The previous four failing accessibility scans and twelve confirmation keyboard failures are now zero.

Both isolated performance passes reached nominal 60 fps, p95 below 20 ms and exactly zero CLS, including cold-font keyboard journeys. Stage effects pass 10/10 per size per reviewer. Final mocked recovery/wallet audit passes 14/14 with no signing or live writes. The entry JS is 143,074 B gzip using Node gzip defaults, +1,471 B (+1.04%) versus the 141,603 B baseline; Phaser remains lazy at 315,728 B gzip. No runtime flag or economy value changed.

Package results retain **two expected failures and eleven inherited skips**; none were added or weakened. Axe reports some incomplete contrast determinations; measured text regressions and native visual review supplement those checks. Accessibility-tree/live-region inspection is automated, not a human screen-reader listening session. These local results do not prove deployed backend source, native gateway behavior, production asset identity or a funded wallet journey.

## Exact commands and preserved evidence

- [A commands/logs](../../ui/cards/SINGLE2-STACK/reviewed-a/receipt.json), [A complete changed-spec supplement](../../ui/cards/SINGLE2-STACK/changed-complete-a/receipt.json).
- [Clean detached B commands/logs](../../ui/cards/SINGLE2-STACK/reviewed-b/receipt.json), [B supplement](../../ui/cards/SINGLE2-STACK/changed-complete-b/receipt.json). B ran tests before its diff review in `/private/tmp/taskbar-hero-single2-b-1eefc3e`, ports 5320–5324; A used 5300–5304. Full suite was not duplicated in B.
- [A performance/effects/keyboard](../../ui/cards/SINGLE2-POLISH/reviewed-1eefc3e/receipt.json), [B performance/effects/keyboard](../../ui/cards/SINGLE2-POLISH/verified-clean-b-1eefc3e/receipt.json); serial isolated port 5350. B's first launcher rejected an output path outside its own worktree before opening a browser. That harness failure is retained; rerun uses its own reports directory, with no product change or weakened assertion.
- [Final U5 mocked states](../../ui/cards/SINGLE2-U5/reviewed-1eefc3e/audit.json), [A grade](../../ui/cards/SINGLE2-STACK/A.md), [B grade](../../ui/cards/SINGLE2-STACK/B.md).

The gate commands use `npx -y pnpm@10.28.0 typecheck`, `lint`, `build`, package tests, `vitest run --maxWorkers=2`, and Playwright `--repeat-each=3 --workers=2 --retries=0` for changed specs. Full runs omit repeat-each; resize uses five repetitions. Exact argv, viewport, cwd, ports, timestamps and exit codes are in the linked JSON and adjacent logs. Pinned axe script SHA-256: `880970c081707360e64f34cea25ff91892f5bc95675b0776925b9709dd8a68bb`.

## Rejections and fixes

`d31cb2a` remains A0/B0: Salvage explanatory text measured 2.73–3.66 contrast. `68ab4c1` remains rejected for cold-font CLS 0.000074–0.000167 despite full395/size and axe passing. `22e4c4b` remains rejected: one StageLayout unit timeout under concurrent gates and deliberate Landing pixel changes rejected by the old baseline. #271 fixes contrast and font slots, corrects link wrapping, and adds separately reviewed exact PNG baselines while retaining original captures. No pixel tolerance, contrast threshold, timeout, retry or test exclusion was relaxed.

The final source diff was reviewed for PR intent and scope. All original seven integrations were conflict-free. STACKFIX changes only two CSS files and regression evidence/tests; no economics/auth/DB behavior changed in that repair. Source art remains additive with provenance. No integration PR is opened, and no main merge or deployment is performed.
