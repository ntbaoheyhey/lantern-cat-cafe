-- Taskbar Hero V8: database for Cat RPG v2 (docs/proposals/schema-v2.md, approved 2026-10-24).
-- Additive only: six new tables and the v2_* functions. v1 tables and functions are untouched;
-- players, relic_forges and relic_vouchers are shared on purpose. Every number (costs, caps, bag
-- limit, cooldown, key cost) is a function parameter computed by the Edge Function from
-- packages/game-rules; only structure (slot, rarity, source lists, formats) is checked here.
-- Every function locks the players row first (like v1) and returns jsonb: a result with
-- "status": "ok", or a refusal {"error": "<code>", ...} (codes in docs/api-v2.md) that changed nothing.
-- Rollback: supabase/tests/v2/rollback.sql (a test fixture, not a migration).

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table public.cat_state (
  player_id uuid primary key references public.players (id) on delete cascade,
  class_id text check (class_id ~ '^[a-z]+$'),
  level integer not null default 1 check (level between 1 and 100),
  xp bigint not null default 0 check (xp >= 0),
  chapter integer not null default 1 check (chapter >= 1),
  round integer not null default 1 check (round >= 1),
  kills integer not null default 0 check (kills >= 0),
  best_stage integer not null default 0 check (best_stage >= 0),
  last_claim_at timestamptz not null default now(),
  progress_rev bigint not null default 0,
  last_daily_key_day date,
  boss_cooldown_until timestamptz,
  fights bigint not null default 0 check (fights >= 0),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  item_key text not null check (item_key ~ '^[a-z0-9.]+$'),
  slot text not null check (slot in ('weapon', 'helmet', 'armor', 'gloves', 'boots', 'collar', 'earring', 'ring', 'charm')),
  weapon_type text check (weapon_type in ('sword', 'hammer', 'daggers', 'spear', 'bow', 'staff', 'flasks')),
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  level integer not null check (level between 1 and 100),
  bonus jsonb not null default '[]'::jsonb check (jsonb_typeof(bonus) = 'array' and jsonb_array_length(bonus) <= 4),
  locked boolean not null default false,
  equipped boolean not null default false,
  source text not null check (source in ('starter', 'drop', 'chest', 'craft', 'founder')),
  created_at timestamptz not null default now(),
  constraint items_weapon_type_iff_weapon check ((slot = 'weapon') = (weapon_type is not null))
);
create index items_player_idx on public.items (player_id);
create unique index items_one_equipped_per_slot on public.items (player_id, slot) where equipped;

create table public.player_stacks (
  player_id uuid not null references public.players (id) on delete cascade,
  stack_id text not null check (stack_id ~ '^[a-z][a-zA-Z0-9]*$'),
  qty bigint not null default 0 check (qty >= 0),
  primary key (player_id, stack_id)
);

create table public.boss_clears (
  player_id uuid not null references public.players (id) on delete cascade,
  chapter integer not null check (chapter >= 1),
  first_cleared_at timestamptz not null,
  wins integer not null default 1 check (wins >= 1),
  last_won_at timestamptz not null,
  primary key (player_id, chapter)
);

create table public.boss_fights (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  fight_no bigint not null,
  chapter integer not null check (chapter >= 1),
  won boolean not null,
  key_spent boolean not null,
  chest jsonb,
  created_at timestamptz not null default now(),
  unique (player_id, fight_no)
);
create index boss_fights_player_created_idx on public.boss_fights (player_id, created_at);

create table public.founder_grants (
  player_id uuid primary key references public.players (id) on delete cascade,
  granted_at timestamptz not null default now(),
  contents jsonb not null
);

-- RLS: select-own policies only; every write goes through the service_role-only functions below.
alter table public.cat_state enable row level security;
alter table public.items enable row level security;
alter table public.player_stacks enable row level security;
alter table public.boss_clears enable row level security;
alter table public.boss_fights enable row level security;
alter table public.founder_grants enable row level security;

