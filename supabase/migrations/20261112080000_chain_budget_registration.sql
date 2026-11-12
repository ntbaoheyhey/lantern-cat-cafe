-- Register a reviewed routine budget atomically with every outstanding gift.
-- Direct service inserts bypassed the gift admission lock. A budget now enters
-- disabled through this function only. It is not evidence of economic demand.
revoke insert on public.chain_reward_budgets from service_role;
create function public.chain_reward_budget_register(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b public.chain_reward_budgets; prior public.chain_reward_budgets;
  t public.chain_tester_budgets; policy public.chain_source_policies;
  committed numeric; routine numeric; pool numeric; observed_block bigint; observed_hash text;
begin
  b:=jsonb_populate_record(null::public.chain_reward_budgets,p->'budget');
  b.enabled:=false;
  perform pg_advisory_xact_lock(431150);
  select * into t from public.chain_tester_budgets where contract=b.contract for update;
  if t.contract is null then raise exception 'tester_budget_unavailable';end if;
  select * into prior from public.chain_reward_budgets where id=b.id;
  if prior.id is not null then
    if (to_jsonb(prior)-'enabled') is distinct from (to_jsonb(b)-'enabled') then
      raise exception 'routine_budget_conflict';end if;
    return to_jsonb(prior);
  end if;
  select * into policy from public.chain_source_policies where source_id=b.source_id for share;
  if policy.source_id is null or b.rules_hash is distinct from policy.rules_hash then
    raise exception 'routine_policy';end if;
  if coalesce(p->>'pool_balance','') !~ '^(0|[1-9][0-9]{0,27})$' or
     coalesce(p->>'block','') !~ '^(0|[1-9][0-9]{0,15})$' or
     coalesce(p->>'block_hash','') !~ '^0x[0-9a-f]{64}$' then raise exception 'tester_budget_snapshot';end if;
  pool:=(p->>'pool_balance')::numeric;observed_block:=(p->>'block')::bigint;observed_hash:=p->>'block_hash';
  if pool>1000000000000000000000000000 or observed_block>9007199254740991 or observed_block<t.last_block or
     (observed_block=t.last_block and observed_hash is distinct from t.last_hash) then
    raise exception 'tester_budget_snapshot';end if;
  select coalesce(sum(amount::numeric),0) into committed from public.chain_tester_reservations where contract=b.contract;
  select coalesce(sum(ceiling::numeric),0) into routine from public.chain_reward_budgets where contract=b.contract;
  if committed+routine+b.ceiling::numeric+t.protected_yarn::numeric>pool then
    raise exception 'tester_pool_low';end if;
  insert into public.chain_reward_budgets select b.*;
  update public.chain_tester_budgets set last_block=observed_block,last_hash=observed_hash where contract=b.contract;
  return to_jsonb(b);
end;
$$;
revoke all on function public.chain_reward_budget_register(jsonb) from public,anon,authenticated;
grant execute on function public.chain_reward_budget_register(jsonb) to service_role;
