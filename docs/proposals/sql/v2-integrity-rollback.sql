-- PROPOSAL / MANUAL ONLY. Never applied live by S2-FIX1.
-- Deploy the previous Edge build before rollback; new once RPCs will no longer exist.
-- This discards retry history and reopens the starter/equipment gaps. Back up first.
begin;
drop trigger v2_equipment_revision on public.items;
drop function public.v2_equipment_revision();
drop function public.v2_craft_once(uuid, uuid, jsonb, jsonb, jsonb, integer);
drop function public.v2_boss_fight_once(uuid, uuid, jsonb, jsonb, jsonb);
drop function public.v2_action_result(uuid, text, uuid, jsonb);
drop table public.v2_action_results;

create or replace function public.v2_salvage(p_player uuid, p_item_ids uuid[], p_gains jsonb, p_caps jsonb default '{}'::jsonb)
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

create or replace function public.v2_item_json(i public.items)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', i.id, 'itemKey', i.item_key, 'slot', i.slot, 'weaponType', i.weapon_type,
    'rarity', i.rarity, 'level', i.level, 'bonus', i.bonus, 'locked', i.locked, 'equipped', i.equipped
  ));
$$;

commit;
