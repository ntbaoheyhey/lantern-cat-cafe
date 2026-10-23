-- Taskbar Hero B3: idle claim and gear API (docs/api.md).
-- The game-state, idle-claim and equip Edge Functions compute with packages/game-rules and
-- write through the functions below, which are executable by service_role only.

-- Gear rows map to game-rules `Gear` (keep in sync with CONFIG.slots, CONFIG.rarities and
-- CONFIG.gear.maxLevel). Existing rows become common level 1.
alter table public.gear
  add column rarity text not null default 'common'
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  add column level integer not null default 1 check (level between 1 and 30),
  add constraint gear_slot_check check (slot in ('weapon', 'helm', 'armor', 'ring'));

-- Boss the player faces next (B4 raises it). Also the item level of idle drops.
alter table public.idle_state
  add column boss_level integer not null default 1 check (boss_level between 1 and 50);

create function public.game_epoch_micros(t timestamptz) returns bigint
language sql immutable set search_path = '' as $$
  select (extract(epoch from t) * 1000000)::bigint;
$$;

-- Insert gear items from a jsonb array of {slot, rarity, level, power} and return the new
-- rows as a jsonb array of {id, slot, rarity, level, equipped}. Internal helper.
create function public.game_insert_gear(p_player uuid, p_items jsonb, p_equipped boolean)
returns jsonb
language sql volatile security definer set search_path = '' as $$
  with ins as (
    -- created_at steps by 1 microsecond per item so listings keep the input order.
    insert into public.gear (player_id, item_key, slot, rarity, level, power, equipped, created_at)
    select p_player, (e.item ->> 'slot') || ':' || (e.item ->> 'rarity'), e.item ->> 'slot', e.item ->> 'rarity',
           (e.item ->> 'level')::integer, (e.item ->> 'power')::integer, p_equipped,
           now() + (e.ord - 1) * interval '1 microsecond'
      from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as e(item, ord)
     order by e.ord
    returning id, slot, rarity, level, equipped, created_at
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'slot', slot, 'rarity', rarity, 'level', level, 'equipped', equipped)
              order by created_at, id),
    '[]'::jsonb)
  from ins;
$$;

-- Everything the API returns about a player, as jsonb, or null when the player does not exist.
-- A player with no gear first gets p_starter ({slot, rarity, level, power}[]) equipped.
-- p_day is today's game day (dayIndex, UTC+7) as a date: date '1970-01-01' + dayIndex.
create function public.game_snapshot(p_player uuid, p_day date, p_starter jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.idle_state;
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
    )
  );
end;
$$;

-- Credit one idle claim in a single transaction. Refuses (returns null, changes nothing) when
-- last_claim_at is no longer p_expected_last_micros (another claim won the race) or p_now is less than
-- 10 s after it. Otherwise inserts p_drops unequipped, adds gold and shards, sets
-- last_claim_at = p_now and returns the new drops as a jsonb array.
create function public.game_claim(
  p_player uuid,
  p_expected_last_micros bigint,
  p_now timestamptz,
  p_gold bigint,
  p_shards integer,
  p_drops jsonb
)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_last timestamptz;
  v_drops jsonb;
begin
  if p_gold < 0 or p_shards < 0 then
    raise exception 'game_claim: negative gains';
  end if;
  perform 1 from public.players where id = p_player for update;
  select last_claim_at into v_last from public.idle_state where player_id = p_player for update;
  if not found or public.game_epoch_micros(v_last) <> p_expected_last_micros or p_now < v_last + interval '10 seconds' then
    return null;
  end if;

  v_drops := public.game_insert_gear(p_player, p_drops, false);
  update public.idle_state
     set gold = gold + p_gold, shards = shards + p_shards, last_claim_at = p_now
   where player_id = p_player;
  return v_drops;
end;
$$;

-- Equip an item the player owns, unequipping whatever is in its slot first, in one transaction.
-- Returns false when the item does not exist or belongs to someone else.
create function public.game_equip(p_player uuid, p_gear_id uuid)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_slot text;
begin
  -- Serialize gear changes per player so concurrent equips never hit gear_one_equipped_per_slot.
  perform 1 from public.players where id = p_player for update;
  select slot into v_slot from public.gear where id = p_gear_id and player_id = p_player;
  if not found then
    return false;
  end if;
  update public.gear set equipped = false
   where player_id = p_player and slot = v_slot and equipped and id <> p_gear_id;
  update public.gear set equipped = true where id = p_gear_id and not equipped;
  return true;
end;
$$;

-- Internal helpers: only the functions above (running as their owner) call them.
revoke all on function public.game_epoch_micros(timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.game_insert_gear(uuid, jsonb, boolean) from public, anon, authenticated, service_role;
revoke all on function public.game_snapshot(uuid, date, jsonb) from public, anon, authenticated;
revoke all on function public.game_claim(uuid, bigint, timestamptz, bigint, integer, jsonb) from public, anon, authenticated;
revoke all on function public.game_equip(uuid, uuid) from public, anon, authenticated;
grant execute on function public.game_snapshot(uuid, date, jsonb) to service_role;
grant execute on function public.game_claim(uuid, bigint, timestamptz, bigint, integer, jsonb) to service_role;
grant execute on function public.game_equip(uuid, uuid) to service_role;
