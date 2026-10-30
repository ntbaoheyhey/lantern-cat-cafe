# Database (Supabase Postgres)

Migrations: SQL files in `supabase/migrations/`, applied in filename order. Off-chain state is server-decided; only the service role (Edge Functions) writes.

## Tables (all in `public`, RLS enabled on every one)

| Table | Purpose / key columns |
|---|---|
| `players` | `id` uuid pk, `wallet` text unique (lowercase `0x` + 40 hex, checked), `created_at` |
| `idle_state` | `player_id` pk/fk, `gold` bigint >= 0, `shards` int >= 0, `last_claim_at`, `boss_level` 1..50 (default 1, B3) |
| `gear` | `id`, `player_id`, `item_key` (`<slot>:<rarity>`), `slot` (CONFIG.slots), `rarity` (CONFIG.rarities, B3), `level` 1..30 (B3), `power` >= 0 (rounded `gearStat`), `equipped`; at most one equipped item per (player, slot) |
| `boss_attempts` | `id`, `player_id`, `day` date, `won`, `created_at` |
| `boss_keys` | `id`, `player_id`, `day`, `spent_at` nullable; `unique (player_id, day)` |
| `relic_vouchers` | `nonce` bigint identity pk, `player_id`, `relic_id`, `rarity`, `status` in (`issued`,`minted`,`expired`), `tx_hash` (nullable, 0x + 64 hex), `created_at`, `expires_at` > `created_at`; B5 adds `forge_id` fk, `signature` (nullable, 0x + 130 hex) and at most one `issued` voucher per forge |
| `relic_forges` | `id`, `player_id`, `day` date, `relic_id`, `rarity`, `created_at`; `unique (player_id, day)` (B5: one paid forge per game day) |
| `siwe_nonces` | `nonce` text pk, `created_at`, `used_at` (for B2); server-only |
| `cat_state` | `player_id` pk/fk, `class_id` text, `level` 1..100, `xp` bigint >= 0, `chapter` >= 1, `round` >= 1, `kills` >= 0, `best_stage` >= 0, `last_claim_at`, `progress_rev`, `last_daily_key_day` date, `boss_cooldown_until`, `fights` (v2, V8) |
| `items` | `id` uuid pk, `player_id` fk, `item_key`, `slot`, `weapon_type`, `rarity`, `level`, `bonus` jsonb (<= 4 lines), `locked` bool, `equipped` bool, `source`, `created_at`; partial unique index on `(player_id, slot)` where `equipped` (v2, V8) |
| `player_stacks` | `(player_id, stack_id)` pk, `qty` bigint >= 0; holds currencies and crafting materials (v2, V8) |
| `boss_clears` | `(player_id, chapter)` pk, `first_cleared_at`, `wins` >= 1 (v2, V8) |
| `boss_history` | `id` uuid pk, `player_id` fk, `chapter`, `won` bool, `key_spent` bool, `created_at` (v2, V8) |
| `forge_history` | `id` uuid pk, `player_id` fk, `recipe_id`, `slot`, `item_id` fk, `created_at` (v2, V8) |

Functions (B2, `20260102000000_siwe_auth.sql`, execute granted to `service_role` only): `consume_siwe_nonce(text) -> boolean` (atomic single-use, 10 minute window) and `upsert_player_by_wallet(text) -> uuid` (creates `players` + `idle_state` on first sign-in). See [auth.md](auth.md).

Functions (B3, `20260104000000_game_api.sql`, `security definer`, `search_path = ''`, execute granted to `service_role` only), called by the `game-state`, `idle-claim` and `equip` Edge Functions (logic in `supabase/functions/_shared/game.ts`):

- `game_snapshot(player, day, starter jsonb) -> jsonb`: the player's totals, gear, unspent keys and today's attempts (`day` = `date '1970-01-01' + dayIndex(now)`), or null if the player does not exist. A player with no gear first gets `starter` (the 4 `starterGear()` items) equipped.
- `game_claim(player, expected_last_micros, now, gold, shards, drops jsonb) -> jsonb`: one transaction. Returns null and changes nothing unless `last_claim_at` still equals `expected_last_micros` and `now` is at least 10 s later; otherwise inserts the drops unequipped, adds gold and shards, sets `last_claim_at = now`, and returns the new rows.
- `game_equip(player, gear_id) -> boolean`: false if the item is not the player's; otherwise unequips the slot, then equips the item, in one transaction.
- All three lock the `players` row first, so claims and equips for one player run one at a time and `gear_one_equipped_per_slot` never fires. Internal helpers `game_insert_gear` and `game_epoch_micros` are not executable by any API role.

