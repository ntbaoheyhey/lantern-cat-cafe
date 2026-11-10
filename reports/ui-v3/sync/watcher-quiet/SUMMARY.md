# Quiet optional report reads

The older art R0 tip `7393f294b4ffd209b44e479794908abae3830e93` has no `ART-REPORT.md`. The watcher correctly caught that optional read failure, but Node forwarded the Git diagnostic to stderr before the catch. This made a successful poll look like a failure.

The Git helper now explicitly pipes stdio. Expected absent reports stay quiet; actual candidate-fetch failures still throw into the existing `last-error.txt` handler. Eligibility rules and stop conditions are unchanged.

- Reproduction: [122-byte diagnostic](before.log), from the prior default-stdio Git read of the missing R0 report.
- Exact live check: `node reports/ui-v3/sync/watcher-quiet/poll-smoke.mjs`; [poll receipt](poll.json) shows a fresh heartbeat and zero stdout/stderr bytes. The test stops only its own child after the completed poll; it never creates `STOP-UI`.
- [Seven eligibility cases](status-tests.json) PASS; syntax and diff checks PASS.
- [G1](checks.txt): typecheck/lint/1,867 web tests/build PASS after waiting for the shared timing lock in the 30-second local loop; lock released with the required handoff.
- [Fresh 1280×720 offline Home](fresh.json), both looks: zero browser errors; [look on](fresh-on.webp) and [look off](fresh-off.webp) visually reviewed.

Fresh-eyes concerns are unchanged: cold-start delay (U, bounded repairs exhausted), prototype battle art (B, no accepted art release), and limited Home depth (U, approved static fallback). The primary action and labels remain clear; crew faces are unobstructed. No UI, gameplay, asset or artifact changes were made. Offline SHA256 stays `2a7bef0551b40376c8d51fafbd35556e4870ababc08d06de60196d5a3d9c95a5`, 31,203,011 B. Score remains 8.475/10 and G6 remains PARTIAL.
