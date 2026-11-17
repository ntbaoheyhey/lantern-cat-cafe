# Independent QA findings — SHIP

QA-1 | MAJOR | owner SHIP | 52aaaba399a38cf76de68866af6c8e6ed972cfdd | A fresh deploy operator is told to retain signing/JWT/sponsor secrets without their exact setting names; missing prerequisites stop guest entry or rewards. | Run `python3 tools/v4qa/runbook-audit.py`; compare required-env-check.json with USER-DEPLOY-VI sections2/4. | reports/v4-qa/Q2/required-env-check.json; Q2/required-env-recheck-a12c22842.json | Add the names-only prerequisite table and distinguish platform-injected, required and optional values; never print values. | status open
