# Integrated readability checkpoint
REFERENCE: ../../memory/PROMPT.md, ../../demo/readability, reveal/checks.json, invitations/checks.json, ../../validation/integration-readability.json

The measured offline artifact is `/tmp/cardrpg-big-integration-readability-index.html`, SHA-256 `1bd16da4c2699d95b41ba33318c46b86c7bb6870091cebdccf18a7b738f0d768`. Its source includes the published B4 chain and A reveal/layout repairs. The subsequent controls candidate adds E1/E2 and a gallery control repair, and awaits its own full checks.

## Observed results
REFERENCE: ../../validation/integration-font-retry.log, ../../video/pilot-toggle/failure.log, reveal/checks.json, invitations/checks.json

| Check | Result | Evidence |
| --- | --- | --- |
| Feel lab | 21 captures across three sizes, 0 horizontal overflow, page errors or remote requests | ../../demo/readability/screens/checks.json |
| Source typecheck, lint, unit, build | Passed, 1,719 web and 1,020 rules tests | ../../validation/integration-readability.json |
| Full E2E | 420 passed, one external-font connection reset | ../../validation/integration-readability-e2e.log |
| Focused expired-session retry | Both parameterized cases passed | ../../validation/integration-font-retry.log |
| Rare entrance | Eight cases and 24 captures passed canvas/fairness bounds and account checks | reveal/checks.json |
| Invitation flows | 36 captures across three sizes and CPU4, zero page errors | invitations/checks.json |
| Video attempt | Header toggle intercepted by the open drawer | ../../video/pilot-toggle/failure.log |

The focused retry covers the original failing spec. The next source candidate will run all five project gates again. The video attempt led to source `289ffa0e`, which adds a visible Hide controls action while preserving the gallery fixture. Seven focused tests passed. Browser verification is queued on artifact `85592fae2f4ca0bd35d2b92ce1f4cfe729362d38b54cdaee1ff5c43fa5af7557`.

## Visual review follow-up
REFERENCE: reveal/1024-cpu1-legendary-entrance.png, reveal/1024-cpu1-legendary-layout.json

The 1024×600 entrance canvas ends at504.25px. Visual review also found the accompanying card/footer below the lower viewport edge. The original guard covers the canvas alone. Follow-up source `4fa7989f` adds settled card, result and action bounds in a separate Lane A worktree. Diagnosis and correction remain pending. This finding stays attached to the gacha grade.

Invitation screenshots also record frame timing, including CPU4 MAX266.6ms and three frames over50ms. Screenshot overhead belongs to those samples. Controlled timing remains in the separate G matrix.
