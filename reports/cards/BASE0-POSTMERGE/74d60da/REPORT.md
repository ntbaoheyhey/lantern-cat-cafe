# BASE0 actual-main verification — IN PROGRESS

Updated 2026-11-02T11:51:03+07:00. PR246 merged as `74d60dab2cef8c31a3f2729d18719ff3021a9eda`; resulting tree equals graded280ff4b. This report separates actual-main evidence from premerge checks.

- Clean checkout: `/Users/bao/.codex/worktrees/mega-base0-postmerge-74d60da/taskbar-hero`.
- All14 completed command exits are0: frozen install; Deno generation/drift/import guard; root tests/typecheck/lint; default/classic/v2 builds; two bundle scans; links; full browser1280×720.
- Tests: scripts5, chain32, auth24, Supabase548, game-rules366, API-contract16, web1308. Game-rules retains2 expected failures/11 skips, unchanged.
- Full browser1280×720:265/265 PASS (2.3min), session37224/PID85026 terminal. No owned test process or4440–4444 listener observed at checkpoint.
- Links:70 Markdown files/811 references, no missing targets. Deno:18 functions clean. Both bundle scans found no secret-looking strings.
- Both exact-main GitHub Vercel statuses say Deployment has completed. Authenticated primary UI confirms Ready, Production/Current, main and full74d60da source; alias https://taskbarhero-eight.vercel.app. See provider-ui-observation.json and provider-production.jpg.
- Remaining: full1600×900;12-spec repeat10 at bothsizes; safe ledger FORCE_ALL verifier; complete artifact equality; legacy check-live; approved phased live path at bothsizes. Provider success is not live-path proof.
- Ledger verifierd71d866 initializes pinned contract submodules and prepares Solidity0.8.24 before offline tests. Syntax/diff passed; actual FORCE_ALL run pending. Report its synthetic tested SHA separately if squash creates one.
- No test, worker/helper, product edit, merge, release or app request was started by this checkpoint. No later merge before all main/live gates pass.

Raw logs/exit files are retained here; checkpoint-result.json records their hashes/sizes. Existing A97.64285714285714/B98 remain unchanged; coordinator checks are not a new independent grade. The checkpoint preparation initially expected15 exits; the guard stopped before writes and inventory corrected this to14 without changing any result.

Milestone 2026-11-02T12:12:41+07:00: actualmain74d60da fullbrowser265/265 at both1280x720 and1600x900, exit0. Twelve-spec repeat10 at1280 is RUNNING, session5924/shellPID6207, ports4440–4443 owned by6245/6264/6312/6361; worktree mega-base0-postmerge-74d60da remains tracked-clean. Repeat1600, safeFORCE_ALL verifier, artifact identity and live gates still pending. No nextmerge.
