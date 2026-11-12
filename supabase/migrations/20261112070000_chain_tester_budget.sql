-- Optional, finite judge program. No public rows or authority are enabled here.
-- A reviewed ceiling is a lifetime authorization budget, not a burn forecast.
create table public.chain_tester_budgets (
  contract text primary key check (contract ~ '^0x[0-9a-f]{40}$'),
  ceiling text not null check (ceiling ~ '^[1-9][0-9]{0,27}$' and ceiling::numeric<=1000000000000000000000000000),
  protected_yarn text not null default '0' check (protected_yarn ~ '^(0|[1-9][0-9]{0,27})$' and protected_yarn::numeric<=1000000000000000000000000000),
  evidence_hash text not null check (evidence_hash ~ '^[0-9a-f]{64}$'),
  enabled boolean not null default false,
  last_block bigint not null default -1,
  last_hash text
);
create table public.chain_tester_reservations (
  contract text not null references public.chain_tester_budgets(contract),
  player_id uuid not null references public.players(id),
  wallet text not null check (wallet ~ '^0x[0-9a-f]{40}$'),
  nonce text not null check (nonce ~ '^(0|[1-9][0-9]{0,77})$' and nonce::numeric<115792089237316195423570985008687907853269984665640564039457584007913129639936),
  amount text not null check (amount='20000000000000000000'),
  primary key(contract,player_id), unique(contract,wallet), unique(contract,nonce)
);
alter table public.chain_tester_budgets enable row level security;
alter table public.chain_tester_reservations enable row level security;
revoke all on public.chain_tester_budgets,public.chain_tester_reservations from public,anon,authenticated,service_role;
grant select,insert on public.chain_tester_budgets to service_role;
grant update(enabled) on public.chain_tester_budgets to service_role;
grant select on public.chain_tester_reservations to service_role;

create function public.chain_tester_reserve(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.chain_tester_reservations; prior public.chain_tester_reservations;
  b public.chain_tester_budgets; committed numeric; routine numeric; pool numeric;
  observed_block bigint; observed_hash text;
begin
  r:=jsonb_populate_record(null::public.chain_tester_reservations,p);
  -- Same lock as routine reservations. Never release on timeout or expiry.
  perform pg_advisory_xact_lock(431150);
  select * into b from public.chain_tester_budgets where contract=r.contract for update;
  if b.contract is null or not b.enabled then raise exception 'tester_budget_unavailable';end if;
  if not exists(select 1 from public.players where id=r.player_id and wallet=r.wallet) or
     not exists(select 1 from public.chain_judge_passes where player_id=r.player_id and wallet=r.wallet) then
    raise exception 'no_judge_pass';end if;
  if r.amount is distinct from '20000000000000000000' then raise exception 'tester_budget_conflict';end if;
  select * into prior from public.chain_tester_reservations where contract=r.contract and player_id=r.player_id;
  if prior.player_id is not null then
    if to_jsonb(prior) is distinct from to_jsonb(r) then raise exception 'tester_budget_conflict';end if;
    return to_jsonb(prior);
  end if;
  if coalesce(p->>'pool_balance','') !~ '^(0|[1-9][0-9]{0,27})$' or
     coalesce(p->>'block','') !~ '^(0|[1-9][0-9]{0,15})$' or
     coalesce(p->>'block_hash','') !~ '^0x[0-9a-f]{64}$' then raise exception 'tester_budget_snapshot';end if;
  pool:=(p->>'pool_balance')::numeric;observed_block:=(p->>'block')::bigint;observed_hash:=p->>'block_hash';
  if pool>1000000000000000000000000000 or observed_block<b.last_block or
     (observed_block=b.last_block and observed_hash is distinct from b.last_hash) then
    raise exception 'tester_budget_snapshot';end if;
  select coalesce(sum(amount::numeric),0) into committed from public.chain_tester_reservations where contract=r.contract;
  if committed+r.amount::numeric>b.ceiling::numeric then raise exception 'tester_budget_exhausted';end if;
  -- Conservative: retain all authorized grants and every configured routine
  -- ceiling, even if paid. No unverifiable credit/release of an old promise.
  select coalesce(sum(ceiling::numeric),0) into routine from public.chain_reward_budgets where contract=r.contract;
  if committed+r.amount::numeric+routine+b.protected_yarn::numeric>pool then
    raise exception 'tester_pool_low';end if;
  insert into public.chain_tester_reservations select r.*;
  update public.chain_tester_budgets set last_block=observed_block,last_hash=observed_hash where contract=r.contract;
  return to_jsonb(r);
end;
$$;
revoke all on function public.chain_tester_reserve(jsonb) from public,anon,authenticated;
grant execute on function public.chain_tester_reserve(jsonb) to service_role;
