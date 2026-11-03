# Optional user steps — living draft

These steps do not substitute for local implementation or verification.

Current SYSTEM authority (3 November2026) prohibits backend deployments, live migrations and Vercel/VITE_GAME_V2 changes. Recovering the backup below does not itself authorize any such action; a later explicit instruction would be needed. Historical release wording below is conditional, not a ready-to-run instruction.

1. Rotate any previously exposed database credential through Supabase project Settings → Database → Reset database password. Verify authorized integrations reconnect. Do not restore an exposed password; replace integrations with the newly rotated credential. No secret values are recorded here.
2. Repo visibility and contest submission remain unchanged. A later submission pack will document optional publication/submission steps; neither action is authorized for execution by this mission.

Exact optional deployment commands will be added after corresponding local checks prove the changes. No live migration, deployment or flag change is claimed.

Runtime inventory (2026-11-01): the existing Supabase CLI can list the specified project; no credential value was printed or stored. No Vercel CLI executable was found. No release action follows from inventory alone: local score/merge gates, additive-only migration checks and the live go/no-go checklist still apply.

Historical T001 attempt3 (2026-11-02) — retired orchestrator metadata note; no current action. The orchestrator remains stopped and must not be restarted.

Original historical wording: the worker
cannot edit read-only GOAL.md or queue.json. Update T001's deployment acceptance
to explicitly adopt completed T014's approved replacement target
`9c457a3e56b7c5813fa40e6aa20b0c14242ef26a`, retaining historical `74d60da` proof,
or explicitly limit the old SHA criterion to its historical observation window.
Then re-grade the retained evidence. Current successor evidence does not satisfy
literal present-tense `74d60da` equality. No rollback, repeated T014 verification,
new release, or separate corrective task is needed. [Evidence and exact proposed
wording](cards/T001-BASE0-ACCEPTANCE-R3/REPORT.md).

## T007 — required owner recovery before the CXN3 backend release

PR #244 remains draft at `db0f9d64c408825a832d808bc31cfd88f1c3a014`. PR #250 is merged,
but a complete current-production function bundle and its tested restore path are unavailable.
The authenticated CLI refused the read-only export with `UnsafeFunctionDownloadPathError`
because a bundled dependency would extract outside its function directory. Do not disable or
bypass that guard, and do not treat the two partially downloaded files as a rollback package.

The project owner must recover the complete October 31 deployment source and dependency/import
maps from the original deployment checkout or a supported Supabase Dashboard export/support path,
and provide a deployable, secret-free artifact with a known restore procedure. Use project
`qoalewtxflagoprrxrgh`, Edge Functions, and the versions recorded in the linked evidence.
No credentials or private keys should be included. Verify the package locally before any release.
If the owner cannot recover it, keep the current release in place and leave #244 unmerged.
This is a required safety prerequisite under GOAL hard guardrails and mission section 7;
it is not permission to deploy without rollback.

After recovery, finish both fresh self-review passes and the exact-head full gate. The read-only
catalog check already found 17/17 objects present; do not reapply migrations based on filenames.
Any actual migration still needs its documented additive, reversible path and local rollback proof.
Deploy only through that authorized path, preserve the verified previous function package for
rollback, leave Vercel settings unchanged, and run the live `--v2` checker only after #244 merges.
If the live gate fails, stop the queue and restore the verified previous function package through
its tested procedure; never roll back by deleting player data. No release command is offered as
ready to execute while these prerequisites are unresolved.

[Evidence, exact failed export command, and retained preflight results](cards/T007-CXN3-GATE/REPORT.md).


## Optional: native context compaction for this long chat

The current handoff is saved in `reports/MEGA-CURRENT-HANDOFF.md`. The context-compact skill at `/Users/bao/.codex/skills/context-compact/SKILL.md` says: “If no such tool is exposed, ask the user to enter `/compact` in the current Codex composer.” No native compaction action is exposed in this tool session. If desired, enter `/compact` in this same chat; do not create a helper chat or use another writer. Per the user instruction, this owner step is optional and blocks no ongoing work.

The configured threshold was observed as180880 tokens with scope `total`; it was preserved. Runtime application and an actual new compaction event were NOT VERIFIED. Saving this handoff or reading that setting is not a claim that compaction occurred.


## CXQ1 — user-controlled Fuji wallet test

The user has Core in Chrome and supplied public address0x2Bba9a48F7F79d99154108A28d32f1a21d17055c. Read-only Fuji verification found0.57499999978920712testAVAX at block60447415; this account is also the deployed NFT owner. Funding for this account is therefore observed, but isolated throwaway status, the separate funded buyer and an actual mint/list/buy run are not verified.

The user stopped screen control. SYSTEM must not resume browser/native UI actions without explicit permission. The user can perform the [manual test](cards/CXQ1-FRESH/MANUAL-TEST.md) in Core and send only public addresses, start time and mint/list/buy transaction hashes. No seed, private key, password, voucher, signature or session token should be shared.

Use normal game eligibility and wallet prompts on chain43113 only. The owner account does not need any administrative action. A separate buyer must have free test AVAX. The earlier official faucet/login observation remains [historical evidence](cards/CXQ1-FRESH/FUNDING.md), not a claim that the supplied account lacks funds.

The [public receipt checker](cards/CXQ1-FRESH/WALLET-RUN.md) rejects mismatched contracts/accounts/payments, stale receipts, missing transfers and reorgs. Its local controls do not count as a live funded run. UI-owned SYS-UI-007 also remains a separate live regression until its corrective release is verified. No backend deployment, production setting change or guard bypass is authorized.


## SYS-HEALTH-001 — read-only sign-in failure diagnosis

Current auth-nonce returns502 for POST and GET; auth-verify GET returns405. The supplied seller wallet has observed test funds, but new sign-in can fail independently. Please inspect the Supabase auth-nonce logs/Invocations for3November2026 19:57–20:25 Vietnam time and share only the sanitized error category/redacted message. Request ids and exact evidence are in [SYS-HEALTH-001](cards/SYS-HEALTH-001/REPORT.md). No credential or raw log export is needed. This is a read-only owner step, not authorization to redeploy, migrate, change flags or bypass #244 backup/restore safeguards.
