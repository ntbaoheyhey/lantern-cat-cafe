# Independent QA findings — ART

QA-5 | MAJOR | owner ART | b1e4398a8844fa51d2784760e92ed24528d13d2b | A judge/operator running the documented fresh-clone test command sees7presentation-test failures, so repository validation is red. | Frozen install in qa-clone, then pnpm test via tools/v4qa/local-checks.py; web suite reports2failed files/7failed tests in cat-presentation and outcome-labels. | reports/v4-qa/Q2/test-failure-summary.json; Q2/local-checks-1.json; work/v4qa/jobs/q2-test.log | Resolve the presentation/rules contract mismatch and restore the7tests before freeze; coordinate rule semantics with SHIP. | status open

No independently reproduced findings yet.