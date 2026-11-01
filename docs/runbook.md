# Runbook

Operating the live Taskbar Hero. Values (keys, tokens) are never written here; only variable names. Setup of secrets is in [go-live](go-live.md), contract deployment in [deploy](deploy.md).

Release order and rollback: [v2 cut-over checklist](cutover-v2.md). The v2 switch is Vercel
Production `VITE_GAME_V2=1` plus redeploy; rollback uses `0` plus redeploy or Promote. Keep v2 rows.

## Live check

```sh
node scripts/check-live.mjs
```

Node 20 or newer, no install. It prints PASS or FAIL per check and exits non-zero if any fails. It checks: the site loads; each of the 9 classic/shared Edge Functions refuses an anonymous POST with a 4xx (`auth-nonce` is public and answers 200); `relics/1..4.json`, their images and the 64-hex path wallets request; and read-only Fuji calls (chain id, RelicNFT code, `signer()`, `owner()`, `uri(1)` pointing at the site, `RelicMarket.relicNFT()`). Contract addresses are read from `README.md`.

The default run also includes all nine v2 routes. For only the 27 unsigned v2 probes, run
`node scripts/check-live.mjs --v2`: preflight 2xx with CORS, unsigned POST 401, oversized JSON 413/400.
No key or session is sent. The existing script reads no anon key. Current handlers authenticate
before body parsing, so oversized unsigned requests can fail this strict check with 401. Missing
budget SQL affects authenticated requests; an unsigned 401 cannot confirm that SQL is installed.
User: run the [read-only catalog query](proposals/sql/check-live-schema.sql) in the SQL editor,
then follow the [migration order](cutover-v2.md#2-check-the-live-schema-then-apply-pending-migrations).
The default legacy `auth-nonce` probe issues a challenge; `--v2` avoids it.

Optional overrides: `SITE_URL`, `SUPABASE_URL`, `FUJI_RPC_URL`. If a run behind a proxy shows `fetch failed`, the machine cannot reach the host (on Node 22 try `NODE_USE_ENV_PROXY=1`).

Reading a failure:

| Failing check | Likely cause | Go to |
| --- | --- | --- |
| site loads, relic json or image | Vercel deployment failed, was paused, or hit its cap | [Vercel cap](#vercel-cap-or-failed-deploy) |
| v2 returns 503 | budgets migration missing? Check the catalog and function logs; other counter-store failures can also cause 503 | [Migration order](cutover-v2.md#2-check-the-live-schema-then-apply-pending-migrations) |
| function returns 5xx or does not answer | functions not deployed, or the project is paused | [Paused Supabase project](#paused-supabase-project), [Redeploy functions](#redeploy-the-edge-functions) |
| function returns 2xx where 4xx is expected | `verify_jwt` or auth changed; investigate before demo | [Redeploy functions](#redeploy-the-edge-functions) |
| `uri(1)` not the site | metadata URI not set, or the site URL changed | [Set the metadata URI](#set-the-metadata-uri) |
| `signer()` zero or unexpected | signer rotation half done | [Rotate the signer](#rotate-the-voucher-signer) |

## Demo-day checklist

Do this the day before, then again 30 minutes before.

1. Run `node scripts/check-live.mjs`. Every line must be PASS.
2. Browser: **Chrome, Brave or Edge** with Core or MetaMask. Wallets do not work in Safari. Phone demos use the in-wallet browser or demo mode.
3. Wallet: switched to Avalanche Fuji (chain 43113) and funded with test AVAX. Gas for a mint or a listing is a fraction of one test AVAX; keep at least 1 for the day. Faucet: https://core.app/tools/testnet-faucet/?subnet=c&token=c (limited per day; fund early).
4. Sign in on the live site once, open the Forge and Market tabs, and confirm the account loads. Use a fresh account for the demo so the daily forge is unspent.
5. Have the demo-mode fallback ready: `pnpm --filter @taskbar-hero/web dev` runs the whole game without Supabase or a wallet (no Relic mint).
6. Tabs open before going on stage: the live site, the Fuji explorer page of RelicNFT (link in `README.md`).
7. Do not merge anything to `main` during the demo window: every merge deploys the site (and the functions, when their code changes).

## Redeploy the Edge Functions

User only: confirm pending migrations first, run `node scripts/check-deno-imports.mjs`, then use
the exact [manual deployment command](cutover-v2.md#3-deploy-the-verified-functions-user-only).
The existing automatic workflow can deploy changed bundles on `main` when its repo secret is
configured, but do not dispatch Actions for this release. Afterwards run the live checks.

Function secrets (set in the Supabase dashboard, **Edge Functions > Secrets**; never in git): `AUTH_JWT_SECRET`, `GAME_SEED_SECRET`, `SIWE_DOMAIN`, `SIWE_ALLOWED_ORIGIN`, `VOUCHER_SIGNER_PRIVATE_KEY`, `FUJI_RPC_URL` (optional). New values apply to the next request without a redeploy. Changing `AUTH_JWT_SECRET` signs everyone out.

## Set the metadata URI

Owner wallet only (the deployer wallet; its key lives in a local .env file in the contracts directory on the owner's machine (not committed) as `DEPLOYER_PRIVATE_KEY`). The exact `cast send` and check commands are in [deploy](deploy.md#set-the-metadata-uri). Do this again if the site's URL changes; `check-live` then fails on `uri(1)` until it matches.

## Rotate the voucher signer

Do this if `VOUCHER_SIGNER_PRIVATE_KEY` may have leaked, or on a schedule.

1. Make a new dedicated key that holds no funds (`cast wallet new`). Keep the private key in a password manager.
2. Set the Edge Function secret `VOUCHER_SIGNER_PRIVATE_KEY` to the new key (dashboard). From this moment new vouchers are signed with it, which the contract rejects until step 3, so do steps 2 and 3 together.
3. As the RelicNFT owner, call `setSigner(newSignerAddress)` (variable name on the owner's machine: `OWNER_KEY`, the deployer key; command: `cast send <RelicNFT> "setSigner(address)" <newSignerAddress> --rpc-url <FUJI_RPC_URL> --private-key $OWNER_KEY`).
4. Run `node scripts/check-live.mjs` and confirm `signer()` is the new address.
5. Vouchers issued with the old key stop working immediately. A player with an unminted voucher can mint again after the voucher expires (30 minutes plus a 2 minute grace): `relic-forge` then re-signs the same Relic with a new nonce and the new key, and no shards or keys are spent twice. If one specific voucher is the problem, the owner can instead kill just that nonce with `cancelNonce` (see [contracts](contracts.md)).

## Paused Supabase project

Free Supabase projects pause after a period of inactivity (check the current policy in the dashboard). Symptoms: every function check fails, the game shows connection errors, sign-in fails.

1. Open the Supabase dashboard, select project `qoalewtxflagoprrxrgh`, and use **Restore project**. Data is kept; restoring takes a few minutes.
2. Run `node scripts/check-live.mjs`. If functions still fail, follow the manual deployment procedure above after checking migrations.
3. Prevent it before a demo: open the live site and sign in a few days ahead, and check the dashboard the day before.
4. If it cannot be restored in time, run the demo from demo mode (see the checklist).

## Vercel cap or failed deploy

Symptoms: the site is down or shows a limit message, `site loads` or the relic checks fail, or a merge did not deploy.

1. Check the project **web** in the Vercel dashboard: **Deployments** for the last build and its log, and **Usage** for any cap on the free plan.
2. If the newest deployment is broken, open the previous good deployment and **Promote to Production** (or revert the commit on `main`, which deploys again).
3. If a usage cap is reached, wait for the reset or ask the project owner to raise the plan; while it is down use the demo-mode fallback. Relic metadata is served from the site, so wallets and explorers cannot show Relic art or names while the site is down; the contracts and ownership are unaffected.
4. Only `main` is built (`apps/web/vercel.json`), so a pull request never uses the quota; merge only when needed near a cap.
5. If the production URL ever changes, update `SIWE_DOMAIN` and `SIWE_ALLOWED_ORIGIN` (function secrets), the `VITE_*` variables, and the metadata URI, then redeploy.
