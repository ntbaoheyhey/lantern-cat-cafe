# Decisions

- 2026-11-16T04:44:21.272565+00:00 S0: created integration branch from 88fa5bdfd820609f054d174fce24248f35aa9575; shell clean, no stash required. Legacy supervisor absent, reserved ports free.
- 2026-11-16T04:44:21.272565+00:00 S0: web namespace returned route_not_found; connected search service works and will supply primary sources.
- 2026-11-16T04:46:06.152206+00:00 S0: first workspace tests failed at startup on shared Vitest 5 fsModuleCache; trying workspace-concurrency=1. No test assertion changed. Nohup child ended with shell lifecycle; use persistent exec session for fixture (PID68690).
- V4 SHIP ADOPTED 2026-11-16T04:48:36.267987+00:00
- 2026-11-16T04:48:36.267987+00:00 S0 complete: serial package test execution fixes shared-cache startup race; all baseline checks pass. See LEARN/S0.md.
- 2026-11-16T05:22:13.593571+00:00 REV2 adopted verbatim:46223bytes,sha256=76f6550e50769f5cbaeaf812fdea37c12a82b17453cbee5d605d89db9ee0f332; disk/process reconciliation complete; resume S1 candidate review while existing jobs continue.
