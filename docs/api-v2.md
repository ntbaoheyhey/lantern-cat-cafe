# Game API v2

The contract for Cat RPG v2. Types and the `GameApiV2` interface live in `apps/web/src/api/GameApiV2.ts`; the database behind it is in [proposals/schema-v2.md](proposals/schema-v2.md). Same conventions as [api.md](api.md): `POST https://<project>.supabase.co/functions/v1/<name>` with `Authorization: Bearer <session JWT>` and a JSON body; the player comes from the JWT `sub` claim only, and any player id, wallet or timestamp in the body is ignored. All numbers (costs, caps, cooldown, bag limit) come from `packages/game-rules` config, never from the client.

**Coexistence.** The v1 endpoints in api.md are unchanged and stay live until the cut-over (V29). v2 functions are new, prefixed `v2-`, use their own tables and are only called by the client when `VITE_GAME_V2=1`. Shared with v1 on purpose: accounts, the Relic tables (one Relic a day across both versions) and `relic-mint-report`, which v2 reuses as is (body `{ nonce, txHash }`; it returns the v1 `ServerState`, so a v2 client calls `v2-state` afterwards).

**Every v2 response carries the new `ServerStateV2`**, either as the whole body or in `state`.

## Calls

| Function | Body | Returns |
| --- | --- | --- |
| `v2-state` | `{}` | `ServerStateV2` |
| `v2-claim` | `{}` | `{ gains: GainsV2, state }` |
| `v2-equip` | `{ "itemId": "<uuid>" \| null, "slot": SlotId }` | `ServerStateV2` |
| `v2-choose-class` | `{ "classId": ClassId }` | `ServerStateV2` |
| `v2-boss-fight` | `{ "chapter": number }` | `{ won, timeline, chest?, keySpent, state }` |
| `v2-craft` | `{ "recipeId": "rcp.<rarity>", "slot": SlotId }` | `{ item, state }` |
| `v2-salvage` | `{ "itemIds": ["<uuid>", ...] }` | `{ gains, state }` |
| `v2-lock` | `{ "itemId": "<uuid>", "locked": boolean }` | `ServerStateV2` |
| `v2-relic-forge` | `{}` | `{ voucher, state }` |

Ids come from the game-rules v2 content registry: `ClassId` (`warrior`, `guardian`, `rogue`, `hunter`, `archer`, `witch`, `alchemist`), `SlotId` (`weapon`, `helmet`, `armor`, `gloves`, `boots`, `collar`, `earring`, `ring`, `charm`), gear rarity (`common` ... `legendary`), `StatId`, material ids, recipe ids (`rcp.common` ... `rcp.legendary`). Times are unix seconds on the server clock, except timeline `t` (milliseconds).

## ServerStateV2

```
cat         { classId: ClassId | null, level, xp, xpToNext }
progress    { chapter, round, kills, killsPerRound, gated, neededPower }
currencies  { fish, yarn, keys }
materials   { fluffTuft?, shinyButton?, catnipCrystal?, starlightScale?, moonPearl? }   // absent = 0
inventory   ItemV2[]     // { id, itemKey, slot, weaponType?, rarity, level, bonus: {stat, value}[], locked, equipped }
bagLimit    number
equipped    Record<SlotId, itemId | null>     // all 9 slots
unlockedSlots SlotId[]
bosses      { chapters: { chapter, cleared, wins }[], cooldownUntil: number | null }   // one cooldown per player
forge       { blockedBy: 'daily_limit' | 'not_enough_yarn' | 'no_moon_pearl' | null, forgedToday, pending: RelicVoucher | null, today: TodayRelic | null }
founder     boolean
serverTime  number
```

`RelicVoucher` and `TodayRelic` are the v1 shapes (api-contract). Stats are not sent; the client derives them with game-rules `deriveStats` from `itemKey`, `rarity`, `level` and `bonus`.

## Endpoints

### v2-state
Creates the player's `cat_state` row if missing and returns the state. `classId` is null until `v2-choose-class`. An unreissued expired voucher in `forge.pending` is re-signed with the same relic, as in v1.

