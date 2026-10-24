# Game API

The contract between the web client and the server. Types, error codes, HTTP statuses and endpoint names live in `packages/api-contract` (`apps/web/src/api/GameApi.ts` re-exports it); `MockGameApi` implements the same rules in the browser. The Supabase implementation calls the Edge Functions below. All numbers come from `packages/game-rules`.

## Calls

Every call is `POST https://<project>.supabase.co/functions/v1/<name>` with `Authorization: Bearer <session JWT from auth-verify>` and a JSON body. The server identifies the player from the JWT `sub` claim only; any player id, wallet or timestamp in the body is ignored.

| Function | Body | Returns | Task |
| --- | --- | --- | --- |
| `game-state` | `{}` | `ServerState` | B3 |
| `idle-claim` | `{}` | `ClaimResult` | B3 |
| `equip` | `{ "gearId": "<uuid>" }` | `ServerState` | B3 |
| `boss-fight` | `{}` | `BossFightResult` | B4 |
| `upgrade` | `{ "gearId": "<uuid>" }` | `ServerState` | B6 |
| `relic-forge` | `{}` | `ForgeResult` | B5 |
| `relic-mint-report` | `{ "nonce": "<decimal>", "txHash": "0x…" }` | `ServerState` | B5 |

Errors return a non-2xx status with `{ "error": GameApiErrorCode }` (plus `"reason"` for `forge_blocked`):

| Code | Status | When |
| --- | --- | --- |
| `unauthenticated` | 401 | Missing, expired or invalid JWT. |
| `not_owner` | 403 | `equip` on an item that is not the caller's. |
| `not_found` | 404 | Player row missing. |
| `rate_limited` | 429 | Reserved; `idle-claim` within 10 s returns 200 with nothing added instead. |
| `no_attempts_left` | 409 | `boss-fight` after `CONFIG.boss.maxAttemptsPerDay` attempts today. |
| `forge_blocked` | 409 | `relic-forge` with no pending voucher while forging is blocked; `reason` is the `ForgeBlock` (`daily_limit`, `no_boss_key`, `not_enough_shards`). |
| `mint_not_confirmed` | 409 | `relic-mint-report` when the tx is missing, reverted, or has no `RelicForged` for that nonce. Safe to retry. |
| `not_enough_gold` | 409 | `upgrade` when gold < `upgradeCost(item)`. |
| `max_level` | 409 | `upgrade` on an item at `gear.maxLevel`. |
| `server_error` | 500 | Anything else. |

## Rules

- **Time** is the server clock only. "Today" is `dayIndex(unixSeconds)` from game-rules: the day resets at midnight UTC+7.
- **ServerState.gear** is the equipped items only (one per slot); **inventory** is every owned item, equipped included. Power is `heroPower(gear)`.
- **idle-claim** credits `computeClaimGains(state, now - last_claim_at, seed)`: the first `idle.onlineWindowSeconds` (5 min) pay the full rate, the rest pays `idle.offlineEfficiency` (50%), and the total is capped at `idle.offlineCapSeconds` (8 h). It then sets `last_claim_at = now`. A claim less than 10 s after the previous one adds nothing and does not move `last_claim_at`. Drops are inserted as unequipped inventory and returned in `drops`.
- **upgrade** raises one owned item (equipped or not) by one level and subtracts `upgradeCost(item)` gold (game-rules), in one transaction with the player row locked so two parallel upgrades cannot overspend. `not_owner` for another player's or an unknown item. Gold is the only thing spent on upgrades; the boss balance (`simulateActivePlay`) assumes players spend gold this way.
- **equip** unequips whatever is in the item's slot and equips the item, in one transaction.
- **boss-fight** refuses at the daily attempt limit, otherwise records an attempt and runs `simulateBoss(power, bossLevel, serverSeed)`. A win raises `bossLevel` by 1 (up to `boss.maxLevel`) and, if no key was granted today, grants one Boss Key (`boss_keys` unique per player and day). A loss changes nothing but the attempt count. The client replays `result.log` and never re-simulates.
- **bossKeys** counts unspent keys (`boss_keys.spent_at is null`). B5 spends them.
- **ServerState.forge** is `{ blockedBy, forgedToday, pending, today }`. `today` is today's forged Relic (`relicId`, `rarityName`, `minted`, `txHash`) or null; it comes from `relic_forges` for today's UTC+7 day joined with its newest voucher (B7). `blockedBy` is `forgeBlock(...)` from game-rules, or null when forging is allowed or a voucher is pending.
- **relic-forge** (one Relic per UTC+7 day):
  1. If a voucher is pending (issued, not minted), return it with no spend and no re-roll. If it has expired, re-sign the same `relicId` and `rarity` with a new nonce and expiry (~30 min), mark the old nonce expired, and return the new one.
  2. Otherwise refuse with `forge_blocked` if `forgeBlock` says so.
  3. Otherwise, in one transaction: spend `relic.shardCost` shards and `relic.bossKeyCost` Boss Keys, roll `rollRelicRarity(serverSeed)` with seed `HMAC(GAME_SEED_SECRET, "relic:<playerId>:<day>")`, set `relicId = relicIdFor(rarity)` and `rarity = rarityIndex(rarity)` (uint8), insert a `relic_vouchers` row (status `issued`), and sign the EIP-712 voucher (docs/contracts.md) with `VOUCHER_SIGNER_PRIVATE_KEY` for `player` = the session wallet.
  4. Concurrent calls must not double-spend: the forge for a player and day is unique.
- **relic-mint-report** reads the tx receipt on Fuji (chain 43113, RelicNFT from packages/chain). It accepts only a successful tx from RelicNFT that emits `RelicForged(player, relicId, rarity, nonce)` matching the caller's voucher, then marks the voucher `minted` with `tx_hash`. Unknown nonce or another player's nonce: `not_found`. Reporting an already minted voucher again returns the state unchanged. If the player never reports, the voucher stays pending; the client may also call `relic-mint-report` later with the hash, and the chain stays the source of truth for ownership.
- **Demo mode**: `MockGameApi.forgeRelic` returns a voucher with an all-zero signature (`DEMO_SIGNATURE`) and the zero address as player. The client must not send it to a wallet; it shows the rolled Relic as a demo result.

## Database notes for B3/B4

The B1 `gear` table has `item_key`, `slot`, `power`, `equipped`. B3 adds `rarity` and `level` columns (with checks matching `CONFIG.rarities` and `gear.maxLevel`) so rows map to `Gear`. B3 also adds `boss_level` to `idle_state` (default 1). New tables and functions get no default grants since B2, so every new object grants explicitly.
