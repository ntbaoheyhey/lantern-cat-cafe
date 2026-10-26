# Proposal: database schema for Cat RPG v2 (V8a)

Status: **proposal, needs the user's sign-off.** Doc only. Nothing here is applied; card V8 writes the migration and tests only after sign-off. Based on `main` at `d5e67bc` and the approved plan (Cat RPG v2, 24 Oct 2026).

## Summary for sign-off

1. **v2 gets its own tables** (`cat_state`, `items`, `player_stacks`, `boss_clears`, `boss_fights`, `founder_grants`) instead of new columns on `idle_state` and `gear`. The v1 tables and functions stay exactly as they are, so the live game cannot break before cut-over, and rolling back is flipping the switch back. This differs from the card's wording (which said "new columns on idle_state, gear changes"); the reasons are in [Why separate tables](#why-separate-tables).
2. **Shared on purpose:** `players` (accounts, wallets), `relic_forges` and `relic_vouchers` (Relic history and the one-Relic-a-day limit). The voucher functions are reused unchanged.
3. **The save reset at cut-over is free:** v2 tables start empty. Nothing is deleted. v1 rows are frozen and kept until a later, separately approved cleanup.
4. **Founder chest:** at cut-over, every existing player gets one fixed bundle of materials and keys, recorded in `founder_grants` so it is granted exactly once.
5. **Security stays the same as today:** RLS on every table, select-own policies only, all writes through `security definer` functions executable only by `service_role`, each locking the `players` row first.
6. **Numbers stay in config.** The database holds only structure (slot names, rarity names, format checks). Costs, caps and the bag limit are passed in by the Edge Functions from `packages/game-rules`.

