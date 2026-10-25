-- DRAFT for D8: no contents or cutoff are chosen here. Cut-over runbook section 4, steps 2–3,
-- calls v2_grant_founder_batch with approved parameters until remaining = 0. Repeating is a no-op.
-- The existing per-player grant owns stack credit, caps and idempotency; this adds batching only.
create function public.v2_grant_founder_batch(
  p_cutoff timestamptz,
  p_contents jsonb,
  p_caps jsonb default '{}'::jsonb,
  p_limit integer default 500
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  -- This one material-key list mirrors Object.keys(STACK_CAPS_V2). Fish is the uncapped currency.
  v_material_keys constant text[] := array['yarn', 'fluffTuft', 'shinyButton', 'catnipCrystal', 'starlightScale', 'moonPearl', 'catKey'];
  v_entry record;
  v_player record;
  v_result jsonb;
  v_contents jsonb := '{}'::jsonb;
  v_granted integer := 0;
  v_already bigint;
  v_remaining bigint;
begin
  if p_cutoff is null or p_contents is null or jsonb_typeof(p_contents) <> 'object' then
    return jsonb_build_object('error', 'invalid_request');
  end if;
  -- Validate the entire object before any row is locked or credited. Numeric strings are refused.
  for v_entry in select key, value from jsonb_each(p_contents) loop
    if (v_entry.key <> 'fish' and not (v_entry.key = any(v_material_keys)))
       or jsonb_typeof(v_entry.value) <> 'number' then
      return jsonb_build_object('error', 'invalid_request');
    end if;
    if (v_entry.value #>> '{}')::numeric < 0
       or trunc((v_entry.value #>> '{}')::numeric) <> (v_entry.value #>> '{}')::numeric
       or (v_entry.value #>> '{}')::numeric > 9223372036854775807 then
      return jsonb_build_object('error', 'invalid_request');
    end if;
    -- Normalize whole numeric spellings (for example 1.0) for the existing bigint stack helper.
    v_contents := v_contents || jsonb_build_object(v_entry.key, (v_entry.value #>> '{}')::numeric::bigint);
  end loop;
  select count(*) into v_already from public.players p
    where p.created_at < p_cutoff and exists (select 1 from public.founder_grants f where f.player_id = p.id);
  for v_player in
    select p.id from public.players p
    where p.created_at < p_cutoff and not exists (select 1 from public.founder_grants f where f.player_id = p.id)
    order by p.created_at, p.id
    limit greatest(1, least(5000, coalesce(p_limit, 500)))
    for update of p skip locked
  loop
    select public.v2_grant_founder(v_player.id, v_contents, p_caps) into v_result;
    if v_result ->> 'status' = 'granted' then v_granted := v_granted + 1; end if;
  end loop;
  select count(*) into v_remaining from public.players p
    where p.created_at < p_cutoff and not exists (select 1 from public.founder_grants f where f.player_id = p.id);
  return jsonb_build_object('granted', v_granted, 'already', v_already, 'remaining', v_remaining);
end;
$$;

revoke all on function public.v2_grant_founder_batch(timestamptz, jsonb, jsonb, integer) from public, anon, authenticated;
grant execute on function public.v2_grant_founder_batch(timestamptz, jsonb, jsonb, integer) to service_role;
