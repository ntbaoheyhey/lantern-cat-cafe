# Independent QA findings — SHIP

QA-1 | MAJOR | owner SHIP | b1e4398a8844fa51d2784760e92ed24528d13d2b | A fresh deploy operator is told to retain signing/JWT/sponsor secrets without their exact setting names; missing prerequisites stop guest entry or rewards. | Run `python3 tools/v4qa/runbook-audit.py`; compare required-env-check.json with USER-DEPLOY-VI sections2/4. | reports/v4-qa/Q2/required-env-check.json | Add the names-only prerequisite table and distinguish platform-injected, required and optional values; never print values. | status open
