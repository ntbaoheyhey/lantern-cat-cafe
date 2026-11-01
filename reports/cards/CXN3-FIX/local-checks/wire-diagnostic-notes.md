# Wire-test preparation findings

The first launch command was rejected before execution because its cleanup used rm-f style deletion. No test ran in that rejected call. The safer command retains its PID evidence file and uses rmdir only for the empty, newly owned lock directory. No forced file deletion or guard bypass was used.

The first actual wire run reached all nine endpoints. Their OPTIONS and ordinary unsigned checks passed, but the newly written oversized assertion expected400 while the unchanged loopback server returned413 from its own8192-byte transport guard (scripts/local-server.mjs). The mission explicitly accepts400or413. The original test source is preserved in wire-spec-overconstrained.ts.txt and its red log in wire-before-commit.log.

The corrected assertion accepts only400or413, still excludes401, and checks the handler JSON/CORS shape when the response is400. No existing test or transport guard was relaxed. This checks the wire contract, not the changed handler's oversized branch: the27direct handler regressions exercise that branch, including unknown/misleading lengths and stream cancellation. No live fix or full deployment proof follows from a loopback result.
