# Database (Supabase Postgres)

Migrations: `supabase/migrations/*.sql`, applied in filename order. Off-chain state is server-decided; only the service role (Edge Functions) writes.

## Tables (all in `public`, RLS enabled on every one)

| Table | Purpose / key columns |
|---|---|
| `players` | `id` uuid pk, `wallet` text unique (lowercase `0x` + 40 hex, checked), `created_at` |
| `idle_state` | `player_id` pk/fk, `gold` bigint >= 0, `shards` int >= 0, `last_claim_at`, `boss_level` 1..50 (default 1, B3) |
| `gear` | `id`, `player_id`, `item_key` (`<slot>:<rarity>`), `slot` (CONFIG.slots), `rarity` (CONFIG.rarities, B3), `level` 1..30 (B3), `power` >= 0 (rounded `gearStat`), `equipped`; at most one equipped item per (player, slot) |
| `boss_attempts` | `id`, `player_id`, `day` date, `won`, `created_at` |
| `boss_keys` | `id`, `player_id`, `day`, `spent_at` nullable; `unique (player_id, day)` |
| `relic_vouchers` | `nonce` bigint identity pk, `player_id`, `relic_id`, `rarity`, `status` in (`issued`,`minted`,`expired`), `tx_hash` (nullable, 0x + 64 hex), `created_at`, `expires_at` > `created_at` |
| `siwe_nonces` | `nonce` text pk, `created_at`, `used_at` (for B2); server-only |

Functions (B2, `20260102000000_siwe_auth.sql`, execute granted to `service_role` only): `consume_siwe_nonce(text) -> boolean` (atomic single-use, 10 minute window) and `upsert_player_by_wallet(text) -> uuid` (creates `players` + `idle_state` on first sign-in). See [auth.md](auth.md).

Functions (B3, `20260104000000_game_api.sql`, `security definer`, `search_path = ''`, execute granted to `service_role` only), called by the `game-state`, `idle-claim` and `equip` Edge Functions (logic in `supabase/functions/_shared/game.ts`):

- `game_snapshot(player, day, starter jsonb) -> jsonb`: the player's totals, gear, unspent keys and today's attempts (`day` = `date '1970-01-01' + dayIndex(now)`), or null if the player does not exist. A player with no gear first gets `starter` (the 4 `starterGear()` items) equipped.
- `game_claim(player, expected_last_micros, now, gold, shards, drops jsonb) -> jsonb`: one transaction. Returns null and changes nothing unless `last_claim_at` still equals `expected_last_micros` and `now` is at least 10 s later; otherwise inserts the drops unequipped, adds gold and shards, sets `last_claim_at = now`, and returns the new rows.
- `game_equip(player, gear_id) -> boolean`: false if the item is not the player's; otherwise unequips the slot, then equips the item, in one transaction.
- All three lock the `players` row first, so claims and equips for one player run one at a time and `gear_one_equipped_per_slot` never fires. Internal helpers `game_insert_gear` and `game_epoch_micros` are not executable by any API role.

Claim seed: the first 4 bytes (big-endian) of `HMAC-SHA256(GAME_SEED_SECRET, "<player id>:<last_claim_at in microseconds since the epoch>")`, so each claim window has one fixed seed the client cannot know or reroll. `GAME_SEED_SECRET` falls back to the JWT secret when unset. Claims credit `computeClaimGains` (5 minutes at the full rate, the rest at 50%, capped at 8 h), as `docs/api.md` specifies.

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

Tests run in-process Postgres via `@electric-sql/pglite` (Node only, no docker, no network). `supabase/tests/sql/bootstrap.sql` stubs the Supabase pieces (roles `anon`, `authenticated`, `service_role` with BYPASSRLS, `auth.uid()`, `auth.jwt()` reading `request.jwt.claims`, and Supabase's default grants). Tests then apply every migration and use `set role` plus `request.jwt.claims`. They cover: migrations apply, RLS enabled everywhere, cross-player isolation, anon/authenticated cannot write, `siwe_nonces` closed, `unique(player_id, day)`, gold/shards >= 0, wallet and status checks. `game.test.ts` (B3) runs the Edge Function logic in `supabase/functions/_shared/game.ts` against the SQL functions: starter gear, claim math and seed, the 10 s rule, the offline cap, ignored body fields, equip ownership and swaps, response shapes, and grants.

Caveat: this is PGlite, not the real Supabase stack; the stub approximates `auth.*`. Verify once against `supabase db reset` when the CLI is available.
