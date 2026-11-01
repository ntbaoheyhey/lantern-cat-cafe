# CXN3-FIX verification — local candidate, not merge-ready

Candidate a9b804cec74c866b0b06ca69142d10db3b642a75 is based on repaired BASE0280ff4b. Main remains1fb25ed at the last ref check. The coordinator implemented and verified it directly; no subagent or helper runner was used. No source push, PR, backend release or player-state write is claimed here.

## Behavior

The shared v2 handler rejects actual input above8192bytes before authentication. It bounds the entire body read to10seconds and handles abort/cancellation without waiting indefinitely for producer cleanup. UTF-8/object parsing remains after authentication and budget admission. Ordinary unsigned small/malformed/empty input remains401; refused input never reaches game work. The token verifier, SIWE, schemas, contracts and gameplay rules are unchanged. This does not yet establish a cause or deployed fix for historical endpoint timeouts.

## Current-head evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Frozen install, root typecheck/lint/unit tests | PASS; root includes575Supabase/1308web tests; inherited2expected failures/11skips disclosed |local-checks/install-a9b804.log and root-*-a9b804.log |
| Direct handler regressions |27PASS; initial24-case run had8FAIL/16PASS and is retained |local-checks/body-limit-*.log; current root log |
| Deliberate mutants |6/6detected,2green27-test controls; scratch restored clean |local-checks/mutations-a9b804/RESULT.md and per-fault logs/diffs |
| Default/classic/v2 builds | PASS |local-checks/*build*a9b804.log |
| Deno generation/drift/import guard | PASS;18functions clean |local-checks/deno-*-a9b804.log |
| Links and bundle secret scans | PASS |local-checks/links-a9b804.log; bundle-scan*-a9b804.log |
| Same-day main comparison |classicgzip+0.144240%;v2+0.140554%, below5%; static public tree unchanged |local-checks/bundle-budget-a9b804.json and comparison/build logs |
| Complete browser suites |274/274at1280×720 and274/274at1600×900; zero retries |local-checks/full-*-a9b804.log |
| New wire spec repeat10 |90/90at each configured desktop size |local-checks/repeat-*-a9b804.log |
| Guest and local-signed UI audit |18+18records, zero findings |ui-audit-guest/findings.json;ui-audit-signed/findings.json |
| Effects and reduced motion |10/10at each size; all9manifest screens reached in both modes |effects-1280/summary.json;effects-1600/summary.json |
| Images |16PNG captures, each below200,000bytes |local-checks/png-bytes-a9b804.txt |
| Keyboard and contrast |7main tabs at each size with focus/visible panels;10contrast tests pass |public-config/manual-results.json;local-checks/contrast-a9b804.log |
| Production public-config guest UI |4manual cases pass across flags0/1 and both measured sizes; one visible canvas and no observed console errors |public-config/source.json, embedded-config-check.json, build/bundle logs and manual-results.json |

The public configuration was observed from the live client, validated as the expected public anon role/project and verified embedded in both builds. Values were withheld. Manual guest checks used fresh tabs/origins and performed no sign-in/wallet action. Reviewed ApiSwitch/ApiSwitchV2 code selects demo APIs without a tab-scoped session token. This is manual UI/console evidence, not a new network-interception trace or proof that the server repair is deployed.

## Honesty and scope

Initial type inference failure, the9over-constrained wire assertions and their original test source remain preserved. The mission accepts400or413; the unchanged loopback server's own8192-byte guard returns413 before the production handler. Corrected wire tests still reject401, while27direct handler tests exercise the masked branch. The loopback runtime also omits player-budget admission; dedicated Supabase tests cover the real PGlite budget RPC. No existing assertion, skip or retry was weakened.

G5 setup observations include an ineffective pre-tab viewport setting and one stale accessibility index. These were corrected using fresh state; the wrong-size observation was excluded. Actual dimensions were measured for every counted case. UI structural debt and the empty-versus-populated Bag fixture mismatch are disclosed in ui-diff.md; no completed redesign match is claimed.

Tier1: supabase/functions/_shared/v2/http.ts and supabase/tests/src/v2-body-limits.test.ts. Tier2: apps/web/e2e/server/request-body-limits.spec.ts, the decision/index and reports/cxn3-fix.md. Scope is relative to BASE0280ff4b; inherited BASE0 code is not attributed to this repair. No dependencies, environment values, workflows, contracts or migrations changed.

## Remaining gates

Source publication/draft PR, required PR-verifier handling, actual-main integration, independent review and release/live proof remain incomplete. The user forbids subagents/helpers; self-review is not independent grading and no score is assigned.

The repository verify-pr.sh contains forced deletion of its temporary directory and forced worktree removal. It has not been invoked for this item. A previous launch cleanup was automatically rejected for rm-f style deletion; that was resolved by retaining PID evidence and removing only an empty lock directory. Do not evade that safeguard by running the same forced-deletion behavior through an opaque script. Safely address the existing verifier's cleanup before deciding its named-command gate is complete; all actual validation steps already run remain cited above.

BASE0's deployment hold is separate and remains. This item is inserted before CXN3 because the latter's mandatory v2 live check is known red. No merger, quota reset, backend health or full deployed-source identity follows from these local results.
