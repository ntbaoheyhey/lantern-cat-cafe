# Direct mutation checks

Candidate: eb3786f3a38d446fb2d08dbf195e44f8480220ab. The coordinator ran ordinary project tests directly in a new scratch worktree; no subagent, helper or mutation-runner script was used.

| Deliberate source fault | Observed result | Evidence |
| --- | --- | --- |
| Authenticate before byte validation |6assertion failures,21passed; unsigned oversized bodies return401 |m1-auth-before-size.diff/.log |
| Raise the byte cap from8192to8193 |4assertion failures,23passed; extra byte is admitted |m2-extra-byte.diff/.log |
| Accept array-shaped JSON |1assertion failure,26passed; returns200instead of400 |m3-array-body.diff/.log |
| Decode invalid UTF-8 with replacement |1assertion failure,26passed; malformed encoded JSON is accepted |m4-lossy-utf8.diff/.log |
| Delay the body deadline to20seconds |2assertion failures,25passed; required refusal has not completed at10seconds |m5-late-deadline.diff/.log |
| Await a producer's cancellation promise |1assertion failure,26passed; refusal remains pending |m6-await-cancel.diff/.log |

All six mutants exited1 with genuine assertions after the suite loaded; no syntax, import, install or termination failure is counted. The immutable handler was restored between mutations, and each saved diff shows the isolated fault. Both unmodified controls passed27/27 with exit0. Scratch HEAD remains eb3786f and its working tree is clean. Production/source checkout was never mutated by these experiments.

This is builder verification, not an independent grade. The temporary20-second deadline existed only as a deliberate fault in scratch; the candidate deadline and all test timeouts were unchanged.