B4 (`20260105000000_boss_fight.sql`, same rules): `game_boss_fight(player, day, boss_level, won, max_attempts, max_level) -> boolean` records one fight the `boss-fight` Edge Function already simulated. With the player row locked it returns null and changes nothing when the player has `max_attempts` attempts on `day`; otherwise it inserts the attempt and, on a win, sets `boss_level` to `boss_level + 1` (capped, never lowered, so two parallel wins at one level raise it once) and inserts today's `boss_keys` row if missing. It returns true only when this call granted the key.

B5 (`20260106000000_relic_forge.sql`, same rules): `game_snapshot` also returns `forgedToday` and `pending` (the player's `issued` voucher). `game_forge(player, day, relic_id, rarity, shard_cost, key_cost, expires_at)` locks the player and returns `{status:"pending", voucher}` when an issued voucher exists, `{status:"blocked", reason}` (`daily_limit`, `no_boss_key`, `not_enough_shards`, in game-rules `forgeBlock` order) with nothing spent, or spends the shards and the oldest unspent Boss Keys, inserts the forge and an unsigned voucher, and returns `{status:"new", voucher}`. `game_voucher_sign` stores the server's EIP-712 signature once. `game_voucher_reissue` replaces an issued voucher that has expired with a new nonce for the same forge (same Relic and rarity); the old row becomes `expired`. `game_voucher` reads one of the player's vouchers and `game_voucher_minted` marks it minted with the tx hash. The `relic-forge` function re-signs only 120 s after expiry and only when `RelicNFT.usedNonces(nonce)` is false on Fuji, so one forge can never mint twice; `relic-mint-report` marks a voucher minted only after the Fuji receipt has a successful `RelicForged` log from RelicNFT with the voucher's player, relicId, rarity and nonce.


B6 (`20260107000000_gear_upgrade.sql`, same rules): `game_upgrade(player, gear_id, expected_level, cost, max_level, power) -> text` raises one owned item by one level for `cost` gold and stores its new `power`. With the player and item rows locked it returns `not_owner`, `stale` (the level is no longer `expected_level`, so the `upgrade` Edge Function prices it again), `max_level` or `not_enough_gold` without changing anything, else spends the gold and returns `ok`.

B7 (`20260108000000_forge_today.sql`): `game_snapshot` also returns `today`, the `relic_forges` row for the game day with `relicId`, `rarityName`, `minted` (any voucher of that forge is `minted`) and `txHash` (the minted voucher's `tx_hash`), or null when nothing was forged that day.

V8 (`20261101000000_v2_cat_rpg.sql` and `20261102000000_v2_integrity.sql`, same security rules): introduces the Cat RPG v2 database engine. Every function locks the `players` row first, executes as `security definer` with `search_path = ''`, and returns `jsonb`:
- `v2_snapshot(p_player uuid) -> jsonb`: returns full v2 player snapshot (`cat_state`, `items`, `player_stacks`, `boss_clears`, `forgedToday`, `pending` voucher). Initializes starting `cat_state` if missing.
- `v2_claim(p_player uuid, p_progress_rev bigint, p_now timestamptz, p_cat_patch jsonb, p_gains jsonb, p_items jsonb, p_stacks jsonb, p_caps jsonb) -> jsonb`: credits offline and idle gains (XP, cat state, items, material stacks), validating progress revision and minimum claim interval.
- `v2_equip(p_player uuid, p_item_id uuid, p_slot text) -> jsonb`: equips `p_item_id` in `p_slot` (or unequips if null), verifying player ownership, unlocked slot, and weapon type compatibility.
- `v2_lock_item(p_player uuid, p_item_id uuid, p_locked boolean) -> jsonb`: toggles item lock status to protect against accidental salvage.
- `v2_boss_fight(p_player uuid, p_chapter integer, p_won boolean, p_cooldown_until timestamptz, p_chest jsonb, p_caps jsonb) -> jsonb`: processes boss fight outcomes, records boss clears and history, decrements Cat Keys on win, and applies loss cooldowns.
- `v2_craft(p_player uuid, p_recipe_id text, p_slot text, p_cost jsonb, p_item jsonb, p_bag_limit integer) -> jsonb`: deducts recipe costs (Fish, Yarn, materials) and inserts crafted item if bag limit has room.
- `v2_salvage(p_player uuid, p_item_ids uuid[], p_gains jsonb, p_caps jsonb) -> jsonb`: deletes unequipped, unlocked, non-starter items and credits returned Yarn and material stacks.
- `v2_relic_forge(p_player uuid, p_day date, p_relic_id bigint, p_rarity text, p_cost jsonb, p_expires_at timestamptz) -> jsonb`: checks daily limit across v1 and v2, spends 30 Yarn and 1 Moon Pearl, creates the forge row, and issues an unsigned voucher.
Claim seed: the first 4 bytes (big-endian) of `HMAC-SHA256(GAME_SEED_SECRET, "<player id>:<last_claim_at in microseconds since the epoch>")`, so each claim window has one fixed seed the client cannot know or reroll. `GAME_SEED_SECRET` falls back to the JWT secret when unset. Claims credit `computeClaimGains` (5 minutes at the full rate, the rest at 50%, capped at 8 h), as `docs/api.md` specifies. Boss seed: the same HMAC over `"boss:<player id>:<game day>:<attempt number today>"`; every attempt is recorded, so a known seed can never be fought twice. Relic seed: the same HMAC over `"relic:<player id>:<game day>"`, so the rarity is fixed for the day and parallel forges agree.

Additions beyond the card: `gear.created_at`, the one-equipped-per-slot partial unique index, format checks on wallet/tx_hash, FK `on delete cascade`, and `power >= 0`.

## RLS rule

A row is visible to the caller when its `player_id` (`players.id` for `players`) equals `auth.uid()`, i.e. the JWT `sub` claim, which B2 must set to the player's uuid. We chose this over matching `players.wallet` to the `wallet` claim because it needs no join and uses the pk index. The `wallet` claim is not used by RLS.

- Only `SELECT` policies exist, for role `authenticated`. No INSERT/UPDATE/DELETE policies.
- Migration also revokes all table privileges from `anon`/`authenticated` and grants back only `SELECT` (player tables, `authenticated`), so writes fail with "permission denied" even if a policy were added by mistake.
- `siwe_nonces` has RLS on, no grants for client roles, and (migration `20261103000000_siwe_nonces_server_only.sql`, applied by hand) a restrictive deny-all policy for `anon` and `authenticated`, so a future permissive policy cannot expose it. Only `service_role` (BYPASSRLS) can use it.
- `private.v2_request_budgets` (migration `20261104000000_v2_request_budgets.sql`, applied by hand) holds per-player request counters; only `service_role` can call `v2_take_budgets` / `v2_cleanup_budgets`. Apply before redeploying v2 functions (limiter fails closed). See `docs/proposals/rate-limit-v2.md`.

## Tests

```
pnpm install
pnpm test                          # whole repo
pnpm --filter @taskbar-hero/supabase-tests test   # just the DB tests
```

Tests run in-process Postgres via `@electric-sql/pglite` (Node only, no docker, no network). `supabase/tests/sql/bootstrap.sql` stubs the Supabase pieces (roles `anon`, `authenticated`, `service_role` with BYPASSRLS, `auth.uid()`, `auth.jwt()` reading `request.jwt.claims`, and Supabase's default grants). Tests then apply every migration and use `set role` plus `request.jwt.claims`. They cover: migrations apply, RLS enabled everywhere, cross-player isolation, anon/authenticated cannot write, `siwe_nonces` closed, `unique(player_id, day)`, gold/shards >= 0, wallet and status checks. `game.test.ts` (B3) runs the Edge Function logic in `supabase/functions/_shared/game.ts` against the SQL functions: starter gear, claim math and seed, the 10 s rule, the offline cap, ignored body fields, equip ownership and swaps, response shapes, and grants. `boss.test.ts` (B4) covers wins, keys and levels, losses, the daily limit (also with two parallel fights), the UTC+7 day boundary, the response shape and grants. `upgrade.test.ts` (B6) covers the exact cost, level and power, every error, stale prices, two parallel upgrades, the response shape and grants. `forge.test.ts` (B5, B7) covers `forge.today` (none, unminted, minted with the hash, yesterday, per player), spending and the signed voucher (recovered with a throwaway key), the same-day repeat, reissue after expiry, a late mint seen on chain, the daily limit and next day, blocks, two parallel forges, mint reports (wrong nonce, reverted tx, other contract, other player, RPC down), response shapes, grants and RLS.

Caveat: this is PGlite, not the real Supabase stack; the stub approximates `auth.*`. Verify once against `supabase db reset` when the CLI is available.
