# Game API

The contract between the web client and the server. Types live in `apps/web/src/api/GameApi.ts`; `MockGameApi` implements the same rules in the browser. The Supabase implementation calls the Edge Functions below. All numbers come from `packages/game-rules`.

## Calls

Every call is `POST https://<project>.supabase.co/functions/v1/<name>` with `Authorization: Bearer <session JWT from auth-verify>` and a JSON body. The server identifies the player from the JWT `sub` claim only; any player id, wallet or timestamp in the body is ignored.

| Function | Body | Returns | Task |
| --- | --- | --- | --- |
| `game-state` | `{}` | `ServerState` | B3 |
| `idle-claim` | `{}` | `ClaimResult` | B3 |
| `equip` | `{ "gearId": "<uuid>" }` | `ServerState` | B3 |
| `boss-fight` | `{}` | `BossFightResult` | B4 |

Errors return a non-2xx status with `{ "error": GameApiErrorCode }`:

| Code | Status | When |
| --- | --- | --- |
| `unauthenticated` | 401 | Missing, expired or invalid JWT. |
| `not_owner` | 403 | `equip` on an item that is not the caller's. |
| `not_found` | 404 | Player row missing. |
| `rate_limited` | 429 | Reserved; `idle-claim` within 10 s returns 200 with nothing added instead. |
| `no_attempts_left` | 409 | `boss-fight` after `CONFIG.boss.maxAttemptsPerDay` attempts today. |
| `server_error` | 500 | Anything else. |

## Rules

- **Time** is the server clock only. "Today" is `dayIndex(unixSeconds)` from game-rules: the day resets at midnight UTC+7.
- **ServerState.gear** is the equipped items only (one per slot); **inventory** is every owned item, equipped included. Power is `heroPower(gear)`.
- **idle-claim** credits `computeClaimGains(state, now - last_claim_at, seed)`: the first `idle.onlineWindowSeconds` (5 min) pay the full rate, the rest pays `idle.offlineEfficiency` (50%), and the total is capped at `idle.offlineCapSeconds` (8 h). It then sets `last_claim_at = now`. A claim less than 10 s after the previous one adds nothing and does not move `last_claim_at`. Drops are inserted as unequipped inventory and returned in `drops`.
- **equip** unequips whatever is in the item's slot and equips the item, in one transaction.
- **boss-fight** refuses at the daily attempt limit, otherwise records an attempt and runs `simulateBoss(power, bossLevel, serverSeed)`. A win raises `bossLevel` by 1 (up to `boss.maxLevel`) and, if no key was granted today, grants one Boss Key (`boss_keys` unique per player and day). A loss changes nothing but the attempt count. The client replays `result.log` and never re-simulates.
- **bossKeys** counts unspent keys (`boss_keys.spent_at is null`). B5 spends them.

## Database notes for B3/B4

The B1 `gear` table has `item_key`, `slot`, `power`, `equipped`. B3 adds `rarity` and `level` columns (with checks matching `CONFIG.rarities` and `gear.maxLevel`) so rows map to `Gear`. B3 also adds `boss_level` to `idle_state` (default 1). New tables and functions get no default grants since B2, so every new object grants explicitly.
