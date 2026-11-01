# Bound v2 input before authentication

Decision by Codex under the user's mission authority, 2026-11-02.

CXN3 requires unsigned oversized requests to return400 or413. The existing handler authenticates before reading the body, so an oversized unsigned request returns401. The former implementation also waits for stream cancellation and has no total body-read deadline. These behaviors are reproduced by the new regression tests; the initial run records8failures and16passing controls.

Keep the existing8192-byte limit. Check actual streamed bytes before authentication; an advertised oversized Content-Length may reject early, but absent or misleading headers never bypass the real byte limit. Decode UTF-8 and parse the bounded object only after authentication and player-budget admission. Thus ordinary unsigned malformed/empty payloads still return401, and admitted malformed data still returns400. Budget refusals retain their status and Retry-After headers without running game logic.

A single10-second deadline bounds the entire input read, including slow chunk delivery. It is shorter than the existing15-second diagnostic request timeout; that diagnostic timeout is not raised. Request aborts stop the read. Refusal responses do not wait for a producer's cancellation promise, which might never settle. Cancellation failures are cleanup failures after refusal and cannot turn the refusal into an indefinite wait. No game work or database action runs for rejected input.

The small fixed buffer bounds memory use before authentication. The new deadline is an input-resource policy, not a claim that the observed live endpoint timeouts are fixed. Those timeouts remain an operational finding until the deployed behavior is verified. No auth token verification, SIWE, request budget, database schema, gameplay rule, contract or frontend flag changes. This repairs an existing input contract rather than enabling a new gameplay feature.

This work is local and unreleased. Before release it still requires complete exact-head verification, applicable review gates and documented rollback. Rollback restores the previous handler source from the recorded parent commit; no migration or player-data change is involved. An independent review is not claimed: the user now forbids subagents/helpers.
