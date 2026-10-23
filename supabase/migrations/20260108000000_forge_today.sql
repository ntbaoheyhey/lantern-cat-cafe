-- Taskbar Hero B7: game_snapshot also returns `today` (ServerState.forge.today): the Relic forged on
-- p_day with whether it was minted and the confirmed tx hash, or null when nothing was forged that
-- day. Same as the B5 version otherwise; grants are unchanged by create or replace.

-- game_snapshot (B5) plus `today`.
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
      'relicId', f.relic_id::text,
      'rarityName', f.rarity,
      'minted', m.status = 'minted',
      'txHash', case when m.status = 'minted' then m.tx_hash else null end
    ) end
  );
end;
$$;
