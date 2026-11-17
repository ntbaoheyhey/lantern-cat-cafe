# Deploy runbook dry run — active
Target pinned for runtime: b1e4398a8844fa51d2784760e92ed24528d13d2b. QA source static audit: abf6438866f0b5fcb9d09747d565c59cf6b35a3b; product/runtime diff to target is empty.
No deployment, login, production change or secret values were accessed.

| Runbook step | Result so far | Evidence / exact wording proposal |
|---|---|---|
| 1 source branch and rollback | AMBIGUOUS | Fresh clone pinned;19Nov freeze tag intentionally absent before freeze. Save previous production URL manually. |
| 1 frozen install | PASS QA tree; clone pending load guard | fresh-clone.json; pnpm10.28.0,Node24.22.2 match required versions. |
| 1 tests/typecheck/build | PENDING | Fresh clone's two Foundry submodules are uninitialized; reproduce forge failure before remediation. |
| 2 Supabase login/link/migration/deploy | STATIC PASS paths; NOT EXECUTED | All25handler paths exist; CLI2.122.0 installed. Verify linked migration history manually on deployment day. |
| 2/4 secret prerequisites | AMBIGUOUS / QA-1 | Add exact names AUTH_JWT_SECRET,VOUCHER_SIGNER_PRIVATE_KEY,optional SPONSOR_PRIVATE_KEY,GAME_SEED_SECRET; distinguish platform-injected SUPABASE_* variables. |
| 3 bounded YARN budget | STATIC PASS script path; NOT EXECUTED | tools/chain/prepare-v3-demo.mjs exists; preserve historical start-block and ledger. No SQL/chain write run. |
| 4 sponsor reserve check | STATIC PASS arithmetic; live balance unmeasured | Keep1AVAX after pending+0.05AVAX+21000*gas; no sponsor/secret inspection. |
| 5 Vercel source/artifact | AMBIGUOUS pending build | Vercel CLI is invoked via pinned dlx; no installed global binary. No Vercel API functions in source; backend is Supabase Edge Functions.250MB Node function limit not applicable to this static Vite source tree. Actual hosted project settings not accessed. |
| 5 flags | STATIC names audit complete; classification in progress | ENV-NAMES.md lists110direct/wrapper environment names and6dynamic access sites; absent optional flags are not blockers. |
| 6 public smoke/rollback | NOT EXECUTED | Requires user deployment URL and recorded preceding deployment. Read-only QA smoke does not claim transaction completion. |

Required on20Nov: authorized Vercel/Supabase access; reviewed freeze SHA/tag; previous production URL; migration backup/history; existing signer/JWT/sponsor settings by exact name; public start-block; finite YARN budget; sponsor reserve; valid guest quota; final static artifact and public metadata/audio URLs.
Full-size artifact,10largest cold requests, local check results and exact step verdicts will follow the active jobs.
