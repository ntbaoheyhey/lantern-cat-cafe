# Database (Supabase Postgres)

Migrations: `supabase/migrations/*.sql`, applied in filename order. Off-chain state is server-decided; only the service role (Edge Functions) writes.

## Tables (all in `public`, RLS enabled on every one)

| Table | Purpose / key columns |
|---|---|
| `players` | `id` uuid pk, `wallet` text unique (lowercase `0x` + 40 hex, checked), `created_at` |
| `idle_state` | `player_id` pk/fk, `gold` bigint >= 0, `shards` int >= 0, `last_claim_at` |
| `gear` | `id`, `player_id`, `item_key`, `slot`, `power` >= 0, `equipped`; at most one equipped item per (player, slot) |
| `boss_attempts` | `id`, `player_id`, `day` date, `won`, `created_at` |
| `boss_keys` | `id`, `player_id`, `day`, `spent_at` nullable; `unique (player_id, day)` |
| `relic_vouchers` | `nonce` bigint identity pk, `player_id`, `relic_id`, `rarity`, `status` in (`issued`,`minted`,`expired`), `tx_hash` (nullable, 0x + 64 hex), `created_at`, `expires_at` > `created_at` |
| `siwe_nonces` | `nonce` text pk, `created_at`, `used_at` (for B2); server-only |

Functions (B2, `20260102000000_siwe_auth.sql`, execute granted to `service_role` only): `consume_siwe_nonce(text) -> boolean` (atomic single-use, 10 minute window) and `upsert_player_by_wallet(text) -> uuid` (creates `players` + `idle_state` on first sign-in). See [auth.md](auth.md).

Additions beyond the card: `gear.created_at`, the one-equipped-per-slot partial unique index, format checks on wallet/tx_hash, FK `on delete cascade`, and `power >= 0`.

## RLS rule

A row is visible to the caller when its `player_id` (`players.id` for `players`) equals `auth.uid()`, i.e. the JWT `sub` claim, which B2 must set to the player's uuid. We chose this over matching `players.wallet` to the `wallet` claim because it needs no join and uses the pk index. The `wallet` claim is not used by RLS.

- Only `SELECT` policies exist, for role `authenticated`. No INSERT/UPDATE/DELETE policies.
- Migration also revokes all table privileges from `anon`/`authenticated` and grants back only `SELECT` (player tables, `authenticated`), so writes fail with "permission denied" even if a policy were added by mistake.
- `siwe_nonces` has RLS on, no policies, no grants: only `service_role` (BYPASSRLS) can use it.

## Tests

```
pnpm install
pnpm test                          # whole repo
pnpm --filter @taskbar-hero/supabase-tests test   # just the DB tests
```

Tests run in-process Postgres via `@electric-sql/pglite` (Node only, no docker, no network). `supabase/tests/sql/bootstrap.sql` stubs the Supabase pieces (roles `anon`, `authenticated`, `service_role` with BYPASSRLS, `auth.uid()`, `auth.jwt()` reading `request.jwt.claims`, and Supabase's default grants). Tests then apply every migration and use `set role` plus `request.jwt.claims`. They cover: migrations apply, RLS enabled everywhere, cross-player isolation, anon/authenticated cannot write, `siwe_nonces` closed, `unique(player_id, day)`, gold/shards >= 0, wallet and status checks.

Caveat: this is PGlite, not the real Supabase stack; the stub approximates `auth.*`. Verify once against `supabase db reset` when the CLI is available.
