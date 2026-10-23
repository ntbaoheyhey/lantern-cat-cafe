# Going live (Edge Functions)

The database migrations are applied to the live Supabase project (`qoalewtxflagoprrxrgh`). The eight Edge Functions (`auth-nonce`, `auth-verify`, `game-state`, `idle-claim`, `equip`, `boss-fight`, `relic-forge`, `relic-mint-report`) are deployed by GitHub Actions (`.github/workflows/deploy-functions.yml`) on every push to `main` that changes code they bundle, or by hand from the Actions tab. This page lists what a person has to set once.

Never paste any of these values into git, an issue, a PR or a chat.

## 1. Let GitHub deploy (one secret)

1. Create a personal access token at https://supabase.com/dashboard/account/tokens (name it `github-deploy`).
2. In GitHub: repo **Settings > Secrets and variables > Actions > New repository secret**, name `SUPABASE_ACCESS_TOKEN`, value the token.
3. Run it once: **Actions > Deploy Edge Functions > Run workflow** on `main`. Without the secret the job does not fail; it shows a "Deploy skipped" notice.

Functions are deployed with `--no-verify-jwt` (also set in `supabase/config.toml`): the platform gateway does not check the `Authorization` header, because our functions verify our own session JWT themselves.

## 2. Function secrets (Supabase dashboard)

Supabase dashboard > your project > **Edge Functions > Secrets** (or `supabase secrets set --project-ref qoalewtxflagoprrxrgh NAME=value`). New values apply to the next request; no redeploy needed.

| Secret | What to put | Used by |
| --- | --- | --- |
| `AUTH_JWT_SECRET` | Random, at least 32 bytes: `openssl rand -base64 48`. Signs and checks the session JWT. Changing it signs everyone out. | all eight |
| `GAME_SEED_SECRET` | Random: `openssl rand -base64 48`. Keys the idle-drop, boss-fight and Relic rarity seeds. Optional (falls back to `AUTH_JWT_SECRET`), but set it so the two can change independently. | the six game functions |
| `SIWE_DOMAIN` | The production host, no scheme or path, e.g. `taskbar-hero.vercel.app`. Must equal `window.location.host` of the site players sign in on. | auth-nonce, auth-verify |
| `SIWE_ALLOWED_ORIGIN` | Comma list of exact origins allowed by CORS, e.g. `https://taskbar-hero.vercel.app,http://localhost:5173`. Unset means browsers are blocked. | all eight |
| `VOUCHER_SIGNER_PRIVATE_KEY` | The voucher signer's private key (`0x` + 64 hex). Its address must equal `signer()` on the deployed RelicNFT. Use a dedicated key that holds no funds; never reuse the deployer key. Unset or malformed: `relic-forge` answers 500 `server_error` and spends nothing. | the six game functions (relic-forge and game-state sign) |
| `FUJI_RPC_URL` | Optional. Fuji C-Chain RPC used to check mint receipts and `usedNonces`. Defaults to `https://api.avax-test.network/ext/bc/C/rpc`. | the six game functions |

Provided by the platform, do not set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase refuses custom secrets starting with `SUPABASE_`). The code also reads `SUPABASE_JWT_SECRET` before `AUTH_JWT_SECRET`; the platform does not set it, so leave it unset.

Note: `AUTH_JWT_SECRET` is our own key, not the project's JWT secret, so the session token works with our Edge Functions only, not with direct PostgREST queries. The web client uses only the functions.

Sign-in with `localhost:5173` against the live functions needs `SIWE_DOMAIN=localhost:5173`, so local testing against production is limited to the game calls; use a local stack for sign-in.

## 3. Web app (Vercel)

Vercel project **web** > Settings > Environment Variables (Production), then redeploy:

- `VITE_SUPABASE_URL` = `https://qoalewtxflagoprrxrgh.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the project's anon/publishable key (dashboard > Project Settings > API). Safe to expose.

## 4. Smoke test

Replace the origin with your production origin.

```sh
ORIGIN=https://taskbar-hero.vercel.app
FN=https://qoalewtxflagoprrxrgh.supabase.co/functions/v1

# A nonce, and the CORS header echoing your origin.
curl -si -X POST "$FN/auth-nonce" -H "Origin: $ORIGIN" | grep -iE '^HTTP|access-control-allow-origin|nonce'
# expect: HTTP/2 200, access-control-allow-origin: <your origin>, {"nonce":"<32 hex chars>"}

# Browser preflight.
curl -si -X OPTIONS "$FN/game-state" -H "Origin: $ORIGIN" -H "Access-Control-Request-Method: POST" | grep -iE '^HTTP|access-control-allow-origin'
# expect: HTTP/2 204 and the same header

# The game functions run and refuse a missing session (proves --no-verify-jwt took effect).
curl -s -X POST "$FN/game-state" -H "Origin: $ORIGIN"
# expect: {"error":"unauthenticated"}. A gateway error about a missing authorization header means verify_jwt is still on.
```

If the CORS header is missing, `SIWE_ALLOWED_ORIGIN` does not contain that exact origin (scheme, host and port must match). A 500 `{"error":"internal_error"}` from `auth-nonce` usually means a missing secret; see **Edge Functions > Logs** in the dashboard.
