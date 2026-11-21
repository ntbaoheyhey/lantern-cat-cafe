# Cat RPG v2 cut-over checklist

This living checklist follows **user-approved mission section 7**: prove changes locally first;
optional deployment may use already-configured CLI credentials only after the score and merge
gates (sections 3 and 5) pass. Only additive, idempotent, reversible migrations qualify, with a
matching rollback file under `supabase-manual/`. Never rewrite or remove live player data.
Missing credentials mean local verification and recorded optional steps, not a request for secrets.
The current CXN3 P/B card permits **read-only live probes only**: no deploy, SQL application outside
PGlite, Vercel change, push or merge. Later release work must satisfy the prerequisites below.
Use the exact release commit throughout; stop on a failed gate.

## Reality (1 Nov 2026)

- The six v2 tables have been live since **26 Oct 2026**; the integrity migration was applied
  **27 Oct**, as recorded in [C3](../reports/C3.md). These are historical owner confirmations;
  re-check the live catalog below rather than assuming newer migrations are applied.
- The switch is **`VITE_GAME_V2=1` in Vercel Production environment variables, followed by a
  redeploy**. [flag.ts](../apps/web/src/layout/flag.ts) reads that build-time value. Check the
  production setting and the deployed build: C3 records that it may already be `1`.
- Keep backend-dependent features **default-OFF** until their backend is verified. Locally use
  `VITE_GAME_V2=0` for the classic baseline and `1` only for the isolated v2 demo build, with empty
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do not change an existing live setting in this card.
- **D8 Founder batch: DROPPED**, decision 31 Oct (wave-n plan, section 4, per the mission record).
  No batch, cutoff or grant is a launch gate. The existing `founder_grants` table remains.
- Nine classic/shared and nine v2 Edge Functions coexist. Keep classic rows, shared accounts,
  Relic history and Fuji contracts. This checklist does not reset player data.

## 1. Go / no-go before the release

