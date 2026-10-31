-- CXN1: expose the existing claim UUID and hold replacements until the post-reissue chain check.
-- Apply manually before deploying the functions. No existing balances or vouchers are rewritten.
begin;

alter table public.relic_vouchers
  add column if not exists reissue_nonce bigint references public.relic_vouchers (nonce),
  add column if not exists reissue_check_token uuid,
  add column if not exists reissue_check_after timestamptz;

create unique index if not exists relic_vouchers_one_minted_per_forge
  on public.relic_vouchers (forge_id) where status = 'minted';

create or replace function public.game_voucher_json(v public.relic_vouchers)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'claimId', v.forge_id,
    'player', (select wallet from public.players where id = v.player_id),
    'relicId', v.relic_id::text, 'rarityName', v.rarity, 'nonce', v.nonce::text,
    'expiry', extract(epoch from v.expires_at)::bigint,
    'signature', v.signature, 'status', v.status, 'txHash', v.tx_hash,
    'reissueNonce', v.reissue_nonce::text,
    'reissuePending', v.reissue_check_token is not null,
    'reissueCheckAfter', extract(epoch from v.reissue_check_after)
  );
$$;

create or replace function public.game_snapshot(p_player uuid, p_day date, p_starter jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.idle_state;
  v public.relic_vouchers;
  f public.relic_forges;
  m public.relic_vouchers;
begin
  if not exists (select 1 from public.gear where player_id = p_player) then
    -- Serialize first-time setup per player so two calls cannot both insert starters.
    perform 1 from public.players where id = p_player for update;
    if not found then
      return null;
    end if;
    if not exists (select 1 from public.gear where player_id = p_player) then
      perform public.game_insert_gear(p_player, p_starter, true);
    end if;
  end if;

  insert into public.idle_state (player_id) values (p_player) on conflict (player_id) do nothing;
  select * into s from public.idle_state where player_id = p_player;
  if not found then
    return null;
  end if;

  select * into v from public.relic_vouchers
   where player_id = p_player and status = 'issued'
   order by nonce desc limit 1;

  select * into f from public.relic_forges where player_id = p_player and day = p_day;
  if found then
    -- The forge's minted voucher if there is one, else its newest.
    select * into m from public.relic_vouchers
     where forge_id = f.id
     order by (status = 'minted') desc, nonce desc limit 1;
  end if;

  return jsonb_build_object(
    'gold', s.gold,
    'shards', s.shards,
    'bossLevel', s.boss_level,
    -- Exact microseconds since the epoch, for the claim seed and game_claim's compare-and-set.
    'lastClaimMicros', public.game_epoch_micros(s.last_claim_at),
    'bossKeys', (select count(*) from public.boss_keys where player_id = p_player and spent_at is null),
    'attemptsToday', (select count(*) from public.boss_attempts where player_id = p_player and day = p_day),
    'keyEarnedToday', exists (select 1 from public.boss_keys where player_id = p_player and day = p_day),
    'gear', (
      select coalesce(
        jsonb_agg(jsonb_build_object('id', id, 'slot', slot, 'rarity', rarity, 'level', level, 'equipped', equipped)
                  order by created_at, id),
        '[]'::jsonb)
      from public.gear where player_id = p_player
    ),
    'forgedToday', exists (select 1 from public.relic_forges where player_id = p_player and day = p_day),
    'pending', case when v.nonce is null then null else public.game_voucher_json(v) end,
    'today', case when f.id is null then null else jsonb_build_object(
      'claimId', f.id,
      'relicId', f.relic_id::text,
      'rarityName', f.rarity,
      'minted', m.status = 'minted',
      'txHash', case when m.status = 'minted' then m.tx_hash else null end
    ) end
  );
end;
$$;

create or replace function public.v2_snapshot(p_player uuid, p_day date)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.cat_state;
  v public.relic_vouchers;
  f public.relic_forges;
  m public.relic_vouchers;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return null;
  end if;
  insert into public.cat_state (player_id) values (p_player) on conflict (player_id) do nothing;
  select * into s from public.cat_state where player_id = p_player;

  select * into v from public.relic_vouchers
   where player_id = p_player and status = 'issued'
   order by nonce desc limit 1;
  select * into f from public.relic_forges where player_id = p_player and day = p_day;
  if found then
    select * into m from public.relic_vouchers
     where forge_id = f.id
     order by (status = 'minted') desc, nonce desc limit 1;
  end if;

  return jsonb_build_object(
    'classId', s.class_id,
    'level', s.level,
    'xp', s.xp,
    'chapter', s.chapter,
    'round', s.round,
    'kills', s.kills,
    'bestStage', s.best_stage,
    'fights', s.fights,
    'progressRev', s.progress_rev,
    -- Exact microseconds since the epoch: the claim seed and v2_claim's compare-and-set.
    'lastClaimMicros', public.game_epoch_micros(s.last_claim_at),
    'lastDailyKeyDay', s.last_daily_key_day,
    'cooldownUntil', case when s.boss_cooldown_until > now() then extract(epoch from s.boss_cooldown_until)::bigint end,
    'serverTime', extract(epoch from now())::bigint,
    'stacks', (select coalesce(jsonb_object_agg(stack_id, qty), '{}'::jsonb) from public.player_stacks where player_id = p_player),
    'inventory', public.v2_items_json(p_player, null),
    'equipped', (select coalesce(jsonb_object_agg(slot, id), '{}'::jsonb) from public.items where player_id = p_player and equipped),
    'bossClears', (
      select coalesce(jsonb_agg(jsonb_build_object('chapter', chapter, 'wins', wins) order by chapter), '[]'::jsonb)
        from public.boss_clears where player_id = p_player
    ),
    'founder', exists (select 1 from public.founder_grants where player_id = p_player),
    'forgedToday', f.id is not null,
    'pending', case when v.nonce is null then null else public.game_voucher_json(v) end,
    'today', case when f.id is null then null else jsonb_build_object(
      'claimId', f.id,
      'relicId', f.relic_id::text,
      'rarityName', f.rarity,
      'minted', m.status = 'minted',
      'txHash', case when m.status = 'minted' then m.tx_hash else null end
    ) end
  );
end;
$$;

-- A mint report and cancellation of any replacement are one locked operation.
create or replace function public.game_voucher_minted(p_player uuid, p_nonce bigint, p_tx_hash text)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  v public.relic_vouchers;
begin
  perform 1 from public.players where id = p_player for update;
  select * into v from public.relic_vouchers where player_id = p_player and nonce = p_nonce;
  if not found then return false; end if;
  if exists (select 1 from public.relic_vouchers where forge_id = v.forge_id and status = 'minted' and nonce <> p_nonce) then
    return false;
  end if;
  update public.relic_vouchers set status = 'cancelled', reissue_check_token = null, reissue_check_after = null
   where forge_id = v.forge_id and nonce <> p_nonce and status = 'issued';
  update public.relic_vouchers set status = 'minted', tx_hash = coalesce(tx_hash, p_tx_hash),
    reissue_check_token = null, reissue_check_after = null
   where player_id = p_player and nonce = p_nonce;
  return true;
end;
$$;

-- Persist no signature while its exclusive chain check is in progress, or after a sibling mint.
create or replace function public.game_voucher_sign(p_player uuid, p_nonce bigint, p_signature text)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform 1 from public.players where id = p_player for update;
  update public.relic_vouchers v set signature = coalesce(v.signature, lower(p_signature))
   where v.player_id = p_player and v.nonce = p_nonce and v.status = 'issued'
     and v.reissue_check_token is null
     and not exists (select 1 from public.relic_vouchers m where m.forge_id = v.forge_id and m.status = 'minted');
  return found;
end;
$$;

-- Reissue only after expiry + the existing 120-second grace. A replacement stays unsigned until
-- its creator completes the second nonceUsed read. The token is returned ONLY to that caller.
-- An interrupted check can be resumed after a lease of the same grace duration, without another
-- voucher, payment or rarity roll. Snapshots never return the token.
create or replace function public.game_voucher_reissue(p_player uuid, p_nonce bigint, p_now timestamptz, p_expires_at timestamptz)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  old public.relic_vouchers;
  v public.relic_vouchers;
begin
  perform 1 from public.players where id = p_player for update;
  select * into old from public.relic_vouchers
   where player_id = p_player and nonce = p_nonce and status = 'issued';
  if not found then return null; end if;
  if exists (select 1 from public.relic_vouchers where forge_id = old.forge_id and status = 'minted') then return null; end if;
  if old.reissue_check_token is not null then
    if p_now <= old.reissue_check_after then return null; end if;
    update public.relic_vouchers set reissue_check_token = pg_catalog.gen_random_uuid(),
      reissue_check_after = p_now + interval '120 seconds'
     where nonce = old.nonce returning * into v;
  else
    if date_trunc('second', p_now) <= old.expires_at + interval '120 seconds' then return null; end if;
    update public.relic_vouchers set status = 'expired' where nonce = old.nonce;
    insert into public.relic_vouchers (player_id, forge_id, relic_id, rarity, expires_at,
      reissue_nonce, reissue_check_token, reissue_check_after)
    values (p_player, old.forge_id, old.relic_id, old.rarity, p_expires_at,
      old.nonce, pg_catalog.gen_random_uuid(), p_now + interval '120 seconds') returning * into v;
  end if;
  return public.game_voucher_json(v) || jsonb_build_object('reissueCheckToken', v.reissue_check_token);
end;
$$;

-- Resolve a held replacement atomically. If the old nonce became used, record that old voucher
-- minted (hash unknown), cancel the new voucher and return the OLD row. No new signature exists.
create or replace function public.game_voucher_reissue_resolve(p_player uuid, p_nonce bigint, p_token uuid, p_used boolean)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v public.relic_vouchers;
  old public.relic_vouchers;
  minted public.relic_vouchers;
begin
  perform 1 from public.players where id = p_player for update;
  select * into v from public.relic_vouchers where player_id = p_player and nonce = p_nonce;
  if not found then return null; end if;
  select * into minted from public.relic_vouchers where forge_id = v.forge_id and status = 'minted';
  if found then return public.game_voucher_json(minted); end if;
  if v.status <> 'issued' or p_used is null or v.reissue_check_token is null
     or v.reissue_check_token is distinct from p_token then return null; end if;
  select * into old from public.relic_vouchers
   where player_id = p_player and nonce = v.reissue_nonce and forge_id = v.forge_id;
  if not found then return null; end if;
  if p_used then
    if not public.game_voucher_minted(p_player, old.nonce, null) then return null; end if;
    select * into old from public.relic_vouchers where nonce = old.nonce;
    return public.game_voucher_json(old);
  end if;
  update public.relic_vouchers set reissue_check_token = null, reissue_check_after = null
   where nonce = v.nonce returning * into v;
  return public.game_voucher_json(v);
end;
$$;

revoke all on function public.game_voucher_json(public.relic_vouchers) from public, anon, authenticated, service_role;
revoke all on function public.game_snapshot(uuid, date, jsonb) from public, anon, authenticated;
revoke all on function public.v2_snapshot(uuid, date) from public, anon, authenticated;
revoke all on function public.game_voucher_minted(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.game_voucher_sign(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.game_voucher_reissue(uuid, bigint, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.game_voucher_reissue_resolve(uuid, bigint, uuid, boolean) from public, anon, authenticated;
grant execute on function public.game_snapshot(uuid, date, jsonb) to service_role;
grant execute on function public.v2_snapshot(uuid, date) to service_role;
grant execute on function public.game_voucher_minted(uuid, bigint, text) to service_role;
grant execute on function public.game_voucher_sign(uuid, bigint, text) to service_role;
grant execute on function public.game_voucher_reissue(uuid, bigint, timestamptz, timestamptz) to service_role;
grant execute on function public.game_voucher_reissue_resolve(uuid, bigint, uuid, boolean) to service_role;

commit;