Decisions needed from the user are listed at the end: [Questions](#questions-for-the-user).

## Current state (read from the migrations)

| Table | Used by v1 for |
|---|---|
| `players` | account per wallet; every game function locks this row first |
| `idle_state` | `gold`, `shards`, `last_claim_at`, `boss_level` |
| `gear` | 4 slots (`weapon`, `helm`, `armor`, `ring`) and 4 rarities, both enforced by check constraints; `level` 1..30, `power`, `equipped` |
| `boss_attempts`, `boss_keys` | 5 fights a day; one key per day (`unique (player_id, day)`) |
| `relic_forges`, `relic_vouchers` | one forge per game day; EIP-712 vouchers and mint status |
| `siwe_nonces` | sign-in, server only |

`game_snapshot` returns every `gear` row and the v1 client parses the slot and rarity as v1 enums.

## Why separate tables

Putting v2 data into `idle_state` and `gear` was the card's starting idea. It fails the plan's rule that the live game keeps working until cut-over and that applied migrations and existing functions do not change:

- `gear_slot_check` allows only the 4 v1 slots, and `gear.rarity` only the 4 v1 rarities. v2 needs `helmet`, `gloves`, `boots`, 4 accessories and `uncommon`. Relaxing those checks changes an applied migration's contract.
- `game_snapshot` returns all gear rows. A v2 item (slot `gloves`, rarity `uncommon`) in a tester's bag would reach the live v1 client, which does not know those values.
- v1 `gold` and v2 Fish, v1 `shards` and v2 Yarn would share one balance while both games run. A v2 test session would change the live save, and the reset at cut-over would have to rewrite those columns.
- Undoing a column change after cut-over means a data migration. Undoing a separate table is ignoring it.

Cost of separate tables: a few names exist twice for two weeks, and `gear`, `idle_state`, `boss_attempts` and `boss_keys` become dead after cut-over (dropped later, see [Cleanup](#cleanup-after-the-contest)).

## New tables

Naming: tables get plain names that do not clash with v1 so they need no rename after cut-over. SQL functions are prefixed `v2_`, matching the `v2-*` Edge Functions.

### `cat_state` (one row per player, replaces `idle_state` for v2)

| Column | Type | Rule |
|---|---|---|
| `player_id` | uuid pk, fk `players` on delete cascade | |
| `class_id` | text null | null until the player picks a class; format `^[a-z]+$` (the registry decides valid ids) |
| `level` | integer not null default 1 | `between 1 and 100` (the cap of 60 is config) |
| `xp` | bigint not null default 0 | `>= 0`, XP into the current level |
| `chapter` | integer not null default 1 | `>= 1` (chapter count is content) |
| `round` | integer not null default 1 | `>= 1` (see note) |
| `kills` | integer not null default 0 | `>= 0`, kills in the current round |
| `best_stage` | integer not null default 0 | highest stage ever cleared; sets crafted item level |
| `last_claim_at` | timestamptz not null default now() | compare-and-set for claims, as in v1 |
| `progress_rev` | bigint not null default 0 | bumped by every write to class or progress (see [Concurrency](#concurrency)) |
| `last_daily_key_day` | date null | game day (UTC+7) of the last "first claim of the day" key |
| `boss_cooldown_until` | timestamptz null | set to now + cooldown after a lost boss fight |
| `fights` | bigint not null default 0 | boss fight counter, part of the boss seed |
| `created_at` | timestamptz not null default now() | |

Note on `round`: the check is `round >= 1` only; rounds per chapter (10) is content. The server never writes a round past the boss.

### `items` (owned gear instances, replaces `gear` for v2)

| Column | Type | Rule |
|---|---|---|
| `id` | uuid pk | |
| `player_id` | uuid fk `players` on delete cascade | index |
| `item_key` | text not null | catalog id from the v2 registry, `^[a-z0-9.]+$`, e.g. `wpn.bow.willow` |
| `slot` | text not null | in (`weapon`, `helmet`, `armor`, `gloves`, `boots`, `collar`, `earring`, `ring`, `charm`) |
| `weapon_type` | text null | set only for weapons (`sword`, `hammer`, `daggers`, `spear`, `bow`, `staff`, `flasks`); check `(slot = 'weapon') = (weapon_type is not null)` |
| `rarity` | text not null | in (`common`, `uncommon`, `rare`, `epic`, `legendary`), the gear rarities, never the Relic tiers |
| `level` | integer not null | `between 1 and 100` (per-rarity max is config) |
| `bonus` | jsonb not null default `'[]'` | array of `{ "stat": "<stat id>", "value": <number> }`; check `jsonb_typeof(bonus) = 'array' and jsonb_array_length(bonus) <= 4` |
| `locked` | boolean not null default false | locked items cannot be salvaged |
| `equipped` | boolean not null default false | |
| `source` | text not null | in (`starter`, `drop`, `chest`, `craft`, `founder`), for support and drop-rate checks |
| `created_at` | timestamptz not null default now() | stepped by 1 µs per inserted item, as v1 does, so the bag keeps drop order |

Indexes: `(player_id)`; partial unique `(player_id, slot) where equipped` (one item per slot).

Stats are not stored. They follow from `item_key` + `rarity` + `level` + `bonus` through game-rules `deriveStats` (V2), so a balance change applies to every item at once and nothing can drift.

**Bag limit 200** (config `bagLimit`, passed in): every function that adds items counts the player's rows under the player lock. Idle drops and chest items that do not fit are salvaged at once into materials (the caller sends each item's salvage value with it) and the result lists them as `autoSalvaged`, so a full bag never loses value silently. Crafting into a full bag is refused (`bag_full`) because the player paid for a specific item.

### `player_stacks` (Fish, Yarn, materials, keys)

| Column | Type | Rule |
|---|---|---|
| `player_id` | uuid fk `players` on delete cascade | |
| `stack_id` | text | registry id, `^[a-z][a-zA-Z0-9]*$`: `fish`, `yarn`, `fluffTuft`, `shinyButton`, `catnipCrystal`, `starlightScale`, `moonPearl`, `catKey` |
| `qty` | bigint not null default 0 | `>= 0` |
| | pk `(player_id, stack_id)` | |

One table for every countable thing means one tested code path for "add", "spend" and "not enough": `v2_apply_stacks(player, deltas jsonb, caps jsonb)`. Negative deltas fail the whole call if any balance would go below 0; positive deltas are clamped to `caps` (for example `{"catKey": 5}`, from config) and the function returns what was actually added. Fish replaces v1 gold and Yarn replaces v1 shards in v2 (the registry's `yarn` maps to the old shards name in the UI only).

### `boss_clears`

| Column | Type | Rule |
|---|---|---|
| `player_id` | uuid fk | |
| `chapter` | integer | `>= 1` |
| `first_cleared_at` | timestamptz not null | |
| `wins` | integer not null default 1 | `>= 1` |
| `last_won_at` | timestamptz not null | |
| | pk `(player_id, chapter)` | |

"First clear" is "no row yet", decided inside the boss transaction, so two parallel wins can never both get the first-clear chest.

### `boss_fights` (audit log, replaces `boss_attempts`)

`id` uuid pk, `player_id`, `fight_no` bigint (from `cat_state.fights`), `chapter`, `won`, `key_spent` boolean, `chest` jsonb null (what was granted), `created_at`; `unique (player_id, fight_no)`, index `(player_id, created_at)`. Without a daily limit this grows at most one row per cooldown per player (about 1,440 a day if someone loses non-stop), a few hundred bytes each. It is what lets us answer "my chest was empty" and check drop rates.

### `founder_grants`

`player_id` pk fk, `granted_at`, `contents` jsonb. Filled once by the cut-over step (see [Cut-over](#cut-over-v29-reset-and-founder-chest)). Its existence also drives the Founder badge in the UI.

## Functions (all `security definer`, `search_path = ''`, execute for `service_role` only)

Every function below locks `players` first (`select ... for update`), like every v1 function. That one rule serializes all v1 and v2 writes for a player, including the shared Relic forge. All amounts, costs and limits are parameters computed by the Edge Function from game-rules config; the SQL only checks and applies.

| Function | Called by | What it does under the lock | Refusals (nothing changes) |
|---|---|---|---|
| `v2_snapshot(player, day)` | `v2-state`, every endpoint's response | Creates `cat_state` if missing. Returns cat, progress, stacks, items, boss clears, cooldown, and the Relic `pending` and `today` fields built exactly like v1 `game_snapshot` (reuses `game_voucher_json`). | null if the player does not exist |
| `v2_choose_class(player, class_id, weapon_type, starter jsonb)` | `v2-choose-class` | Sets `class_id`; unequips a weapon of another type; gives the class's Common starter weapon if the player has no weapon of that type, and equips the best owned one of that type if none is equipped; bumps `progress_rev`. | unknown class is refused by the Edge Function before the call |
| `v2_claim(player, expected_last_micros, expected_rev, now, progress jsonb, stack_deltas jsonb, caps jsonb, items jsonb, bag_limit, daily_key_day)` | `v2-claim` | Compare-and-set on `last_claim_at` and `progress_rev` (the claim was computed from that state). Writes the new level, XP, chapter, round, kills, best stage; applies stacks; inserts drops (bag overflow auto-salvaged); records the daily key day; sets `last_claim_at = now`. | null when either value changed (another claim, a boss win or a class change won the race) or `now` is under 10 s after the last claim; the function retries once with a fresh snapshot, as v1 does |
| `v2_equip(player, item_id null, slot, expected_class, weapon_type, unlocked jsonb)` | `v2-equip` | Equips an owned item in its slot (unequipping the previous one), or empties the slot when `item_id` is null. Checks the slot is unlocked at the current level and a weapon matches the class. | `not_owner`, `wrong_slot`, `slot_locked`, `wrong_weapon`, `stale` (class changed) |
| `v2_boss_fight(player, chapter, expected_rev, won, fight_no, key_cost, cooldown_s, chest jsonb, bag_limit, caps)` | `v2-boss-fight` | Checks the cooldown, that the chapter is reached (at the boss, or already cleared for a rematch) and that a key is held. Records the fight. On a win: spends the key, opens the chest in the same transaction (stacks + items), upserts `boss_clears`, and on a first clear of the current chapter moves progress to the next chapter, round 1. On a loss: sets the cooldown, keeps the key. | `cooldown`, `not_reached`, `no_key`, `stale` (`fight_no` or `progress_rev` moved: a parallel fight ran) |
| `v2_craft(player, cost jsonb, item jsonb, bag_limit)` | `v2-craft` | Spends the recipe cost (Yarn, materials, Fish) and inserts the item with `source = 'craft'`. | `not_enough` with the first missing `stack_id`, `bag_full` |
| `v2_salvage(player, item_ids uuid[], gains jsonb)` | `v2-salvage` | Deletes the listed items and adds the gains. Every id must be the player's, unequipped and unlocked. | `not_owner`, `equipped`, `locked` (all or nothing) |
| `v2_lock(player, item_id, locked)` | `v2-lock` | Sets the flag. | `not_owner` |
| `v2_relic_forge(player, day, relic_id, rarity, yarn_cost, pearl_cost, expires_at)` | `v2-relic-forge` | Same as v1 `game_forge`, but pays Yarn and a Moon Pearl from `player_stacks` instead of shards and a Boss Key. Writes the same `relic_forges` and `relic_vouchers` rows. | `pending` voucher returned, or blocked `daily_limit`, `not_enough_yarn`, `no_moon_pearl` (V5 `relicForgeBlockV2` order) |
| `v2_grant_founder(player, contents jsonb)` | cut-over step only | Inserts `founder_grants` and applies the stacks, once. | already granted: no-op |

Reused unchanged: `game_voucher_sign`, `game_voucher_reissue`, `game_voucher`, `game_voucher_minted` (they only touch voucher rows, not costs), and the auth functions.

Internal helpers (`v2_apply_stacks`, `v2_insert_items`, `v2_items_json`) are revoked from every API role including `service_role`, like `game_insert_gear` today.

### Seeds

Same HMAC as v1 (`GAME_SEED_SECRET`), new prefixes so v1 and v2 seeds never collide:
- claim: `"v2claim:<player>:<last_claim_at µs>"`
- boss: `"v2boss:<player>:<fight_no>"`. `fight_no` only grows and every fight is recorded, so a seed can never be fought twice; losing just costs the cooldown.
- craft: `"v2craft:<player>:<count of crafted items>"`; Relic: unchanged `"relic:<player>:<game day>"`, so v1 and v2 roll the same Relic on the same day.

## Concurrency

- One lock per player (`players` row) for every write, v1 and v2.
- Claims are computed outside the database from a snapshot, so they carry two compare-and-set values: `last_claim_at` (no double claim) and `progress_rev` (a boss win or class change in between invalidates the computed progress). The loser gets null and the Edge Function recomputes once.
- Stack changes are deltas checked against the locked balance, so a craft and a claim in parallel both apply correctly.
- `boss_clears` first-clear and `relic_forges unique (player_id, day)` make "only once" rules hold even under parallel requests.
- V8 tests run each of these with two parallel calls, as `concurrency.test.ts` does for v1.

## RLS and grants

Same rule as today ([database.md](../database.md)):
- `enable row level security` on all six tables; one policy each: `for select to authenticated using (player_id = auth.uid())`; `grant select ... to authenticated`. No insert, update or delete policies or grants.
- Default privileges from `20260103000000_auth_hardening.sql` already strip grants from new objects, so every grant is explicit.
- The web client does not query PostgREST today (it sends the game token to Edge Functions), so these policies are defense in depth, as they are for v1.
- V8 extends `rls.test.ts`-style checks to the new tables: cross-player isolation, anon and authenticated cannot write, helpers not executable.

## How v1 and v2 coexist until cut-over

| | v1 (live) | v2 (behind `VITE_GAME_V2=1`) |
|---|---|---|
| Edge Functions | `game-state`, `idle-claim`, `equip`, `boss-fight`, `upgrade`, `relic-forge`, `relic-mint-report` | `v2-state`, `v2-claim`, `v2-equip`, `v2-choose-class`, `v2-boss-fight`, `v2-craft`, `v2-salvage`, `v2-lock`, `v2-relic-forge` (mint reports reuse v1 `relic-mint-report`, which only checks the chain) |
| Tables written | `idle_state`, `gear`, `boss_attempts`, `boss_keys` | `cat_state`, `items`, `player_stacks`, `boss_clears`, `boss_fights` |
| Shared | `players`, `relic_forges`, `relic_vouchers` | same |

Effect of sharing the Relic tables: a tester who forges in v2 has used that day's Relic in v1 too, and vice versa. That is the intended "one Relic a day per player" rule and keeps on-chain history in one place.

The V8 migration is additive only (new tables, new functions), so it can be applied before its code merges and v1 does not notice. It is applied with the Supabase MCP `apply_migration` by the orchestrator after the user's sign-off, then the same file merges to `main`.

## Cut-over (V29): reset and Founder chest

1. Back up (below).
2. Apply a small cut-over migration that calls `v2_grant_founder` for every `players` row that exists at that moment (all current players are Fuji testers). Contents are fixed (no roll), from the V6 numbers table, for example some Fish, Yarn, Fluff Tufts, 1 Moon Pearl and 2 Cat Keys. No gear, because the player has not picked a class yet; the first class pick gives the starter weapon.
3. Deploy the client with v2 on. Players see the class picker, then an empty bag plus the Founder bundle. Accounts, wallets, Relic NFTs and Relic history are untouched.
4. The v1 Edge Functions stay deployed for one day for rollback, then are removed from `deploy-functions.yml`. v1 tables are left as they are (read-only history).

There is no destructive "reset" step: v2 tables were empty for real players, so the reset is simply not reading v1 tables any more.

Testers' v2 rows from before cut-over (orchestrator and test wallets) are cleared in the cut-over migration (`delete from cat_state / items / player_stacks / boss_clears / boss_fights`) so everyone starts equal. This only touches v2 tables.

## Backup and rollback

Free-plan facts (checked 24 Oct 2026, links below): no point-in-time recovery on Free, 500 MB database per project, project pauses after a week without activity.

- **Before V8 (additive):** no backup strictly needed. Rollback SQL is written next to the migration as `supabase/tests/v2/rollback.sql` (not a migration): drops the six v2 tables and the `v2_*` functions. A test applies migration then rollback and checks the v1 schema is unchanged by comparing the `information_schema` and `pg_proc` listings before and after.
- **Before cut-over:** the user runs `supabase db dump --data-only -f backup-cutover.sql` (needs their database password, which stays on their machine) and keeps the file outside the repo. A schema dump (`supabase db dump -f schema.sql`) too.
- **Rollback after cut-over:** switch the client flag back and redeploy. v1 tables still hold every save as of cut-over, so v1 resumes from that moment (anything earned in v2 since is not carried back, and Relics forged in v2 stay real, which is correct). No data restore needed.
- **Real disaster** (data corrupted): restore the dump into the project with `psql`, after which the migrations table must match; documented in `docs/runbook.md` by V29.

## Cleanup after the contest

A later migration, approved separately, drops `idle_state`, `gear`, `boss_attempts`, `boss_keys` and the v1 `game_*` functions that only they use (`game_snapshot`, `game_claim`, `game_equip`, `game_boss_fight`, `game_upgrade`, `game_forge`). Not part of this plan.

## Supabase Free plan limits (checked 24 Oct 2026)

From [Edge Functions limits](https://supabase.com/docs/guides/functions/limits), [Edge Functions pricing](https://supabase.com/docs/guides/functions/pricing) and [pricing](https://supabase.com/pricing):

| Limit | Free plan | What it means for v2 |
|---|---|---|
| CPU time per request | 2 s (async I/O not counted) | V3 targets an 8 h claim under 50 ms; boss sim caps fights at 60 s of game time. Both far below. V9 and V10 add a timing test. |
| Wall clock per request | 150 s (request idle timeout 150 s) | Not a concern; database calls are single transactions. |
| Memory | 256 MB | Bag of 200 items and a boss timeline are tens of KB. |
| Function bundle size | 20 MB via the CLI (5 MB if bundled server-side) | Each `v2-*` function bundles the whole content registry; still small, V9 checks the size once. |
| Functions per project | 100 | 9 v1 functions + 9 v2 functions = 18 during coexistence. |
| Invocations | 500,000 per month | The client claims every 30 s while the tab is visible (it pauses when hidden). That is 120 calls an hour, about 4,000 visible tab-hours a month. During coexistence a tester running both versions counts twice. Enough for the contest; worth watching on demo days. |
| Database size | 500 MB | `boss_fights` is the only table without a hard cap per player; at a few hundred bytes a row it is not a risk for test traffic. |
| Inactivity | Paused after 1 week | Keep the demo project active before judging. |

## Tests V8 will add (the v2 test files in `supabase/tests/`)

Migrations apply on top of v1; v1 tests still pass unchanged; RLS and grants on every new table and function; every refusal code above; bag limit and auto-salvage; key cap 5; stacks never negative; first clear exactly once under two parallel wins; claim compare-and-set against a parallel boss win and class change; Relic forge v2 shares the daily limit with v1 (`game_forge` then `v2_relic_forge` on one day is `daily_limit`); Founder grant only once; rollback script leaves the v1 schema unchanged.

## Questions for the user

1. **Separate v2 tables instead of new columns on `idle_state` and `gear`** (recommended, reasons above). Approve?
2. **Boss cooldown is one per player**, not per chapter: losing any boss means a 60 s catnap before any boss fight, including rematches. Simpler, and nobody can dodge the cooldown by switching chapters. Approve, or prefer per chapter?
3. **Full bag:** idle drops and chest items that do not fit are salvaged automatically and shown in the result; crafting into a full bag is refused. Approve?
4. **Founder chest:** fixed materials and keys, no gear, amounts in the V6 numbers table. Approve?
5. **Testers' v2 rows** are wiped at cut-over so everyone starts equal. Approve?