### v2-claim
Credits everything earned since `last_claim_at` (idle kills, XP, level-ups, drops, the first-claim-of-the-day key) and returns `gains`:

```
gains { xp, levelsGained, fish, yarn, materials, keys, items: ItemV2[], autoSalvaged: AutoSalvagedV2[] }
```

With a full bag (`bagLimit`), drops that do not fit are salvaged at once. They are listed in `autoSalvaged` and their yield is already inside `fish`, `yarn` and `materials`; `items` are only the ones that went into the bag. `keys` is what was actually added after the key cap. Refused with `no_class` before a class is chosen. A claim less than 10 s after the previous one returns 200 with all-zero gains and does not move `last_claim_at`. If a parallel claim, boss win or class change invalidates the computed claim, the server recomputes once, then answers `stale`.

### v2-equip
`itemId` equips that item in `slot` (replacing the slot's item); `null` empties the slot. Refusals: `not_owner` (unknown or another player's item), `wrong_slot` (the item belongs to another slot), `slot_locked` (cat level has not unlocked the slot), `wrong_weapon` (weapon type does not match the class), `no_class`, `stale` (the class changed since the client's view).

### v2-choose-class
Sets the class. A weapon of another type is unequipped; the class's Common starter weapon is given if the player owns no weapon of that type, and the best owned one of that type is equipped if none is. An unknown class is `invalid_request`.

### v2-boss-fight
Runs the server fight for `chapter` (seed `v2boss:<player>:<fight_no>`). The client replays `timeline` and never re-simulates.
Timeline events optionally carry `big` on `boss_windup` and `boss_impact` for the telegraphed big attack, and `dodged` on `boss_impact` when the cat dodges for zero damage.

- Win: spends one key (`keySpent: true`), opens the chest in the same transaction (`chest`: fish, yarn, materials, keys, items, autoSalvaged, same shape as claim gains; bag overflow is auto-salvaged), records the clear, and on the first clear of the current chapter moves progress to the next chapter, round 1.
- Loss: `keySpent: false`, no chest, and `bosses.cooldownUntil` is set (one cooldown for all chapters).

Refusals: `no_class`, `cooldown` (body carries `cooldownUntil`), `not_reached` (chapter not at its boss yet and not cleared before), `no_key`, `stale` (a parallel fight or progress change).

#### Key wall and first-clear lever

The route requires `boss.keyCost` Cat Keys **before** combat, including on a first
clear that would refund a key. A reached boss with zero keys returns HTTP 409
`{ "error": "no_key" }`; it does not increment the fight counter, roll a chest,
set a cooldown, record a clear, or change progress/stacks. Refusals are checked in
this order: missing player, class, cooldown, chapter reach, then keys (request
validation happens before loading the player). A cleared chapter may be rematched,
but still requires a key. A loss keeps the key and grants no first-clear reward.

`boss.firstClearKeys` defaults to **0** (off). The unsigned numbers proposal asks
for **1**. With the lever on, a winning first-clear chest adds one Cat Key; a
rematch adds zero. SQL selects the first-clear chest under the player lock, spends
the entry key first, then credits capped rewards. With the current entry cost of
one and a five-key cap:

| Before | Lever | Result | `keySpent` | `chest.keys` | `state.currencies.keys` |
| ---: | ---: | --- | --- | ---: | ---: |
| 0 | 0 or 1 | 409 `no_key` | absent | absent | unchanged (0) |
| 1 | 0 | first-clear win | true | 0 | 0 |
| 1 | 1 | first-clear win | true | 1 | 1 |
| 5 | 1 | first-clear win | true | 1 | 5 |
| 1 | 1 | rematch win | true | 0 | 0 |
| 1 | 0 or 1 | loss | false | absent | 1 |

`chest.keys` reports actual credited rewards, before subtracting the entry spend;
it is not the net change to the wallet. First-clear refunds change no other chest
reward or RNG draw. Key sources are the first qualifying claim each day (current
`idle.dailyKeys = 1`), rare drops in **cleared chapters** (current chance 1/150 per
monster), and first-clear chests only if the lever is enabled. The browser must
explain the wall and these active sources; an expected refund is never entry
credit. No production default is changed by this documentation or these tests.

### v2-craft
Pays the recipe (Fish, Yarn and materials) and adds one item of the recipe's guaranteed rarity for `slot` (weapon type follows the class), with random bonus lines and a level from the best cleared stage. Refusals: `no_class`, `invalid_request` (unknown recipe or slot), `not_enough` (body `stack` = the first missing stack, nothing is spent), `bag_full` (crafting is never auto-salvaged).

### v2-salvage
All or nothing: every id must be the caller's, unequipped and unlocked. Returns the Fish, Yarn and materials returned (`gains`). Refusals: `not_owner`, `equipped`, `locked`. An empty list is `invalid_request`.

### v2-lock
Sets the `locked` flag; locked items cannot be salvaged. Refusal: `not_owner`.

### v2-relic-forge
Same voucher shape and rules as v1 `relic-forge` (pending voucher returned without a new spend, expired one re-signed, one Relic per UTC+7 day), but a new forge costs 30 Yarn and 1 Moon Pearl. The daily limit is shared with v1: forging in either version blocks the other that day. Refusal: `forge_blocked`, body `reason` in check order `daily_limit`, `not_enough_yarn`, `no_moon_pearl`.

## Errors

Non-2xx with `{ "error": code }` plus the field named in the last column when it applies. A refusal changes nothing. Codes that exist in v1 keep their names and statuses.

| Code | Status | When | Extra field |
| --- | --- | --- | --- |
| `unauthenticated` | 401 | Missing, expired or invalid JWT (v1). | |
| `invalid_request` | 400 | Body fails validation: wrong type, unknown class, recipe or slot, empty `itemIds`. | |
| `not_found` | 404 | Player row missing (v1). | |
| `rate_limited` | 429 | Reserved (v1); a claim under 10 s returns 200 with nothing added. | |
| `server_error` | 500 | Anything else (v1). | |
| `no_class` | 409 | The call needs a class and none is chosen. | |
| `not_owner` | 403 | The item is not the caller's or does not exist. | |
| `wrong_slot` | 409 | `v2-equip` item does not fit `slot`. | |
| `slot_locked` | 409 | `v2-equip` slot not unlocked at the cat's level. | |
| `wrong_weapon` | 409 | `v2-equip` weapon type is not the class's. | |
| `stale` | 409 | The request was based on an outdated state (class changed, parallel claim or fight). Refetch with `v2-state`. | |
| `cooldown` | 409 | `v2-boss-fight` during the boss cooldown. | `cooldownUntil` |
| `not_reached` | 409 | `v2-boss-fight` for a chapter the player has not reached. | |
| `no_key` | 409 | `v2-boss-fight` without a key. | |
| `not_enough` | 409 | `v2-craft` short of Fish, Yarn or a material. | `stack` |
| `bag_full` | 409 | `v2-craft` with the bag at `bagLimit`. | |
| `equipped` | 409 | `v2-salvage` includes an equipped item. | |
| `locked` | 409 | `v2-salvage` includes a locked item. | |
| `forge_blocked` | 409 | `v2-relic-forge` with no pending voucher while blocked. | `reason`: `daily_limit` \| `not_enough_yarn` \| `no_moon_pearl` |

The v1-only codes (`no_attempts_left`, `not_enough_gold`, `max_level`, `mint_not_confirmed`) do not occur in v2 functions.

## Rate notes

- `v2-claim`: minimum interval 10 s per player, as v1. The client claims every 30 s while the tab is visible and pauses when hidden. The Free plan allows 500,000 invocations a month (see schema-v2.md).
- Every function locks the player row, so parallel calls for one player are serialized; the loser of a race gets `stale` or the refusal that now applies.
- Boss fights have no daily limit; the cooldown after a loss is the only throttle.
- There is no per-IP limiting beyond the platform's.
