# QA-6 campaign manifest and policy transition

Read17November before regenerating the manifest. This is source/rollout consistency; no new economy, live database update, contract change or automatic authority activation.

1. [PostgreSQL transaction tutorial](https://www.postgresql.org/docs/current/tutorial-transactions.html), formal product documentation: all-or-nothing changes preserve prior state when a transaction aborts.
2. [PostgreSQL INSERT](https://www.postgresql.org/docs/current/sql-insert.html): ON CONFLICT explicitly chooses the update for an existing policy; it is not a reviewed player-state migration.
3. [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations): distinguish checked-in migrations/local verification from applying changes to the linked project.
4. `tools/chain/campaign-manifest.mjs`:159non-test source files, path/NUL/content/NUL SHA256. The generated constant enables no authority by itself.
5. `tools/chain/prepare-v3-demo.mjs`: already emits a transaction with an advisory lock, ten-minute freshness guard, source-policy upsert and fixed budget checks. It rejects any existing campaign with another rules hash before changing anything; old players are never reset.
6. `20261112090000_chain_campaign_journal.sql` and `docs/design/chain/CAMPAIGN-AUTHORITY.md`: boot/commit require an enabled policy matching the current rules; saved journals retain their original rules fingerprint.
7. Independent QA `Q2/manifest-triage.json` and local `S11/campaign-manifest-comparison-1.json`: working-tree and exact committed Git-blob methods independently agree on159sources/1ce8f46d7bd5e346e4d66964d61157dae07df1b3fdd26550f8746450ca641c82; old manifest ba1bf19667c03038f77cda94c8998b9baa2659d1381ef7cb99b56cc55bb96eea is stale. Zero input differences; existing --check fails.

Decision: regenerate only the manifest, retain the existing explicit policy transaction and stale-player guard, document the exact old/new hashes and required preparation step. Do not add a redundant schema migration or bypass --check. Verify locally that manifest-only rollout is rejected, the prepared transaction enables a fresh current policy, and a stale existing journal aborts the whole transaction without changing player state, policy or budget. User deployment remains a separate explicit action.

Local result `S11/campaign-policy-check-1.json`: three disposable PGlite databases. Manifest-only deployment is rejected by the old policy; the unchanged prepared transaction creates/updates the exact current policy and supports a fresh journal; repeating it preserves state. A stale journal aborts and rollback leaves player, policy, v3 budget and tester budget byte-identical. Source check nowPASS159files. This verifies existing migration behavior; no schema change or public action was needed.
