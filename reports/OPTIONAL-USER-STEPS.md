# Optional user steps — living draft

These steps do not substitute for local implementation or verification.

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


## CXQ1 — funded throwaway Fuji wallet prerequisite

The current official [faucet](https://build.avax.network/console/primary-network/faucet) requires a connected wallet and a Builder Hub login. The Core faucet URL redirected there during this run. The connected in-app browser has neither; Chrome is not enabled in this session's browser tooling. The offered Console wallet would store a key in the browser and was not created. No wallet/key, signature, funding request or transaction has been created by SYSTEM.

After the UI session records CXU3/CXC2 readiness, use two throwaway Fuji-only accounts in a wallet you control and obtain free test AVAX through a supported faucet/login flow. Keep seeds/private keys private; do not paste or commit them. A funded mint/list/buy run must record actual chain43113 receipt hashes for the specified NFT/Market contracts, and must never use mainnet or real funds. Until that run executes, wallet proof remains NOT VERIFIED. This owner prerequisite blocks neither security documentation nor the draft submission pack.

[Current funding observation](cards/CXQ1-FRESH/FUNDING.md). No request is made to bypass login, CAPTCHA, the Supabase export guard or any production setting.