create policy cat_state_select_own on public.cat_state for select to authenticated using (player_id = auth.uid());
create policy items_select_own on public.items for select to authenticated using (player_id = auth.uid());
create policy player_stacks_select_own on public.player_stacks for select to authenticated using (player_id = auth.uid());
create policy boss_clears_select_own on public.boss_clears for select to authenticated using (player_id = auth.uid());
create policy boss_fights_select_own on public.boss_fights for select to authenticated using (player_id = auth.uid());
create policy founder_grants_select_own on public.founder_grants for select to authenticated using (player_id = auth.uid());

grant select on public.cat_state, public.items, public.player_stacks, public.boss_clears,
  public.boss_fights, public.founder_grants to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Internal helpers (not callable by any API role, including service_role)
-- ---------------------------------------------------------------------------------------------

-- Apply stack deltas ({"stackId": n}) under the caller's player lock. Any negative delta that would
-- take a balance below 0 refuses the whole call before anything changes: {"error":"not_enough",
-- "stack": <first such stack by id>}. Positive deltas are clamped to p_caps ({"stackId": max}); a
-- balance already above its cap is left alone. Returns {"added": {stackId: actually added}} for the
-- positive deltas.
create function public.v2_apply_stacks(p_player uuid, p_deltas jsonb, p_caps jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_bal bigint;
  v_new bigint;
  v_cap bigint;
  v_added jsonb := '{}'::jsonb;
begin
  p_deltas := coalesce(p_deltas, '{}'::jsonb);
  p_caps := coalesce(p_caps, '{}'::jsonb);
  for r in select key, (value #>> '{}')::bigint as d from jsonb_each(p_deltas) order by key loop
    if r.d < 0 then
      select qty into v_bal from public.player_stacks where player_id = p_player and stack_id = r.key;
      if coalesce(v_bal, 0) + r.d < 0 then
        return jsonb_build_object('error', 'not_enough', 'stack', r.key);
      end if;
    end if;
  end loop;
  for r in select key, (value #>> '{}')::bigint as d from jsonb_each(p_deltas) order by key loop
    if r.d = 0 then
      continue;
    end if;
    select qty into v_bal from public.player_stacks where player_id = p_player and stack_id = r.key;
    v_bal := coalesce(v_bal, 0);
    if r.d < 0 then
      v_new := v_bal + r.d;
    else
      v_cap := (p_caps ->> r.key)::bigint;
      v_new := case when v_cap is null then v_bal + r.d else greatest(v_bal, least(v_bal + r.d, v_cap)) end;
      v_added := v_added || jsonb_build_object(r.key, v_new - v_bal);
    end if;
    insert into public.player_stacks (player_id, stack_id, qty) values (p_player, r.key, v_new)
    on conflict (player_id, stack_id) do update set qty = excluded.qty;
  end loop;
  return jsonb_build_object('added', v_added);
end;
$$;

-- An item row as the API returns it (ItemV2); weaponType is absent for non-weapons.
create function public.v2_item_json(i public.items)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', i.id, 'itemKey', i.item_key, 'slot', i.slot, 'weaponType', i.weapon_type,
    'rarity', i.rarity, 'level', i.level, 'bonus', i.bonus, 'locked', i.locked, 'equipped', i.equipped
  ));
$$;

-- The player's items as a jsonb array in bag order: all of them, or only p_ids.
create function public.v2_items_json(p_player uuid, p_ids uuid[])
returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(public.v2_item_json(i) order by i.created_at, i.id), '[]'::jsonb)
    from public.items i
   where i.player_id = p_player and (p_ids is null or i.id = any (p_ids));
$$;

