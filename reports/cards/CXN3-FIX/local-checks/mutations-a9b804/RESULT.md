# Current-head direct mutation checks

Head: a9b804cec74c866b0b06ca69142d10db3b642a75. Six faults were applied and executed afresh on this head. Fault definitions were reused as data; predecessor test results were not reused.

| Fault | Failing/passing cases | Verdict |
| --- | --- | --- |
| Auth before byte limit |6/21 | Detected by assertions |
| Allow8193bytes |4/23 | Detected by assertions |
| Allow JSON arrays |1/26 | Detected by assertions |
| Lossy UTF-8 decoding |1/26 | Detected by assertions |
| Delay deadline to20seconds |2/25 | Detected by assertions |
| Await unresolved cancellation |1/26 | Detected by assertions |

All mutant commands exited1 with actual assertion failures, not setup/syntax failures. Both unmodified controls passed27/27 with exit0. The scratch checkout is restored clean at a9b804; the verifier/source checkouts were never mutated. No helper runner or subagent was used.

An already-consumed process handle was later queried again. Persisted terminal logs and absence of a live scratch process confirmed completion; an evidence-exists guard prevented duplicate execution or overwriting the saved M6 result. This was bookkeeping, not another mutant attempt or a retry of a failed product test.
