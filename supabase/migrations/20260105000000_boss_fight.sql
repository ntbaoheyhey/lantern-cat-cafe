-- Taskbar Hero B4: boss fight (docs/api.md). The boss-fight Edge Function simulates the fight with
-- packages/game-rules, then records it here. Executable by service_role only.

-- Record one boss fight in a single transaction, with the player row locked so parallel fights
-- cannot pass the daily limit. p_day is today's game day as a date (same mapping as
-- game_snapshot). p_boss_level is the level that was fought.
-- Returns null and changes nothing when the player already has p_max_attempts attempts on p_day.
-- Otherwise inserts the attempt; on a win raises boss_level to p_boss_level + 1 (at most
-- p_max_level, never lowered, so two parallel wins at one level raise it once) and grants today's
-- Boss Key if none exists yet. Returns true when this call granted the key, else false.
create function public.game_boss_fight(
  p_player uuid,
  p_day date,
  p_boss_level integer,
  p_won boolean,
  p_max_attempts integer,
  p_max_level integer
)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_granted boolean := false;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    raise exception 'game_boss_fight: no player %', p_player;
  end if;
  if (select count(*) from public.boss_attempts where player_id = p_player and day = p_day) >= p_max_attempts then
    return null;
  end if;

  insert into public.boss_attempts (player_id, day, won) values (p_player, p_day, p_won);
  if p_won then
    update public.idle_state
       set boss_level = greatest(boss_level, least(p_boss_level + 1, p_max_level))
     where player_id = p_player;
    insert into public.boss_keys (player_id, day) values (p_player, p_day)
    on conflict (player_id, day) do nothing;
    v_granted := found;
  end if;
  return v_granted;
end;
$$;

revoke all on function public.game_boss_fight(uuid, date, integer, boolean, integer, integer) from public, anon, authenticated;
grant execute on function public.game_boss_fight(uuid, date, integer, boolean, integer, integer) to service_role;
