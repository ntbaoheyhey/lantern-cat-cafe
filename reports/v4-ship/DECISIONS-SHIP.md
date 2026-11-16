# Decisions

- 2026-11-16T04:44:21.272565+00:00 S0: created integration branch from 88fa5bdfd820609f054d174fce24248f35aa9575; shell clean, no stash required. Legacy supervisor absent, reserved ports free.
- 2026-11-16T04:44:21.272565+00:00 S0: web namespace returned route_not_found; connected search service works and will supply primary sources.
- 2026-11-16T04:46:06.152206+00:00 S0: first workspace tests failed at startup on shared Vitest 5 fsModuleCache; trying workspace-concurrency=1. No test assertion changed. Nohup child ended with shell lifecycle; use persistent exec session for fixture (PID68690).
- V4 SHIP ADOPTED 2026-11-16T04:48:36.267987+00:00
- 2026-11-16T04:48:36.267987+00:00 S0 complete: serial package test execution fixes shared-cache startup race; all baseline checks pass. See LEARN/S0.md.
