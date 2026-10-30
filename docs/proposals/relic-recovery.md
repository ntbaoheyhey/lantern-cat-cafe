# Proposal: recovering a paid but unminted Relic

Status: **fix 1 implemented (C7), migration not applied.** Fix 1 (tell minted from cancelled) is in `20261106000000_voucher_cancel_reissue.sql`, `relic.ts` (`nonceMinted`) and the v1/v2 forge flows; tests in `supabase/tests/src/voucher-cancel.test.ts`. The user applies the migration by hand BEFORE the Edge Functions deploy. Fixes 2 and 3, the reissue race guard and the client wallet message are still proposals.

Original status: proposal, not approved; it changes the Relic economy path.

## The gap

A forge costs 30 shards and a Boss Key and creates one `relic_forges` row for the day. The player then has to mint the Relic on Fuji with a server-signed voucher. If the forge is paid but the Relic never reaches the wallet, and the server holds no live (`issued`) voucher for it, the player is stuck: `relic-forge` answers `forge_blocked` with `daily_limit`, the shards and key are gone, and nothing can mint.

## What already works (read from `main`)

| Situation | Behaviour today |
| --- | --- |
| Wallet prompt rejected or tab closed | The voucher stays `issued` and comes back as `pending` (any day). Nothing is spent twice. |
| Voucher expires (30 min TTL) unminted | After expiry + 120 s grace, `relic-forge` checks `usedNonces` on chain. If unused it re-signs the same `relicId` and rarity with a new nonce. |
| Mint succeeded but the report call was lost | The chain check above marks the voucher `minted` instead of re-signing. `relic-mint-report` also accepts a late tx hash. |
| Two calls race | `game_forge` and `game_voucher_reissue` lock the player row; at most one `issued` voucher per forge (unique index). |

## Where a Relic can still be lost or duplicated

1. **Used nonce is not the same as minted (loss).** `forgeRelic` treats `nonceUsed(nonce) == true` as "minted" and calls `voucherMinted(..., null)`. But `RelicNFT.cancelNonce` (owner only) also sets `usedNonces`. A cancelled voucher is then recorded as minted: no Relic, no live voucher, `daily_limit` for the rest of the day, and the next day the player has no key or shards. Trigger: the owner cancels a voucher (for example a suspected leaked signature) and the player's voucher was one of them.
2. **Hidden pending voucher (misleading block).** `load()` drops a pending voucher when it is unsigned and `VOUCHER_SIGNER_PRIVATE_KEY` is missing or malformed. `game-state` then shows `forgedToday` with no pending voucher, which the UI reads as `daily_limit`, although the player owns a recoverable voucher. Transient, but it looks like a lost Relic.
3. **Lagging RPC (duplicate, very low odds).** If a mint is mined just before expiry and the RPC used for `nonceUsed` is more than the 120 s grace behind, a second voucher is issued and both can mint. The contract allows it (different nonces, same relic id), so the player gets two Relics from one forge.
4. **Wrong wallet.** A voucher binds to the signed-in wallet. If the player connects another wallet, minting reverts `NotVoucherPlayer`. The voucher is not lost, but nothing tells the player why.

Gaps 1 and 2 are the "paid but no voucher, daily_limit" cases. 3 and 4 are included because the fix touches the same code.

## Smallest safe fix

Keep the existing model (one forge row per player per day, voucher rows, chain is the truth) and change three things.

1. **Tell minted from cancelled.** When `nonceUsed(n)` is true, look for a `RelicForged` log for that player and relic id (both are indexed topics) and compare `nonce`. Found: mark `minted` and store the tx hash. Not found: mark the voucher `cancelled` (new status value) and treat it like an expired one, so the same forge gets a fresh voucher with a new nonce, the same relic id and the same rarity. No second payment, no re-roll.
2. **Stable claim id.** Return the `relic_forges.id` as `claimId` in `ForgeResult` and `ServerState.forge.today`, and as a field in `relic-mint-report` replies. Rule: a claim id maps to exactly one Relic (`relicId`, rarity) and at most one minted voucher. The client and support use it to refer to a forge; it is not secret.
3. **Never hide a pending voucher.** If the signer is missing, `game-state` still reports `pending` with `signature: null` and a `recoverable: true` hint; `relic-forge` returns `server_error` rather than `daily_limit`. The UI shows "Your Relic is waiting, try again shortly", never the daily limit message.

Duplicate guard (gap 3): before re-signing, require the `nonceUsed` read at a block at least `expiry + grace` old, and after `voucherReissue` re-check the old nonce once; if it was used meanwhile, mark `minted` for the forge and mark the new voucher `cancelled` on the server (the new voucher was never returned to the client). This closes the window without a contract change.

Wrong wallet (gap 4) is a client message only, no server change: if the connected address differs from the voucher player, show "Connect <short address> to mint this Relic".

Not proposed: contract changes, a second forge per day, refunds, or admin tooling in the app. If a case outside these still occurs, support can read the forge by claim id and re-issue with a SQL function run by the owner.

## Reissue rules (after the change)

- A forge has at most one `issued` voucher. Statuses: `issued`, `minted`, `expired`, `cancelled`.
- `expired`: replaced after `expiry + 120 s` if the nonce is unused.
- `cancelled`: replaced immediately when the nonce is used on chain without a matching `RelicForged` log.
- A voucher for a forge whose Relic is already minted is never issued.
- TTL stays 30 minutes. Reissue keeps the same `relicId` and rarity.

## Data changes

- Migration: allow `cancelled` in the `relic_vouchers.status` check and in the `game_voucher_*` functions; a `game_voucher_cancel_reissue` function (same shape as `game_voucher_reissue`, without the expiry condition). No change to `relic_forges`.
- `claimId` is an existing column exposed through the API types (`GameApi.ts`, `docs/api.md`).

## Tests

Edge Function unit tests (`supabase/tests`, in-memory store and fake chain), plus one SQL test:

1. Used nonce with a matching `RelicForged` log: voucher becomes `minted`, tx hash stored, no new voucher.
2. Used nonce with no log (cancelled): voucher `cancelled`, new voucher issued for the same forge, same `relicId` and rarity, shards and keys unchanged.
3. Cancelled voucher then a second call: returns the one `issued` voucher, no second row (unique index holds under two concurrent calls).
4. Unsigned pending voucher with no signer: `game-state` still shows it as pending, `relic-forge` answers `server_error`, not `forge_blocked`.
5. Reissue race: old nonce used between check and reissue leaves the forge `minted` and no live voucher.
6. Client: pending voucher plus a different connected wallet shows the "connect the right wallet" message; daily-limit text never shows while `pending` is set.
7. Regression: today's behaviour for rejected prompt, expiry reissue, late report and double click still passes.

## Risk

- Core change: forge, vouchers and `usedNonces` interpretation. A wrong "cancelled" decision would let a player mint twice, so the log lookup must read the same RelicNFT address and be confirmed by tests 1 and 2. Fuji RPC range limits apply: query from the deployment block, or from the voucher's creation time, never the whole chain.
- Extra RPC call only on the rare expired path; the normal forge path is unchanged.
- Migration is additive (one new status value and one function), safe to roll forward; rolling back leaves `cancelled` rows that old code reads as non-issued.
- Merging to `main` deploys the site immediately and Edge Functions through the deploy workflow, so the migration must be applied before the function change.

## Decisions needed from the user

1. Approve implementing fixes 1 to 3 as described (recommended).
2. Is it acceptable that a player whose voucher the owner cancelled gets a fresh voucher for the same Relic automatically (recommended), or should that need a manual support step?
