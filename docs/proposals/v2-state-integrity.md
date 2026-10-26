# v2 state integrity — gated follow-up

S2's `supabase/tests/v2/security-races.test.ts` contains four explicit `it.fails` cases. They run real rules and migrated SQL; they are neither skipped nor asserted as working guarantees. Temporarily running those same assertions as ordinary tests yields four failures (see the S2 report). Apply these changes only in an approved migration card and then turn each expected failure into an ordinary passing regression. No SQL in this document was applied to a live database.

## Starter salvage loop (High)

Choose warrior, switch to archer so the sword is unequipped, salvage it for common materials, choose warrior again for another free sword, repeat. Current starter issuance checks only whether the player *currently owns* that weapon type; salvage does not check `items.source`. This mints unbounded Yarn/fluffTuft, up to stack caps which the attacker can keep spending. It does not itself mint Moon Pearls or bypass the daily NFT forge limit.

Smallest fix: refuse deletion of source `starter` in the existing locked salvage transaction, preserving the same permission/grants and returning `invalid_request` (no API code addition). Snapshot JSON currently omits `source`, and ordinary drops/crafts share starter catalog IDs. An Edge filter by catalog ID would break valid salvage, so S2 did not make that substitute. A later UX card can hide starter salvage; the SQL refusal is the security boundary. No content/economy number needs to change.

Runnable replacement for an approved SQL migration:

```sql
create or replace function public.v2_salvage(p_player uuid, p_item_ids uuid[], p_gains jsonb, p_caps jsonb default '{}'::jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_ids uuid[];
  v_found integer;
  v_res jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_item_ids, '{}')) as x;
  if cardinality(v_ids) = 0 then return jsonb_build_object('error', 'invalid_request'); end if;
  select count(*) into v_found from public.items where player_id = p_player and id = any(v_ids);
  if v_found <> cardinality(v_ids) then return jsonb_build_object('error', 'not_owner'); end if;
  if exists (select 1 from public.items where player_id = p_player and id = any(v_ids) and equipped) then
    return jsonb_build_object('error', 'equipped');
  end if;
  if exists (select 1 from public.items where player_id = p_player and id = any(v_ids) and locked) then
    return jsonb_build_object('error', 'locked');
  end if;
  if exists (select 1 from public.items where player_id = p_player and id = any(v_ids) and source = 'starter') then
    return jsonb_build_object('error', 'invalid_request');
  end if;
  delete from public.items where player_id = p_player and id = any(v_ids);
  v_res := public.v2_apply_stacks(p_player, p_gains, p_caps);
  return jsonb_build_object('status', 'ok', 'added', v_res->'added');
end;
$$;
-- CREATE OR REPLACE retains existing service-role-only execution grants.
```

Tests must include a mixed starter+ordinary batch (all-or-nothing, no gains), all seven class starter types, a crafted common weapon with the same catalog key (still salvageable), and repeated class selection (no extra weapon). The S2 disposable proposal test exercises these critical distinctions; applying this proposal to that in-memory clone is not deployment.

## Combat snapshot versus equipment (Medium)

`v2_equip` serializes swaps and prevents two equipped items per slot, but does not bump `cat_state.progress_rev`. A boss result computed with a sword equipped still commits after that sword is unequipped; the same problem affects claim stats. Merely taking a fresh snapshot before the RPC leaves a time-of-check/time-of-use gap.

Smallest SQL fix: bump the shared revision on an actual equipment change, including unequip. Existing claim and boss CAS predicates then reject stale results. An idempotent equip must not invalidate other computations. This trigger sketch covers both equip and class-selection updates without changing RPC signatures:

```sql
create function public.v2_equipment_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.equipped is distinct from old.equipped then
    update public.cat_state set progress_rev = progress_rev + 1 where player_id = new.player_id;
  end if;
  return new;
end;
$$;
revoke all on function public.v2_equipment_revision() from public, anon, authenticated;
create trigger v2_equipment_revision after update of equipped on public.items
  for each row execute function public.v2_equipment_revision();
```

Use the existing player-lock-then-cat-state order. This can increment the revision twice in a replacement swap; it is a version, not a count of actions. Confirm all writers preserve that lock order in real PostgreSQL. Add reversed interleavings for equip/claim and equip/boss and an idempotent equip regression. PGlite cannot prove production lock scheduling or deadlock freedom.

## Lost-response craft and boss retry (Medium)

Two crafts with enough resources both pay and produce different instance UUIDs. Two identical boss bodies can be a first clear followed by a paid rematch. These are legitimate intentional repeat actions, but the server cannot distinguish them from HTTP retries: there is no stable action id. This is **not** free double minting; SQL charges both. In-memory per-isolate caching and CAS alone cannot give durable retry safety.

