# Cat RPG v2 cut-over checklist

Owner operations below are instructions for the user, not authorization for an agent to deploy or
change live data. Use the exact release commit throughout. Allow 45–60 minutes, including a
15–20 minute laptop and phone play-through. Stop on a failed gate.

## Reality (1 Nov 2026)

- The six v2 tables have been live since **26 Oct 2026**; the integrity migration was applied
  **27 Oct**, as recorded in [C3](../reports/C3.md). These are historical owner confirmations;
  re-check the live catalog below rather than assuming newer migrations are applied.
- The switch is **`VITE_GAME_V2=1` in Vercel Production environment variables, followed by a
  redeploy**. [flag.ts](../apps/web/src/layout/flag.ts) reads that build-time value. Check the
  production setting and the deployed build: C3 records that it may already be `1`.
- **D8 Founder batch: DROPPED**, decision 31 Oct (wave-n plan, section 4, per the mission record).
  No batch, cutoff or grant is a launch gate. The existing `founder_grants` table remains.
- Nine classic/shared and nine v2 Edge Functions coexist. Keep classic rows, shared accounts,
  Relic history and Fuji contracts. This checklist does not reset player data.

## 1. Go / no-go before the release

Adapted from [C3's checklist](../reports/C3.md#go--no-go-checklist):

- [ ] Freeze merges and record the release commit from `origin/main`; no open blocker PRs.
- [ ] Local checks green at that commit: install, Deno drift/import guard, typecheck, lint, unit
  tests, build, classic and v2 browser tests. For an existing PR use `scripts/verify-pr.sh`
  without `--comment`; do not spend Actions minutes for verification. Create and push an RC tag
  for that verified commit, using `git tag -a rc-v29-YYYYMMDD -m "v2 release candidate" <commit>`
  then `git push origin rc-v29-YYYYMMDD` (replace date and commit).
- [ ] `node scripts/rehearse-cutover.mjs` passes locally on the release commit, without secrets.
  Its historical Founder-unavailable result is expected; it is not a missing launch step.
- [ ] User confirms the approved balance sign-off in [numbers-v2.md](proposals/numbers-v2.md).
- [ ] User takes a backup (`supabase db dump --data-only -f <outside-repo-backup.sql>`) and stores
  it securely outside the repository; include classic, v2, integrity and shared Relic tables.
- [ ] User checks Vercel **web > Deployments / Usage**: release fits the local budget of three
  deploy groups/day and the project's current plan allowance. Manual function deployment below
  needs no GitHub Actions minutes.
- [ ] User confirms all nine `v2-*` functions in the Supabase dashboard and completes section 2.
- [ ] User confirms Vercel Production `VITE_GAME_V2`, the intended release commit, and a previous
  good deployment to Promote if needed. Locate any local SQL rollback file but do not run it.

## 2. Check the live schema, then apply pending migrations

User: open Supabase project `qoalewtxflagoprrxrgh` > **SQL Editor**, paste the entire
[read-only schema query](proposals/sql/check-live-schema.sql), and run it. It returns one row per
expected object with `present` true/false. All 17 must be true before the function deployment.
It checks catalog presence and signatures, not full function definitions or gameplay behavior.

The table below is generated from the sorted migration filenames **newer than 20261102000000**.
These are pending live confirmation, not a claim that every file is unapplied. Check the owner's
migration record; apply missing files **by hand in the SQL editor BEFORE deploying functions**, in
this order, then run the catalog query again. Do not replay an already-recorded migration blindly.

| File | Why it must precede the function deployment |
| --- | --- |
| [20261103000000_siwe_nonces_server_only.sql](../supabase/migrations/20261103000000_siwe_nonces_server_only.sql) | Explicit server-only nonce policy and client privilege denial. |
| [20261104000000_v2_request_budgets.sql](../supabase/migrations/20261104000000_v2_request_budgets.sql) | Private request budget table and RPCs; authenticated requests fail closed with **503** if the limiter cannot access them. |
| [20261106000000_voucher_cancel_reissue.sql](../supabase/migrations/20261106000000_voucher_cancel_reissue.sql) | Cancelled voucher status and `game_voucher_cancel_reissue` for used-nonce recovery. |
| [20261107000000_voucher_race_guard.sql](../supabase/migrations/20261107000000_voucher_race_guard.sql) | CXN1 reissue columns, one-minted-voucher index and `game_voucher_reissue_resolve`; prevents signing a replacement during the chain check. |

## 3. Deploy the verified functions (user only)

Run `node scripts/check-deno-imports.mjs` first, from the release checkout. Stop if it fails.
Use the existing Supabase CLI login on the user's machine; never paste a token into a command log.
The [deployment reference](deploy.md#edge-functions) links here. `deploy.md` previously contained
only contract commands; this is the existing function workflow command with its public variables
expanded, preserving `--use-api --no-verify-jwt` and all 18 function names:

```sh
node scripts/check-deno-imports.mjs
supabase functions deploy auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade relic-forge relic-mint-report v2-choose-class v2-claim v2-equip v2-state v2-craft v2-salvage v2-lock v2-relic-forge v2-boss-fight --project-ref qoalewtxflagoprrxrgh --use-api --no-verify-jwt
```

Stop on a failed deploy. Function configuration and secret names are in [go-live](go-live.md).

## 4. Set the web switch and check the release

1. User: Vercel **web > Settings > Environment Variables > Production**: confirm
   `VITE_GAME_V2=1`, the public Supabase configuration in [go-live](go-live.md#3-web-app-vercel),
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
5. User / authorized live play-through owner: laptop and phone smoke test with a throwaway Fuji
   wallet: sign in, choose class, claim, boss demo/real fight and chest, inspect/equip/lock Bag
   items, salvage an unlocked non-starter, craft, and obtain a Relic voucher. Check console and
   function logs. Minting or any transaction requires that play-through's separate authorization.
6. If all gates pass, record evidence and lift the merge freeze. Do not announce health from the
   unsigned probes alone: they do not verify sessions, SQL behavior or voucher signing.

## 5. Rollback

Sign-in failure, claim 500, a blank screen or another critical blocker unresolved within ten minutes
means no-go. User: set **`VITE_GAME_V2=0`** in Vercel Production and **redeploy**, or open the previous
good deployment and **Promote to Production**. Check that the promoted build has the intended classic
setting; promoting a build that already used v2 does not restore classic. Re-run health checks.

Keep every v2 row, including `founder_grants` and `v2_action_results`. Classic/shared functions and
Fuji ownership remain in place; verify classic gameplay after rollback. The destructive
[SQL rollback proposal](proposals/sql/v2-integrity-rollback.sql) is only for a disposable rehearsal
or **before real players have v2 data**, with explicit owner approval and a backup. It is never the
post-launch recovery procedure. See [runbook](runbook.md) for incident triage.

## History

The original Card A22 runbook scheduled a code flag flip through C17 and referenced the removed
`ai/codex-v29-founder-grant` draft. [C3](../reports/C3.md) exposed those stale steps. D8's batch was
dropped on 31 Oct; this revision replaces those procedures with the actual Vercel environment switch,
ordered migration confirmation and unsigned v2 probes. Earlier proposals are historical context.
