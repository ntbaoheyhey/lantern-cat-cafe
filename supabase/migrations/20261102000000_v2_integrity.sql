-- S2-FIX1: owner-approved v2 integrity; manual deployment, no live apply by this mission.
begin;

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

revoke all on function public.v2_salvage(uuid, uuid[], jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.v2_salvage(uuid, uuid[], jsonb, jsonb) to service_role;

create or replace function public.v2_item_json(i public.items)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', i.id, 'itemKey', i.item_key, 'slot', i.slot, 'weaponType', i.weapon_type,
    'rarity', i.rarity, 'level', i.level, 'bonus', i.bonus, 'locked', i.locked, 'equipped', i.equipped, 'source', i.source
  ));
$$;

create function public.v2_equipment_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.equipped is distinct from old.equipped then
    update public.cat_state set progress_rev = progress_rev + 1 where player_id = new.player_id;
  end if;
  return new;
end;
$$;
revoke all on function public.v2_equipment_revision() from public, anon, authenticated, service_role;
create trigger v2_equipment_revision after update of equipped on public.items
  for each row execute function public.v2_equipment_revision();

-- All application inserts use v2_insert_items, which omits equipped (default false).
-- Starter/class equip is a subsequent UPDATE and is covered by this trigger.
-- Caller functions already hold players FOR UPDATE before touching items/cat_state.

create table public.v2_action_results (
  player_id uuid not null references public.players(id) on delete cascade,
  route text not null check (route in ('v2-craft', 'v2-boss-fight')),
  request_id uuid not null,
  intent jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (player_id, route, request_id)
);
alter table public.v2_action_results enable row level security;
revoke all on public.v2_action_results from public, anon, authenticated;
-- Same service-role table access as the existing v2 tables; no client SELECT policy.
grant all on public.v2_action_results to service_role;

-- Fast retry lookup before Edge preview checks. A miss is never authorization to mutate:
-- the once wrappers below repeat the lookup under the player lock.
create function public.v2_action_result(p_player uuid, p_route text, p_request_id uuid, p_intent jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare previous public.v2_action_results;
begin
  select * into previous from public.v2_action_results
    where player_id = p_player and route = p_route and request_id = p_request_id;
  if not found then return null; end if;
  if previous.intent is distinct from p_intent then return jsonb_build_object('error', 'invalid_request'); end if;
  return previous.result;
end;
$$;

create function public.v2_craft_once(p_player uuid, p_request_id uuid, p_intent jsonb,
  p_cost jsonb, p_item jsonb, p_bag_limit integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  saved := public.v2_action_result(p_player, 'v2-craft', p_request_id, p_intent);
  if saved is not null then return saved; end if;
  saved := public.v2_craft(p_player, p_cost, p_item, p_bag_limit);
  if saved->>'status' = 'ok' then
    insert into public.v2_action_results(player_id, route, request_id, intent, result)
      values(p_player, 'v2-craft', p_request_id, p_intent, saved);
  end if;
  return saved;
end;
$$;

-- p_args and p_timeline are exclusively server simulation output, never request body spreads.
-- Keep the original RPC signature untouched; no overload ambiguity or old-client breakage.
create function public.v2_boss_fight_once(p_player uuid, p_request_id uuid, p_intent jsonb,
  p_args jsonb, p_timeline jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved jsonb;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  saved := public.v2_action_result(p_player, 'v2-boss-fight', p_request_id, p_intent);
  if saved is not null then return saved; end if;
  saved := public.v2_boss_fight(p_player, (p_args->>'chapter')::integer,
    (p_args->>'expectedRev')::bigint, (p_args->>'won')::boolean, (p_args->>'fightNo')::bigint,
    (p_args->>'keyCost')::integer, (p_args->>'cooldownS')::integer, p_args->'chest',
    (p_args->>'bagLimit')::integer, p_args->'caps', (p_args->>'bossRound')::integer);
  if saved->>'status' = 'ok' then
    saved := saved || jsonb_build_object('timeline', p_timeline);
    insert into public.v2_action_results(player_id, route, request_id, intent, result)
      values(p_player, 'v2-boss-fight', p_request_id, p_intent, saved);
  end if;
  return saved;
end;
$$;

revoke all on function public.v2_action_result(uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.v2_craft_once(uuid, uuid, jsonb, jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.v2_boss_fight_once(uuid, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.v2_action_result(uuid, text, uuid, jsonb) to service_role;
grant execute on function public.v2_craft_once(uuid, uuid, jsonb, jsonb, jsonb, integer) to service_role;
grant execute on function public.v2_boss_fight_once(uuid, uuid, jsonb, jsonb, jsonb) to service_role;
commit;