-- Insert items from a jsonb array of {itemKey, slot, weaponType?, rarity, level, bonus?, salvage?}
-- (unequipped, source p_source). With p_bag_limit set, items beyond the limit are not inserted:
-- they are auto-salvaged, their `salvage` stack deltas applied (clamped to p_caps). Returns
-- {"items": [ItemV2], "autoSalvaged": [...], "salvaged": {stackId: actually added}}.
-- Caller holds the player lock.
create function public.v2_insert_items(p_player uuid, p_items jsonb, p_source text, p_bag_limit integer, p_caps jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_count bigint;
  v_ids uuid[] := '{}';
  v_id uuid;
  v_auto jsonb := '[]'::jsonb;
  v_salv jsonb := '{}'::jsonb;
  v_res jsonb;
  v_ord integer := 0;
begin
  select count(*) into v_count from public.items where player_id = p_player;
  for r in
    select e.item, e.ord from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as e(item, ord) order by e.ord
  loop
    if p_bag_limit is not null and v_count >= p_bag_limit then
      v_auto := v_auto || jsonb_strip_nulls(jsonb_build_object(
        'itemKey', r.item ->> 'itemKey', 'slot', r.item ->> 'slot', 'weaponType', r.item ->> 'weaponType',
        'rarity', r.item ->> 'rarity', 'level', (r.item ->> 'level')::integer));
      -- Sum the salvage yields, then apply them once below.
      select coalesce(jsonb_object_agg(k, t), '{}'::jsonb) into v_salv from (
        select k, sum(d) t from (
          select key as k, (value #>> '{}')::bigint as d from jsonb_each(v_salv)
          union all
          select key, (value #>> '{}')::bigint from jsonb_each(coalesce(r.item -> 'salvage', '{}'::jsonb))
        ) u group by k
      ) s;
      continue;
    end if;
    v_ord := v_ord + 1;
    -- created_at steps by 1 microsecond per item so the bag keeps drop order.
    insert into public.items (player_id, item_key, slot, weapon_type, rarity, level, bonus, source, created_at)
    values (p_player, r.item ->> 'itemKey', r.item ->> 'slot', r.item ->> 'weaponType', r.item ->> 'rarity',
            (r.item ->> 'level')::integer, coalesce(r.item -> 'bonus', '[]'::jsonb), p_source,
            now() + v_ord * interval '1 microsecond')
    returning id into v_id;
    v_ids := v_ids || v_id;
    v_count := v_count + 1;
  end loop;
  v_res := public.v2_apply_stacks(p_player, v_salv, p_caps);
  return jsonb_build_object(
    'items', public.v2_items_json(p_player, v_ids),
    'autoSalvaged', v_auto,
    'salvaged', v_res -> 'added');
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- API functions (service_role only)
-- ---------------------------------------------------------------------------------------------

-- Everything the API returns about a player, or null when the player does not exist. Creates the
-- cat_state row if missing. p_day is today's game day (UTC+7) as a date. Raw database values: the
-- Edge Function adds the config-derived fields (xpToNext, killsPerRound, gated, bagLimit, ...).
--   stacks: {stackId: qty} (fish, yarn, catKey and materials); equipped: {slot: itemId} for the
--   slots that hold an item; cooldownUntil: unix seconds or null once over.
create function public.v2_snapshot(p_player uuid, p_day date)
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
      'relicId', f.relic_id::text,
      'rarityName', f.rarity,
      'minted', m.status = 'minted',
      'txHash', case when m.status = 'minted' then m.tx_hash else null end
    ) end
  );
end;
$$;

-- Pick the class (and its weapon type). A weapon of another type is unequipped; the class's
-- starter weapon (p_starter: an item array) is given if the player owns no weapon of that type;
-- the best owned weapon of that type is equipped if none is. Bumps progress_rev.
create function public.v2_choose_class(p_player uuid, p_class_id text, p_weapon_type text, p_starter jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into public.cat_state (player_id) values (p_player) on conflict (player_id) do nothing;
  update public.cat_state set class_id = p_class_id, progress_rev = progress_rev + 1 where player_id = p_player;

  update public.items set equipped = false
   where player_id = p_player and slot = 'weapon' and equipped and weapon_type is distinct from p_weapon_type;
  if not exists (select 1 from public.items where player_id = p_player and slot = 'weapon' and weapon_type = p_weapon_type) then
    perform public.v2_insert_items(p_player, p_starter, 'starter', null, '{}'::jsonb);
  end if;
  if not exists (select 1 from public.items where player_id = p_player and slot = 'weapon' and equipped) then
    update public.items set equipped = true
     where id = (
       select id from public.items
        where player_id = p_player and slot = 'weapon' and weapon_type = p_weapon_type
        order by case rarity when 'legendary' then 5 when 'epic' then 4 when 'rare' then 3 when 'uncommon' then 2 else 1 end desc,
                 level desc, created_at, id
        limit 1
     );
  end if;
  return jsonb_build_object('status', 'ok', 'classId', p_class_id);
end;
$$;

-- Credit one idle claim. Returns null (nothing changes) when last_claim_at is no longer
-- p_expected_last_micros, progress_rev is no longer p_expected_rev (a boss win or class change
-- won the race) or p_now is under 10 s after the last claim. p_progress holds any of
-- level, xp, chapter, round, kills, bestStage (missing = unchanged). Stack deltas and drops are
-- applied (drops beyond p_bag_limit auto-salvaged). Returns {"status":"ok", added, salvaged,
-- items, autoSalvaged}; added/salvaged are what was actually credited after caps.
create function public.v2_claim(
  p_player uuid,
  p_expected_last_micros bigint,
  p_expected_rev bigint,
  p_now timestamptz,
  p_progress jsonb,
  p_stack_deltas jsonb,
  p_caps jsonb,
  p_items jsonb,
  p_bag_limit integer,
  p_daily_key_day date
)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.cat_state;
  v_stacks jsonb;
  v_ins jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  select * into s from public.cat_state where player_id = p_player for update;
  if not found
     or public.game_epoch_micros(s.last_claim_at) <> p_expected_last_micros
     or s.progress_rev <> p_expected_rev
     or p_now < s.last_claim_at + interval '10 seconds' then
    return null;
  end if;

  v_stacks := public.v2_apply_stacks(p_player, p_stack_deltas, p_caps);
  if v_stacks ? 'error' then
    return v_stacks;
  end if;
  v_ins := public.v2_insert_items(p_player, p_items, 'drop', p_bag_limit, p_caps);

  update public.cat_state
     set level = coalesce((p_progress ->> 'level')::integer, level),
         xp = coalesce((p_progress ->> 'xp')::bigint, xp),
         chapter = coalesce((p_progress ->> 'chapter')::integer, chapter),
         round = coalesce((p_progress ->> 'round')::integer, round),
         kills = coalesce((p_progress ->> 'kills')::integer, kills),
         best_stage = coalesce((p_progress ->> 'bestStage')::integer, best_stage),
         last_daily_key_day = coalesce(p_daily_key_day, last_daily_key_day),
         last_claim_at = p_now,
         progress_rev = progress_rev + 1
   where player_id = p_player;
  return jsonb_build_object('status', 'ok') || v_ins || jsonb_build_object('added', v_stacks -> 'added');
end;
$$;

-- Equip an owned item in its slot, or empty the slot when p_item_id is null. p_unlocked is the
-- jsonb array of slot ids the cat level has unlocked; p_weapon_type the class's weapon type.
-- Refusals, in order: stale (class is not p_expected_class), not_owner, wrong_slot, slot_locked,
-- wrong_weapon.
create function public.v2_equip(p_player uuid, p_item_id uuid, p_slot text, p_expected_class text, p_weapon_type text, p_unlocked jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  c text;
  i public.items;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into public.cat_state (player_id) values (p_player) on conflict (player_id) do nothing;
  select class_id into c from public.cat_state where player_id = p_player;
  if c is distinct from p_expected_class then
    return jsonb_build_object('error', 'stale');
  end if;
  if p_item_id is null then
    update public.items set equipped = false where player_id = p_player and slot = p_slot and equipped;
    return jsonb_build_object('status', 'ok');
  end if;
  select * into i from public.items where id = p_item_id and player_id = p_player;
  if not found then
    return jsonb_build_object('error', 'not_owner');
  end if;
  if i.slot <> p_slot then
    return jsonb_build_object('error', 'wrong_slot');
  end if;
  if not coalesce(p_unlocked, '[]'::jsonb) ? p_slot then
    return jsonb_build_object('error', 'slot_locked');
  end if;
  if i.slot = 'weapon' and i.weapon_type is distinct from p_weapon_type then
    return jsonb_build_object('error', 'wrong_weapon');
  end if;
  update public.items set equipped = false where player_id = p_player and slot = p_slot and equipped and id <> p_item_id;
  update public.items set equipped = true where id = p_item_id and not equipped;
  return jsonb_build_object('status', 'ok');
end;
$$;

-- One boss fight whose outcome p_won the Edge Function simulated from the fight's seed.
-- p_fight_no must be cat_state.fights and p_expected_rev the progress_rev of the snapshot it was
-- computed from, else stale. p_boss_round is the round that holds the chapter's boss (config).
-- p_chest: {"first": {"stacks": {..}, "items": [..]}, "rematch": {...}}; the first-clear chest is
-- used when boss_clears has no row for the chapter, decided under the lock. Refusals, in order:
-- stale, cooldown (with cooldownUntil, unix s), not_reached, no_key.
-- Win: spends p_key_cost keys, opens the chest (stacks clamped to p_caps, items beyond p_bag_limit
-- auto-salvaged), upserts boss_clears and on a first clear of the current chapter moves progress to
-- the next chapter, round 1 (bumps progress_rev). Loss: cooldown for p_cooldown_s seconds, key kept.
create function public.v2_boss_fight(
  p_player uuid,
  p_chapter integer,
  p_expected_rev bigint,
  p_won boolean,
  p_fight_no bigint,
  p_key_cost integer,
  p_cooldown_s integer,
  p_chest jsonb,
  p_bag_limit integer,
  p_caps jsonb,
  p_boss_round integer
)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.cat_state;
  v_first boolean;
  v_chest jsonb;
  v_keys bigint;
  v_stacks jsonb;
  v_ins jsonb;
  v_cd timestamptz;
  v_out jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into public.cat_state (player_id) values (p_player) on conflict (player_id) do nothing;
  select * into s from public.cat_state where player_id = p_player for update;

  if s.fights <> p_fight_no or s.progress_rev <> p_expected_rev then
    return jsonb_build_object('error', 'stale');
  end if;
  if s.boss_cooldown_until > now() then
    return jsonb_build_object('error', 'cooldown', 'cooldownUntil', extract(epoch from s.boss_cooldown_until)::bigint);
  end if;
  v_first := not exists (select 1 from public.boss_clears where player_id = p_player and chapter = p_chapter);
  if v_first and not (p_chapter = s.chapter and s.round >= p_boss_round) then
    return jsonb_build_object('error', 'not_reached');
  end if;
  select qty into v_keys from public.player_stacks where player_id = p_player and stack_id = 'catKey';
  if coalesce(v_keys, 0) < p_key_cost then
    return jsonb_build_object('error', 'no_key');
  end if;

  if not p_won then
    v_cd := now() + p_cooldown_s * interval '1 second';
    update public.cat_state set fights = fights + 1, boss_cooldown_until = v_cd where player_id = p_player;
    insert into public.boss_fights (player_id, fight_no, chapter, won, key_spent) values (p_player, p_fight_no, p_chapter, false, false);
    return jsonb_build_object('status', 'ok', 'won', false, 'keySpent', false, 'firstClear', false,
                              'cooldownUntil', extract(epoch from v_cd)::bigint, 'chest', null);
  end if;

  v_chest := coalesce(p_chest -> case when v_first then 'first' else 'rematch' end, '{}'::jsonb);
  v_stacks := public.v2_apply_stacks(p_player, jsonb_build_object('catKey', -p_key_cost), p_caps);
  v_stacks := public.v2_apply_stacks(p_player, v_chest -> 'stacks', p_caps);
  v_ins := public.v2_insert_items(p_player, v_chest -> 'items', 'chest', p_bag_limit, p_caps);
  v_out := jsonb_build_object('items', v_ins -> 'items', 'autoSalvaged', v_ins -> 'autoSalvaged',
                              'added', v_stacks -> 'added', 'salvaged', v_ins -> 'salvaged');

  if v_first then
    insert into public.boss_clears (player_id, chapter, first_cleared_at, wins, last_won_at)
    values (p_player, p_chapter, now(), 1, now());
  else
    update public.boss_clears set wins = wins + 1, last_won_at = now() where player_id = p_player and chapter = p_chapter;
  end if;
  if v_first and p_chapter = s.chapter then
    update public.cat_state
       set chapter = chapter + 1, round = 1, kills = 0, progress_rev = progress_rev + 1, fights = fights + 1
     where player_id = p_player;
  else
    update public.cat_state set fights = fights + 1 where player_id = p_player;
  end if;
  insert into public.boss_fights (player_id, fight_no, chapter, won, key_spent, chest)
  values (p_player, p_fight_no, p_chapter, true, true, v_out);
  return jsonb_build_object('status', 'ok', 'won', true, 'keySpent', true, 'firstClear', v_first,
                            'cooldownUntil', null, 'chest', v_out);
end;
$$;

-- Craft one item: p_cost is {stackId: positive amount} (Fish, Yarn, materials), p_item one item
-- object (as in v2_insert_items). Refusals: bag_full when the bag holds p_bag_limit items (checked
-- first, never auto-salvaged), then not_enough with the first missing stack. Nothing is spent on a refusal.
create function public.v2_craft(p_player uuid, p_cost jsonb, p_item jsonb, p_bag_limit integer)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_res jsonb;
  v_ins jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if (select count(*) from public.items where player_id = p_player) >= p_bag_limit then
    return jsonb_build_object('error', 'bag_full');
  end if;
  v_res := public.v2_apply_stacks(
    p_player,
    (select coalesce(jsonb_object_agg(key, -((value #>> '{}')::bigint)), '{}'::jsonb) from jsonb_each(coalesce(p_cost, '{}'::jsonb))),
    '{}'::jsonb);
  if v_res ? 'error' then
    return v_res;
  end if;
  v_ins := public.v2_insert_items(p_player, jsonb_build_array(p_item), 'craft', null, '{}'::jsonb);
  return jsonb_build_object('status', 'ok', 'item', v_ins -> 'items' -> 0);
end;
$$;

-- Salvage items all or nothing: deletes them and adds p_gains (clamped to p_caps). Every id must be
-- the player's, unequipped and unlocked. Refusals, in order: invalid_request (empty list),
-- not_owner, equipped, locked.
create function public.v2_salvage(p_player uuid, p_item_ids uuid[], p_gains jsonb, p_caps jsonb default '{}'::jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_ids uuid[];
  v_found integer;
  v_res jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_item_ids, '{}')) as x;
  if cardinality(v_ids) = 0 then
    return jsonb_build_object('error', 'invalid_request');
  end if;
  select count(*) into v_found from public.items where player_id = p_player and id = any (v_ids);
  if v_found <> cardinality(v_ids) then
    return jsonb_build_object('error', 'not_owner');
  end if;
  if exists (select 1 from public.items where player_id = p_player and id = any (v_ids) and equipped) then
    return jsonb_build_object('error', 'equipped');
  end if;
  if exists (select 1 from public.items where player_id = p_player and id = any (v_ids) and locked) then
    return jsonb_build_object('error', 'locked');
  end if;
  delete from public.items where player_id = p_player and id = any (v_ids);
  v_res := public.v2_apply_stacks(p_player, p_gains, p_caps);
  return jsonb_build_object('status', 'ok', 'added', v_res -> 'added');
end;
$$;

create function public.v2_lock(p_player uuid, p_item_id uuid, p_locked boolean)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  update public.items set locked = p_locked where id = p_item_id and player_id = p_player;
  if not found then
    return jsonb_build_object('error', 'not_owner');
  end if;
  return jsonb_build_object('status', 'ok');
end;
$$;

-- Same as v1 game_forge, paid in Yarn and a Moon Pearl from player_stacks. Returns
--   {"status":"pending","voucher":..}   a live voucher exists (any day): nothing spent;
--   {"status":"blocked","reason":..}    daily_limit | not_enough_yarn | no_moon_pearl, in that order;
--   {"status":"new","voucher":..}       costs spent, forge and an unsigned issued voucher inserted.
-- The daily limit is shared with v1 (the same relic_forges row per player and day).
create function public.v2_relic_forge(
  p_player uuid,
  p_day date,
  p_relic_id integer,
  p_rarity text,
  p_yarn_cost integer,
  p_pearl_cost integer,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v public.relic_vouchers;
  v_forge uuid;
  v_qty bigint;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    raise exception 'v2_relic_forge: no player %', p_player;
  end if;

  select * into v from public.relic_vouchers
   where player_id = p_player and status = 'issued'
   order by nonce desc limit 1;
  if found then
    return jsonb_build_object('status', 'pending', 'voucher', public.game_voucher_json(v));
  end if;

  if exists (select 1 from public.relic_forges where player_id = p_player and day = p_day) then
    return jsonb_build_object('status', 'blocked', 'reason', 'daily_limit');
  end if;
  select qty into v_qty from public.player_stacks where player_id = p_player and stack_id = 'yarn';
  if coalesce(v_qty, 0) < p_yarn_cost then
    return jsonb_build_object('status', 'blocked', 'reason', 'not_enough_yarn');
  end if;
  select qty into v_qty from public.player_stacks where player_id = p_player and stack_id = 'moonPearl';
  if coalesce(v_qty, 0) < p_pearl_cost then
    return jsonb_build_object('status', 'blocked', 'reason', 'no_moon_pearl');
  end if;

  perform public.v2_apply_stacks(p_player, jsonb_build_object('yarn', -p_yarn_cost, 'moonPearl', -p_pearl_cost), '{}'::jsonb);
  insert into public.relic_forges (player_id, day, relic_id, rarity)
  values (p_player, p_day, p_relic_id, p_rarity)
  returning id into v_forge;
  insert into public.relic_vouchers (player_id, forge_id, relic_id, rarity, expires_at)
  values (p_player, v_forge, p_relic_id, p_rarity, p_expires_at)
  returning * into v;
  return jsonb_build_object('status', 'new', 'voucher', public.game_voucher_json(v));
end;
$$;

-- Cut-over only: record the Founder bundle (p_contents: {stackId: amount}) and credit it, once per
-- player (clamped to p_caps). {"status":"granted"} or {"status":"already"} (nothing changes).
create function public.v2_grant_founder(p_player uuid, p_contents jsonb, p_caps jsonb default '{}'::jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into public.founder_grants (player_id, contents) values (p_player, coalesce(p_contents, '{}'::jsonb))
  on conflict (player_id) do nothing;
  if not found then
    return jsonb_build_object('status', 'already');
  end if;
  perform public.v2_apply_stacks(p_player, p_contents, p_caps);
  return jsonb_build_object('status', 'granted');
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------------------------

revoke all on function public.v2_apply_stacks(uuid, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.v2_item_json(public.items) from public, anon, authenticated, service_role;
revoke all on function public.v2_items_json(uuid, uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.v2_insert_items(uuid, jsonb, text, integer, jsonb) from public, anon, authenticated, service_role;

revoke all on function public.v2_snapshot(uuid, date) from public, anon, authenticated;
revoke all on function public.v2_choose_class(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.v2_claim(uuid, bigint, bigint, timestamptz, jsonb, jsonb, jsonb, jsonb, integer, date) from public, anon, authenticated;
revoke all on function public.v2_equip(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.v2_boss_fight(uuid, integer, bigint, boolean, bigint, integer, integer, jsonb, integer, jsonb, integer) from public, anon, authenticated;
revoke all on function public.v2_craft(uuid, jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.v2_salvage(uuid, uuid[], jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.v2_lock(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.v2_relic_forge(uuid, date, integer, text, integer, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.v2_grant_founder(uuid, jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.v2_snapshot(uuid, date) to service_role;
grant execute on function public.v2_choose_class(uuid, text, text, jsonb) to service_role;
grant execute on function public.v2_claim(uuid, bigint, bigint, timestamptz, jsonb, jsonb, jsonb, jsonb, integer, date) to service_role;
grant execute on function public.v2_equip(uuid, uuid, text, text, text, jsonb) to service_role;
grant execute on function public.v2_boss_fight(uuid, integer, bigint, boolean, bigint, integer, integer, jsonb, integer, jsonb, integer) to service_role;
grant execute on function public.v2_craft(uuid, jsonb, jsonb, integer) to service_role;
grant execute on function public.v2_salvage(uuid, uuid[], jsonb, jsonb) to service_role;
grant execute on function public.v2_lock(uuid, uuid, boolean) to service_role;
grant execute on function public.v2_relic_forge(uuid, date, integer, text, integer, integer, timestamptz) to service_role;
grant execute on function public.v2_grant_founder(uuid, jsonb, jsonb) to service_role;
