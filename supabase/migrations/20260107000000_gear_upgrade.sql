-- Taskbar Hero B6: gear upgrade (docs/api.md, the upgrade rule).
-- The upgrade Edge Function computes the price with game-rules upgradeCost from the level it read;
-- this function re-checks that level under the player lock, so a concurrent upgrade can never pay a
-- stale price. Executable by service_role only.

-- Raise the player's item p_gear_id from p_expected_level to p_expected_level + 1 for p_cost gold,
-- storing p_power (gearStat at the new level, rounded) as its power.
-- Returns 'ok', or (changing nothing) 'not_owner' (unknown or another player's item), 'stale' (the
-- level is no longer p_expected_level), 'max_level' (level >= p_max_level) or 'not_enough_gold'.
create function public.game_upgrade(
  p_player uuid,
  p_gear_id uuid,
  p_expected_level integer,
  p_cost bigint,
  p_max_level integer,
  p_power integer
)
returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_level integer;
  v_gold bigint;
begin
  if p_cost is null or p_cost < 0 or p_power is null or p_power < 0 then
    raise exception 'game_upgrade: bad cost % or power %', p_cost, p_power;
  end if;
  -- Serialize gold and gear changes per player.
  perform 1 from public.players where id = p_player for update;
  select level into v_level from public.gear where id = p_gear_id and player_id = p_player for update;
  if not found then
    return 'not_owner';
  end if;
  if v_level <> p_expected_level then
    return 'stale';
  end if;
  if v_level >= p_max_level then
    return 'max_level';
  end if;
  select gold into v_gold from public.idle_state where player_id = p_player for update;
  if coalesce(v_gold, 0) < p_cost then
    return 'not_enough_gold';
  end if;
  update public.idle_state set gold = gold - p_cost where player_id = p_player;
  update public.gear set level = level + 1, power = p_power where id = p_gear_id;
  return 'ok';
end;
$$;

revoke all on function public.game_upgrade(uuid, uuid, integer, bigint, integer, integer) from public, anon, authenticated;
grant execute on function public.game_upgrade(uuid, uuid, integer, bigint, integer, integer) to service_role;