Add a UUID `requestId` generated once per user action and preserved across transport retries, plus a service-only `(player_id, route, request_id)` ledger. Lock the player, look up the ledger, reject a changed intent, execute the existing SQL mutation and save its result **in the same transaction**. Store the stable intent (recipe/slot or boss chapter), not the computed seed, current inventory or expected revision. A same-body *new* requestId remains an intentional new action. Do not expire ledger keys while clients may retry; a retained key/tombstone must refuse an old retry even after its bulky response is removed. Bound issuance with the rate limiter.

Schema sketch (not applied):

```sql
create table public.v2_action_results (
  player_id uuid not null references public.players(id) on delete cascade,
  route text not null check(route in ('v2-craft', 'v2-boss-fight')),
  request_id uuid not null,
  intent jsonb not null,
  result jsonb,
  created_at timestamptz not null default now(),
  primary key(player_id, route, request_id)
);
alter table public.v2_action_results enable row level security;
revoke all on public.v2_action_results from public, anon, authenticated;
-- Only the SECURITY DEFINER wrapper may read/write this table; no client SELECT policy.
```

Inside the approved craft/boss wrapper, preserve the lock before the ledger lookup:

```sql
-- Algorithm to insert into the existing RPCs, not a standalone SQL statement:
-- perform 1 from public.players where id = p_player for update;
-- select * into previous from public.v2_action_results
--  where player_id=p_player and route=p_route and request_id=p_request_id;
-- if found then
--   if previous.intent is distinct from p_intent then return '{"error":"invalid_request"}'::jsonb; end if;
--   return coalesce(previous.result, '{"error":"stale"}'::jsonb); -- compacted tombstone refuses execution
-- end if;
-- [existing validated, locked mutation assigns v_result]
-- insert into public.v2_action_results(player_id,route,request_id,intent,result)
-- values(p_player,p_route,p_request_id,p_intent,v_result);
-- return v_result;
```

The server must first retrieve a prior result by verified player/requestId **before** preview checks, otherwise a valid retry can be rejected for insufficient resources/cooldown. A miss still uses the atomic wrapper, so two misses cannot both mutate. Prefer persisting mutation result/item/timeline and attaching a fresh state snapshot to the replay response. Boss simulation must retain the originally committed timeline, not recompute using a new fight counter. This requires an API/client/SQL change in one approved card; changing only Edge Functions cannot finish the contract. Tests: parallel same id yields one spend; transport retry returns the same item/timeline; same id/different intent rejects; different players may use the same id independently; database failure rolls back spend and ledger together.

## Used nonce versus actual mint (Low, privileged precondition)

`forgeRelicV2` calls `voucherMinted(..., null)` whenever the expired nonce is used. Contract owner cancellation and a compromised signer can also set `usedNonces`; that flag alone is not a receipt. Reuse the existing [Relic recovery proposal](relic-recovery.md): require a canonical matching `RelicForged` log (contract, recipient, relic, rarity, nonce), distinguish cancellation, and choose a confirmation depth/reorg recovery policy before reissue. Fail closed if the authoritative RPC cannot answer. Stable nonce means stable during one issued voucher; an expired unused voucher intentionally receives a **new** nonce. Never reuse an expired nonce as a new paid forge.

## Existing contract Mediums (proposal and testnet mitigation)

**Signer compromise — Medium, CONFIRMED trust boundary, compromise NOT VERIFIED.** The current `mint` accepts any valid signer voucher with an unused nonce; no on-chain daily/supply budget exists ([contracts/src/RelicNFT.sol:70](../../contracts/src/RelicNFT.sol#L70)). With time, pin known relic/rarity mappings, constrain voucher lifetime, evaluate issuance caps, keep signer and owner separate, and operate owner authority through a multisig. For an honest Fuji submission: call the assets valueless testnet items, keep the signer only in the server secret store, monitor forged nonces against issuance records and maintain a tested owner signer-rotation runbook. Rotation invalidates all outstanding signatures, including legitimate ones. Do not claim that the game's database one-per-day cap survives signer compromise.

**Single-step ownership — Medium, CONFIRMED source, deployed owner NOT VERIFIED.** `RelicNFT` inherits OpenZeppelin `Ownable` ([contracts/src/RelicNFT.sol:14](../../contracts/src/RelicNFT.sol#L14)), so a transfer to an uncontrolled nonzero address can permanently remove signer rotation and URI administration. With time, redeploy using `Ownable2Step`, retain disabled renunciation, test acceptance and update the chain address only after owner review. For testnet: make no ownership transfer during the submission, keep the current owner recoverable and separate from the signer, and document that the immutable deployment cannot be patched. No contract, deployment address or ownership was changed in S2.