Adapted from [C3's checklist](../reports/C3.md#go--no-go-checklist):

- [ ] Hold merges during the release window and record the release commit from `origin/main`;
  no open blocker PRs. Independent graders and the serial merge gates must pass.
- [ ] Local checks green at that commit: install, Deno drift/import guard, typecheck, lint, unit
  tests, build, classic and v2 browser tests. For an existing PR run
  `bash scripts/verify-pr.sh <release-pr-number>` without `--comment`; do not spend Actions
  minutes for verification. Create and push an RC tag
  for that verified commit, using `git tag -a rc-v29-YYYYMMDD -m "v2 release candidate" <commit>`
  then `git push origin rc-v29-YYYYMMDD` (replace date and commit).
- [ ] `node scripts/rehearse-cutover.mjs` passes locally on the release commit, without secrets.
- [ ] Record any balance decision/signature through the mission's full-authority decision process;
  [numbers-v2.md](proposals/numbers-v2.md) currently says NOT READY FOR SIGN-OFF. That historical
  proposal is not evidence of approved or deployed numbers; CXN3 changes no balance.
- [ ] Prove migration application from zero and on the prior schema in PGlite. Review reversibility
  and the matching rollback files before any optional live application. The live database has
  **no verified backup**; never use destructive SQL there, even if a backup later becomes available.
- [ ] Check Vercel **web > Deployments / Usage**: respect the 100 deploys/day cap and current plan
  allowance. No GitHub Actions runs for this mission.
- [ ] Confirm all nine `v2-*` functions and complete section 2; unsigned refusals alone do not
  confirm deployed function versions or SQL.
- [ ] Record Vercel Production `VITE_GAME_V2`, the intended release commit and a previous good
  deployment. Test flag rollback locally before any optional switch; do not execute SQL rollback.

Safe local checks from the release checkout (Node 20+, pnpm 10.28.0; no credentials):

```sh
CI=true pnpm install --frozen-lockfile
pnpm gen:deno
git diff --exit-code -- supabase/functions
node scripts/check-deno-imports.mjs
node --test scripts/check-live.test.mjs
pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/live-schema.test.ts --reporter verbose --silent=false
VITE_GAME_V2=0 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' pnpm --filter @taskbar-hero/web build
```

These targeted checks supplement the full verification gate. Browser checks/rehearsal are scheduled
separately; this card does not run them. CXN3's reserved ports are 4320/4321/4322/4323, with empty test
backend configuration. Keep local mock-auth overrides out of production.

## 2. Check the live schema, then apply pending migrations

For an authorized read-only catalog check, open Supabase project `qoalewtxflagoprrxrgh` > **SQL Editor**, paste the entire
[read-only schema query](proposals/sql/check-live-schema.sql), and run it. It returns one row per
expected object with `present` true/false. All 17 must be true before the function deployment.
It checks catalog presence and signatures, not full function definitions or gameplay behavior.

The table below is generated from the sorted migration filenames **newer than 20261102000000**.
These are pending live confirmation, not a claim that every file is unapplied. Check the owner's
migration record. In a later section-7-authorized deployment, apply missing files **by hand in the
SQL editor BEFORE deploying functions**, in this order, then run the catalog query again. Without
the required access or release gates, keep this as an optional step and use the local PGlite proof.
Do not replay an already-recorded migration blindly.

| File | Why it must precede the function deployment |
| --- | --- |
| [20261103000000_siwe_nonces_server_only.sql](../supabase/migrations/20261103000000_siwe_nonces_server_only.sql) | Explicit server-only nonce policy and client privilege denial. |
| [20261104000000_v2_request_budgets.sql](../supabase/migrations/20261104000000_v2_request_budgets.sql) | Private request budget table and RPCs; authenticated requests fail closed with **503** if the limiter cannot access them. |
| [20261106000000_voucher_cancel_reissue.sql](../supabase/migrations/20261106000000_voucher_cancel_reissue.sql) | Cancelled voucher status and `game_voucher_cancel_reissue` for used-nonce recovery. |
| [20261107000000_voucher_race_guard.sql](../supabase/migrations/20261107000000_voucher_race_guard.sql) | CXN1 reissue columns, one-minted-voucher index and `game_voucher_reissue_resolve`; prevents signing a replacement during the chain check. |

Only `private.v2_request_budgets` is implemented as a budget table. The proposed per-IP
`v2_proxy_requests` table is not a committed migration and is not part of this inventory.

## 3. Deploy the verified functions (optional, section 7)

Run `node scripts/check-deno-imports.mjs` first, from the release checkout. Stop if it fails.
Use only an already-configured Supabase CLI login, after the local score/merge gates and migration
prerequisites pass; never paste a token into a command log. Otherwise retain the commands as optional
steps and the flags as default-OFF. Current NO-GO prerequisites:

- BASE0 repaired the missing explicit `index` aliases and converted the known-defect case in
  [deno-imports.test.ts](../supabase/tests/src/deno-imports.test.ts) to a passing regression.
  The integrated checkout resolves all 18 functions. Re-run the strict import guard and
  no-drift check on the exact release commit; successful generation alone is insufficient.
  A failing guard remains a no-go condition. Do not disable it.
- This checkout lacks `supabase-manual/v2-rollback.sql` and the per-migration rollback files required
  by section 7. Review and test those locally before optional migration deployment; do not invent
  a live rollback or claim the proposal below is an equivalent file.

The [deployment reference](deploy.md#edge-functions) links here. This is the existing function
workflow command with its public variables expanded, preserving `--use-api --no-verify-jwt`
and all 18 function names:

```sh
node scripts/check-deno-imports.mjs
supabase functions deploy auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade relic-forge relic-mint-report v2-choose-class v2-claim v2-equip v2-state v2-craft v2-salvage v2-lock v2-relic-forge v2-boss-fight --project-ref qoalewtxflagoprrxrgh --use-api --no-verify-jwt
```

Stop on a failed deploy. Function configuration and secret names are in [go-live](go-live.md).

## 4. Set the web switch and check the release

1. Only after the entire live go/no-go checklist is green and rollback has been tested, section 7
   permits the switch if the Vercel CLI is already logged in. Otherwise keep it as an optional step:
   Vercel **web > Settings > Environment Variables > Production**: confirm `VITE_GAME_V2=1`,
   the public Supabase configuration in [go-live](go-live.md#3-web-app-vercel),
   and the intended release commit. Redeploy to bake in the environment value. If the intended
   build is already Ready with this setting, no additional redeploy is needed.
2. Wait for **Ready**, then confirm production points at that build at
   <https://taskbarhero-eight.vercel.app>.
3. Run the unsigned v2 checks (27 probes; no sign-in or key):

   ```sh
   node scripts/check-live.mjs --v2
   ```

   OPTIONS must return 2xx with CORS allowing the site origin, POST and content-type; an empty
   unsigned POST must return 401; oversized JSON must return 413 or 400. A 503 prints
   **"budgets migration missing?"**: check section 2 and function logs. This is a diagnostic hint,
   not proof of that cause. Any failure is a no-go until reviewed.

   **Current handler limitation:** authentication precedes body parsing and budget admission.
   Unsigned oversized JSON can therefore return 401, which this strict check reports as FAIL.
   A passing unsigned 401 does not prove the budgets migration is present. Use section 2 for
   schema confirmation and the signed-in smoke test for actual gameplay. Do not add credentials
   to this script to bypass either limitation.
4. Run `node scripts/check-live.mjs` for the additional existing site, classic/shared function,
   metadata and Fuji read checks. The legacy `auth-nonce` probe issues a challenge; it does not
   sign in. For strictly unsigned v2-only checks use `--v2` above.
5. Prove gameplay locally at 1280x720 and 1600x900, with the flag ON and OFF. A later section-7
   wallet card may use a disposable Fuji wallet (or local anvil/fork if faucet funding is unavailable)
   to test sign-in, class, claim, boss, Bag, craft and Relics. Never use mainnet or real funds. This
   read-only card neither signs in nor issues transactions. Check console and function logs without
   recording credentials.
6. If all gates pass, record evidence and end the release window. Do not announce health from the
   unsigned probes alone: they do not verify sessions, SQL behavior or voucher signing.

## 5. Rollback

Sign-in failure, claim 500, a blank screen or another critical blocker unresolved within ten minutes
means no-go. In authorized release/incident work, set **`VITE_GAME_V2=0`** in Vercel Production and
**redeploy**, or open the previous
good deployment and **Promote to Production**. Check that the promoted build has the intended classic
setting; promoting a build that already used v2 does not restore classic. Re-run health checks.

Keep every v2 row, including `founder_grants` and `v2_action_results`. Classic/shared functions and
Fuji ownership remain in place; verify classic gameplay after rollback. The destructive
[SQL rollback proposal](proposals/sql/v2-integrity-rollback.sql) is a disposable local rehearsal
reference. The requested `supabase-manual/v2-rollback.sql` is absent and has not been compared with
that proposal. Historically SQL rollback was restricted to **before real players have v2 data**;
section 7a now prohibits destructive live operations. Keep SQL rollback local; it is never the
post-launch recovery procedure. See [runbook](runbook.md) for incident triage.

## History

The original Card A22 runbook scheduled a code flag flip through C17 and referenced the removed
`ai/codex-v29-founder-grant` draft. [C3](../reports/C3.md) exposed those stale steps. D8's batch was
dropped on 31 Oct; this revision replaces those procedures with the actual Vercel environment switch,
ordered migration confirmation and unsigned v2 probes. Earlier proposals are historical context.
